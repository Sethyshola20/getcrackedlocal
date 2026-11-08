import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Topic } from "../../../entities/curriculum/model";
import { TopicMark } from "../../../entities/curriculum/TopicMark";
import { color } from "../../../shared/lib/styles";
import { useWorkspace } from "../../workspace/WorkspaceProvider";

export function TopicCard({ topic }: { topic: Topic }) {
  const { data } = useWorkspace();
  const mastered = data.questions.filter(
    (q) => q.topic === topic.id && (data.progress[q.id]?.bestScore || 0) >= 80,
  ).length;
  return (
    <Link
      className="topic-card"
      to={`/questions?topic=${topic.id}`}
      style={color(topic.color)}
    >
      <div className="topic-card-top">
        <TopicMark topic={topic} />
        <ArrowUpRight size={16} />
      </div>
      <h3>{topic.name}</h3>
      <p>{topic.description}</p>
      <div className="topic-card-foot">
        <span>
          {data.questions.filter((q) => q.topic === topic.id).length} questions
        </span>
        {mastered > 0 ? (
          <span className="topic-mastered">{mastered} mastered</span>
        ) : (
          <span className="topic-level">FOUNDATION → EXPERT</span>
        )}
      </div>
      <div className="topic-progress">
        <i
          style={{
            width: `${(mastered / data.questions.filter((q) => q.topic === topic.id).length) * 100}%`,
          }}
        />
      </div>
    </Link>
  );
}
