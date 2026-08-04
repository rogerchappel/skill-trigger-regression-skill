import type { RegressionReport, PromptResult, SkillProfile } from "./types.js";

export function buildReport(profile: SkillProfile, results: PromptResult[]): RegressionReport {
  const failed = results.filter((result) => result.expected !== result.actual).length;
  return {
    skill: profile.name,
    passed: failed === 0,
    summary: {
      total: results.length,
      failed,
      positives: results.filter((result) => result.expected).length,
      negatives: results.filter((result) => !result.expected).length
    },
    results
  };
}

export function renderJson(report: RegressionReport): string {
  return JSON.stringify(report, null, 2);
}

function renderMarkdownInline(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\\/g, "\\\\")
    .replace(/([`*_[\]{}()#+.!|\-])/g, "\\$1")
    .replace(/\r\n?|\n/g, "<br>");
}

export function renderMarkdown(report: RegressionReport): string {
  const lines = ["# Skill Trigger Regression", "", `Skill: ${report.skill}`, `Passed: ${report.passed ? "yes" : "no"}`, `Total: ${report.summary.total} | Failed: ${report.summary.failed}`, ""];
  for (const result of report.results) {
    const icon = result.expected === result.actual ? "PASS" : "FAIL";
    lines.push(`## ${icon}: ${renderMarkdownInline(result.prompt)}`, "");
    lines.push(`- Expected trigger: ${result.expected}`);
    lines.push(`- Actual trigger: ${result.actual}`);
    lines.push(`- Score: ${result.score}`);
    lines.push(`- Matched phrases: ${result.matchedPhrases.join(", ") || "none"}`);
    lines.push(`- Matched vetoes: ${result.matchedVetoes.join(", ") || "none"}`);
    if (result.rationale) lines.push(`- Rationale: ${renderMarkdownInline(result.rationale)}`);
    lines.push("");
  }
  return lines.join("\n");
}
