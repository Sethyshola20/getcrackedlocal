import {
  ArrowRight,
  Bookmark,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { formats, levels } from "../../entities/curriculum/labels";
import { useOverlays } from "../../shared/state/OverlayProvider";
import { Button } from "../../shared/ui/Button";
import { Empty } from "../../shared/ui/Empty";
import { useWorkspace } from "../workspace/WorkspaceProvider";
import { QuestionRow } from "./components/QuestionRow";
import { TopicCard } from "./components/TopicCard";
import { selectQuestions } from "./model";

export function Library({ mode }: { mode?: "saved" | "review" }) {
  const { data } = useWorkspace();
  const { auth, session } = useOverlays();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const [page, setPage] = useState(1);
  const topic = params.get("topic") || "",
    difficulty = params.get("difficulty") || "",
    format = params.get("format") || "",
    status = params.get("status") || "",
    view = params.get("view");
  const selected = data.topics.find((t) => t.id === topic);
  const questions = selectQuestions(
    data.questions,
    data.topics,
    data.progress,
    { topic, difficulty, format, search, status, mode },
    Date.now(),
  );
  const pages = Math.max(1, Math.ceil(questions.length / 12));
  const safePage = Math.min(page, pages);
  useEffect(() => {
    setPage(1);
  }, [search, topic, difficulty, format, status, mode]);
  const filter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("view");
    setParams(next);
  };
  return (
    <>
      <div className="page-heading library-heading">
        <div>
          <div className="eyebrow">
            {mode === "review"
              ? "BUILD LASTING UNDERSTANDING"
              : mode === "saved"
                ? "YOUR PERSONAL COLLECTION"
                : "THE QUESTION LIBRARY"}
          </div>
          <h1>
            {mode === "review"
              ? "Make it stick."
              : mode === "saved"
                ? "Worth coming back to."
                : selected
                  ? selected.name
                  : "Follow your curiosity."}
          </h1>
          <p>
            {mode === "review"
              ? "Revisit concepts just as they need another look."
              : mode === "saved"
                ? "Good questions deserve a second thought."
                : selected
                  ? selected.description
                  : `${data.questions.length} original questions. ${data.topics.length} domains. Plenty of depth.`}
          </p>
        </div>
        <Button
          secondary
          onClick={() =>
            session(
              mode === "review" ? "due" : mode === "saved" ? "saved" : topic,
            )
          }
        >
          <Play size={15} />
          Practice {selected ? "this topic" : "a session"}
        </Button>
      </div>
      {!mode && (
        <div className="library-tabs">
          <button
            className={view !== "topics" ? "active" : ""}
            onClick={() => filter("view", "")}
          >
            All questions <span>{data.questions.length}</span>
          </button>
          <button
            className={view === "topics" ? "active" : ""}
            onClick={() => {
              setParams({ view: "topics" });
            }}
          >
            Browse topics <span>12</span>
          </button>
          <div className="tab-note">
            <ShieldCheck size={14} />
            Original questions. Primary references.
          </div>
        </div>
      )}
      {mode && !data.user ? (
        <Empty
          icon={mode === "saved" ? Bookmark : RotateCcw}
          title={
            mode === "saved"
              ? "Keep the questions that catch your eye."
              : "Your next review starts with a first attempt."
          }
          description={
            mode === "saved"
              ? "Sign in to build a collection across every topic."
              : "Sign in, practice a question, and your review queue will grow with you."
          }
          action={
            <Button onClick={auth}>
              Sign in to your workspace <ArrowRight size={16} />
            </Button>
          }
        />
      ) : view === "topics" && !mode ? (
        <div className="all-topic-grid">
          {data.topics.map((t) => (
            <TopicCard key={t.id} topic={t} />
          ))}
        </div>
      ) : (
        <>
          <div className="library-filters">
            <div className="filter-search">
              <Search size={16} />
              <input
                aria-label="Search the question library"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions, concepts, or topics..."
              />
              {search && (
                <button aria-label="Clear search" onClick={() => setSearch("")}>
                  <X size={14} />
                </button>
              )}
            </div>
            <label className="filter-select">
              <span className="sr-only">Topic</span>
              <select
                aria-label="Topic"
                value={topic}
                onChange={(e) => filter("topic", e.target.value)}
              >
                <option value="">All topics</option>
                {data.topics.map((t) => (
                  <option value={t.id} key={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </label>
            <label className="filter-select">
              <span className="sr-only">Difficulty</span>
              <select
                aria-label="Difficulty"
                value={difficulty}
                onChange={(e) => filter("difficulty", e.target.value)}
              >
                <option value="">All levels</option>
                {levels.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
              <ChevronDown size={14} />
            </label>
            <label className="filter-select">
              <span className="sr-only">Question format</span>
              <select
                aria-label="Question format"
                value={format}
                onChange={(e) => filter("format", e.target.value)}
              >
                <option value="">All formats</option>
                {Object.entries(formats).map(([k, v]) => (
                  <option value={k} key={k}>
                    {v}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </label>
          </div>
          <div className="results-bar">
            <span>
              {questions.length} question{questions.length !== 1 ? "s" : ""}
              {selected && (
                <>
                  {" "}
                  in <strong>{selected.name}</strong>
                </>
              )}
            </span>
            <div>
              <label>
                <span className="sr-only">Progress filter</span>
                <select
                  value={status}
                  onChange={(e) => filter("status", e.target.value)}
                >
                  <option value="">All progress</option>
                  <option value="new">Not yet attempted</option>
                  <option value="practiced">Practiced</option>
                  <option value="mastered">Mastered</option>
                </select>
              </label>
              {(topic || difficulty || format || search || status) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setParams({});
                  }}
                >
                  Reset filters <X size={12} />
                </button>
              )}
            </div>
          </div>
          {questions.length ? (
            <>
              <div className="question-table">
                <div className="table-header">
                  <span>QUESTION</span>
                  <span>DIFFICULTY</span>
                  <span>FORMAT</span>
                  <span />
                </div>
                {questions
                  .slice((safePage - 1) * 12, safePage * 12)
                  .map((q) => (
                    <QuestionRow key={q.id} question={q} />
                  ))}
              </div>
              <div className="pagination">
                <span>
                  Showing {(safePage - 1) * 12 + 1}–
                  {Math.min(safePage * 12, questions.length)} of{" "}
                  {questions.length}
                </span>
                <div>
                  <button
                    disabled={safePage === 1}
                    onClick={() => setPage(safePage - 1)}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span>
                    {safePage} <i>/</i> {pages}
                  </span>
                  <button
                    disabled={safePage === pages}
                    onClick={() => setPage(safePage + 1)}
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              {mode === "review" && (
                <div className="review-start">
                  <Button onClick={() => session("due")}>
                    Practice due questions <ArrowRight size={16} />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Empty
              icon={
                mode === "review"
                  ? CheckCheck
                  : mode === "saved"
                    ? Bookmark
                    : Search
              }
              title={
                mode === "review"
                  ? "All caught up. Stay curious."
                  : mode === "saved"
                    ? "A good question is worth saving."
                    : "No questions in this corner yet."
              }
              description={
                mode === "review"
                  ? "Your next review will appear here when it is due. Explore something new in the meantime."
                  : mode === "saved"
                    ? "Open a question and use its bookmark button to add it here."
                    : "Try a different topic, level, or search term."
              }
              action={
                <Link className="button secondary" to="/questions">
                  Explore questions <ArrowRight size={16} />
                </Link>
              }
            />
          )}
        </>
      )}
      <div className="library-info">
        <Lightbulb size={17} />
        <p>
          <strong>A question is just the beginning.</strong> Every exercise
          includes progressive hints, a worked explanation, a reflection rubric,
          and a follow-up to go deeper.
        </p>
      </div>
    </>
  );
}
