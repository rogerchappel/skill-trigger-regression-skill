import fs from "node:fs";
import path from "node:path";
import type { SkillProfile } from "./types.js";

const stop = new Set(["the", "and", "with", "when", "this", "that", "from", "into", "your", "agent", "skill"]);

function keywords(text: string): string[] {
  return Array.from(new Set(text.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) ?? [])).filter((word) => !stop.has(word));
}

type MarkdownHeading = { level: number; title: string; lines: string[]; consumed: number };

function markdownHeading(lines: string[], index: number): MarkdownHeading | undefined {
  const atx = lines[index].match(/^ {0,3}(#{1,6})[ \t]+(.+?)#*[ \t]*$/);
  if (atx) return { level: atx[1].length, title: atx[2], lines: [lines[index]], consumed: 1 };

  const underline = lines[index + 1]?.match(/^ {0,3}(=+|-+)[ \t]*$/);
  if (!underline || !lines[index].trim() || /^(?: {4}|\t)/.test(lines[index])) return undefined;
  return {
    level: underline[1][0] === "=" ? 1 : 2,
    title: lines[index].trim(),
    lines: [lines[index], lines[index + 1]],
    consumed: 2
  };
}

function triggerSource(body: string): string {
  const lines = body.split("\n");
  const sections: string[] = [];
  let section: string[] | undefined;
  let sectionLevel = 0;
  let fence: { marker: "`" | "~"; length: number } | undefined;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (fence) {
      section?.push(line);
      const closingFence = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/)?.[1];
      if (closingFence?.[0] === fence.marker && closingFence.length >= fence.length) fence = undefined;
      continue;
    }

    const openingFence = line.match(/^ {0,3}(`{3,}|~{3,})/)?.[1];
    if (openingFence) {
      section?.push(line);
      fence = { marker: openingFence[0] as "`" | "~", length: openingFence.length };
      continue;
    }

    const heading = markdownHeading(lines, index);
    if (heading) {
      const level = heading.level;
      if (section && level <= sectionLevel) {
        sections.push(section.join("\n"));
        section = undefined;
      }
      if (/^(?:use this skill|when to use|examples?|triggers?)(?:\b|:)/i.test(heading.title)) {
        if (section) sections.push(section.join("\n"));
        section = [...heading.lines];
        sectionLevel = level;
      } else {
        section?.push(...heading.lines);
      }
      index += heading.consumed - 1;
    } else {
      section?.push(line);
    }
  }

  if (section) sections.push(section.join("\n"));
  return sections.length ? sections.join("\n") : body.slice(0, 1200);
}

function vetoSource(body: string): string {
  const lines = body.split("\n");
  const negativeSections: string[] = [];
  const directives: string[] = [];
  let negativeSection: string[] | undefined;
  let fence: { marker: "`" | "~"; length: number } | undefined;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
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

    // Top-level lines indented by four spaces or a tab are Markdown code,
    // so examples containing directive-like text must not affect vetoes.
    if (/^(?: {4}|\t)/.test(line)) continue;

    const parsedHeading = markdownHeading(lines, index);
    const heading = parsedHeading?.title ?? "";
    if (heading) {
      if (negativeSection) negativeSections.push(negativeSection.join("\n"));
      negativeSection = /limitations?|should not|do not use|not for|avoid/i.test(heading)
        ? [...parsedHeading!.lines]
        : undefined;
      index += parsedHeading!.consumed - 1;
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
  const phrases = keywords(triggerSource(body));
  const vetoes = keywords(vetoSource(body));
  return { name, phrases, vetoes };
}
