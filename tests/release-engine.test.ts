import assert from "node:assert/strict";
import test from "node:test";
import { assessRelease, demoAssessmentInput } from "../src/release-engine.js";

test("blocks a release and groups related failing evidence", () => {
  const report = assessRelease(demoAssessmentInput());

  assert.equal(report.recommendation, "HOLD");
  assert.equal(report.totals.failed, 2);
  assert.equal(report.totals.warning, 1);
  assert.equal(report.failureGroups.length, 3);
  assert.match(report.summary, /block version 2\.8\.0-rc\.1/);
});

test("ships a release when every supplied check passes", () => {
  const input = demoAssessmentInput();
  input.checks = input.checks.map((check) => ({ ...check, status: "passed" as const }));
  const report = assessRelease(input);

  assert.equal(report.recommendation, "SHIP");
  assert.equal(report.riskScore, 0);
  assert.equal(report.failureGroups.length, 0);
});

test("rejects an assessment with no evidence", () => {
  const input = demoAssessmentInput();
  input.checks = [];
  assert.throws(() => assessRelease(input), /At least one release check/);
});
