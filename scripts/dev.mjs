import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const cwd = resolve(fileURLToPath(new URL("..", import.meta.url)));
const build = spawnSync(
  "go",
  ["build", "-o", "bin/understack", "./cmd/server"],
  {
    cwd,
    stdio: "inherit",
    env: process.env,
  },
);
if (build.error || build.status !== 0) {
  console.error(build.error?.message || "The Go backend could not be built.");
  process.exit(1);
}
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  setTimeout(() => process.exit(code), 1000).unref();
}
for (const [command, args, childCwd] of [
  [resolve(cwd, "bin/understack"), [], cwd],
  [
    process.execPath,
    [resolve(cwd, "web/node_modules/vite/bin/vite.js"), "--host", "127.0.0.1"],
    resolve(cwd, "web"),
  ],
]) {
  const child = spawn(command, args, {
    cwd: childCwd,
    stdio: "inherit",
    env: process.env,
  });
  children.push(child);
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping) stop(code || 0);
  });
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
