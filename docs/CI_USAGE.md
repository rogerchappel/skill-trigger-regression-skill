# CI Usage

Run trigger regression in pull requests that change `SKILL.md`, examples, or host routing metadata.

```bash
npm ci
npm run build
node dist/cli.js run fixtures/sample-skill --fixtures fixtures/triggers.json --format json
```

Use JSON output for machine gates and Markdown output for release review notes. A failing report exits with code `2` so CI can distinguish routing regressions from command errors.
