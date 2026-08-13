#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { buildReport } from "./report.js";
import { loadFixtures } from "./fixtures.js";
import { loadSkillProfile } from "./skill.js";
import { renderJson, renderMarkdown } from "./report.js";
import { runRegression } from "./scorer.js";

function help(): string {
  return "Usage: skill-trigger-regression run <skill-dir> --fixtures triggers.json [--format markdown|json] [--output file]";
}

function resolvedPath(file: string): string {
  const absolute = path.resolve(file);
  if (fs.existsSync(absolute)) return fs.realpathSync(absolute);
  return path.join(fs.realpathSync(path.dirname(absolute)), path.basename(absolute));
}

function assertDistinctOutput(output: string, fixtureFile: string, skillDir: string): void {
  const destination = resolvedPath(output);
  const inputs = [resolvedPath(fixtureFile), resolvedPath(path.join(skillDir, "SKILL.md"))];
  if (inputs.includes(destination)) {
    throw new Error(`Output path must not overwrite an input file: ${output}`);
  }
}

const args = process.argv.slice(2);
if (args.length === 1 && args[0] === "--help") {
  console.log(help());
  process.exit(0);
}
if (args.includes("--help")) {
  console.error(`--help must be used alone\n${help()}`);
  process.exit(1);
}
if (args[0] !== "run") {
  console.error(`Expected the run command\n${help()}`);
  process.exit(1);
}
const skillDir = args[1];
const options = new Map<string, string>();
const supported = new Set(["--fixtures", "--format", "--output"]);
for (let index = 2; index < args.length; index += 2) {
  const option = args[index];
  if (!supported.has(option)) {
    console.error(`Unknown option: ${option}\n${help()}`);
    process.exit(1);
  }
  if (options.has(option)) {
    console.error(`Duplicate option: ${option}\n${help()}`);
    process.exit(1);
  }
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    console.error(`Missing value for ${option}\n${help()}`);
    process.exit(1);
  }
  options.set(option, value);
}
const fixtureFile = options.get("--fixtures");
if (!skillDir || !fixtureFile) {
  console.error(`Missing required --fixtures value\n${help()}`);
  process.exit(1);
}
const format = options.get("--format") ?? "markdown";
if (format !== "markdown" && format !== "json") {
  console.error(`Unsupported format: ${format}. Expected markdown or json.`);
  process.exit(1);
}
try {
  const output = options.get("--output");
  if (output) assertDistinctOutput(output, fixtureFile, skillDir);
  const profile = loadSkillProfile(skillDir);
  const report = buildReport(profile, runRegression(profile, loadFixtures(fixtureFile)));
  const rendered = format === "json" ? renderJson(report) : renderMarkdown(report);
  if (output) fs.writeFileSync(output, rendered);
  else process.stdout.write(rendered);
  process.exit(report.passed ? 0 : 2);
} catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
