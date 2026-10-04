import type { PromptResult, SkillProfile, TriggerFixture } from "./types.js";

function matchesPhrase(prompt: string, phrase: string): boolean {
  const escaped = phrase.toLowerCase().trim().split(/\s+/).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+");
  if (!escaped) return false;
  return new RegExp(`(?<![a-z0-9-])${escaped}(?![a-z0-9-])`, "i").test(prompt);
}

export function scorePrompt(profile: SkillProfile, prompt: string): { actual: boolean; score: number; matchedPhrases: string[]; matchedVetoes: string[] } {
  const matchedPhrases = profile.phrases.filter((phrase) => matchesPhrase(prompt, phrase));
  const matchedVetoes = profile.vetoes.filter((phrase) => matchesPhrase(prompt, phrase));
  const score = matchedPhrases.length - matchedVetoes.length * 2;
  return { actual: score >= 2, score, matchedPhrases, matchedVetoes };
}

export function runRegression(profile: SkillProfile, fixtures: TriggerFixture): PromptResult[] {
  const positives = fixtures.shouldTrigger.map((item) => ({ ...scorePrompt(profile, item.prompt), prompt: item.prompt, expected: true, rationale: item.rationale }));
  const negatives = fixtures.shouldNotTrigger.map((item) => ({ ...scorePrompt(profile, item.prompt), prompt: item.prompt, expected: false, rationale: item.rationale }));
  return [...positives, ...negatives];
}
