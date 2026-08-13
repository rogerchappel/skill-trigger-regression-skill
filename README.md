# skill-trigger-regression-skill

Local-first CLI and reusable agent skill for checking whether `SKILL.md` activation language still matches intended prompts and rejects anti-examples.

## Quickstart

```bash
npm ci
npm run build
npx skill-trigger-regression run fixtures/sample-skill --fixtures fixtures/triggers.json --format markdown
```

Before contributing or preparing a release, run the complete local gate:

```bash
npm run release:check
```

## What it does

- Reads a skill directory containing `SKILL.md`.
- Extracts activation phrases from headings, examples, and trigger-like wording.
- Excludes fenced and top-level indented Markdown code from anti-example veto extraction.
- Scores positive and negative prompt fixtures deterministically.
- Emits Markdown or JSON reports for CI, release review, or prompt regression triage.

When `--output` is provided, its resolved path must differ from both the fixture
file and the target skill's `SKILL.md`. The command rejects collisions before
writing so report generation cannot overwrite either input.

### Report formats

JSON reports preserve prompt and rationale strings exactly, including embedded
line breaks. Markdown reports keep those fields inside their heading or list
item: Markdown and HTML-significant characters are escaped, and embedded line
breaks render as `<br>`. This prevents fixture text such as headings or list
markers from changing the report's document structure.

## Safety

No LLM calls, network calls, telemetry, or hosted marketplace checks. The CLI
only reads local inputs and writes a report when `--output` names a distinct
file.

## Limitations

V1 uses lexical scoring and anti-example vetoes. It is designed as a cheap regression gate, not a substitute for live agent evaluation.
