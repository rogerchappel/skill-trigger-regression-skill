# skill-trigger-regression-skill

Use this skill when creating, updating, reviewing, or packaging agent skills and you need evidence that activation wording still routes correctly.

## Required Inputs

- A local skill directory containing `SKILL.md`.
- A fixture JSON file with prompts that should trigger and should not trigger.

## Side-effect Boundaries

This skill is read-only. Do not edit the tested skill automatically, install skills, apply proposals, or change routing rules unless the user separately asks for those actions.

## Workflow

1. Read the skill description and examples.
2. Add or select trigger fixtures for core workflows and adjacent false-positive risks.
3. Run the CLI and inspect failures.
4. Report missing coverage, over-triggering prompts, and suggested wording areas.

## Validation

Run `npm run release:check` before using the report as release evidence.
