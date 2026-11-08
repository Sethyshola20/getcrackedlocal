import { parseStoredJSON, tabStorage } from "../../shared/storage/browser.ts";
export function readSession() {
  const storedIDs = parseStoredJSON(tabStorage.read("understack-session"));
  const storedResults = parseStoredJSON(
    tabStorage.read("understack-session-results"),
  );
  const ids = Array.isArray(storedIDs)
    ? storedIDs.filter((id): id is string => typeof id === "string")
    : [];
  const results: Record<string, number> =
    storedResults &&
    typeof storedResults === "object" &&
    !Array.isArray(storedResults)
      ? Object.fromEntries(
          Object.entries(storedResults).filter(
            (entry): entry is [string, number] =>
              typeof entry[1] === "number" &&
              Number.isFinite(entry[1]) &&
              entry[1] >= 0 &&
              entry[1] <= 100,
          ),
        )
      : {};
  return { ids, results };
}
export function startSession(ids: string[]): boolean {
  const saved = tabStorage.write("understack-session", JSON.stringify(ids));
  const reset = tabStorage.write("understack-session-results", "{}");
  return saved && reset;
}
export function rememberSessionResult(id: string, score: number) {
  if (!Number.isFinite(score) || score < 0 || score > 100) return;
  const { results } = readSession();
  tabStorage.write(
    "understack-session-results",
    JSON.stringify({ ...results, [id]: score }),
  );
}
