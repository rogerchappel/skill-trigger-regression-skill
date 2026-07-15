import fs from "node:fs";
import type { TriggerFixture } from "./types.js";

export function loadFixtures(file: string): TriggerFixture {
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<TriggerFixture>;
  return {
    shouldTrigger: parsed.shouldTrigger ?? [],
    shouldNotTrigger: parsed.shouldNotTrigger ?? []
  };
}
