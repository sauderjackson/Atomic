#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { collectFindings } from "./audit.mjs";
import { engineerIssues, planEngineer } from "./engineer.mjs";
import { decisionIssues, planDecisions } from "./sync-product.mjs";
import { layerSyncIssues } from "./sync.mjs";
import { root } from "./tokens.mjs";

const command = process.argv[2];

if (command === "audit") {
  const started = performance.now();
  const findings = collectFindings();
  const elapsed = Math.round(performance.now() - started);
  for (const finding of findings) {
    const token = finding.token ? `  ${finding.token}` : "";
    console.log(`${finding.severity}  ${finding.file}:${finding.line}  ${finding.raw} -> ${finding.use}${token}`);
  }
  console.log(`${findings.length} findings in ${elapsed}ms`);
  process.exit(findings.length > 0 ? 1 : 0);
}

if (command === "sync") {
  const started = performance.now();
  const issues = layerSyncIssues();
  const elapsed = Math.round(performance.now() - started);
  for (const issue of issues) console.error(issue);
  if (issues.length === 0) console.log(`layer-sync ok in ${elapsed}ms`);
  else console.error(`${issues.length} disagreements in ${elapsed}ms`);
  process.exit(issues.length > 0 ? 1 : 0);
}

if (command === "decisions") {
  const started = performance.now();
  let planned = [];
  let planError = "";
  try {
    planned = planDecisions();
  } catch (error) {
    planError = error instanceof Error ? error.message : String(error);
  }
  for (const decision of planned) {
    console.log(`${decision.status}  ${decision.name}  used ${decision.uses}  ${decision.reason}`);
  }
  const decisionsDir = join(root, "decisions");
  for (const entry of readdirSync(decisionsDir)) {
    if (!entry.endsWith(".json")) continue;
    const data = JSON.parse(readFileSync(join(decisionsDir, entry), "utf8"));
    if (data.source !== "figma") continue;
    console.log(`${data.status}  ${data.name}  figma  ${data.reason}`);
  }
  const issues = planError ? [planError] : decisionIssues();
  const elapsed = Math.round(performance.now() - started);
  for (const issue of issues) console.error(issue);
  if (issues.length === 0) console.log(`decisions ok in ${elapsed}ms`);
  else console.error(`${issues.length} disagreements in ${elapsed}ms`);
  process.exit(issues.length > 0 ? 1 : 0);
}

if (command === "engineer") {
  const started = performance.now();
  let planned = [];
  let planError = "";
  try {
    planned = planEngineer();
  } catch (error) {
    planError = error instanceof Error ? error.message : String(error);
  }
  for (const record of planned) {
    const bump = record.bump ? `  ${record.bump}` : "";
    console.log(`${record.passed ? "release" : "parked"}  ${record.name}  ${record.score} out of 10${bump}  ${record.reason}`);
  }
  const issues = planError ? [planError] : engineerIssues();
  const elapsed = Math.round(performance.now() - started);
  for (const issue of issues) console.error(issue);
  if (issues.length === 0) console.log(`${planned.length} scores in ${elapsed}ms`);
  else console.error(`${issues.length} disagreements in ${elapsed}ms`);
  process.exit(issues.length > 0 ? 1 : 0);
}

console.error("Use: atomic audit, atomic sync, atomic decisions, or atomic engineer");
process.exit(1);
