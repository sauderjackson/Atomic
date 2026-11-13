import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { decide, decisionIssues, figmaDecisionIssues, planDecisions } from "../scripts/sync-product.mjs";
import { root } from "../scripts/tokens.mjs";

test("one use stays a candidate and the second use adopts it", () => {
  assert.equal(decide({ productOnly: false, reason: "", uses: 1 }).status, "candidate");
  assert.equal(decide({ productOnly: false, reason: "", uses: 2 }).status, "adopt");
});

test("a product-only piece stays out", () => {
  const decision = decide({
    productOnly: true,
    reason: "It belongs to the product.",
    uses: 2,
  });
  assert.equal(decision.status, "leave out");
  assert.equal(decision.reason, "It belongs to the product.");
});

test("the practice app has one adopt, one candidate, and one leave-out", () => {
  const decisions = Object.fromEntries(planDecisions().map((decision) => [decision.name, decision.status]));
  assert.deepEqual(decisions, {
    FieldGroup: "adopt",
    NoteCard: "candidate",
    PracticeBanner: "leave out",
  });
  assert.deepEqual(decisionIssues(), []);
});

test("figma candidates validate next to practice-app ones", () => {
  const figmaFiles = readdirSync(join(root, "decisions")).filter((entry) => {
    const data = JSON.parse(readFileSync(join(root, "decisions", entry), "utf8"));
    return data.source === "figma";
  });
  assert.ok(figmaFiles.length > 0);
  assert.deepEqual(figmaDecisionIssues(), []);
  const draft = JSON.parse(readFileSync(join(root, "decisions", "social-l7-end.json"), "utf8"));
  assert.equal(draft.status, "candidate");
  assert.equal(draft.needsHuman, true);
  assert.equal(draft.surface, "social");
});
