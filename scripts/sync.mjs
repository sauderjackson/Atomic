import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCatalog, renderAgents, renderCatalog } from "./build-catalog.mjs";
import { buildDocsPages } from "./build-docs.mjs";
import { renderThemes, root } from "./tokens.mjs";

export function layerSyncIssues() {
  const issues = [];
  compare("tokens/build/themes.css", renderThemes(), "Run npm run build:tokens.", issues);
  let generated;
  try {
    generated = buildCatalog();
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
    return issues;
  }
  compare("catalog.json", renderCatalog(generated.catalog), "Run npm run build:catalog.", issues);
  compare("AGENTS.md", renderAgents(generated.catalog.rules), "Run npm run build:catalog.", issues);
  let pages;
  try {
    pages = buildDocsPages();
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
    return issues;
  }
  for (const [file, text] of Object.entries(pages)) {
    compare(file, text, "Run npm run build:docs.", issues);
  }
  return issues;
}

function compare(file, expected, hint, issues) {
  let actual = "";
  try {
    actual = readFileSync(join(root, file), "utf8");
  } catch {
    issues.push(`${file} is missing. ${hint}`);
    return;
  }
  if (actual !== expected) issues.push(`${file} disagrees with the token source. ${hint}`);
}
