import { lazy, Suspense } from "react";
const CodeWorkspace = lazy(() =>
  import("./CodeWorkspace").then((module) => ({
    default: module.CodeWorkspace,
  })),
);

import { BookOpen, LoaderCircle } from "lucide-react";
import { formatIcon } from "../../entities/curriculum/presentation";

import { cx } from "../../shared/lib/styles";

import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Button } from "../../shared/ui/Button";

import type { QuestionWorkspace } from "./useQuestionWorkspace";
type Props = Pick<
  QuestionWorkspace,
  | "draftKey"
  | "q"
  | "answer"
  | "setAnswer"
  | "choices"
  | "setChoices"
  | "submitting"
  | "tab"
  | "setTab"
  | "notes"
  | "saveNote"
  | "submit"
>;
export function AnswerEditor(props: Props) {
  const {
    draftKey,
    q,
    answer,
    setAnswer,
    choices,
    setChoices,
    submitting,
    tab,
    setTab,
    notes,
    saveNote,
    submit,
  } = props;
  if (!q) return null;
  const Icon = formatIcon[q.format] || BookOpen;
  return (
    <section className="answer-panel">
      <div className="answer-tabs">
        <button
          className={tab === "answer" ? "active" : ""}
          onClick={() => setTab("answer")}
        >
          <Icon size={15} />
          {q.format === "code" ? "Your implementation" : "Your answer"}
        </button>
        <button
          className={tab === "notes" ? "active" : ""}
          onClick={() => setTab("notes")}
        >
          Scratchpad<span>PRIVATE · THIS BROWSER</span>
        </button>
        {tab === "answer" && (
          <span className="draft-label">Draft kept in this tab</span>
        )}
      </div>
      {tab === "notes" ? (
        <textarea
          aria-label="Private scratchpad"
          className="scratchpad"
          placeholder="A place to think out loud. Notes stay in this browser, separate from your submitted answer."
          value={notes}
          onChange={(e) => saveNote(e.target.value)}
        />
      ) : (
        <>
          {q.format === "choice" || q.format === "multi_select" ? (
            <div className="choice-list">
              {q.format === "multi_select" && (
                <p className="choice-instruction">
                  Select all answers that apply.
                </p>
              )}
              {q.options?.map((o, i) => (
                <label
                  key={i}
                  className={cx(
                    "choice-option",
                    choices.includes(i) && "selected",
                  )}
                >
                  <input
                    type={q.format === "choice" ? "radio" : "checkbox"}
                    name="answer"
                    checked={choices.includes(i)}
                    onChange={() =>
                      setChoices(
                        q.format === "choice"
                          ? [i]
                          : choices.includes(i)
                            ? choices.filter((c) => c !== i)
                            : [...choices, i],
                      )
                    }
                  />
                  <span className="choice-letter">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{o}</span>
                  {choices.includes(i) && <Check size={16} />}
                </label>
              ))}
            </div>
          ) : q.format === "numeric" ? (
            <div className="numeric-answer">
              <label htmlFor="numeric">Your result</label>
              <input
                id="numeric"
                inputMode="decimal"
                type="text"
                placeholder="Enter a number"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <small>
                Use the units specified in the question. Enter only the number.
              </small>
            </div>
          ) : q.format === "code" ? (
            <Suspense
              fallback={
                <div className="question-loading">Opening code editor…</div>
              }
            >
              <CodeWorkspace
                key={draftKey}
                question={q}
                value={answer}
                onChange={setAnswer}
                storageKey={draftKey}
              />
            </Suspense>
          ) : (
            <div className="text-answer">
              <textarea
                aria-label="Your reasoning"
                placeholder={
                  q.format === "debug"
                    ? "Locate the root cause. Explain why it happens, then describe or write a repair..."
                    : q.format === "design"
                      ? "Start with the requirements and assumptions. Walk through your design, failure modes, and tradeoffs..."
                      : "Explain your reasoning. What is happening, why does it happen, and what assumptions matter?"
                }
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
            </div>
          )}
          <div className="answer-footer">
            <span>
              {["choice", "multi_select", "numeric"].includes(q.format) ? (
                <>
                  <ShieldCheck size={14} />
                  Automatically checked
                </>
              ) : (
                <>
                  <BookOpen size={14} />
                  Compare with the explanation, then assess your reasoning.
                </>
              )}
            </span>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <>
                  {["choice", "multi_select", "numeric"].includes(q.format)
                    ? "Check my answer"
                    : "Reveal & reflect"}
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
