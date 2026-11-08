import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCheck,
  Flame,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Question } from "../../entities/curriculum/model";
import { useOverlays } from "../../shared/state/OverlayProvider";
import { Button } from "../../shared/ui/Button";
import { SectionHeading } from "../../shared/ui/SectionHeading";
import { Stat } from "../../shared/ui/Stat";
import { QuestionRow } from "../library/components/QuestionRow";
import { TopicCard } from "../library/components/TopicCard";
import { PathCard } from "../paths/PathCard";
import { useWorkspace } from "../workspace/WorkspaceProvider";
import { StackIllustration } from "./StackIllustration";

export function Overview() {
  const { data } = useWorkspace();
  const { session, auth } = useOverlays();
  const completed = data.stats.mastered;
  const navigate = useNavigate();
  const recommendations = [
    data.questions.find((q) => q.id === "rust-publication"),
    data.questions.find((q) => q.id === "architecture-pointer-chase"),
    data.questions.find((q) => q.id === "inference-kv-size"),
  ].filter(Boolean) as Question[];
  const latest = data.attempts[0];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            YOUR LEARNING WORKSPACE <span className="eyebrow-line" />
          </div>
          <h1>
            {data.user
              ? `Welcome back, ${data.user.name.split(" ")[0]}.`
              : "A little deeper, every day."}
            <span className="heading-spark">✳</span>
          </h1>
          <p>Build the kind of understanding that stays with you.</p>
        </div>
        <div className="date-stamp">
          <span className="online-dot" />
          {new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: data.user?.timezone,
          })}
        </div>
      </div>
      <section className="hero-card">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="hero-dot" /> BEYOND THE SURFACE
          </div>
          <h2>
            Don’t just know it.
            <br />
            <span>Understand why.</span>
          </h2>
          <p>
            From the borrow checker to the bits on the wire.
            <br className="desktop-br" /> Deep questions for engineers who keep
            asking why.
          </p>
          <div className="hero-actions">
            <Button onClick={() => session()}>
              Start a practice session <ArrowRight size={17} />
            </Button>
            <Link to="/questions">
              Explore the library <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="hero-foot">
            <span>
              <Check size={12} />
              12 technical domains
            </span>
            <span>
              <Check size={12} />4 levels of depth
            </span>
            <span>
              <Check size={12} />
              More than multiple choice
            </span>
          </div>
        </div>
        <StackIllustration />
      </section>
      <div className="stats-grid">
        <Stat
          label="Questions to explore"
          value={String(data.questions.length)}
          icon={BookOpen}
          sub="Every one a reason to think."
        />
        <Stat
          label="Questions mastered"
          value={String(completed).padStart(2, "0")}
          icon={CheckCheck}
          sub={
            completed
              ? `${Math.round((completed / data.questions.length) * 100)}% of the library`
              : "The first one starts a habit."
          }
          progress={completed / data.questions.length}
        />
        <Stat
          label="Current streak"
          value={`${data.stats.streak}`}
          icon={Flame}
          suffix={data.stats.streak === 1 ? "day" : "days"}
          sub={
            data.stats.streak
              ? "Keep your momentum going."
              : "Your next session starts it."
          }
        />
        <Stat
          label="Your learning XP"
          value={data.stats.xp.toLocaleString()}
          icon={Zap}
          sub={
            data.stats.xp
              ? "Built one concept at a time."
              : "Earned through understanding."
          }
        />
      </div>
      <div className="overview-columns">
        <section className="continue-section">
          <SectionHeading
            title="Choose your next rabbit hole"
            description="Pick a topic. Follow your curiosity."
            action={
              <Link className="text-link" to="/questions?view=topics">
                All topics <ArrowRight size={15} />
              </Link>
            }
          />
          <div className="topic-grid">
            {data.topics.slice(0, 6).map((t) => (
              <TopicCard key={t.id} topic={t} />
            ))}
          </div>
        </section>
        <section className="daily-card">
          <div className="daily-title">
            <span className="small-label">THE DAILY PRACTICE</span>
            <Target size={18} />
          </div>
          <div className="goal-ring">
            <svg viewBox="0 0 132 132">
              <circle cx="66" cy="66" r="58" />
              <circle
                className="ring-fill"
                cx="66"
                cy="66"
                r="58"
                style={{
                  strokeDasharray: "364.42",
                  strokeDashoffset:
                    364.42 *
                    (1 -
                      Math.min(data.stats.today / (data.user?.goal || 5), 1)),
                }}
              />
            </svg>
            <div>
              <strong>
                {data.stats.today}
                <span>/{data.user?.goal || 5}</span>
              </strong>
              <small>questions today</small>
            </div>
          </div>
          <h3>
            {data.stats.today >= (data.user?.goal || 5)
              ? "A good day to go deeper."
              : "Small sessions. Real progress."}
          </h3>
          <p>
            {data.user
              ? "A few thoughtful questions are worth more than a hundred guesses."
              : "Make a little room for the things you want to understand."}
          </p>
          <button className="daily-button" onClick={() => session()}>
            {data.stats.today ? "Keep exploring" : "Find your first question"}
            <ArrowRight size={15} />
          </button>
          <div className="daily-bottom">
            <span className="online-dot" />
            {data.user ? (
              "Your progress is saved automatically."
            ) : (
              <button onClick={auth}>
                Sign in to make your progress stick
              </button>
            )}
          </div>
        </section>
      </div>
      <section className="paths-section">
        <SectionHeading
          eyebrow="CONNECT THE DOTS"
          title="Go further with a learning path"
          action={
            <Link className="text-link" to="/paths">
              View all paths <ArrowRight size={15} />
            </Link>
          }
        />
        <div className="path-grid">
          {data.paths.slice(0, 3).map((p, i) => (
            <PathCard key={p.id} path={p} index={i} />
          ))}
        </div>
      </section>
      <section className="recommend-section">
        <SectionHeading
          title={
            latest
              ? "Keep the questions coming"
              : "A few good questions to start with"
          }
          description="Less trivia. More mental models."
          action={
            <button
              className="text-link"
              onClick={() => {
                const q =
                  data.questions[
                    Math.floor(Math.random() * data.questions.length)
                  ];
                navigate("/questions/" + q.id);
              }}
            >
              <Sparkles size={14} />
              Surprise me
            </button>
          }
        />
        <div className="question-table compact">
          <div className="table-header">
            <span>QUESTION</span>
            <span>DIFFICULTY</span>
            <span>FORMAT</span>
            <span />
          </div>
          {recommendations.map((q) => (
            <QuestionRow key={q.id} question={q} />
          ))}
        </div>
      </section>
      <div className="bottom-thought">
        <span>✳</span>
        <p>“What happens if…” is where the interesting questions begin.</p>
        <span className="small-label">STAY CURIOUS.</span>
      </div>
    </>
  );
}
