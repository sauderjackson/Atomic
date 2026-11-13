import assert from "node:assert/strict";
import test from "node:test";
import { collectFindings, suggest } from "../scripts/audit.mjs";
import { layerSyncIssues } from "../scripts/sync.mjs";
import { readJson } from "../scripts/tokens.mjs";

test("an exact color points at the token that holds it", () => {
  const catalog = readJson("catalog.json");
  const surface = catalog.tokens["color.bg.surface"];
  const hint = suggest(surface.values.neutral.light, catalog);
  assert.equal(hint.severity, "major");
  assert.match(hint.use, /^var\(--/);
  assert.match(hint.token, /color\.bg\.surface/);
});

test("a nearby color is a minor suggestion", () => {
  const catalog = readJson("catalog.json");
  const surface = catalog.tokens["color.bg.surface"].values.neutral.light;
  const rgb = surface.slice(1).match(/../g).map((part) => Number.parseInt(part, 16));
  rgb[0] = Math.min(255, rgb[0] + 2);
  const shifted = `#${rgb.map((part) => part.toString(16).padStart(2, "0")).join("")}`;
  const hint = suggest(shifted, catalog);
  assert.equal(hint.severity, "minor");
  assert.match(hint.use, /^var\(--/);
});

test("an exact size points at the token that holds it", () => {
  const catalog = readJson("catalog.json");
  const tap = catalog.tokens["size.tap"];
  const hint = suggest(tap.values.neutral.light, catalog);
  assert.equal(hint.severity, "major");
  assert.match(hint.token, /size\.tap/);
});

test("the repo has no raw values outside the token source", () => {
  assert.deepEqual(collectFindings(), []);
});

test("docs, catalog, agent rules, and tokens agree", () => {
  assert.deepEqual(layerSyncIssues(), []);
});
