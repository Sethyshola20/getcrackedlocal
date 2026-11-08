import type { Question, Topic } from "../../entities/curriculum/model";
import type { Progress } from "../../entities/learning/model";
export type QuestionFilters = {
  topic?: string;
  difficulty?: string;
  format?: string;
  search?: string;
  status?: string;
  mode?: "saved" | "review";
};
export function selectQuestions(
  questions: Question[],
  topics: Topic[],
  progress: Record<string, Progress>,
  filters: QuestionFilters,
  now: number,
): Question[] {
  const names = new Map(topics.map((t) => [t.id, t.name]));
  const search = (filters.search || "").toLowerCase();
  return questions.filter((q) => {
    const p = progress[q.id];
    if (
      (filters.topic && q.topic !== filters.topic) ||
      (filters.difficulty && q.difficulty !== filters.difficulty) ||
      (filters.format && q.format !== filters.format)
    )
      return false;
    if (
      search &&
      !`${q.title} ${q.tags.join(" ")} ${names.get(q.topic) || ""}`
        .toLowerCase()
        .includes(search)
    )
      return false;
    if (filters.mode === "saved" && !p?.bookmarked) return false;
    if (
      filters.mode === "review" &&
      (!p?.dueAt ||
        Date.parse(p.dueAt) > now ||
        !Number.isFinite(Date.parse(p.dueAt)))
    )
      return false;
    if (filters.status === "new" && p?.attempts) return false;
    if (filters.status === "practiced" && !p?.attempts) return false;
    return filters.status !== "mastered" || (p?.bestScore || 0) >= 80;
  });
}
