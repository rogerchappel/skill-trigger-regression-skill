import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const temporaryRoot = mkdtempSync(join(tmpdir(), "skill-trigger-package-"));
const source = join(temporaryRoot, "source");
const consumer = join(temporaryRoot, "consumer");

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(" ")} failed\n${result.stdout}${result.stderr}`
  );
  return result.stdout;
}

try {
  cpSync(root, source, {
    recursive: true,
    filter(path) {
      const relative = path.slice(root.length).replace(/^\//, "");
      return ![".git", "dist", "node_modules"].some(
        (excluded) => relative === excluded || relative.startsWith(`${excluded}/`)
      );
    }
  });

  run("npm", ["ci", "--ignore-scripts"], source);
  const packOutput = run(
    "npm",
    ["pack", "--json", "--pack-destination", temporaryRoot],
    source
  );
  const [{ filename }] = JSON.parse(packOutput);
  const tarball = join(temporaryRoot, filename);

  mkdirSync(consumer);
  run("npm", ["init", "--yes"], consumer);
  run("npm", ["install", "--ignore-scripts", tarball], consumer);

  const packageRoot = join(consumer, "node_modules", "skill-trigger-regression-skill");
  for (const requiredFile of [
    "dist/cli.js",
    "dist/index.js",
    "dist/index.d.ts",
    "SKILL.md",
    "fixtures/triggers.json"
  ]) {
    assert.equal(existsSync(join(packageRoot, requiredFile)), true, `${requiredFile} is missing`);
  }

  const bin = join(consumer, "node_modules", ".bin", "skill-trigger-regression");
  assert.equal(existsSync(bin), true, "installed CLI bin is missing");
  const help = run(bin, ["--help"], consumer);
  assert.match(help, /Usage: skill-trigger-regression/);

  const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
  assert.equal(manifest.bin["skill-trigger-regression"], "./dist/cli.js");
  console.log(`Verified ${basename(tarball)} from clean source`);
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
