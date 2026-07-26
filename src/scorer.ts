import type { PromptResult, SkillProfile, TriggerFixture } from "./types.js";

function words(text: string): Set<string> {
  return new Set(text.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) ?? []);
}

export function scorePrompt(profile: SkillProfile, prompt: string): { actual: boolean; score: number; matchedPhrases: string[]; matchedVetoes: string[] } {
  const promptWords = words(prompt);
  const matchedPhrases = profile.phrases.filter((phrase) => promptWords.has(phrase));
  const matchedVetoes = profile.vetoes.filter((phrase) => promptWords.has(phrase));
  const score = matchedPhrases.length - matchedVetoes.length * 2;
  return { actual: score >= 2, score, matchedPhrases, matchedVetoes };
}

export function runRegression(profile: SkillProfile, fixtures: TriggerFixture): PromptResult[] {
  const positives = fixtures.shouldTrigger.map((item) => ({ ...scorePrompt(profile, item.prompt), prompt: item.prompt, expected: true, rationale: item.rationale }));
  const negatives = fixtures.shouldNotTrigger.map((item) => ({ ...scorePrompt(profile, item.prompt), prompt: item.prompt, expected: false, rationale: item.rationale }));
  return [...positives, ...negatives];
}
