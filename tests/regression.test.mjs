import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildReport, loadFixtures, loadSkillProfile, renderJson, renderMarkdown, runRegression } from "../dist/index.js";

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

test("extracts trigger sections from level-3 ATX headings without including preamble", () => {
  const skillDir = mkdtempSync(join(tmpdir(), "level-three-trigger-skill-"));
  writeFileSync(join(skillDir, "SKILL.md"), `# level-three-trigger-skill

Boilerplate filler describes unrelated setup.

### When to use

Use this skill for nebula reports and quasar summaries.

### Limitations

Avoid destructive deletion.
`);

  const profile = loadSkillProfile(skillDir);
  const [positive, unrelatedPreamble] = runRegression(profile, {
    shouldTrigger: [{ prompt: "nebula quasar analysis" }],
    shouldNotTrigger: [{ prompt: "boilerplate filler" }]
  });

  assert.equal(positive.actual, true);
  assert.deepEqual(positive.matchedPhrases.sort(), ["nebula", "quasar"]);
  assert.equal(unrelatedPreamble.actual, false);
  assert.deepEqual(unrelatedPreamble.matchedPhrases, []);
});

test("falls back to the opening skill text when no trigger heading exists", () => {
  const skillDir = mkdtempSync(join(tmpdir(), "fallback-trigger-skill-"));
  writeFileSync(join(skillDir, "SKILL.md"), `# fallback-trigger-skill

Nebula reports and quasar summaries are supported.
`);

  const profile = loadSkillProfile(skillDir);
  assert.equal(profile.phrases.includes("nebula"), true);
  assert.equal(profile.phrases.includes("quasar"), true);
});

test("keeps Setext limitation terms out of triggers and uses them as vetoes", () => {
  const profile = loadSkillProfile("fixtures/setext-skill");
  const results = runRegression(profile, loadFixtures("fixtures/setext-triggers.json"));

  for (const phrase of ["analyze", "lunar", "telemetry", "inspect", "orbital", "reports"]) {
    assert.equal(profile.phrases.includes(phrase), true);
  }
  for (const limitation of ["gardening", "recipes"]) {
    assert.equal(profile.phrases.includes(limitation), false);
    assert.equal(profile.vetoes.includes(limitation), true);
  }
  assert.equal(results[0].actual, true);
  assert.equal(results[1].actual, false);
  assert.deepEqual(results[1].matchedVetoes.sort(), ["gardening", "recipes"]);
});

test("ignores fenced Setext pseudo-headings", () => {
  const skillDir = mkdtempSync(join(tmpdir(), "fenced-setext-skill-"));
  writeFileSync(join(skillDir, "SKILL.md"), `# fenced-setext-skill

When to use
-----------

Use this skill for nebula reports and quasar summaries.

\`\`\`markdown
Limitations
-----------
Avoid nebula reports and quasar summaries.
\`\`\`

Limitations
-----------

Avoid gardening recipes.
`);

  const profile = loadSkillProfile(skillDir);
  assert.equal(profile.vetoes.includes("nebula"), false);
  assert.equal(profile.vetoes.includes("quasar"), false);
  assert.equal(profile.vetoes.includes("gardening"), true);
  assert.equal(profile.vetoes.includes("recipes"), true);
});

