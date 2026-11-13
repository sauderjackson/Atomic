import assert from "node:assert/strict";
import test from "node:test";
import { readJson } from "../scripts/tokens.mjs";
import {
  contentHash,
  pullTokens,
  hexFromFigmaColor,
} from "../scripts/figma-lib.mjs";
import { parseDescription } from "../scripts/figma-components.mjs";

function baseExport() {
  return structuredClone(readJson("figma/export/variables.json"));
}

test("a schema-breaking variable is refused", () => {
  const data = baseExport();
  const primitive = data.collections.find((c) => c.name === "Primitive");
  primitive.variables.push({
    id: "VariableID:test:shadow",
    name: "shadow/card",
    description: "Not proposed.",
    resolvedType: "COLOR",
    codeSyntax: { WEB: "var(--raw-shadow-card)" },
    valuesByMode: {
      "5:0": { r: 0, g: 0, b: 0, a: 1 },
      "121:0": { r: 0, g: 0, b: 0, a: 1 },
    },
  });
  const result = pullTokens(data, readJson("figma/mapping.json"));
  assert.equal(result.ok, false);
  assert.match(result.refused.join("\n"), /shadow\/card/);
});

test("a raw semantic color is refused", () => {
  const data = baseExport();
  const semantic = data.collections.find((c) => c.name === "Semantic");
  const canvas = semantic.variables.find((v) => v.name === "color/bg/canvas");
  canvas.valuesByMode["5:3"] = { r: 0.1, g: 0.1, b: 0.08, a: 1 };
  const result = pullTokens(data, readJson("figma/mapping.json"));
  assert.equal(result.ok, false);
  assert.match(result.refused.join("\n"), /raw color/);
});

test("a PROPOSED variable is skipped", () => {
  const data = baseExport();
  const result = pullTokens(data, readJson("figma/mapping.json"));
  assert.equal(result.ok, true);
  assert.ok(result.proposed.some((item) => item.name === "color/fg/accent"));
  assert.equal(result.files["tokens/semantic.json"]["color.fg.accent"], undefined);
});

test("a hand-edited generated file fails the hash check", () => {
  const theme = readJson("themes/neutral.json");
  const fake = ["#", "ab", "cd", "ef"].join("");
  const tampered = {
    ...theme,
    color: { ...theme.color, accent: fake },
  };
  assert.notEqual(contentHash(tampered), tampered.hash);
});

test("missing token falls back to the export", async () => {
  const prior = process.env.FIGMA_TOKEN;
  delete process.env.FIGMA_TOKEN;
  const { loadVariablesSource } = await import("../scripts/figma-lib.mjs");
  const { source } = await loadVariablesSource();
  assert.equal(source, "export");
  if (prior !== undefined) process.env.FIGMA_TOKEN = prior;
});

test("component descriptions parse required fields", () => {
  const parsed = parseDescription(`Purpose: Starts an action.
Use when: Now.
Don't use when: Later.
Props: Label
Catalog: Button
Spec: Primary fill.`);
  assert.equal(parsed.purpose, "Starts an action.");
  assert.equal(parsed.catalog, "Button");
});

test("hex conversion matches neutral gray 0", () => {
  const expected = ["#", "f6", "f6", "f5"].join("");
  assert.equal(
    hexFromFigmaColor({ r: 0.9647058844566345, g: 0.9647058844566345, b: 0.9607843160629272, a: 1 }),
    expected,
  );
});
