import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../src/", import.meta.url));
function files(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? files(path.join(dir, entry.name))
        : /\.tsx?$/.test(entry.name)
          ? [path.join(dir, entry.name)]
          : [],
    );
}
const sources = files(root);
function dependencies(file) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    99,
    true,
  );
  const dependencies = [];
  function visit(node) {
    if (ts.isImportDeclaration(node)) {
      const spec = node.moduleSpecifier.text;
      const typeOnly =
        node.importClause?.isTypeOnly ||
        (node.importClause?.namedBindings &&
          ts.isNamedImports(node.importClause.namedBindings) &&
          !node.importClause.name &&
          node.importClause.namedBindings.elements.every((e) => e.isTypeOnly));
      dependencies.push({ spec, typeOnly });
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      ts.isStringLiteral(node.arguments[0])
    )
      dependencies.push({ spec: node.arguments[0].text, typeOnly: false });
    ts.forEachChild(node, visit);
  }
  visit(source);
  return dependencies;
}
function resolve(file, spec) {
  if (!spec.startsWith(".")) return null;
  const base = path.resolve(path.dirname(file), spec);
  return (
    [base, base + ".ts", base + ".tsx", path.join(base, "index.ts")].find(
      (file) => fs.existsSync(file) && fs.statSync(file).isFile(),
    ) || null
  );
}
test("shared and entity modules cannot depend on features or app composition", () => {
  for (const file of sources) {
    const layer = path.relative(root, file).split(path.sep)[0];
    for (const { spec } of dependencies(file)) {
      const resolved = resolve(file, spec);
      if (!resolved) continue;
      const target = path.relative(root, resolved).split(path.sep)[0];
      if (layer === "shared")
        assert.equal(target, "shared", `${file} imports ${spec}`);
      if (layer === "entities")
        assert.ok(
          ["entities", "shared"].includes(target),
          `${file} imports ${spec}`,
        );
      if (layer === "features")
        assert.notEqual(target, "app", `${file} imports the composition root`);
    }
  }
});
test("network and browser persistence stay behind dedicated adapters", () => {
  for (const file of sources) {
    const relative = path.relative(root, file);
    const source = fs.readFileSync(file, "utf8");
    if (/\bfetch\s*\(/.test(source))
      assert.equal(relative, "shared/api/client.ts");
    if (/\b(?:localStorage|sessionStorage)\b/.test(source))
      assert.equal(relative, "shared/storage/browser.ts");
    for (const { spec } of dependencies(file))
      if (spec.includes("shared/api/client"))
        assert.equal(
          path.basename(file),
          "api.ts",
          `${relative} bypasses its feature API`,
        );
  }
});
test("runtime module graph is acyclic", () => {
  const active = new Set(),
    visited = new Set();
  function visit(file, chain = []) {
    if (visited.has(file)) return;
    assert.ok(
      !active.has(file),
      "Import cycle: " +
        [...chain, file].map((f) => path.relative(root, f)).join(" → "),
    );
    active.add(file);
    for (const d of dependencies(file)) {
      const target = resolve(file, d.spec);
      if (!d.typeOnly && target) visit(target, [...chain, file]);
    }
    active.delete(file);
    visited.add(file);
  }
  for (const file of sources) visit(file);
});
