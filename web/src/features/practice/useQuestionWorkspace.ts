import { readSession } from "../sessions/storage";
import { practiceApi } from "./api";
import { reflectionScore } from "./model";
import { practiceStorage } from "./storage";

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Question } from "../../entities/curriculum/model";
import type { Attempt, Feedback } from "../../entities/learning/model";
import { useOverlays } from "../../shared/state/OverlayProvider";
import { useWorkspace } from "../workspace/WorkspaceProvider";

import { rememberSessionResult } from "../sessions/storage";

export function useQuestionWorkspace() {
  const { data, refresh } = useWorkspace();
  const { auth, toast } = useOverlays();
  const navigate = useNavigate();
  const { id = "" } = useParams<"id">();
  const [params] = useSearchParams();
  const [q, setQ] = useState<Question | null>(null),
    [error, setError] = useState(""),
    [answer, setAnswer] = useState(""),
    [choices, setChoices] = useState<number[]>([]),
    [hint, setHint] = useState(0),
    [feedback, setFeedback] = useState<Feedback | null>(null),
    [criteria, setCriteria] = useState<boolean[]>([]),
    [submitting, setSubmitting] = useState(false),
    [assessed, setAssessed] = useState(false),
    [reviewedAttempt, setReviewedAttempt] = useState<Attempt | null>(null),
    [tab, setTab] = useState<"answer" | "notes">("answer"),
    [notes, setNotes] = useState("");
  const start = useRef(Date.now());
  const draftKey = `understack-draft:${data.user?.id || "guest"}:${id}`;
  const noteKey = `understack-note:${data.user?.id || "guest"}:${id}`;
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    practiceApi
      .question(id, controller.signal)
      .then(async (question) => {
        if (!active) return;
        setQ(question);
        setAnswer(question.format === "code" ? question.code || "" : "");
        const draft = practiceStorage.readDraft(draftKey);
        if (draft) {
          setAnswer(draft.answer);
          setChoices(draft.choices);
        }
        setNotes(practiceStorage.readNote(noteKey));
        if (params.get("attempt")) {
          const result = await practiceApi.attempt(
            params.get("attempt")!,
            controller.signal,
          );
          if (!active) return;
          if (result.attempt.questionId !== id) {
            throw new Error(
              "This attempt belongs to a different question. Open it from My progress.",
            );
          }
          setAnswer(result.attempt.answer);
          setChoices(result.attempt.choices || []);
          setFeedback(result.feedback);
          setReviewedAttempt(result.attempt);
          setCriteria(
            result.attempt.criteria?.length
              ? result.attempt.criteria
              : result.feedback.rubric.map(() => false),
          );
          setAssessed(result.attempt.score >= 0);
        }
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
      controller.abort();
    };
  }, [id, draftKey, noteKey, params]);
  useEffect(() => {
    if (!q || feedback) return;
    practiceStorage.saveDraft(draftKey, { answer, choices });
  }, [answer, choices, q, feedback, draftKey]);
  const saveNote = (value: string) => {
    setNotes(value);
    if (!practiceStorage.saveNote(noteKey, value))
      toast("Notes could not be saved in this browser.");
  };
  async function submit() {
    if (!q) return;
    setSubmitting(true);
    setError("");
    try {
      const f = await practiceApi.submit(id, {
        answer,
        choices,
        elapsedSeconds: Math.min(
          86400,
          Math.floor((Date.now() - start.current) / 1000),
        ),
      });
      setFeedback(f);
      setCriteria(f.rubric.map(() => false));
      setAssessed(f.autoGraded);
      if (f.autoGraded && params.get("session") === "1")
        rememberSessionResult(id, f.score);
      practiceStorage.removeDraft(draftKey);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }
  async function assess() {
    if (!feedback) return;
    setSubmitting(true);
    setError("");
    try {
      let score = reflectionScore(criteria);
      if (data.user && feedback.attemptId) {
        const result = await practiceApi.assess(feedback.attemptId, criteria);
        score = result.score;
        await refresh();
      }
      setFeedback({ ...feedback, score });
      setAssessed(true);
      if (params.get("session") === "1") rememberSessionResult(id, score);
      toast(
        data.user
          ? "Assessment saved. Your review is scheduled."
          : "Practice complete. Sign in to save future progress.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }
  async function bookmark() {
    if (!data.user) {
      auth();
      return;
    }
    try {
      await practiceApi.bookmark(id, !data.progress[id]?.bookmarked);
      await refresh();
      toast(
        data.progress[id]?.bookmarked
          ? "Question removed from saved."
          : "Question saved for another thought.",
      );
    } catch (e) {
      toast((e as Error).message);
    }
  }
  const path = data.paths.find((p) => p.id === params.get("path"));
  const { ids: queue } = readSession();
  const sessionActive = params.get("session") === "1";
  const ids =
    path?.questionIds ||
    (sessionActive
      ? queue
      : data.questions.filter((v) => v.topic === q?.topic).map((v) => v.id));
  const index = ids.indexOf(id);
  const nextID = ids[index + 1];
  const next = () => {
    if (nextID) {
      navigate(
        `/questions/${nextID}${path ? "?path=" + path.id : sessionActive ? "?session=1" : ""}`,
      );
    } else if (sessionActive) {
      toast(
        "Session complete. Every question is another layer of understanding.",
      );
      navigate("/session/complete");
    } else navigate(path ? "/paths/" + path.id : "/questions");
  };
  function retry() {
    setFeedback(null);
    setAssessed(false);
    setError("");
    setAnswer(q?.format === "code" ? q.code || "" : "");
    setChoices([]);
    start.current = Date.now();
  }
  return {
    auth,
    draftKey,
    data,
    id,
    q,
    error,
    answer,
    setAnswer,
    choices,
    setChoices,
    hint,
    setHint,
    feedback,
    criteria,
    setCriteria,
    submitting,
    assessed,
    reviewedAttempt,
    tab,
    setTab,
    notes,
    saveNote,
    submit,
    assess,
    bookmark,
    path,
    sessionActive,
    ids,
    index,
    nextID,
    next,
    retry,
  };
}
export type QuestionWorkspace = ReturnType<typeof useQuestionWorkspace>;
