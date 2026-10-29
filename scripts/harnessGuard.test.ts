import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const guard = path.join(root, '.agents/scripts/pre-tool-guard.mjs');
const inspect = (cmd: string, modern = false) => {
  const input = modern ? { tool_input: { cmd } } : { toolCall: { args: { CommandLine: cmd } } };
  const result = spawnSync(process.execPath, [guard], { input: JSON.stringify(input), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout).decision;
};

test('harness inspects secret and force-push arguments without executing the mocked commands', () => {
  for (const cmd of [
    'git add .env', 'git add -f .env.local', 'git -C . add "dir with spaces/.env.local"',
    'git add -- .env[.]local', 'git add -f .', 'git push --force-with-lease origin main',
    "git add -f -- ':(glob).env[.]local'", "git add -f -- ':(top,literal).env.local'", 'git add --pathspec-from-file=/tmp/files',
    'git push origin +main', "bash -lc 'git add -f .env.local'", "sh -c 'git push --force origin main'",
  ]) assert.equal(inspect(cmd), 'deny', cmd);
  assert.equal(inspect('git add -f .env.local', true), 'deny');
  for (const cmd of ['git add README.md', 'git add .env.example', 'git push origin main', 'git add src/App.tsx\nprintf .env.local']) {
    assert.equal(inspect(cmd), 'allow', cmd);
  }
});

test('paid generation is recognized from mock payloads but never launched', () => {
  assert.equal(inspect('node --import tsx scripts/generate-portrait-videos.ts'), 'force_ask');
  assert.equal(inspect("bash -lc 'npx tsx scripts/generate-care-voices.ts'"), 'force_ask');
  assert.equal(inspect('npm test'), 'allow');
});

test('configured hooks resolve from the repository root and its nested harness folder', () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, '.agents/hooks.json'), 'utf8'));
  const commands = [config['credit-and-safety-guard'].PreToolUse[0].hooks[0].command, config['quality-gate'].Stop[0].command];
  for (const cwd of [root, path.join(root, '.agents')]) for (const command of commands) {
    const result = spawnSync(command, { cwd, shell: true, encoding: 'utf8', input: JSON.stringify({ terminationReason: 'cancelled' }) });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).decision, 'allow');
  }
});
