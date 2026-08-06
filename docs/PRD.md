# PRD: skill-trigger-regression-skill

Status: in-progress
Decision: ship
Updated: 2026-07-15
Source: OSS Factory queue replenishment after ready contained only empty placeholders.

## Summary

`skill-trigger-regression-skill` is a local-first agent skill and CLI that tests whether skill activation descriptions still fire for intended prompts and stay quiet for anti-examples.

## Problem

Agent skills drift when descriptions, examples, or host routing rules change. A skill can silently over-trigger on unrelated tasks or fail to trigger on its core workflow, and most repos only discover that during a live agent run.

## Users

- Agent-skill authors maintaining `SKILL.md` files.
- OpenClaw/Codex operators reviewing reusable skills before adoption.
- OSS maintainers packaging skills for multiple agent hosts.

## V1 Scope

- CLI: `skill-trigger-regression run <skill-dir> --fixtures fixtures/triggers.json`.
- Parse `SKILL.md` frontmatter and body sections for activation language.
- Fixture format with `shouldTrigger`, `shouldNotTrigger`, and rationale fields.
- Deterministic lexical scorer with explicit anti-example vetoes; no LLM calls in V1.
- Markdown and JSON reports showing pass/fail prompts, matched phrases, and missing coverage.
- Agent `SKILL.md` explaining when to use the regression harness, approval boundaries, and validation workflow.

## Out of Scope

- Hosted skill marketplace checks.
- Live agent execution.
- Automatic prompt rewriting.
- Network calls or telemetry.

## Verification

- Fixture-backed tests for pass, fail, and anti-example veto cases.
- CLI smoke against checked-in sample skills.
- `npm run release:check`, which runs type checking, tests, CLI smoke and fixture
  runs, then builds a package from clean source and verifies its installed CLI.

## Agent Prompt

Build `skill-trigger-regression-skill` as a local-first TypeScript CLI plus reusable agent skill for regression-testing skill activation behavior from fixtures.
