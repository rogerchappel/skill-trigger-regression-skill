import assert from "node:assert/strict";
import test from "node:test";
import { buildReport, loadFixtures, loadSkillProfile, runRegression } from "../dist/index.js";

test("passes sample trigger regression", () => {
  const profile = loadSkillProfile("fixtures/sample-skill");
  const fixtures = loadFixtures("fixtures/triggers.json");
  const report = buildReport(profile, runRegression(profile, fixtures));
  assert.equal(report.passed, true);
  assert.equal(report.summary.total, 4);
});

test("reports matched phrases", () => {
  const profile = loadSkillProfile("fixtures/sample-skill");
  const fixtures = loadFixtures("fixtures/triggers.json");
  const result = runRegression(profile, fixtures)[0];
  assert.ok(result.matchedPhrases.length >= 2);
});
