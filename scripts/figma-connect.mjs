#!/usr/bin/env node
/**
 * Publishes Code Connect templates. Needs an Organization or Enterprise plan.
 * On Professional, exits cleanly with a plain-words message.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { root } from "./tokens.mjs";

const token = process.env.FIGMA_TOKEN;
if (!token) {
  console.log("FIGMA_TOKEN is not set. Skipping Code Connect publish.");
  process.exit(0);
}

const config = join(root, "figma.config.json");
if (!existsSync(config)) {
  console.error("figma.config.json is missing.");
  process.exit(1);
}

const result = spawnSync(
  "npx",
  ["--yes", "@figma/code-connect", "publish"],
  {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, FIGMA_ACCESS_TOKEN: token },
  },
);

const combined = `${result.stdout || ""}\n${result.stderr || ""}`;
if (/organization|enterprise|plan|403|401|forbidden/i.test(combined)) {
  console.log("Publishing Code Connect needs an Organization or Enterprise plan. Templates are in the repo; publish when the plan allows it.");
  process.exit(0);
}

if (result.status !== 0) {
  console.error(combined.trim() || "Code Connect publish failed.");
  process.exit(result.status ?? 1);
}

console.log(combined.trim() || "Code Connect publish finished.");
