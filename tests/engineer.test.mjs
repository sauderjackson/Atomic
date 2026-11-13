import assert from "node:assert/strict";
import test from "node:test";
import { engineerIssues, modelReady, planEngineer, scorePiece } from "../scripts/engineer.mjs";

test("a finished piece scores 10 and picks a version bump", () => {
  const ready = {
    name: "FieldGroup",
    status: "adopt",
    uses: 2,
    productOnly: false,
    sourceExists: true,
    raw: false,
    usesKit: true,
    kitFile: true,
    kitDoc: true,
    inCatalog: true,
  };
  const scored = scorePiece(ready);
  assert.equal(scored.score, 10);
  assert.equal(scored.passed, true);
  assert.equal(scored.bump, "minor");
  assert.equal(scorePiece({ ...ready, name: "Button" }).bump, "patch");
});

test("the adopted field group is parked until it is in the kit", () => {
  const records = planEngineer();
  assert.equal(records.length, 1);
  assert.equal(records[0].name, "FieldGroup");
  assert.equal(records[0].passed, false);
  assert.equal(records[0].bump, null);
  assert.ok(records[0].score < 10);
  assert.ok(records[0].failed.includes("in the catalog"));
  assert.deepEqual(engineerIssues(), []);
});

test("the score file never includes the engineer key", () => {
  const previous = process.env.ENGINEER_API_KEY;
  process.env.ENGINEER_API_KEY = "secret-key-value";
  try {
    assert.equal(modelReady(), true);
    const text = JSON.stringify(planEngineer());
    assert.equal(text.includes("secret-key-value"), false);
    assert.equal(text.includes("ENGINEER_API_KEY"), false);
  } finally {
    if (previous === undefined) delete process.env.ENGINEER_API_KEY;
    else process.env.ENGINEER_API_KEY = previous;
  }
});
