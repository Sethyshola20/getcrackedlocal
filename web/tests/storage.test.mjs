import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createBrowserStorage,
  parseStoredJSON,
} from "../src/shared/storage/browser.ts";
import { practiceStorage } from "../src/features/practice/storage.ts";
import {
  readSession,
  startSession,
  rememberSessionResult,
} from "../src/features/sessions/storage.ts";

test("unavailable browser storage fails safely", () => {
  const store = createBrowserStorage(() => {
    throw new Error("blocked");
  });
  assert.equal(store.read("key"), null);
  assert.equal(store.write("key", "value"), false);
  assert.equal(store.remove("key"), false);
  assert.equal(parseStoredJSON("broken"), null);
});
test("draft and session keys remain compatible and validate stored data", (t) => {
  const values = new Map();
  const port = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const prior = globalThis.window;
  globalThis.window = { sessionStorage: port, localStorage: port };
  t.after(() => {
    if (prior === undefined) delete globalThis.window;
    else globalThis.window = prior;
  });
  const key = "understack-draft:1:borrow";
  practiceStorage.saveDraft(key, { answer: "reasoning", choices: [1] });
  assert.deepEqual(practiceStorage.readDraft(key), {
    answer: "reasoning",
    choices: [1],
  });
  values.set(key, '{"answer":1,"choices":"bad"}');
  assert.equal(practiceStorage.readDraft(key), null);
  startSession(["borrow"]);
  rememberSessionResult("borrow", 67);
  assert.deepEqual(readSession(), { ids: ["borrow"], results: { borrow: 67 } });
  startSession(["queue"]);
  assert.deepEqual(readSession(), { ids: ["queue"], results: {} });
  values.set("understack-session", "{}");
  values.set(
    "understack-session-results",
    '{"bad":"100","over":200,"valid":0}',
  );
  assert.deepEqual(readSession(), { ids: [], results: { valid: 0 } });
});
