#!/usr/bin/env node
import fs from "node:fs";
import { buildReport } from "./report.js";
import { loadFixtures } from "./fixtures.js";
import { loadSkillProfile } from "./skill.js";
import { renderJson, renderMarkdown } from "./report.js";
import { runRegression } from "./scorer.js";

function help(): string {
  return "Usage: skill-trigger-regression run <skill-dir> --fixtures triggers.json [--format markdown|json] [--output file]";
}

const args = process.argv.slice(2);
if (args.includes("--help") || args[0] !== "run") {
  console.log(help());
  process.exit(args.includes("--help") ? 0 : 1);
}
const skillDir = args[1];
const fixtureFile = args[args.indexOf("--fixtures") + 1];
if (!skillDir || !fixtureFile) {
  console.error(help());
  process.exit(1);
}
const format = args[args.indexOf("--format") + 1] ?? "markdown";
const outputFlag = args.indexOf("--output");
const profile = loadSkillProfile(skillDir);
const report = buildReport(profile, runRegression(profile, loadFixtures(fixtureFile)));
const rendered = format === "json" ? renderJson(report) : renderMarkdown(report);
if (outputFlag >= 0) fs.writeFileSync(args[outputFlag + 1], rendered);
else process.stdout.write(rendered);
process.exit(report.passed ? 0 : 2);
