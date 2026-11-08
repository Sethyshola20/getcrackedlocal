export type Topic = {
  id: string;
  name: string;
  short: string;
  description: string;
  color: string;
  category: string;
};
export type Question = {
  id: string;
  topic: string;
  title: string;
  difficulty: string;
  format: string;
  minutes: number;
  tags: string[];
  prompt?: string;
  code?: string;
  language?: string;
  tests?: string;
  options?: string[];
  hints?: string[];
  references?: Reference[];
};
export type Reference = { title: string; url: string };
export type LearningPath = {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  topics: string[];
  questionIds: string[];
};
export type Lesson = {
  id: string;
  title: string;
  summary: string;
  moduleId: string;
  kind: "concept" | "workshop" | "capstone";
  objectives: string[];
  body?: string;
  minutes: number;
  questionIds: string[];
};
export type CourseModule = {
  id: string;
  title: string;
  description: string;
  level: string;
};
export type Course = {
  id: string;
  topic: string;
  title: string;
  description: string;
  prerequisites: string[];
  outcomes: string[];
  modules: CourseModule[];
  lessons: Lesson[];
};
