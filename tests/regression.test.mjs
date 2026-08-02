import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
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

test("limits vetoes to negative sections and reports matched vetoes", () => {
  const profile = loadSkillProfile("fixtures/sectioned-skill");
  const fixtures = loadFixtures("fixtures/sectioned-triggers.json");
  const results = runRegression(profile, fixtures);

  assert.equal(profile.vetoes.includes("destructive"), true);
  assert.equal(profile.vetoes.includes("deletion"), true);
  assert.equal(profile.vetoes.includes("examples"), false);
  assert.equal(profile.vetoes.includes("alpha"), false);
  assert.equal(profile.vetoes.includes("summary"), false);

  assert.equal(results[0].actual, true);
  assert.deepEqual(results[0].matchedVetoes, []);
  assert.equal(results[1].actual, false);
  assert.deepEqual(results[1].matchedVetoes.sort(), ["deletion", "destructive"]);
});

test("ignores ATX headings inside backtick and tilde fences when extracting vetoes", () => {
  const skillDir = mkdtempSync(join(tmpdir(), "fenced-skill-"));
  writeFileSync(join(skillDir, "SKILL.md"), `# fenced-skill

## Examples

Alpha guidance covers destructive deletion examples safely.

\`\`\`markdown
## Limitations
- destructive deletion example
\`\`\`

More ordinary prose remains positive evidence.

~~~markdown
## Do Not Use
- dangerous removal example
~~~

Further beta guidance also remains positive evidence.

## Limitations

Avoid irreversible erasure operations.
`);

  const profile = loadSkillProfile(skillDir);

  for (const falseVeto of ["destructive", "deletion", "ordinary", "dangerous", "removal", "beta"]) {
    assert.equal(profile.vetoes.includes(falseVeto), false);
  }
  assert.equal(profile.vetoes.includes("irreversible"), true);
  assert.equal(profile.vetoes.includes("erasure"), true);

  const [falseVetoRemoved, legitimateVetoRetained] = runRegression(profile, {
    shouldTrigger: [{ prompt: "alpha guidance for destructive deletion" }],
    shouldNotTrigger: [{ prompt: "irreversible erasure operations" }]
  });
  assert.equal(falseVetoRemoved.actual, true);
  assert.deepEqual(falseVetoRemoved.matchedVetoes, []);
  assert.equal(legitimateVetoRetained.actual, false);
  assert.deepEqual(legitimateVetoRetained.matchedVetoes.sort(), ["erasure", "irreversible", "operations"]);
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
