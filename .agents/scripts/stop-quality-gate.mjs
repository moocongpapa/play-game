#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function main() {
  let raw = '';
  try {
    raw = fs.readFileSync(0, 'utf8');
  } catch {
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
    return;
  }

  let payload = {};
  try {
    payload = JSON.parse(raw || '{}');
  } catch {
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
    return;
  }

  // Only check on normal model_stop when no background tasks are running
  if (payload.terminationReason && payload.terminationReason !== 'model_stop') {
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
    return;
  }
  if (payload.fullyIdle === false) {
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
    return;
  }

  const repoRoot = payload?.workspacePaths?.[0] || path.resolve(process.cwd(), '..');
  const convId = String(payload?.conversationId || 'default').replace(/[^a-zA-Z0-9_-]/g, '');
  const execNum = String(payload?.executionNum ?? 0);
  const retryStamp = `/tmp/play-game-harness-stop-${convId}-${execNum}.stamp`;

  // Prevent infinite loop: only nudge once per executionNum
  if (fs.existsSync(retryStamp)) {
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
    return;
  }

  try {
    // Check if src/ has uncommitted changes
    const dirtySrc = execSync('git status --porcelain src/', {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    if (!dirtySrc) {
      process.stdout.write(JSON.stringify({ decision: 'allow' }));
      return;
    }

    // Run fast static harness check
    execSync('npm run harness:check', {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 15000,
    });

    process.stdout.write(JSON.stringify({ decision: 'allow' }));
  } catch (err) {
    try {
      fs.writeFileSync(retryStamp, '1', 'utf8');
    } catch {
      // ignore stamp write errors
    }
    const errMsg = err?.stderr ? String(err.stderr).slice(0, 300) : '하네스 정적 검증 실패';
    process.stdout.write(
      JSON.stringify({
        decision: 'continue',
        reason: `🛡️ [Harness Stop Quality Gate] 수정된 src/ 파일에서 하네스 무결성 오류가 감지되었습니다. 'npm run harness:check'를 실행해 문제를 수정한 뒤 마무리해 주세요:\n${errMsg}`,
      })
    );
  }
}

main();
