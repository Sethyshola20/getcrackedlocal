import type { Reference } from "../curriculum/model";

export type Progress = {
  questionId: string;
  attempts: number;
  bestScore: number;
  lastScore: number;
  dueAt: string;
  interval: number;
  bookmarked: boolean;
};
export type Attempt = {
  id: number;
  questionId: string;
  title: string;
  topic: string;
  answer: string;
  choices: number[];
  score: number;
  createdAt: string;
  elapsedSeconds: number;
  criteria: boolean[];
};
export type Feedback = {
  attemptId: number;
  score: number;
  autoGraded: boolean;
  solution: string;
  rubric: string[];
  correct: number[] | null;
  expected: string;
  followUp: string;
  references: Reference[];
};
