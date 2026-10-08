// Stop hook: run typecheck, lint and tests when the agent finishes; on failure
// block the stop and feed the output back so the agent fixes it first.
// Plain node on purpose: works the same under PowerShell, cmd and bash.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TAIL = 4000; // chars of output kept per failing check

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  // no or invalid stdin: treat as a plain run
}

const run = (cmd, args) =>
  // shell: true so `npm` resolves to npm.cmd on Windows; args are fixed literals.
  spawnSync(cmd, args, { cwd: root, shell: true, encoding: 'utf8', timeout: 150_000 });

// Skip when nothing that can break the checks has changed since HEAD.
// Committed-but-unchecked work in the same session is not detected (documented in CLAUDE.md).
const watched = ['src', 'package.json', 'package-lock.json', 'tsconfig.json', 'eslint.config.mjs', 'next.config.ts', 'vitest.config.ts', 'vitest.config.mts'];
const status = run('git', ['status', '--porcelain', '--', ...watched]);
if (status.status === 0 && status.stdout.trim() === '') {
  process.exit(0);
}
// If git itself failed we fall through and run the checks.

const checks = ['typecheck', 'lint', 'test'];
const failures = [];
for (const name of checks) {
  const r = run('npm', ['run', name, '--silent']);
  if (r.status !== 0) {
    const out = `${r.stdout ?? ''}${r.stderr ?? ''}${r.error ? `\n${r.error.message}` : ''}`;
    failures.push(`### npm run ${name} (exit ${r.status ?? 'none'})\n${out.slice(-TAIL)}`);
  }
}

if (failures.length === 0) {
  console.log(JSON.stringify({ systemMessage: 'Stop hook: typecheck, lint and tests are green.' }));
  process.exit(0);
}

const report = failures.join('\n\n');
if (input.stop_hook_active) {
  // Already blocked once this turn: do not loop forever, just surface it.
  console.log(JSON.stringify({ systemMessage: `Stop hook: checks still failing after a retry.\n\n${report}` }));
} else {
  console.log(
    JSON.stringify({
      decision: 'block',
      reason: `Checks failed. Fix them before reporting done (never edit fixtures or existing tests to get green).\n\n${report}`,
    }),
  );
}
