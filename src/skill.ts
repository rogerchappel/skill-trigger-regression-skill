import fs from "node:fs";
import path from "node:path";
import type { SkillProfile } from "./types.js";

const stop = new Set(["the", "and", "with", "when", "this", "that", "from", "into", "your", "agent", "skill"]);

function keywords(text: string): string[] {
  return Array.from(new Set(text.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) ?? [])).filter((word) => !stop.has(word));
}

function vetoSource(body: string): string {
  const negativeSections: string[] = [];
  const directives: string[] = [];
  let negativeSection: string[] | undefined;
  let fence: { marker: "`" | "~"; length: number } | undefined;

  for (const line of body.split("\n")) {
    if (fence) {
      const closingFence = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/)?.[1];
      if (closingFence?.[0] === fence.marker && closingFence.length >= fence.length) fence = undefined;
      continue;
    }

    const openingFence = line.match(/^ {0,3}(`{3,}|~{3,})/)?.[1];
    if (openingFence) {
      fence = { marker: openingFence[0] as "`" | "~", length: openingFence.length };
      continue;
    }

    const heading = line.match(/^ {0,3}#{1,6}[ \t]+(.+?)#*[ \t]*$/)?.[1] ?? "";
    if (heading) {
      if (negativeSection) negativeSections.push(negativeSection.join("\n"));
      negativeSection = /limitations?|should not|do not use|not for|avoid/i.test(heading) ? [line] : undefined;
    } else if (negativeSection) {
      negativeSection.push(line);
    }

    const directive = line.match(/(?:should not|do not use|not for)\b(.*)/i)?.[1] ?? "";
    if (directive) directives.push(directive);
  }

  if (negativeSection) negativeSections.push(negativeSection.join("\n"));
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
