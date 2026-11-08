import { ArrowRight, BookOpen, Play } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { levels } from "../../entities/curriculum/labels";
import { useOverlays } from "../../shared/state/OverlayProvider";
import { Button } from "../../shared/ui/Button";
import { Modal } from "../../shared/ui/Modal";
import { useWorkspace } from "../workspace/WorkspaceProvider";
import { chooseSession, eligibleQuestions } from "./model";
import { startSession } from "./storage";

export function SessionModal({
  initialTopic,
  close,
}: {
  initialTopic: string;
  close: () => void;
}) {
  const { data } = useWorkspace();
  const { toast } = useOverlays();
  const [topic, setTopic] = useState(
      initialTopic === "due" || initialTopic === "saved" ? "" : initialTopic,
    ),
    [difficulty, setDifficulty] = useState(""),
    [count, setCount] = useState(5),
    [source, setSource] = useState(
      initialTopic === "due" || initialTopic === "saved" ? initialTopic : "all",
    );
  const navigate = useNavigate();
  const eligible = eligibleQuestions(
    data.questions,
    data.progress,
    { topic, difficulty, source },
    Date.now(),
  );
  function start() {
    const ids = chooseSession(eligible, count);
    if (!ids.length) return;
    if (!startSession(ids))
      toast("Browser storage is unavailable; opening a single question.");
    close();
    navigate("/questions/" + ids[0] + "?session=1");
  }
  return (
    <Modal close={close} className="session-modal">
      <span className="session-modal-icon">
        <Play size={25} />
      </span>
      <div className="eyebrow">A LITTLE TIME TO THINK</div>
      <h2>Make it a good session.</h2>
      <p>Choose your focus. Take each question at your own pace.</p>
      <label>
        Focus area
        <select value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="">A bit of everything</option>
          {data.topics.map((t) => (
            <option value={t.id} key={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <div className="session-fields">
        <label>
          Depth
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">Every level</option>
            {levels.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <label>
          Question count
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          >
            {[3, 5, 10, 15].map((n) => (
              <option value={n} key={n}>
                {n} questions
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Choose from
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="all">All matching questions</option>
          <option value="new">Questions I haven’t attempted</option>
          {data.user && <option value="due">Questions due for review</option>}
          {data.user && <option value="saved">My saved questions</option>}
        </select>
      </label>
      <div className="session-summary">
        <span>
          <BookOpen size={15} />
          {eligible.length} matching question{eligible.length === 1 ? "" : "s"}
        </span>
        <span>{Math.min(count, eligible.length)} in your session</span>
      </div>
      <Button onClick={start} disabled={!eligible.length}>
        Let’s go deeper <ArrowRight size={16} />
      </Button>
      <small className="session-disclaimer">
        No timer. No pressure. Just thoughtful practice.
      </small>
    </Modal>
  );
}
