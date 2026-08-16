# Fixture Format

Fixtures are JSON files with two arrays:

- `shouldTrigger`: prompts that must activate the skill.
- `shouldNotTrigger`: prompts that must stay quiet.

Each item uses:

- `prompt`: the representative user request.
- `rationale`: optional explanation for reviewers.

Keep fixtures small and specific. Add adjacent anti-examples whenever a skill overlaps another workflow.

Both fields are required arrays containing at least one item. Every item must be
an object with a non-empty string `prompt`; `rationale`, when present, must be a
string. Invalid JSON, missing or malformed fields, and fixture sets without both
positive and negative coverage are command errors.

Trigger phrases are extracted from ATX Markdown headings at any supported level
(`#` through `######`) and Setext headings (a title underlined with `=` or `-`)
whose title starts with `When to use`, `Use this skill`, `Examples`, or
`Trigger`. Content outside those sections is excluded. If none of those
headings exists, extraction falls back to the first 1,200 characters of the
skill file.
