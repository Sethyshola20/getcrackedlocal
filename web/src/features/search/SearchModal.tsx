import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Command,
  Search,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Difficulty } from "../../entities/curriculum/Difficulty";
import { formats } from "../../entities/curriculum/labels";
import { Modal } from "../../shared/ui/Modal";
import { useWorkspace } from "../workspace/WorkspaceProvider";

export function SearchModal({ close }: { close: () => void }) {
  const { data } = useWorkspace();
  const [text, setText] = useState("");
  const navigate = useNavigate();
  const results = data.questions
    .filter(
      (q) =>
        !text ||
        `${q.title} ${q.tags.join(" ")} ${data.topics.find((t) => t.id === q.topic)?.name}`
          .toLowerCase()
          .includes(text.toLowerCase()),
    )
    .slice(0, 7);
  return (
    <Modal close={close} className="search-modal">
      <div className="global-search">
        <Search size={20} />
        <input
          autoFocus
          aria-label="Search all questions"
          placeholder="A concept, a topic, a good question..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <kbd>ESC</kbd>
      </div>
      <div className="search-section-label">
        {text ? `${results.length} MATCHES` : "A FEW PLACES TO START"}
      </div>
      <div className="global-results">
        {results.map((q) => (
          <button
            key={q.id}
            onClick={() => {
              close();
              navigate("/questions/" + q.id);
            }}
          >
            <span className="global-result-icon">
              <BookOpen size={17} />
            </span>
            <span>
              <strong>{q.title}</strong>
              <small>
                {data.topics.find((t) => t.id === q.topic)?.name} ·{" "}
                {formats[q.format]}
              </small>
            </span>
            <Difficulty value={q.difficulty} />
            <ArrowUpRight size={15} />
          </button>
        ))}
        {!results.length && (
          <p className="search-empty">
            No questions match yet. Try “memory”, “Go”, or “cache”.
          </p>
        )}
      </div>
      <div className="search-foot">
        <span>
          <Command size={12} /> K to open anytime
        </span>
        <button
          onClick={() => {
            close();
            navigate("/questions?q=" + encodeURIComponent(text));
          }}
        >
          Search the full library <ArrowRight size={13} />
        </button>
      </div>
    </Modal>
  );
}