test("Markdown reports keep prompt and rationale text inline", () => {
  const report = {
    skill: "example",
    passed: true,
    summary: { total: 1, failed: 0, positives: 1, negatives: 0 },
    results: [{
      prompt: "First line\n# injected heading\n- injected item",
      expected: true,
      actual: true,
      score: 1,
      matchedPhrases: [],
      matchedVetoes: [],
      rationale: "Why this matches\n## rationale heading\n* rationale item"
    }]
  };

  const markdown = renderMarkdown(report);
  assert.match(markdown, /^## PASS: First line<br>\\# injected heading<br>\\- injected item$/m);
  assert.match(markdown, /^- Rationale: Why this matches<br>\\#\\# rationale heading<br>\\\* rationale item$/m);
  assert.equal(markdown.includes("\n# injected heading"), false);
  assert.equal(markdown.includes("\n- injected item"), false);
  assert.equal(markdown.includes("\n## rationale heading"), false);
  assert.equal(markdown.includes("\n* rationale item"), false);
});

test("JSON reports preserve multiline prompt and rationale text", () => {
  const report = {
    skill: "example",
    passed: true,
    summary: { total: 1, failed: 0, positives: 1, negatives: 0 },
    results: [{
      prompt: "First line\n# heading\n- item",
      expected: true,
      actual: true,
      score: 1,
      matchedPhrases: [],
      matchedVetoes: [],
      rationale: "Reason\n## heading\n* item"
    }]
  };

  assert.deepEqual(JSON.parse(renderJson(report)), report);
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

test("excludes indented Markdown code from the veto profile", () => {
  const skillDir = mkdtempSync(join(tmpdir(), "indented-code-skill-"));
  writeFileSync(join(skillDir, "SKILL.md"), `# indented-code-skill

Use this skill for alpha reports and beta summaries.

## Examples

    do not use gamma delta

\t## Limitations
\tAvoid coded epsilon examples.

Do not use for genuine destructive deletion.
`);

  const profile = loadSkillProfile(skillDir);

  for (const falseVeto of ["gamma", "delta", "coded", "epsilon", "examples"]) {
    assert.equal(profile.vetoes.includes(falseVeto), false);
  }
  for (const genuineVeto of ["genuine", "destructive", "deletion"]) {
    assert.equal(profile.vetoes.includes(genuineVeto), true);
  }
});

test("indented code directives do not cause end-to-end scoring failures", () => {
  const skillDir = mkdtempSync(join(tmpdir(), "indented-scoring-skill-"));
  writeFileSync(join(skillDir, "SKILL.md"), `# indented-scoring-skill

## When To Use

- alpha reports
- beta summaries

## Examples

    do not use gamma delta

Do not use for genuine destructive deletion.
`);

  const profile = loadSkillProfile(skillDir);
  const [codeExample, genuineDirective] = runRegression(profile, {
    shouldTrigger: [{ prompt: "alpha beta gamma delta" }],
    shouldNotTrigger: [{ prompt: "genuine destructive deletion" }]
  });

  assert.equal(codeExample.actual, true);
  assert.deepEqual(codeExample.matchedVetoes, []);
  assert.equal(genuineDirective.actual, false);
  assert.deepEqual(genuineDirective.matchedVetoes.sort(), ["deletion", "destructive", "genuine"]);
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

test("CLI help succeeds only when used alone", () => {
  const help = runCli(["--help"]);
  assert.equal(help.status, 0);
  assert.match(help.stdout, /^Usage: skill-trigger-regression /);
  assert.equal(help.stderr, "");

  for (const args of [
    ["--help", "--wat"],
    ["run", "--help"],
    ["run", "fixtures/sample-skill", "--help"]
  ]) {
    const result = runCli(args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /^--help must be used alone\nUsage:/);
  }
});

test("CLI rejects repeated value options without producing a report", () => {
  for (const option of ["--fixtures", "--format", "--output"]) {
    const firstValue = option === "--fixtures" ? "fixtures/triggers.json" : option === "--format" ? "markdown" : "first.md";
    const secondValue = option === "--fixtures" ? "fixtures/triggers.json" : option === "--format" ? "json" : "second.md";
    const result = runCli([
      "run", "fixtures/sample-skill",
      "--fixtures", "fixtures/triggers.json",
      option, firstValue,
      option, secondValue
    ]);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, new RegExp(`^Duplicate option: ${option}\\nUsage:`));
  }
});

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

test("CLI rejects output that resolves to the fixture file without changing it", () => {
  const fixture = "fixtures/triggers.json";
  const before = readFileSync(fixture);
  const result = runCli([
    "run", "fixtures/sample-skill",
    "--fixtures", fixture,
    "--output", "fixtures/../fixtures/triggers.json"
  ]);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /^Error: Output path must not overwrite an input file:/);
  assert.deepEqual(readFileSync(fixture), before);
});

test("CLI rejects output that resolves to the target SKILL.md without changing it", () => {
  const skillFile = "fixtures/sample-skill/SKILL.md";
  const before = readFileSync(skillFile);
  const result = runCli([
    "run", "fixtures/sample-skill",
    "--fixtures", "fixtures/triggers.json",
    "--output", "fixtures/sample-skill/../sample-skill/SKILL.md"
  ]);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /^Error: Output path must not overwrite an input file:/);
  assert.deepEqual(readFileSync(skillFile), before);
});

test("CLI writes reports to a distinct output path", () => {
  const directory = mkdtempSync(join(tmpdir(), "trigger-report-"));
  const output = join(directory, "report.json");
  const result = runCli([
    "run", "fixtures/sample-skill",
    "--fixtures", "fixtures/triggers.json",
    "--format", "json",
    "--output", output
  ]);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
  assert.equal(JSON.parse(readFileSync(output, "utf8")).passed, true);
});
