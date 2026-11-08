import type {
  Course,
  LearningPath,
  Question,
  Topic,
} from "../../entities/curriculum/model";
import type { User } from "../../entities/identity/model";
import type { Attempt, Progress } from "../../entities/learning/model";

export type Bootstrap = {
  courses: Course[];
  lessonProgress: Record<string, { completed: boolean; updatedAt: string }>;
  user: User | null;
  topics: Topic[];
  questions: Question[];
  paths: LearningPath[];
  progress: Record<string, Progress>;
  attempts: Attempt[];
  activity: { date: string; count: number }[];
  stats: {
    mastered: number;
    attempts: number;
    streak: number;
    xp: number;
    today: number;
    due: number;
  };
};
