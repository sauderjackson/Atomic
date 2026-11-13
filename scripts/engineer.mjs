import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { textHasRawValue } from "./audit.mjs";
import { planDecisions } from "./sync-product.mjs";
import { readJson, root } from "./tokens.mjs";

const engineerDir = join(root, "engineer");
const originalAtoms = new Set(["Button", "TextInput", "Type", "Badge", "Icon"]);

const checkNames = [
  "adopted",
  "source",
  "no raw value",
  "uses the kit",
  "used twice",
  "not product-only",
  "kit file",
  "kit doc",
  "in the catalog",
  "named",
];

export function scorePiece(piece) {
  const results = [
    piece.status === "adopt",
    piece.sourceExists,
    !piece.raw,
    piece.usesKit,
    piece.uses >= 2,
    !piece.productOnly,
    piece.kitFile,
    piece.kitDoc,
    piece.inCatalog,
    /^[A-Z][A-Za-z0-9]+$/.test(piece.name),
  ];
  const failed = checkNames.filter((name, index) => !results[index]);
  const score = checkNames.length - failed.length;
  const passed = failed.length === 0;
  const bump = passed ? (originalAtoms.has(piece.name) ? "patch" : "minor") : null;
  return {
    score,
    passed,
    failed,
    bump,
    reason: passed
      ? `Scored 10 out of 10. The release bump is ${bump}.`
      : `Scored ${score} out of 10. A person needs to build it into the kit or drop it.`,
  };
}

export function planEngineer() {
  const catalog = readJson("catalog.json");
  const catalogNames = new Set(catalog.components.map((component) => component.name));
  const kit = kitFiles();
  return planDecisions()
    .filter((decision) => decision.status === "adopt")
    .map((decision) => {
      const sourcePath = join(root, decision.source);
      const sourceExists = existsSync(sourcePath);
      const text = sourceExists ? readFileSync(sourcePath, "utf8") : "";
      const scored = scorePiece({
        name: decision.name,
        status: decision.status,
        uses: decision.uses,
        productOnly: false,
        sourceExists,
        raw: sourceExists && textHasRawValue(text),
        usesKit: text.includes("@components/"),
        kitFile: kit.tsx.has(decision.name),
        kitDoc: kit.docs.has(idFor(decision.name)),
        inCatalog: catalogNames.has(decision.name),
      });
      return {
        id: decision.id,
        name: decision.name,
        score: scored.score,
        passed: scored.passed,
        bump: scored.bump,
        failed: scored.failed,
        reason: scored.reason,
        source: decision.source,
      };
    });
}

export function renderEngineer(record) {
  return `${JSON.stringify(
    {
      generatedBy: "scripts/engineer.mjs",
      name: record.name,
      score: record.score,
      passed: record.passed,
      bump: record.bump,
      failed: record.failed,
      reason: record.reason,
      source: record.source,
    },
    null,
    2,
  )}\n`;
}

export function engineerIssues() {
  let planned;
  try {
    planned = planEngineer();
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }
  const issues = [];
  const expected = new Set(planned.map((record) => `${record.id}.json`));
  if (!existsSync(engineerDir)) {
    if (planned.length === 0) return [];
    return ["engineer/ is missing. Run npm run sync:engineer."];
  }
  for (const entry of readdirSync(engineerDir)) {
    if (!expected.has(entry)) issues.push(`engineer/${entry} is not a current adopted piece.`);
  }
  for (const record of planned) {
    const file = join(engineerDir, `${record.id}.json`);
    let actual = "";
    try {
      actual = readFileSync(file, "utf8");
    } catch {
      issues.push(`engineer/${record.id}.json is missing. Run npm run sync:engineer.`);
      continue;
    }
    if (actual !== renderEngineer(record)) {
      issues.push(`engineer/${record.id}.json disagrees with the score. Run npm run sync:engineer.`);
    }
    if (actual.includes("ENGINEER_API_KEY") || /sk-|xai-|cursor_/.test(actual)) {
      issues.push(`engineer/${record.id}.json must not contain a key.`);
    }
  }
  return issues;
}

export function writeEngineer() {
  const planned = planEngineer();
  mkdirSync(engineerDir, { recursive: true });
  const expected = new Set(planned.map((record) => `${record.id}.json`));
  for (const entry of readdirSync(engineerDir)) {
    if (!expected.has(entry)) rmSync(join(engineerDir, entry));
  }
  for (const record of planned) {
    writeFileSync(join(engineerDir, `${record.id}.json`), renderEngineer(record));
  }
  return planned;
}

export function modelReady() {
  return typeof process.env.ENGINEER_API_KEY === "string" && process.env.ENGINEER_API_KEY.trim() !== "";
}

export function openParkedIssues(records = planEngineer()) {
  const parked = records.filter((record) => !record.passed);
  if (parked.length === 0) {
    console.log("Nothing is parked.");
    return;
  }
  if (!process.env.GH_TOKEN && !process.env.GITHUB_TOKEN) {
    console.log("No GitHub token. Parked pieces stay in engineer/.");
    return;
  }
  gh(["label", "create", "needs-human", "--description", "A person needs to build this piece or drop it.", "--force"]);
  const listed = gh(["issue", "list", "--label", "needs-human", "--state", "open", "--json", "title", "--limit", "50"]);
  const titles = new Set();
  if (listed.status === 0 && listed.stdout.trim()) {
    for (const issue of JSON.parse(listed.stdout)) titles.add(issue.title);
  }
  for (const record of parked) {
    const title = `Needs a person: ${record.name}`;
    if (titles.has(title)) {
      console.log(`${title} is already open.`);
      continue;
    }
    const failed = record.failed.join(", ");
    const body = [
      record.reason,
      "",
      `Failed checks: ${failed}.`,
      "",
      "A person can build this piece into the kit, or drop it.",
    ].join("\n");
    const created = gh(["issue", "create", "--title", title, "--body", body, "--label", "needs-human"]);
    if (created.status !== 0) {
      console.error(created.stderr || created.stdout);
      process.exit(created.status || 1);
    }
    console.log(created.stdout.trim());
  }
}

function kitFiles() {
  const tsx = new Set();
  const docs = new Set();
  walk(join(root, "components"), (file) => {
    const name = basename(file);
    if (name.endsWith(".tsx")) tsx.add(name.slice(0, -".tsx".length));
    if (name.endsWith(".md")) docs.add(name.slice(0, -".md".length));
  });
  return { tsx, docs };
}

function idFor(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function walk(dir, visit) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, visit);
    else visit(path);
  }
}

function gh(args) {
  return spawnSync("gh", args, { encoding: "utf8" });
}

if (process.argv[1] && process.argv[1].endsWith("engineer.mjs")) {
  if (process.argv.includes("--issues")) {
    openParkedIssues();
  } else if (process.argv.includes("--write")) {
    const planned = writeEngineer();
    for (const record of planned) {
      console.log(`${record.passed ? "release" : "parked"}  ${record.name}  ${record.score} out of 10`);
    }
    if (modelReady()) console.log("Engineer key is set.");
    else console.log("Engineer key is not set. The score still runs.");
  } else {
    const issues = engineerIssues();
    for (const issue of issues) console.error(issue);
    process.exit(issues.length > 0 ? 1 : 0);
  }
}
