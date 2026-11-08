import {
  parseStoredJSON,
  persistentStorage,
  tabStorage,
} from "../../shared/storage/browser.ts";
export type Draft = { answer: string; choices: number[] };
export function readDraft(key: string): Draft | null {
  const value = parseStoredJSON(tabStorage.read(key));
  if (!value || typeof value !== "object") return null;
  const draft = value as Partial<Draft>;
  if (
    typeof draft.answer !== "string" ||
    !Array.isArray(draft.choices) ||
    !draft.choices.every((v) => Number.isInteger(v) && v >= 0)
  )
    return null;
  return { answer: draft.answer, choices: draft.choices };
}
export const practiceStorage = {
  readDraft,
  saveDraft: (key: string, draft: Draft) =>
    tabStorage.write(key, JSON.stringify(draft)),
  removeDraft: (key: string) => tabStorage.remove(key),
  readNote: (key: string) => persistentStorage.read(key) || "",
  saveNote: (key: string, value: string) => persistentStorage.write(key, value),
};
