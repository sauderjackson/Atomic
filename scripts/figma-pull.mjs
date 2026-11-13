#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { root, readJson } from "./tokens.mjs";
import {
  loadVariablesSource,
  pullTokens,
  writePullResult,
  stripMeta,
  diffTheme,
} from "./figma-lib.mjs";

function readMaybe(path) {
  const full = join(root, path);
  if (!existsSync(full)) return null;
  return JSON.parse(readFileSync(full, "utf8"));
}

const { source, data } = await loadVariablesSource();
const mapping = readJson("figma/mapping.json");
const result = pullTokens(data, mapping);

if (!result.ok) {
  for (const message of result.refused) console.error(message);
  process.exit(1);
}

const before = {
  neutral: stripMeta(readMaybe("themes/neutral.json")),
  okvy: stripMeta(readMaybe("themes/okvy.json")),
  semantic: stripMeta(readMaybe("tokens/semantic.json")),
  light: stripMeta(readMaybe("tokens/modes/light.json")),
  dark: stripMeta(readMaybe("tokens/modes/dark.json")),
  base: stripMeta(readMaybe("tokens/base.json")),
};

writePullResult(result);

const build = spawnSync("npm", ["run", "build:tokens"], { cwd: root, encoding: "utf8" });
if (build.status !== 0) {
  console.error(build.stdout);
  console.error(build.stderr);
  process.exit(build.status ?? 1);
}

const after = {
  neutral: stripMeta(result.files["themes/neutral.json"]),
  okvy: stripMeta(result.files["themes/okvy.json"]),
  semantic: stripMeta(result.files["tokens/semantic.json"]),
  light: stripMeta(result.files["tokens/modes/light.json"]),
  dark: stripMeta(result.files["tokens/modes/dark.json"]),
  base: stripMeta(result.files["tokens/base.json"]),
};

const changes = [
  ...diffTheme(before.neutral, after.neutral, "themes/neutral"),
  ...diffTheme(before.okvy, after.okvy, "themes/okvy"),
  ...diffTheme(before.semantic, after.semantic, "tokens/semantic"),
  ...diffTheme(before.light, after.light, "tokens/modes/light"),
  ...diffTheme(before.dark, after.dark, "tokens/modes/dark"),
  ...diffTheme(before.base, after.base, "tokens/base"),
];

console.log(`figma:pull source=${source}`);
console.log(`Changed values: ${changes.length}`);
for (const change of changes) {
  console.log(`  ${change.path}: ${JSON.stringify(change.from)} → ${JSON.stringify(change.to)}`);
}
console.log(`Proposed (skipped): ${result.proposed.length}`);
for (const item of result.proposed) {
  console.log(`  ${item.kind} ${item.name}${item.note ? ` — ${item.note}` : ""}`);
}
console.log("Refused: 0");
