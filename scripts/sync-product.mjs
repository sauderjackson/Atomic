import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { root } from "./tokens.mjs";

const productRoot = join("examples", "product");
const piecesDir = join(root, productRoot, "src", "pieces");
const decisionsDir = join(root, "decisions");

export function decide(piece) {
  if (piece.productOnly) {
    return {
      status: "leave out",
      reason: piece.reason,
    };
  }
  if (piece.uses >= 2) {
    return {
      status: "adopt",
      reason: "Used in two places. It joins the kit.",
    };
  }
  if (piece.uses === 1) {
    return {
      status: "candidate",
      reason: "Used once. It joins the kit the second time it shows up.",
    };
  }
  return {
    status: "leave out",
    reason: "It is not used on a screen, so it stays out of the kit.",
  };
}

export function planDecisions() {
  if (!existsSync(piecesDir)) {
    throw new Error("examples/product/src/pieces is missing.");
  }
  const pieces = readdirSync(piecesDir)
    .filter((entry) => entry.endsWith(".tsx"))
    .sort();
  if (pieces.length === 0) {
    throw new Error("The practice app has no pieces to decide on.");
  }
  return pieces.map((entry) => {
    const name = entry.slice(0, -".tsx".length);
    if (!/^[A-Z][A-Za-z0-9]+$/.test(name)) {
      throw new Error(`${entry} must be a PascalCase piece name.`);
    }
    const sourcePath = join(piecesDir, entry);
    const note = readSidecar(sourcePath, name);
    const uses = countUses(name, sourcePath);
    const decision = decide({
      productOnly: Boolean(note),
      reason: note?.reason ?? "",
      uses,
    });
    return {
      id: name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(),
      name,
      status: decision.status,
      uses,
      reason: decision.reason,
      source: relative(root, sourcePath).split("\\").join("/"),
    };
  });
}

export function renderDecision(decision) {
  return `${JSON.stringify(
    {
      generatedBy: "scripts/sync-product.mjs",
      name: decision.name,
      status: decision.status,
      uses: decision.uses,
      reason: decision.reason,
      source: decision.source,
    },
    null,
    2,
  )}\n`;
}

export function decisionIssues() {
  let planned;
  try {
    planned = planDecisions();
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }
  const issues = [];
  const expected = new Set(planned.map((decision) => `${decision.id}.json`));
  if (!existsSync(decisionsDir)) {
    issues.push("decisions/ is missing. Run npm run sync:product.");
    return issues;
  }
  for (const entry of readdirSync(decisionsDir)) {
    if (!expected.has(entry)) issues.push(`decisions/${entry} is not a current practice-app piece.`);
  }
  for (const decision of planned) {
    const file = join(decisionsDir, `${decision.id}.json`);
    let actual = "";
    try {
      actual = readFileSync(file, "utf8");
    } catch {
      issues.push(`decisions/${decision.id}.json is missing. Run npm run sync:product.`);
      continue;
    }
    const expectedText = renderDecision(decision);
    if (actual !== expectedText) {
      issues.push(`decisions/${decision.id}.json disagrees with the practice app. Run npm run sync:product.`);
    }
  }
  return issues;
}

export function writeDecisions() {
  const planned = planDecisions();
  mkdirSync(decisionsDir, { recursive: true });
  const expected = new Set(planned.map((decision) => `${decision.id}.json`));
  for (const entry of readdirSync(decisionsDir)) {
    if (!expected.has(entry)) rmSync(join(decisionsDir, entry));
  }
  for (const decision of planned) {
    writeFileSync(join(decisionsDir, `${decision.id}.json`), renderDecision(decision));
  }
  return planned;
}

function readSidecar(sourcePath, name) {
  const sidecar = sourcePath.replace(/\.tsx$/, ".json");
  if (!existsSync(sidecar)) return null;
  let data;
  try {
    data = JSON.parse(readFileSync(sidecar, "utf8"));
  } catch {
    throw new Error(`${name}.json must be valid JSON.`);
  }
  if (data.productOnly !== true) {
    throw new Error(`${name}.json may only mark a piece as product-only.`);
  }
  if (typeof data.reason !== "string" || data.reason.trim() === "") {
    throw new Error(`${name}.json needs a reason for leaving the piece out.`);
  }
  return data;
}

function countUses(name, ownFile) {
  const pattern = new RegExp("<" + name + "\\b", "g");
  let count = 0;
  walk(join(root, productRoot, "src"), (file) => {
    if (file === ownFile) return;
    if (!file.endsWith(".tsx") && !file.endsWith(".jsx")) return;
    const text = readFileSync(file, "utf8");
    pattern.lastIndex = 0;
    count += [...text.matchAll(pattern)].length;
  });
  return count;
}

function walk(dir, visit) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist") continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, visit);
    else visit(path);
  }
}

if (process.argv[1] && process.argv[1].endsWith("sync-product.mjs")) {
  const write = process.argv.includes("--write");
  if (write) {
    const planned = writeDecisions();
    for (const decision of planned) console.log(`${decision.status}  ${decision.name}`);
  } else {
    const issues = decisionIssues();
    for (const issue of issues) console.error(issue);
    process.exit(issues.length > 0 ? 1 : 0);
  }
}
