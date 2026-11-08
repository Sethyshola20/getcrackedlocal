import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChartNoAxesCombined,
  CheckCheck,
  Flame,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { TopicMark } from "../../entities/curriculum/TopicMark";
import { formats } from "../../entities/curriculum/labels";
import type { Attempt } from "../../entities/learning/model";
import { color, cx } from "../../shared/lib/styles";
import { useOverlays } from "../../shared/state/OverlayProvider";
import { Button } from "../../shared/ui/Button";
import { Empty } from "../../shared/ui/Empty";
import { Modal } from "../../shared/ui/Modal";
import { SectionHeading } from "../../shared/ui/SectionHeading";
import { Stat } from "../../shared/ui/Stat";
import { useWorkspace } from "../workspace/WorkspaceProvider";

export function ProgressPage() {
  const { data } = useWorkspace();
  const { auth } = useOverlays();
  const [open, setOpen] = useState<Attempt | null>(null);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">PROGRESS, ONE CONNECTION AT A TIME</div>
          <h1>Understanding adds up.</h1>
          <p>Your practice history, growing strengths, and next steps.</p>
        </div>
        {data.user && (
          <a className="button secondary" href="/api/export" download>
            <ArrowDownToLine size={15} />
            Export progress
          </a>
        )}
      </div>
      {!data.user ? (
        <Empty
          icon={ChartNoAxesCombined}
          title="Give your progress a place to grow."
          description="Sign in to track every attempt, see your strengths, and revisit what needs another look."
          action={
            <Button onClick={auth}>
              Create your workspace <ArrowRight size={16} />
            </Button>
          }
        />
      ) : (
        <>
          <div className="stats-grid">
            <Stat
              label="Questions mastered"
              value={String(data.stats.mastered)}
              icon={CheckCheck}
              sub={`of ${data.questions.length} original questions`}
            />
            <Stat
              label="Total attempts"
              value={String(data.stats.attempts)}
              icon={BookOpen}
              sub="Every attempt builds a connection."
            />
            <Stat
              label="Current streak"
              value={String(data.stats.streak)}
              suffix={data.stats.streak === 1 ? "day" : "days"}
              icon={Flame}
              sub={`Daily goal: ${data.user.goal} questions`}
            />
            <Stat
              label="Learning XP"
              value={data.stats.xp.toLocaleString()}
              icon={Zap}
              sub="Based on your best rubric scores."
            />
          </div>
          <section className="activity-panel">
            <SectionHeading
              title="Showing up is a skill."
              description="Your last 13 weeks of practice. Every square is a day."
              action={<span className="small-label">{data.user.timezone}</span>}
            />
            <div className="heatmap">
              {data.activity.map((d) => (
                <div
                  key={d.date}
                  title={`${d.date}: ${d.count} attempt${d.count !== 1 ? "s" : ""}`}
                  className={cx(
                    d.count > 0 && "some",
                    d.count >= 3 && "more",
                    d.count >= 5 && "most",
                  )}
                  aria-label={`${d.date}: ${d.count} attempts`}
                />
              ))}
            </div>
            <div className="heatmap-legend">
              <span>Consistency beats cramming.</span>
              <div>
                Less <i />
                <i className="some" />
                <i className="more" />
                <i className="most" /> More
              </div>
            </div>
          </section>
          <section className="topic-mastery">
            <SectionHeading
              title="Your map of understanding"
              description="Mastery means a best score of at least 80%. Open-ended scores use your own reflection rubric."
            />
            <div className="mastery-grid">
              {data.topics.map((t) => {
                const qs = data.questions.filter((q) => q.topic === t.id),
                  done = qs.filter(
                    (q) => (data.progress[q.id]?.bestScore || 0) >= 80,
                  ).length;
                return (
                  <Link
                    to={"/questions?topic=" + t.id}
                    key={t.id}
                    className="mastery-row"
                    style={color(t.color)}
                  >
                    <TopicMark topic={t} small />
                    <div>
                      <strong>{t.name}</strong>
                      <div className="mastery-bar">
                        <i style={{ width: `${(done / qs.length) * 100}%` }} />
                      </div>
                    </div>
                    <span>
                      {done}
                      <small> / {qs.length}</small>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
          <section className="history-panel">
            <SectionHeading
              title="Your recent thinking"
              description="Revisit an answer or finish a reflection you left open."
            />
            {data.attempts.length ? (
              <div className="history-list">
                {data.attempts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setOpen(a)}
                    className="history-row"
                  >
                    <div
                      className={cx("history-score", a.score >= 80 && "good")}
                    >
                      {a.score < 0 ? <BookOpen size={16} /> : a.score + "%"}
                    </div>
                    <div>
                      <strong>{a.title}</strong>
                      <span>
                        {data.topics.find((t) => t.id === a.topic)?.name} ·{" "}
                        {a.score < 0
                          ? "Reflection pending"
                          : formats[
                              data.questions.find((q) => q.id === a.questionId)
                                ?.format || "explanation"
                            ]}
                      </span>
                    </div>
                    <time>
                      {new Date(a.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                    <ArrowUpRight size={15} />
                  </button>
                ))}
              </div>
            ) : (
              <Empty
                icon={BookOpen}
                title="Your first good question is waiting."
                description="Choose a topic and take your time with an answer."
                action={
                  <Link className="button" to="/questions">
                    Find a question <ArrowRight size={16} />
                  </Link>
                }
              />
            )}
          </section>
        </>
      )}
      {open && (
        <Modal close={() => setOpen(null)} className="attempt-modal">
          <div className="eyebrow">A PREVIOUS ATTEMPT</div>
          <h2>{open.title}</h2>
          <p className="attempt-date">
            {new Date(open.createdAt).toLocaleString()} ·{" "}
            {open.score < 0
              ? "Reflection pending"
              : open.score + "% understanding"}
          </p>
          <pre>
            {open.answer ||
              open.choices?.map((i) => String.fromCharCode(65 + i)).join(", ")}
          </pre>
          <Link
            className="button"
            to={`/questions/${open.questionId}?attempt=${open.id}`}
          >
            Review answer & explanation <ArrowRight size={16} />
          </Link>
        </Modal>
      )}
    </>
  );
}
