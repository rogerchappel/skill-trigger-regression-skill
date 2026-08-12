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

## Command contract

`skill-trigger-regression --help` prints usage and exits successfully only when
`--help` is the sole argument. Combine `run` with one value each for the
required `--fixtures` option and the optional `--format` and `--output`
options. Unknown options, missing values, repeated options, and `--help`
combined with other arguments are command errors: they write a concise message
to standard error and exit with code `1` without producing a report.
