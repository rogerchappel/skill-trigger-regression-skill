# Release Candidate Notes

## 0.1.0

- Deterministic skill trigger parser and scorer.
- Fixture schema for positive and negative prompt coverage.
- Markdown and JSON reports.
- Sample skill fixtures and tests.

## Readiness

- No external services.
- CLI and import API included.
- `npm run release:check` covers type checking, tests, CLI smoke and fixture
  runs, then packs from clean source and installs the tarball to verify the
  published CLI and required runtime files.
- `npm pack` runs the TypeScript build automatically through the `prepack`
  lifecycle; a separate manual build is not required after installing
  development dependencies.
