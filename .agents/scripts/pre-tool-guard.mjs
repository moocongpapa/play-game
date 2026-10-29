#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

// Tokenize for inspection only: command text is never evaluated or executed.
function words(command) {
  const result = [];
  let word = '', quote = '', escaped = false;
  const flush = () => { if (word) result.push(word); word = ''; };
  for (const char of command) {
    if (escaped) { word += char; escaped = false; continue; }
    if (char === '\\' && quote !== "'") { escaped = true; continue; }
    if (quote) { if (char === quote) quote = ''; else word += char; continue; }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === '\n') { flush(); result.push(';'); continue; }
    if (/\s/.test(char)) { flush(); continue; }
    if (/[;&|()]/.test(char)) { flush(); result.push(char); continue; }
    word += char;
  }
  flush();
  return result;
}
function gitCommands(tokens) {
  const commands = [];
  for (let i = 0; i < tokens.length; i++) {
    if (path.basename(tokens[i]) !== 'git') continue;
    let j = i + 1;
    while (tokens[j]?.startsWith('-')) {
      const option = tokens[j++];
      if (['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--config-env'].includes(option)) j++;
    }
    const command = tokens[j++], args = [];
    while (j < tokens.length && !/^[;&|()]$/.test(tokens[j])) args.push(tokens[j++]);
    commands.push({ command, args });
  }
  return commands;
}
function main() {
  let payload;
  try { payload = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); }
  catch { process.stdout.write(JSON.stringify({ decision: 'allow' })); return; }
  const args = payload?.toolCall?.args || payload?.tool_input || {};
  const command = String(args.CommandLine ?? args.cmd ?? args.command ?? '');
  const inspected = [{ command, depth: 0 }];
  const allTokens = [];
  for (let at = 0; at < inspected.length; at++) {
    const item = inspected[at], tokens = words(item.command);
    allTokens.push(tokens);
    if (item.depth >= 5) continue;
    for (let i = 0; i < tokens.length; i++) {
      if (!['sh', 'bash', 'zsh', 'dash', 'ksh', 'fish'].includes(path.basename(tokens[i]))) continue;
      const flag = tokens[i + 1];
      if (/^-[a-z]*c[a-z]*$/.test(flag || '') && tokens[i + 2]) inspected.push({ command: tokens[i + 2], depth: item.depth + 1 });
    }
  }
  const finish = (decision, reason) => process.stdout.write(JSON.stringify({ decision, ...(reason ? { reason } : {}) }));
  for (const tokens of allTokens) for (const git of gitCommands(tokens)) {
    if (git.command === 'push' && git.args.some(arg => /^--force(?:$|-|=)/.test(arg) || /^-[^-]*f/.test(arg) || arg.startsWith('+'))) {
      finish('deny', '강제 푸시는 저장소 보호 규칙에 의해 차단되었습니다.'); return;
    }
    if (git.command === 'add' && git.args.some(arg => arg.startsWith('--pathspec-from-file'))) {
      finish('deny', '파일 목록으로 스테이징하기 전에 .env 시크릿 포함 여부를 명시적으로 검토해야 합니다.'); return;
    }
    const forcedBulkAdd = git.args.some(arg => arg === '--force' || /^-[^-]*f/.test(arg)) && git.args.some(arg => ['.', '..', '-A', '--all', '*', '**'].includes(arg) || arg.includes('$'));
    if (git.command === 'add' && (forcedBulkAdd || git.args.some(arg => {
      const name = arg.replace(/^:\([^)]*\)/, '').replace(/^:(?!\/)/, '').replaceAll('\\', '/').split('/').at(-1);
      return name !== '.env.example' && name.startsWith('.env') && (name.length === 4 || '.*?[{'.includes(name[4]));
    }))) {
      finish('deny', '.env 시크릿 파일은 스테이징할 수 없습니다.'); return;
    }
  }
  const paid = ['generate-portrait-videos', 'generate-bonus-scenes', 'generate-play-audio', 'generate-care-voices'];
  if (allTokens.some(tokens => tokens.some(token => ['node', 'tsx', 'npm', 'npx', 'bun'].includes(path.basename(token))) && tokens.some(token => paid.some(script => path.basename(token).startsWith(script))))) {
    finish('force_ask', '유료 미디어 생성 스크립트입니다. 크레딧 사용에 대한 명시적 승인을 확인해 주세요.'); return;
  }
  finish('allow');
}
main();
