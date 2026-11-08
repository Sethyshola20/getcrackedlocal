import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Circle,
  GitBranch,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { formats, levels } from "../../entities/curriculum/labels";
import { pathIcon } from "../../entities/curriculum/presentation";
import { color, cx } from "../../shared/lib/styles";
import { Empty } from "../../shared/ui/Empty";
import { useWorkspace } from "../workspace/WorkspaceProvider";

export function PathDetail() {
  const { data } = useWorkspace();
  const location = useLocation();
  const path = data.paths.find(
    (p) => p.id === location.pathname.split("/").pop(),
  );
  if (!path)
    return (
      <Empty
        icon={GitBranch}
        title="Path not found."
        description="Explore one of the four learning paths."
        action={
          <Link className="button" to="/paths">
            See all paths
          </Link>
        }
      />
    );
  const qs = path.questionIds.map((id) =>
    data.questions.find((q) => q.id === id)!,
  );
  const done = qs.filter(
    (q) => (data.progress[q.id]?.bestScore || 0) >= 80,
  ).length;
  const next =
    qs.find((q) => (data.progress[q.id]?.bestScore || 0) < 80) || qs[0];
  const Icon = pathIcon[path.icon];
  return (
    <>
      <Link className="back-link" to="/paths">
        <ArrowLeft size={14} />
        All learning paths
      </Link>
      <div className="path-detail-hero" style={color(path.color)}>
        <span className="path-symbol">
          <Icon size={28} />
        </span>
        <div className="eyebrow">A GUIDED LEARNING PATH</div>
        <h1>{path.name}</h1>
        <p>{path.description}</p>
        <div className="path-detail-meta">
          <span>{qs.length} questions</span>
          <span>3 technical domains</span>
          <span>Foundation → Expert</span>
        </div>
        <Link className="button" to={`/questions/${next.id}?path=${path.id}`}>
          {done ? "Continue this path" : "Start this path"}
          <ArrowRight size={16} />
        </Link>
        <div className="path-detail-progress">
          <span>
            {done} of {qs.length} questions mastered
          </span>
          <div>
            <i style={{ width: `${(done / qs.length) * 100}%` }} />
          </div>
        </div>
      </div>
      {levels.map((l, i) => (
        <section className="path-stage" key={l}>
          <div className="stage-heading">
            <span>0{i + 1}</span>
            <h2>{l}</h2>
            <small>
              {qs.filter((q) => q.difficulty === l).length} QUESTIONS
            </small>
          </div>
          <div className="question-table compact">
            {qs
              .filter((q) => q.difficulty === l)
              .map((q) => (
                <Link
                  className="path-stage-question"
                  to={`/questions/${q.id}?path=${path.id}`}
                  key={q.id}
                >
                  <span
                    className={cx(
                      "path-check",
                      (data.progress[q.id]?.bestScore || 0) >= 80 && "done",
                    )}
                  >
                    {(data.progress[q.id]?.bestScore || 0) >= 80 ? (
                      <Check size={14} />
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
                  <span>{q.minutes} min</span>
                  <ArrowUpRight size={15} />
                </Link>
              ))}
          </div>
        </section>
      ))}
    </>
  );
}
