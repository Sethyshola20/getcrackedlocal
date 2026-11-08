import { test } from "node:test";
import assert from "node:assert/strict";
import { api, ApiError } from "../src/shared/api/client.ts";

test("transport serializes options and propagates server errors with status", async (t) => {
  const previous = globalThis.fetch;
  t.after(() => (globalThis.fetch = previous));
  let request;
  globalThis.fetch = async (path, options) => {
    request = { path, options };
    return new Response('{"ok":true}');
  };
  const controller = new AbortController();
  assert.deepEqual(
    await api("/test", {
      method: "POST",
      body: "{}",
      signal: controller.signal,
    }),
    { ok: true },
  );
  assert.equal(request.path, "/api/test");
  assert.equal(request.options.signal, controller.signal);
  assert.equal(request.options.headers["Content-Type"], "application/json");
  globalThis.fetch = async () =>
    new Response('{"error":"Sign in required"}', { status: 401 });
  await assert.rejects(
    api("/private"),
    (error) =>
      error instanceof ApiError &&
      error.status === 401 &&
      error.message === "Sign in required",
  );
  globalThis.fetch = async () =>
    new Response("<html>gateway error</html>", { status: 502 });
  await assert.rejects(
    api("/test"),
    (error) => error instanceof ApiError && error.status === 502,
  );
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await api("/empty"), undefined);
});
test("request cancellation remains distinguishable from a server rejection", async (t) => {
  const previous = globalThis.fetch;
  t.after(() => (globalThis.fetch = previous));
  globalThis.fetch = async () => {
    throw new DOMException("Aborted", "AbortError");
  };
  await assert.rejects(api("/test"), (error) => error.name === "AbortError");
});
