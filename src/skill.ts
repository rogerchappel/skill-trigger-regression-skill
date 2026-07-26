import fs from "node:fs";
import path from "node:path";
import type { SkillProfile } from "./types.js";

const stop = new Set(["the", "and", "with", "when", "this", "that", "from", "into", "your", "agent", "skill"]);

function keywords(text: string): string[] {
  return Array.from(new Set(text.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) ?? [])).filter((word) => !stop.has(word));
}

function vetoSource(body: string): string {
  const sections = body.split(/\n(?=#{1,6}\s)/);
  const negativeSections = sections.filter((section) => {
    const heading = section.match(/^#{1,6}\s+(.+)$/m)?.[1] ?? "";
    return /limitations?|should not|do not use|not for|avoid/i.test(heading);
  });
  const directives = body
    .split("\n")
    .map((line) => line.match(/(?:should not|do not use|not for)\b(.*)/i)?.[1] ?? "")
    .filter(Boolean);
  return [...negativeSections, ...directives].join("\n");
}

export function loadSkillProfile(skillDir: string): SkillProfile {
  const file = path.join(skillDir, "SKILL.md");
  const body = fs.readFileSync(file, "utf8");
  const name = path.basename(path.resolve(skillDir));
  const triggerBlocks = body.split(/\n(?=## )/).filter((block) => /use this skill|when to use|examples|trigger/i.test(block));
  const phraseSource = triggerBlocks.length ? triggerBlocks.join("\n") : body.slice(0, 1200);
  const phrases = keywords(phraseSource);
  const vetoes = keywords(vetoSource(body));
  return { name, phrases, vetoes };
}
