# CI Usage

Run trigger regression in pull requests that change `SKILL.md`, examples, or host routing metadata.

```bash
npm ci
npm run release:check
```

The release check runs type checking, tests, CLI help and fixture smoke runs, and
an install test of a package built from clean source. Use JSON output for
additional machine gates and Markdown
output for release review notes. A failing report exits with code `2` so CI can
distinguish routing regressions from command errors.
