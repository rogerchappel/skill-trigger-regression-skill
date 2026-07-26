export type TriggerFixture = {
  shouldTrigger: Array<{ prompt: string; rationale?: string }>;
  shouldNotTrigger: Array<{ prompt: string; rationale?: string }>;
};

export type SkillProfile = {
  name: string;
  phrases: string[];
  vetoes: string[];
};

export type PromptResult = {
  prompt: string;
  expected: boolean;
  actual: boolean;
  score: number;
  matchedPhrases: string[];
  matchedVetoes: string[];
  rationale?: string;
};

export type RegressionReport = {
  skill: string;
  passed: boolean;
  summary: { total: number; failed: number; positives: number; negatives: number };
  results: PromptResult[];
};
