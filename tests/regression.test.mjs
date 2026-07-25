import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

test("rejects invalid and zero-coverage fixture sets", () => {
  const invalid = [
    [{ shouldNotTrigger: [{ prompt: "no" }] }, /shouldTrigger.*array/],
    [{ shouldTrigger: "yes", shouldNotTrigger: [{ prompt: "no" }] }, /shouldTrigger.*array/],
    [{ shouldTrigger: [{}], shouldNotTrigger: [{ prompt: "no" }] }, /shouldTrigger.*item 0.*prompt/],
    [{ shouldTrigger: [{ prompt: "yes", rationale: 1 }], shouldNotTrigger: [{ prompt: "no" }] }, /rationale.*string/],
    [{ shouldTrigger: [], shouldNotTrigger: [{ prompt: "no" }] }, /shouldTrigger.*at least one/],
    [{ shouldTrigger: [{ prompt: "yes" }], shouldNotTrigger: [] }, /shouldNotTrigger.*at least one/]
  ];
  for (const [fixture, message] of invalid) {
    const file = join(tmpdir(), `trigger-fixture-${Math.random()}.json`);
    writeFileSync(file, JSON.stringify(fixture));
    assert.throws(() => loadFixtures(file), message);
  }
});

function runCli(args) {
  return spawnSync(process.execPath, ["dist/cli.js", ...args], { encoding: "utf8" });
}

test("CLI rejects malformed options with concise command errors", () => {
  for (const args of [
    ["run", "fixtures/sample-skill"],
    ["run", "fixtures/sample-skill", "--fixtures"],
    ["run", "fixtures/sample-skill", "--fixtures", "fixtures/triggers.json", "--output"],
    ["run", "fixtures/sample-skill", "--fixtures", "fixtures/triggers.json", "--format", "yaml"],
    ["run", "fixtures/sample-skill", "--fixtures", "fixtures/triggers.json", "--wat", "value"]
  ]) {
    const result = runCli(args);
    assert.equal(result.status, 1);
    assert.equal(result.stderr.includes("node:fs"), false);
    assert.notEqual(result.stderr.trim(), "");
  }
});

test("CLI preserves exit 2 for valid regression failures", () => {
  const file = join(tmpdir(), "trigger-fixture-failure.json");
  writeFileSync(file, JSON.stringify({
    shouldTrigger: [{ prompt: "unrelated words" }],
    shouldNotTrigger: [{ prompt: "video render" }]
  }));
  const result = runCli(["run", "fixtures/sample-skill", "--fixtures", file, "--format", "json"]);
  assert.equal(result.status, 2);
  assert.equal(JSON.parse(result.stdout).passed, false);
});
