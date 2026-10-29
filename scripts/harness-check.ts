import fs from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';

const ROOT = process.cwd();

interface CheckResult {
  name: string;
  passed: boolean;
  details: string[];
}

function readText(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function extractGameIdsFromTypes(): string[] {
  const src = readText('src/types.ts');
  const match = src.match(/export type GameId\s*=([\s\S]*?);/);
  if (!match) return [];
  const block = match[1];
  const ids: string[] = [];
  const regex = /'([a-z0-9_]+)'/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(block)) !== null) {
    ids.push(m[1]);
  }
  return ids;
}

function checkRegistrySync(gameIds: string[]): CheckResult {
  const details: string[] = [];
  const catalogSrc = readText('src/data/gameCatalog.ts');
  const appSrc = readText('src/App.tsx');
  const artworkSrc = readText('src/components/GameArtwork.tsx');
  const devThumbSrc = readText('src/components/development/DevelopmentThumbnail.tsx');

  for (const id of gameIds) {
    const inCatalog = new RegExp(`\\b${id}\\s*:`).test(catalogSrc);
    if (!inCatalog) {
      details.push(`[gameCatalog.ts] GameId '${id}' 누락`);
    }

    const inApp = new RegExp(`case\\s+'${id}'\\s*:`).test(appSrc);
    if (!inApp) {
      details.push(`[App.tsx] switch case '${id}' 라우팅 누락`);
    }

    const inArtwork =
      new RegExp(`case\\s+'${id}'\\s*:`).test(artworkSrc) ||
      new RegExp(`'${id}'`).test(devThumbSrc);
    if (!inArtwork) {
      details.push(`[GameArtwork.tsx] '${id}' 썸네일 아트워크 누락`);
    }
  }

  return {
    name: '1. 카탈로그 · 라우팅 · 썸네일 동기화 검사 (Registry Sync)',
    passed: details.length === 0,
    details,
  };
}

function checkStageLayoutAndGameCue(): CheckResult {
  const details: string[] = [];
  const gameStageTsx = readText('src/components/GameStage.tsx');
  const gameStageCss = readText('src/components/GameStage.css');
  const mobileCss = readText('src/mobile-game-layout.css');

  // Extract LOCAL_FEEDBACK_GAMES ids
  const match = gameStageTsx.match(/LOCAL_FEEDBACK_GAMES\s*=\s*new Set<GameId>\(\[([\s\S]*?)\]\)/);
  const localFeedbackIds: string[] = [];
  if (match) {
    const regex = /'([a-z0-9_]+)'/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(match[1])) !== null) {
      localFeedbackIds.push(m[1]);
    }
  }

  for (const id of localFeedbackIds) {
    if (!gameStageCss.includes(`data-game='${id}'`)) {
      details.push(`[GameStage.css] data-game='${id}' 패딩 초기화 규칙 누락`);
    }
  }

  const requiredStageClasses = [
    '.block-tower-stage',
    '.fruit-munch-stage',
    '.trampoline-stage',
    '.bath-stage',
    '.mirror-maze-stage',
    '.forest-peekaboo-stage',
    '.magic-slime-stage',
    '.magic-potion-stage',
    '.fruit-catcher-stage',
    '.pipe-connect-stage',
  ];

  for (const cls of requiredStageClasses) {
    if (!gameStageCss.includes(cls)) {
      details.push(`[GameStage.css] '${cls}' 스테이지 높이/레이아웃 규칙 누락`);
    }
    if (!mobileCss.includes(cls)) {
      details.push(`[mobile-game-layout.css] '${cls}' 모바일 풀스크린 규칙 누락`);
    }
  }

  // Extract the :is(...) .game-cue relative-flex block in GameStage.css
  const cueBlockMatch = gameStageCss.match(/:is\(([\s\S]*?)\)\s*\.game-cue\s*\{[\s\S]*?position:\s*relative/);
  if (!cueBlockMatch) {
    details.push(`[GameStage.css] 상단 바 .game-cue 겹침 방지(position: relative) 블록 누락`);
  } else {
    const cueSelectorBlock = cueBlockMatch[1];
    const customTopBarTargets = [
      '.fruit-munch-top-bar',
      '.bath-top-bar',
      '.trampoline-top-bar',
      '.mirror-maze-stage',
      '.forest-peekaboo-stage',
      '.magic-slime-stage',
      '.magic-potion-stage',
      '.fruit-catcher-stage',
      '.pipe-connect-stage',
    ];
    for (const target of customTopBarTargets) {
      if (!cueSelectorBlock.includes(target)) {
        details.push(`[GameStage.css] .game-cue 상단 겹침 방지 셀렉터에 '${target}' 누락`);
      }
    }
  }

  return {
    name: '2. 상단 버튼(.game-cue) 겹침 방지 및 모바일 스테이지 레이아웃 검사',
    passed: details.length === 0,
    details,
  };
}

