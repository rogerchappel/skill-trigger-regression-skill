# Orchestration

Use this harness before adopting or changing a reusable agent skill.

1. Add representative prompts to a fixture file.
2. Include anti-examples for adjacent workflows that should not trigger.
3. Run `skill-trigger-regression run <skill-dir> --fixtures <file>`.
4. Treat failures as release blockers until activation text or fixtures are updated.

The harness is deterministic so it can run in CI without model access.
