# Fixture Format

Fixtures are JSON files with two arrays:

- `shouldTrigger`: prompts that must activate the skill.
- `shouldNotTrigger`: prompts that must stay quiet.

Each item uses:

- `prompt`: the representative user request.
- `rationale`: optional explanation for reviewers.

Keep fixtures small and specific. Add adjacent anti-examples whenever a skill overlaps another workflow.
