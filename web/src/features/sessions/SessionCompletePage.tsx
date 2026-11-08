import { useOverlays } from "../../shared/state/OverlayProvider";
import { useWorkspace } from "../workspace/WorkspaceProvider";
import { summarizeSession } from "./model";
import { readSession } from "./storage";

import { ArrowRight, ArrowUpRight, CheckCheck, Circle } from "lucide-react";
import { Link } from "react-router-dom";
import { Difficulty } from "../../entities/curriculum/Difficulty";
import { formats } from "../../entities/curriculum/labels";
import { cx } from "../../shared/lib/styles";
import { Button } from "../../shared/ui/Button";
import { SectionHeading } from "../../shared/ui/SectionHeading";

export function SessionComplete() {
  const { data } = useWorkspace();
  const { session, auth } = useOverlays();
  const { ids, results } = readSession();
  const { questions, scores, average } = summarizeSession(
    ids,
    results,
    data.questions,
  );
  return (
    <>
      <div className="session-complete-hero">
        <span className="session-complete-icon">
          <CheckCheck size={32} />
        </span>
        <div className="eyebrow">A LITTLE DEEPER THAN BEFORE</div>
        <h1>
          {scores.length
            ? "That was time well spent."
            : "A good session starts with a question."}
        </h1>
        <p>
          {scores.length
            ? "Take a breath. Let the ideas settle. Your next connection can wait."
            : "Pick a focus and give your curiosity a little room."}
        </p>
        {scores.length > 0 && (
          <div className="session-totals">
            <div>
              <strong>
                {scores.length}
                <small> / {questions.length}</small>
              </strong>
              <span>
                {scores.length === 1
                  ? "question reflected on"
                  : "questions reflected on"}
              </span>
            </div>
            <div>
              <strong>
                {average}
                <small>%</small>
              </strong>
              <span>average understanding</span>
            </div>
            <div>
              <strong>{scores.filter((s) => s >= 80).length}</strong>
              <span>
                {scores.filter((s) => s >= 80).length === 1
                  ? "solid mental model"
                  : "solid mental models"}
              </span>
            </div>
          </div>
        )}
        <div className="session-complete-actions">
          <Button onClick={() => session()}>
            Another layer? <ArrowRight size={16} />
          </Button>
          <Link
            className="button secondary"
            to={data.user ? "/progress" : "/questions"}
          >
            {data.user ? "See my progress" : "Explore the library"}
            <ArrowUpRight size={15} />
          </Link>
        </div>
        {!data.user && scores.length > 0 && (
          <p className="session-guest">
            This practice session stays in this tab.{" "}
            <button onClick={auth}>Create an account</button> to save future
            progress.
          </p>
        )}
      </div>
      {questions.length > 0 && (
        <section className="session-recap">
          <SectionHeading
            title="The questions you thought through"
            description="A starting point for your next reflection."
          />
          <div className="question-table">
            {questions.map((q) => (
              <Link
                className="session-recap-row"
                to={"/questions/" + q.id}
                key={q.id}
              >
                <span
                  className={cx("history-score", results[q.id] >= 80 && "good")}
                >
                  {Number.isFinite(results[q.id]) ? (
                    results[q.id] + "%"
                  ) : (
                    <Circle size={14} />
                  )}
                </span>
                <div>
                  <strong>{q.title}</strong>
                  <small>
                    {data.topics.find((t) => t.id === q.topic)?.name} ·{" "}
                    {formats[q.format]}
                  </small>
                </div>
                <Difficulty value={q.difficulty} />
                <ArrowUpRight size={15} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
