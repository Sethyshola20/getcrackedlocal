import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { LearningPath } from "../../entities/curriculum/model";
import { pathIcon } from "../../entities/curriculum/presentation";
import { color } from "../../shared/lib/styles";
import { useWorkspace } from "../workspace/WorkspaceProvider";

export function PathCard({
  path,
  index,
}: {
  path: LearningPath;
  index: number;
}) {
  const { data } = useWorkspace();
  const Icon = pathIcon[path.icon];
  const done = path.questionIds.filter(
    (id) => (data.progress[id]?.bestScore || 0) >= 80,
  ).length;
  return (
    <Link
      to={"/paths/" + path.id}
      className="path-card"
      style={color(path.color)}
    >
      <div className="path-card-top">
        <span className="path-symbol">
          <Icon size={21} strokeWidth={1.5} />
        </span>
        <span className="path-no">PATH / 0{index + 1}</span>
        <ArrowUpRight size={16} />
      </div>
      <h3>{path.name}</h3>
      <p>{path.description}</p>
      <div className="path-topics">
        {path.topics.map((id) => (
          <span key={id}>{data.topics.find((t) => t.id === id)?.name}</span>
        ))}
      </div>
      <div className="path-card-foot">
        <span>
          {done
            ? `${done} of ${path.questionIds.length} mastered`
            : `${path.questionIds.length} questions · 3 topics`}
        </span>
        <ArrowRight size={15} />
      </div>
    </Link>
  );
}
