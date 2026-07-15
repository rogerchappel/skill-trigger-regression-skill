# skill-trigger-regression-skill

Local-first CLI and reusable agent skill for checking whether `SKILL.md` activation language still matches intended prompts and rejects anti-examples.

## Quickstart

```bash
npm install
npm run build
npx skill-trigger-regression run fixtures/sample-skill --fixtures fixtures/triggers.json --format markdown
```

## What it does

- Reads a skill directory containing `SKILL.md`.
- Extracts activation phrases from headings, examples, and trigger-like wording.
- Scores positive and negative prompt fixtures deterministically.
- Emits Markdown or JSON reports for CI, release review, or prompt regression triage.

## Safety

No LLM calls, network calls, telemetry, file mutation, or hosted marketplace checks. The CLI only reads local files and writes reports.

## Limitations

V1 uses lexical scoring and anti-example vetoes. It is designed as a cheap regression gate, not a substitute for live agent evaluation.
