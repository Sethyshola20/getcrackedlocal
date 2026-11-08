import { test } from "node:test";
import assert from "node:assert/strict";
import { selectQuestions } from "../src/features/library/model.ts";
import {
  eligibleQuestions,
  chooseSession,
  summarizeSession,
} from "../src/features/sessions/model.ts";
import { reflectionScore } from "../src/features/practice/model.ts";

const now = Date.parse("2026-11-08T12:00:00Z");
const questions = [
  {
    id: "borrow",
    topic: "rust",
    title: "Borrowed time",
    tags: ["Ownership"],
    difficulty: "Foundation",
    format: "choice",
  },
  {
    id: "queue",
    topic: "go",
    title: "Queue cancellation",
    tags: ["Concurrency"],
    difficulty: "Advanced",
    format: "code",
  },
  {
    id: "raft",
    topic: "distributed",
    title: "A stale leader",
    tags: ["Consensus"],
    difficulty: "Expert",
    format: "design",
  },
];
const topics = [
  { id: "rust", name: "Rust" },
  { id: "go", name: "Go" },
  { id: "distributed", name: "Distributed systems" },
];
const progress = {
  borrow: {
    attempts: 2,
    bestScore: 100,
    bookmarked: true,
    dueAt: "2026-11-08T12:00:00Z",
  },
  queue: {
    attempts: 1,
    bestScore: 33,
    bookmarked: false,
    dueAt: "2026-11-09T12:00:00Z",
  },
};
const ids = (qs) => qs.map((q) => q.id);
test("library combines topic, level, format and case-insensitive concept search", () => {
  assert.deepEqual(
    ids(
      selectQuestions(
        questions,
        topics,
        progress,
        {
          topic: "rust",
          difficulty: "Foundation",
          format: "choice",
          search: "OWNERSHIP",
        },
        now,
      ),
    ),
    ["borrow"],
  );
  assert.deepEqual(
    ids(
      selectQuestions(
        questions,
        topics,
        progress,
        { search: "Distributed systems" },
        now,
      ),
    ),
    ["raft"],
  );
  assert.deepEqual(
    ids(
      selectQuestions(
        questions,
        topics,
        progress,
        { topic: "go", difficulty: "Expert" },
        now,
      ),
    ),
    [],
  );
});
test("saved, due, new and mastered are independent learning views", () => {
  for (const filters of [
    { mode: "saved" },
    { mode: "review" },
    { status: "mastered" },
  ])
    assert.deepEqual(
      ids(selectQuestions(questions, topics, progress, filters, now)),
      ["borrow"],
    );
  assert.deepEqual(
    ids(selectQuestions(questions, topics, progress, { status: "new" }, now)),
    ["raft"],
  );
  assert.deepEqual(
    ids(
      selectQuestions(
        questions,
        topics,
        progress,
        { status: "practiced" },
        now,
      ),
    ),
    ["borrow", "queue"],
  );
  assert.deepEqual(
    ids(
      selectQuestions(
        questions,
        topics,
        { borrow: { ...progress.borrow, dueAt: "invalid" } },
        { mode: "review" },
        now,
      ),
    ),
    [],
  );
});
test("sessions respect focus, saved state and exact due boundary", () => {
  assert.deepEqual(
    ids(
      eligibleQuestions(
        questions,
        progress,
        { topic: "", difficulty: "", source: "due" },
        now,
      ),
    ),
    ["borrow"],
  );
  assert.deepEqual(
    ids(
      eligibleQuestions(
        questions,
        progress,
        { topic: "go", difficulty: "Advanced", source: "new" },
        now,
      ),
    ),
    [],
  );
  assert.deepEqual(
    ids(
      eligibleQuestions(
        questions,
        progress,
        { topic: "", difficulty: "", source: "saved" },
        now,
      ),
    ),
    ["borrow"],
  );
});
test("session selection does not mutate catalog and never repeats a question", () => {
  const original = ids(questions);
  const picked = chooseSession(questions, 10, () => 0);
  assert.equal(picked.length, 3);
  assert.equal(new Set(picked).size, 3);
  assert.deepEqual(ids(questions), original);
  assert.equal(chooseSession(questions, 2, () => 0).length, 2);
  assert.deepEqual(chooseSession([], 5), []);
});
test("recap excludes retired questions and unassessed answers", () => {
  const summary = summarizeSession(
    ["borrow", "raft", "retired"],
    { borrow: 100, retired: 0 },
    questions,
  );
  assert.deepEqual(ids(summary.questions), ["borrow", "raft"]);
  assert.deepEqual(summary.scores, [100]);
  assert.equal(summary.average, 100);
  assert.equal(summarizeSession([], {}, questions).average, 0);
  assert.equal(reflectionScore([true, false, true]), 67);
  assert.equal(reflectionScore([]), 0);
});
