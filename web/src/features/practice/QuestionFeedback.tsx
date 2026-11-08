import { LoaderCircle } from "lucide-react";

import { BookOpen } from "lucide-react";

import { Bookmark } from "lucide-react";
import { cx } from "../../shared/lib/styles";

import Markdown from "react-markdown";

import { Check } from "lucide-react";

import {
  ArrowRight,
  CheckCheck,
  ChevronDown,
  ExternalLink,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "../../shared/ui/Button";

import type { QuestionWorkspace } from "./useQuestionWorkspace";
type Props = Pick<
  QuestionWorkspace,
  | "auth"
  | "data"
  | "q"
  | "answer"
  | "choices"
  | "feedback"
  | "criteria"
  | "setCriteria"
  | "submitting"
  | "assessed"
  | "reviewedAttempt"
  | "assess"
  | "path"
  | "sessionActive"
  | "nextID"
  | "next"
  | "retry"
>;
export function QuestionFeedback(props: Props) {
  const {
    auth,
    data,
    q,
    answer,
    choices,
    feedback,
    criteria,
    setCriteria,
    submitting,
    assessed,
    reviewedAttempt,
    assess,
    path,
    sessionActive,
    nextID,
    next,
    retry,
  } = props;
  if (!q || !feedback) return null;
  return (
    <section className="feedback-panel">
      <div
        className={cx(
          "feedback-heading",
          assessed && feedback.score >= 80 && "correct",
        )}
      >
        <span>
          {assessed ? (
            feedback.score >= 80 ? (
              <CheckCheck size={20} />
            ) : (
              <RotateCcw size={20} />
            )
          ) : (
            <BookOpen size={20} />
          )}
        </span>
        <div>
          <h2>
            {assessed
              ? feedback.score >= 80
                ? "That’s a solid understanding."
                : "A good place to go deeper."
              : "Now, think about your thinking."}
          </h2>
          <p>
            {assessed
              ? `${feedback.score}% ${feedback.autoGraded ? "· Automatically checked" : "· Your rubric assessment"}${data.user ? " · Progress saved" : ""}`
              : "Read the explanation, then assess what your answer covered."}
          </p>
        </div>
        {assessed && (
          <strong>
            {feedback.score}
            <small>%</small>
          </strong>
        )}
      </div>
      <details className="submitted-answer">
        <summary>
          Your submitted answer <ChevronDown size={14} />
        </summary>
        {choices.length ? (
          <ul>
            {choices.map((i) => (
              <li key={i}>{q.options?.[i]}</li>
            ))}
          </ul>
        ) : (
          <pre>{answer}</pre>
        )}
        {reviewedAttempt && (
          <small>
            Submitted {new Date(reviewedAttempt.createdAt).toLocaleString()}
          </small>
        )}
      </details>
      {feedback.autoGraded && (
        <div className="correct-answer">
          <strong>Expected answer</strong>
          <p>
            {feedback.expected ||
              feedback.correct?.map((i) => q.options?.[i]).join(" · ")}
          </p>
        </div>
      )}
      <div className="solution-label">
        <BookOpen size={15} />
        THE EXPLANATION
      </div>
      <div className="markdown solution">
        <Markdown>{feedback.solution}</Markdown>
      </div>
      {!feedback.autoGraded && (
        <div className="rubric">
          <div>
            <h3>What did your answer cover?</h3>
            <p>
              Check only the points you reasoned through before reading the
              explanation.
            </p>
          </div>
          {feedback.rubric.map((r, i) => (
            <label
              className={cx("rubric-item", criteria[i] && "checked")}
              key={i}
            >
              <input
                type="checkbox"
                disabled={assessed}
                checked={criteria[i] || false}
                onChange={(e) =>
                  setCriteria(
                    criteria.map((c, j) => (j === i ? e.target.checked : c)),
                  )
                }
              />
              <span>{r}</span>
            </label>
          ))}
          {!assessed && (
            <div className="assess-footer">
              <small>
                Self-assessment · {criteria.filter(Boolean).length}/
                {criteria.length} concepts
              </small>
              <Button onClick={assess} disabled={submitting}>
                {submitting ? (
                  <LoaderCircle className="spin" size={16} />
                ) : (
                  <>
                    Save my reflection <Check size={16} />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
      <div className="follow-up">
        <Sparkles size={18} />
        <div>
          <strong>One layer deeper</strong>
          <p>{feedback.followUp}</p>
        </div>
      </div>
      <div className="references">
        <h3>Go to the source</h3>
        {feedback.references.map((r) => (
          <a key={r.url} href={r.url} target="_blank" rel="noreferrer">
            {r.title}
            <ExternalLink size={14} />
          </a>
        ))}
      </div>
      {!data.user && (
        <div className="guest-note">
          <Bookmark size={17} />
          <p>
            This was a practice attempt.{" "}
            <button onClick={auth}>Create an account</button> to save future
            attempts and build your review queue.
          </p>
        </div>
      )}
      <div className="next-question">
        <button className="text-link" onClick={retry}>
          Try again <RotateCcw size={14} />
        </button>
        <Button onClick={next} disabled={!assessed}>
          {nextID
            ? "Next question"
            : sessionActive
              ? "Finish session"
              : path
                ? "Back to path"
                : "Back to library"}
          <ArrowRight size={16} />
        </Button>
      </div>
    </section>
  );
}
