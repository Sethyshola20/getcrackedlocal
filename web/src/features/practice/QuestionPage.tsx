import { AnswerEditor } from "./AnswerEditor";
import { QuestionFeedback } from "./QuestionFeedback";

import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Clock3,
  Code2,
  Lightbulb,
  LoaderCircle,
  Plus,
  Search,
} from "lucide-react";
import Markdown from "react-markdown";
import { Link } from "react-router-dom";
import { Difficulty } from "../../entities/curriculum/Difficulty";
import { formats } from "../../entities/curriculum/labels";
import { formatIcon } from "../../entities/curriculum/presentation";
import { cx } from "../../shared/lib/styles";
import { CodeBlock } from "../../shared/ui/CodeBlock";
import { Empty } from "../../shared/ui/Empty";

import { levels } from "../../entities/curriculum/labels";

import { useQuestionWorkspace } from "./useQuestionWorkspace";
export function QuestionPage() {
  const workspace = useQuestionWorkspace();
  const {
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
  } = workspace;
  if (!q)
    return error ? (
      <Empty
        icon={Search}
        title="This question could not be opened."
        description={error}
        action={
          <Link className="button" to="/questions">
            Back to the library
          </Link>
        }
      />
    ) : (
      <div className="question-loading">
        <LoaderCircle size={24} className="spin" />
        Opening a good question...
      </div>
    );
  const topic = data.topics.find((t) => t.id === q.topic)!;
  const Icon = formatIcon[q.format] || BookOpen;
  return (
    <>
      <div className="question-topline">
        <Link
          className="back-link"
          to={
            path
              ? "/paths/" + path.id
              : "/questions" + (q.topic ? "?topic=" + q.topic : "")
          }
        >
          <ArrowLeft size={14} />
          {path ? path.name : "Question library"}
        </Link>
        <div>
          {(path || sessionActive) && (
            <span className="session-counter">
              {index + 1} / {ids.length}
              <span>{path ? "IN THIS PATH" : "IN THIS SESSION"}</span>
            </span>
          )}
          <button
            onClick={bookmark}
            className={cx(
              "save-question",
              data.progress[id]?.bookmarked && "saved",
            )}
          >
            <Bookmark
              size={15}
              fill={data.progress[id]?.bookmarked ? "currentColor" : "none"}
            />
            {data.progress[id]?.bookmarked ? "Saved" : "Save question"}
          </button>
        </div>
      </div>
      <div className="question-layout">
        <article className="question-content">
          <div className="question-meta">
            <Link
              to={"/questions?topic=" + q.topic}
              style={{ color: topic.color }}
            >
              {topic.name}
            </Link>
            <span>·</span>
            <span>
              <Icon size={13} />
              {formats[q.format]}
            </span>
          </div>
          <h1>{q.title}</h1>
          <div className="question-submeta">
            <Difficulty value={q.difficulty} />
            <span>
              <Clock3 size={14} />
              {q.minutes} min of thought
            </span>
            <span className="question-id">{q.id.toUpperCase()}</span>
          </div>
          <div className="markdown prompt">
            <Markdown>{q.prompt}</Markdown>
          </div>
          {q.code && q.format !== "code" && (
            <CodeBlock code={q.code} language={q.language} />
          )}
          {q.format === "code" && q.code && (
            <div className="code-exercise-note">
              <Code2 size={16} />
              {["go", "rust", "cpp"].includes(q.language || "")
                ? "Implement, run, and test your code before comparing your approach."
                : "Write your pseudocode and explain its guarantees below."}
            </div>
          )}
          <div className="tags">
            {q.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <div className="hint-box">
            <button
              onClick={() =>
                setHint((h) => Math.min((q.hints || []).length, h + 1))
              }
              disabled={hint === (q.hints || []).length}
            >
              <span>
                <Lightbulb size={16} />A nudge in the right direction
              </span>
              <span>
                {hint ? `${hint} / ${q.hints?.length}` : "Reveal a hint"}
                <Plus size={14} />
              </span>
            </button>
            {q.hints?.slice(0, hint).map((h, i) => (
              <p key={i}>
                <span>0{i + 1}</span>
                {h}
              </p>
            ))}
          </div>
          {!feedback ? (
            <AnswerEditor
              draftKey={draftKey}
              q={q}
              answer={answer}
              setAnswer={setAnswer}
              choices={choices}
              setChoices={setChoices}
              submitting={submitting}
              tab={tab}
              setTab={setTab}
              notes={notes}
              saveNote={saveNote}
              submit={submit}
            />
          ) : (
            <QuestionFeedback
              auth={auth}
              data={data}
              q={q}
              answer={answer}
              choices={choices}
              feedback={feedback}
              criteria={criteria}
              setCriteria={setCriteria}
              submitting={submitting}
              assessed={assessed}
              reviewedAttempt={reviewedAttempt}
              assess={assess}
              path={path}
              sessionActive={sessionActive}
              nextID={nextID}
              next={next}
              retry={retry}
            />
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </article>
        <aside className="question-aside">
          <div className="thinking-card">
            <span className="tiny-spark">✳</span>
            <div className="small-label">A BETTER WAY TO PRACTICE</div>
            <h3>
              Take your time.
              <br />
              Make the connections.
            </h3>
            <p>
              The goal isn’t a quick answer. It’s a mental model you can use
              again.
            </p>
            <ol>
              <li>
                <span>01</span>State your assumptions.
              </li>
              <li>
                <span>02</span>Reason through the edges.
              </li>
              <li>
                <span>03</span>Explain the why.
              </li>
            </ol>
          </div>
          <div className="question-depth">
            <span className="small-label">
              DEPTH / {levels.indexOf(q.difficulty) + 1} OF 4
            </span>
            <div className="depth-track">
              {levels.map((l, i) => (
                <span
                  key={l}
                  className={i <= levels.indexOf(q.difficulty) ? "filled" : ""}
                />
              ))}
            </div>
            <h4>{q.difficulty}</h4>
            <p>
              {q.difficulty === "Foundation"
                ? "Build a reliable starting mental model."
                : q.difficulty === "Intermediate"
                  ? "Apply the model. Notice what changes."
                  : q.difficulty === "Advanced"
                    ? "Find the edge cases and hidden assumptions."
                    : "Connect multiple models. Defend your tradeoffs."}
            </p>
          </div>
          {data.progress[id]?.attempts > 0 && (
            <div className="your-history">
              <span className="small-label">YOUR HISTORY</span>
              <div>
                <span>Attempts</span>
                <strong>{data.progress[id].attempts}</strong>
              </div>
              <div>
                <span>Best understanding</span>
                <strong>{data.progress[id].bestScore}%</strong>
              </div>
              {data.progress[id].dueAt && (
                <div>
                  <span>Next review</span>
                  <strong>
                    {new Date(data.progress[id].dueAt).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" },
                    )}
                  </strong>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
