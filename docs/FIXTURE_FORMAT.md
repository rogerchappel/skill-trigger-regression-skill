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
