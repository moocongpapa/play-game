#!/usr/bin/env node
import fs from 'node:fs';

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

  const cmd = String(payload?.toolCall?.args?.CommandLine || '');

  // 1. Hard block force push or staging .env files
  if (/git\s+push\s+.*(--force|-f\b)/.test(cmd)) {
    process.stdout.write(
      JSON.stringify({
        decision: 'deny',
        reason: '🛑 [Harness Safety Guard] 강제 푸시(git push --force)는 저장소 보호 규칙에 의해 차단되었습니다.',
      })
    );
    return;
  }

  if (/git\s+add\s+.*\b\.env\b/.test(cmd)) {
    process.stdout.write(
      JSON.stringify({
        decision: 'deny',
        reason: '🛑 [Harness Safety Guard] .env 시크릿 파일은 스테이징할 수 없습니다.',
      })
    );
    return;
  }

  // 2. Require explicit confirmation before running paid media generation scripts
  const paidScripts = [
    'generate-portrait-videos',
    'generate-bonus-scenes',
    'generate-play-audio',
    'generate-care-voices',
  ];
  const isDirectExecution = paidScripts.some(
    (script) =>
      new RegExp(`(tsx|node|npm\\s+run)\\s+.*${script}`).test(cmd)
  );

  if (isDirectExecution) {
    process.stdout.write(
      JSON.stringify({
        decision: 'force_ask',
        reason:
          '💰 [Harness Credit Guard] 유료 API 크레딧을 소모하는 미디어 생성 스크립트 실행 요청입니다. 계속 진행할까요?',
      })
    );
    return;
  }

  process.stdout.write(JSON.stringify({ decision: 'allow' }));
}

main();