function checkAudioAndTimerHygiene(): CheckResult {
  const details: string[] = [];
  const gamesDir = path.join(ROOT, 'src/screens/games');
  const files = fs.readdirSync(gamesDir).filter((f) => f.endsWith('.tsx'));

  for (const file of files) {
    const src = fs.readFileSync(path.join(gamesDir, file), 'utf8');

    // Check if speakText is called directly without stopAllSpeech or shared speech-managing hooks
    const callsSpeakText = /\bspeakText\s*\(/.test(src);
    const hasSpeechCleanup =
      /\bstopAllSpeech\b/.test(src) ||
      /\buseToddlerPlay\b/.test(src) ||
      /\busePlayJourney\b/.test(src) ||
      /\bDevelopmentShell\b/.test(src);

    if (callsSpeakText && !hasSpeechCleanup) {
      details.push(`[src/screens/games/${file}] speakText 호출 게임에 stopAllSpeech 언마운트 정리 누락`);
    }

    // Check if setInterval is used without clearInterval
    if (/\bsetInterval\s*\(/.test(src) && !/\bclearInterval\s*\(/.test(src)) {
      details.push(`[src/screens/games/${file}] setInterval 사용 후 clearInterval 정리 누락`);
    }

    // Check if requestAnimationFrame is used without cancelAnimationFrame
    if (/\brequestAnimationFrame\s*\(/.test(src) && !/\bcancelAnimationFrame\s*\(/.test(src)) {
      details.push(`[src/screens/games/${file}] requestAnimationFrame 사용 후 cancelAnimationFrame 정리 누락`);
    }
  }

  // Also scan all .tsx files in src/screens and src/components for raw setTimeout without clearTimeout or useGameTimeouts
  const uiFiles = [
    ...walkFiles(path.join(ROOT, 'src/screens')),
    ...walkFiles(path.join(ROOT, 'src/components')),
  ].filter((f) => f.endsWith('.tsx'));

  for (const fullPath of uiFiles) {
    const src = fs.readFileSync(fullPath, 'utf8');
    const hasRawTimeout = /\bsetTimeout\s*\(/.test(src);
    const hasTimeoutCleanup = /\bclearTimeout\s*\(/.test(src) || /\buseGameTimeouts\b/.test(src);
    if (hasRawTimeout && !hasTimeoutCleanup) {
      const rel = path.relative(ROOT, fullPath);
      details.push(`[${rel}] setTimeout 호출 후 clearTimeout 또는 useGameTimeouts 정리 누락`);
    }
  }

  return {
    name: '3. 음성(stopAllSpeech) 및 타이머/애니메이션 메모리 누수 검사',
    passed: details.length === 0,
    details,
  };
}

function walkFiles(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, out);
    } else if (/\.(ts|tsx|js|mjs|html)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function checkProgressionLifecycles(): CheckResult {
  const details: string[] = [];
  const games = ['BubbleBathGame', 'ForestPeekabooGame', 'FruitCatcherGame', 'MagicPotionGame', 'MagicSlimeGame', 'MirrorMazeGame', 'PipeConnectGame', 'TrampolineJumpGame'];
  for (const game of games) {
    const file = `src/screens/games/${game}.tsx`;
    const source = ts.createSourceFile(file, readText(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ['useEffect', 'useLayoutEffect'].includes(node.expression.text)) {
        const [effect, dependencies] = node.arguments;
        if (effect && dependencies && (ts.isArrowFunction(effect) || ts.isFunctionExpression(effect)) && ts.isArrayLiteralExpression(dependencies)) {
          const names = dependencies.elements.map(dependency => dependency.getText(source));
          if (names.includes('soundEnabled') && ts.isBlock(effect.body)) {
            for (const statement of effect.body.statements) {
              if (ts.isReturnStatement(statement) && statement.expression?.getText(source).includes('clearGameTimeouts')) {
                details.push(`[${file}] 음소거 변경이 진행 타이머를 삭제하는 effect cleanup 발견`);
              }
            }
          }
          if (game === 'TrampolineJumpGame' && names.includes('onCompleteQuiz') && effect.body.getText(source).includes('createSkyWave')) {
            details.push(`[${file}] 완료 콜백 변경이 수집물을 초기화하는 effect 발견`);
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  if (/\bdeleteDatabase\s*\(/.test(readText('src/App.tsx'))) details.push('[App.tsx] 설정 초기화에서 작품·음성 DB를 삭제할 수 없음');
  return { name: '5. 음소거 중 진행 · 콜백 초기화 · 작품 보존 회귀 검사', passed: details.length === 0, details };
}

function checkPaidScriptIsolation(): CheckResult {
  const details: string[] = [];
  const forbiddenPatterns = [
    'generate-portrait-videos',
    'generate-bonus-scenes',
    'generate-play-audio',
    'generate-care-voices',
  ];

  const filesToScan = [...walkFiles(path.join(ROOT, 'src')), ...walkFiles(path.join(ROOT, 'tests'))];

  for (const file of filesToScan) {
    const content = fs.readFileSync(file, 'utf8');
    // Strip single-line and multi-line comments before checking for script imports/invocations
    const codeOnly = content
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    for (const pat of forbiddenPatterns) {
      if (codeOnly.includes(pat)) {
        const rel = path.relative(ROOT, file);
        details.push(`[${rel}] 유료 미디어 생성 스크립트('${pat}') 코드 참조 발견 — 런타임/테스트 격리 위반`);
      }
    }
  }

  return {
    name: '4. 유료 API 생성 스크립트(generate-*.ts) 런타임 격리 검사',
    passed: details.length === 0,
    details,
  };
}

function main() {
  const gameIds = extractGameIdsFromTypes();
  console.log(`\n🛡️  [Play-Game Harness Verifier] 총 ${gameIds.length}개 놀이 무결성 점검 시작...\n`);

  const results: CheckResult[] = [
    checkRegistrySync(gameIds),
    checkStageLayoutAndGameCue(),
    checkAudioAndTimerHygiene(),
    checkPaidScriptIsolation(),
    checkProgressionLifecycles(),
  ];

  let hasFailure = false;
  for (const res of results) {
    if (res.passed) {
      console.log(`✅ ${res.name}: 통과`);
    } else {
      hasFailure = true;
      console.error(`❌ ${res.name}: 실패 (${res.details.length}건)`);
      for (const line of res.details) {
        console.error(`   - ${line}`);
      }
    }
  }

  console.log('');
  if (hasFailure) {
    console.error('🚨 하네스 정적 검증 실패! 위 항목을 수정한 후 다시 실행해 주세요.');
    process.exit(1);
  } else {
    console.log('🎉 하네스 정적 검증 통과. 실제 상태 전환은 npm test와 브라우저 회귀 화면에서 함께 확인합니다.');
  }
}

main();
