import fs from "node:fs";
import type { TriggerFixture } from "./types.js";

export function loadFixtures(file: string): TriggerFixture {
  const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Fixture file must contain a JSON object");
  }
  const fixture = parsed as Record<string, unknown>;
  return {
    shouldTrigger: validateCases(fixture.shouldTrigger, "shouldTrigger"),
    shouldNotTrigger: validateCases(fixture.shouldNotTrigger, "shouldNotTrigger")
  };
}

function validateCases(value: unknown, field: string): TriggerFixture["shouldTrigger"] {
  if (!Array.isArray(value)) throw new Error(`Fixture field "${field}" must be an array`);
  if (value.length === 0) throw new Error(`Fixture field "${field}" must contain at least one case`);
  return value.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`Fixture field "${field}" item ${index} must be an object`);
    }
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.prompt !== "string" || candidate.prompt.trim() === "") {
      throw new Error(`Fixture field "${field}" item ${index} must have a non-empty prompt`);
    }
    if (candidate.rationale !== undefined && typeof candidate.rationale !== "string") {
      throw new Error(`Fixture field "${field}" item ${index} rationale must be a string`);
    }
    return { prompt: candidate.prompt, ...(candidate.rationale === undefined ? {} : { rationale: candidate.rationale }) };
  });
}
