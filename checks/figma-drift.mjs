import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { readJson, root, withoutMeta, renderThemes } from "../scripts/tokens.mjs";
import {
  assertHash,
  pullTokens,
} from "../scripts/figma-lib.mjs";

const GENERATED_PATHS = [
  "themes/neutral.json",
  "themes/okvy.json",
  "tokens/base.json",
  "tokens/semantic.json",
  "tokens/modes/light.json",
  "tokens/modes/dark.json",
];

const CODE_CONNECT = [
  { catalog: "Button", file: "components/atoms/button/button.figma.tsx", props: ["variant"] },
  { catalog: "TextInput", file: "components/atoms/input/input.figma.tsx", props: [] },
  { catalog: "Badge", file: "components/atoms/badge/badge.figma.tsx", props: ["tone"] },
  { catalog: "Icon", file: "components/atoms/icon/icon.figma.tsx", props: ["name"] },
];

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function figmaDriftIssues() {
  const issues = [];
  const warnings = [];

  for (const path of GENERATED_PATHS) {
    if (!existsSync(join(root, path))) {
      issues.push(`${path} is missing. Run npm run figma:pull.`);
      continue;
    }
    const value = readJson(path);
    const hashIssue = assertHash(path, value);
    if (hashIssue) issues.push(hashIssue);
  }

  try {
    const mapping = readJson("figma/mapping.json");
    const { data } = loadVariablesSourceSync();
    const result = pullTokens(data, mapping);
    if (!result.ok) {
      for (const message of result.refused) issues.push(message);
    } else {
      for (const [path, expected] of Object.entries(result.files)) {
        const actual = withoutMeta(readJson(path));
        const want = withoutMeta(expected);
        if (!deepEqual(actual, want)) {
          const sample = firstDiff(want, actual);
          issues.push(
            `Token ${sample} changed in Figma but not in the repo. Run \`npm run figma:pull\`.`,
          );
        }
      }
      const css = renderThemes();
      const onDisk = readFileSync(join(root, "tokens/build/themes.css"), "utf8");
      if (css !== onDisk) {
        issues.push("tokens/build/themes.css does not match a fresh pull. Run npm run figma:pull.");
      }
    }
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
  }

  const catalog = readJson("catalog.json");
  const catalogNames = new Set((catalog.components || []).map((c) => c.name));
  for (const entry of CODE_CONNECT) {
    if (!catalogNames.has(entry.catalog)) continue;
    const full = join(root, entry.file);
    if (!existsSync(full)) {
      issues.push(`${entry.catalog} has no Code Connect template at ${entry.file}.`);
      continue;
    }
    const text = readFileSync(full, "utf8");
    for (const prop of entry.props) {
      if (!text.includes(prop)) {
        issues.push(`${entry.file} is missing prop mapping for ${prop}.`);
      }
    }
  }

  // Warnings: library components without catalog or decision
  try {
    const exportPath = join(root, "figma/export/components.json");
    if (existsSync(exportPath)) {
      const components = JSON.parse(readFileSync(exportPath, "utf8"));
      const decisions = new Set(
        readdirSync(join(root, "decisions"))
          .filter((f) => f.endsWith(".json"))
          .map((f) => f.replace(/\.json$/, "")),
      );
      for (const component of components.components || []) {
        if (component.pageRole === "private" && !component.name.startsWith("_") && !component.name.startsWith(".")) {
          warnings.push(`Private page component ${component.name} should use a _ or . prefix.`);
        }
        if (component.pageRole !== "library") continue;
        const catalogLine = component.parsed?.catalog || "";
        const catalogName = catalogLine.split(/\s|\(/)[0];
        const hasCatalog = catalogNames.has(catalogName);
        const id = kebab(component.name);
        if (
          !hasCatalog
          && !decisions.has(id)
          && !/candidate/i.test(catalogLine)
          && !/parked/i.test(catalogLine)
        ) {
          warnings.push(`Library component ${component.name} has neither a catalog entry nor a decision record.`);
        }
      }
    }
  } catch {
    // ignore warning scan failures
  }

  for (const warning of warnings) {
    console.warn(`warning: ${warning}`);
  }

  return issues;
}

function loadVariablesSourceSync() {
  // Drift always prefers the committed export when no token, matching pull fallback.
  // Use the sync helper via deasync-free approach: only sync export for Gate.
  const exportPath = join(root, "figma/export/variables.json");
  if (!existsSync(exportPath)) {
    throw new Error("figma/export/variables.json is missing.");
  }
  return { data: JSON.parse(readFileSync(exportPath, "utf8")) };
}

function firstDiff(expected, actual, path = "") {
  if (expected && actual && typeof expected === "object" && typeof actual === "object") {
    const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
    for (const key of keys) {
      const next = path ? `${path}.${key}` : key;
      if (!deepEqual(expected[key], actual[key])) return firstDiff(expected[key], actual[key], next);
    }
  }
  return path || "value";
}

function kebab(name) {
  return name
    .replaceAll(" / ", " ")
    .replaceAll("/", " ")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

if (process.argv[1] && process.argv[1].endsWith("figma-drift.mjs")) {
  const issues = figmaDriftIssues();
  for (const issue of issues) console.error(issue);
  process.exit(issues.length > 0 ? 1 : 0);
}
