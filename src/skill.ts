import fs from "node:fs";
import path from "node:path";
import type { SkillProfile } from "./types.js";

const stop = new Set(["the", "and", "with", "when", "this", "that", "from", "into", "your", "agent", "skill"]);

function keywords(text: string): string[] {
  return Array.from(new Set(text.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) ?? [])).filter((word) => !stop.has(word));
}

export function loadSkillProfile(skillDir: string): SkillProfile {
  const file = path.join(skillDir, "SKILL.md");
  const body = fs.readFileSync(file, "utf8");
  const name = path.basename(path.resolve(skillDir));
  const triggerBlocks = body.split(/\n(?=## )/).filter((block) => /use this skill|when to use|examples|trigger/i.test(block));
  const phraseSource = triggerBlocks.length ? triggerBlocks.join("\n") : body.slice(0, 1200);
  const phrases = keywords(phraseSource);
  const vetoes = keywords(body.split(/should not|do not use|not for/i).slice(1).join("\n"));
  return { name, phrases, vetoes };
}
