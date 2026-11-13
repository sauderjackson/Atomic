import assert from "node:assert/strict";
import test from "node:test";
import { decide, decisionIssues, planDecisions } from "../scripts/sync-product.mjs";

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
