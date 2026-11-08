import type { Question } from "../../entities/curriculum/model";
import type { Progress } from "../../entities/learning/model";
export type SessionFilters = {
  topic: string;
  difficulty: string;
  source: string;
};
export function eligibleQuestions(
  questions: Question[],
  progress: Record<string, Progress>,
  filters: SessionFilters,
  now: number,
) {
  return questions.filter((q) => {
    const p = progress[q.id];
    return (
      (!filters.topic || q.topic === filters.topic) &&
      (!filters.difficulty || q.difficulty === filters.difficulty) &&
      (filters.source !== "due" ||
        (!!p?.dueAt && Date.parse(p.dueAt) <= now)) &&
      (filters.source !== "new" || !p?.attempts) &&
      (filters.source !== "saved" || p?.bookmarked)
    );
  });
}
export function chooseSession(
  questions: Question[],
  count: number,
  random: () => number = Math.random,
): string[] {
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.max(0, count)).map((q) => q.id);
}
export function summarizeSession(
  ids: string[],
  results: Record<string, number>,
  catalog: Question[],
) {
  const questions = ids
    .map((id) => catalog.find((q) => q.id === id))
    .filter((q): q is Question => !!q);
  const scores = questions
    .filter((q) => Number.isFinite(results[q.id]))
    .map((q) => results[q.id]);
  const average = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;
  return { questions, scores, average };
}
