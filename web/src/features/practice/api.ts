import type { Question } from "../../entities/curriculum/model";
import type { Attempt, Feedback } from "../../entities/learning/model";
import { api } from "../../shared/api/client";
export type RunResult = {
  output: string;
  exitCode: number;
  durationMs: number;
  timedOut: boolean;
  truncated: boolean;
};
export type Submission = {
  answer: string;
  choices: number[];
  elapsedSeconds: number;
};
export const practiceApi = {
  execute: (
    id: string,
    input: { code: string; tests: string; mode: "run" | "test" },
    signal: AbortSignal,
  ) =>
    api<RunResult>(`/questions/${encodeURIComponent(id)}/execute`, {
      method: "POST",
      signal,
      body: JSON.stringify(input),
    }),
  question: (id: string, signal?: AbortSignal) =>
    api<Question>("/questions/" + encodeURIComponent(id), { signal }),
  attempt: (id: string, signal?: AbortSignal) =>
    api<{ attempt: Attempt; feedback: Feedback }>(
      "/attempts/" + encodeURIComponent(id),
      { signal },
    ),
  submit: (id: string, input: Submission) =>
    api<Feedback>(`/questions/${encodeURIComponent(id)}/attempt`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  assess: (id: number, criteria: boolean[]) =>
    api<{ score: number }>(`/attempts/${id}/assess`, {
      method: "POST",
      body: JSON.stringify({ criteria }),
    }),
  bookmark: (id: string, bookmarked: boolean) =>
    api(`/questions/${encodeURIComponent(id)}/bookmark`, {
      method: "PUT",
      body: JSON.stringify({ bookmarked }),
    }),
};
