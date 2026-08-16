#!/usr/bin/env bash
set -euo pipefail
npm run check
npm test
npm run smoke
node dist/cli.js run fixtures/sample-skill --fixtures fixtures/triggers.json --format markdown >/tmp/skill-trigger-regression.md
node dist/cli.js run fixtures/sectioned-skill --fixtures fixtures/sectioned-triggers.json --format markdown >/tmp/skill-trigger-sectioned-regression.md
node dist/cli.js run fixtures/setext-skill --fixtures fixtures/setext-triggers.json --format markdown >/tmp/skill-trigger-setext-regression.md
node scripts/package-smoke.mjs
