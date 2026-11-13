#!/usr/bin/env node
import { performance } from "node:perf_hooks";
import { collectFindings } from "./audit.mjs";
import { layerSyncIssues } from "./sync.mjs";

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

console.error("Use: atomic audit    or    atomic sync");
process.exit(1);
