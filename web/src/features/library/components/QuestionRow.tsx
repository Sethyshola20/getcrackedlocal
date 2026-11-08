import { ArrowUpRight, Bookmark, BookOpen, Check, Circle } from "lucide-react";
import { Link } from "react-router-dom";
import { Difficulty } from "../../../entities/curriculum/Difficulty";
import { formats } from "../../../entities/curriculum/labels";
import type { Question } from "../../../entities/curriculum/model";
import { formatIcon } from "../../../entities/curriculum/presentation";
import { cx } from "../../../shared/lib/styles";
import { useWorkspace } from "../../workspace/WorkspaceProvider";

export function QuestionRow({ question: q }: { question: Question }) {
  const { data } = useWorkspace();
  const t = data.topics.find((t) => t.id === q.topic)!;
  const Icon = formatIcon[q.format] || BookOpen;
  const p = data.progress[q.id];
  return (
    <Link to={"/questions/" + q.id} className="question-row">
      <div className="question-name">
        <span
          className={cx(
            "question-status",
            (p?.bestScore || 0) >= 80 && "mastered",
          )}
        >
          {(p?.bestScore || 0) >= 80 ? (
            <Check size={13} />
          ) : (
            <Circle size={13} />
          )}
        </span>
        <div>
          <strong>{q.title}</strong>
          <span>
            <i style={{ background: t.color }} />
            {t.name}
            <span className="meta-dot">·</span>
            {q.minutes} min
          </span>
        </div>
      </div>
      <Difficulty value={q.difficulty} />
      <span className="format-label">
        <Icon size={14} />
        {formats[q.format]}
      </span>
      <span className="row-arrow">
        {p?.bookmarked ? (
          <Bookmark size={14} fill="currentColor" />
        ) : (
          <ArrowUpRight size={16} />
        )}
      </span>
    </Link>
  );
}
