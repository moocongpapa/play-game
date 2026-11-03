/** Local browser harness. Master audio remains disabled; no generation endpoint is used. */
import React, { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import { PlayMemoryProvider } from '../src/components/PlayMemoryContext';
import { PlayHintsPausedContext } from '../src/components/PlayFlowContext';
import { GameStage } from '../src/components/GameStage';
import { ScratchArtGame } from '../src/screens/games/ScratchArtGame';
import { CakeDecoGame } from '../src/screens/games/CakeDecoGame';
import { BeautySalonGame } from '../src/screens/games/BeautySalonGame';
import { SplashColorGame } from '../src/screens/games/SplashColorGame';
import { FruitHarvestGame } from '../src/screens/games/FruitHarvestGame';
import { FeedingGame } from '../src/screens/games/FeedingGame';
import { DragMatch, DragPiece, DropSlot } from '../src/components/DragMatch';
import { HomeScreen } from '../src/screens/HomeScreen';
import { FriendDayScreen } from '../src/screens/FriendDayScreen';
import { CharacterParkScreen } from '../src/screens/CharacterParkScreen';
import { availableGameIds } from '../src/data/gameCatalog';
import { normalizePlayMemory, PLAY_MEMORY_KEY } from '../src/utils/playMemory';
import { setAudioPreferences } from '../src/utils/soundEngine';
import type { GameId } from '../src/types';
import '../src/index.css';
import '../src/mobile-game-layout.css';
import '../src/play-readability.css';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const host = document.querySelector<HTMLElement>('#fixture')!;
host.style.cssText = 'position:fixed;right:0;bottom:0;width:360px;height:640px;z-index:100;background:#fff9ee;--game-play-height:640px';
const root = createRoot(host);
const results = document.querySelector('#results')!;
const assert = (value: unknown, message: string) => { if (!value) throw new Error(message); };
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const pause = async (ms: number) => { await act(async () => { await delay(ms); }); };
const waitFor = async (check: () => unknown, message: string, timeout = 4500) => {
  const until = performance.now() + timeout;
  while (!check() && performance.now() < until) await pause(60);
  assert(check(), message);
};
const render = async (children: ReactNode, paused = false) => act(async () => root.render(<MotionConfig reducedMotion="always"><PlayMemoryProvider><PlayHintsPausedContext.Provider value={paused}>{children}</PlayHintsPausedContext.Provider></PlayMemoryProvider></MotionConfig>));
const click = async (selector: string) => {
  const target = host.querySelector<HTMLElement>(selector);
  assert(target, `missing ${selector}`);
  await act(async () => target!.click());
};
const memory = () => normalizePlayMemory(JSON.parse(localStorage.getItem(PLAY_MEMORY_KEY) || 'null'));
const props = { buddy: 'jelly' as const, soundEnabled: false, ageGroup: 'sprout' as const, childName: '유하' };
const stage = (id: GameId, node: ReactNode) => <GameStage gameId={id} buddy="jelly" soundEnabled={false}>{node}</GameStage>;
const show = async (name: string, run: () => Promise<void>) => {
  const original = localStorage.getItem(PLAY_MEMORY_KEY);
  localStorage.removeItem(PLAY_MEMORY_KEY);
  const row = document.createElement('li'); results.append(row);
  try { await run(); row.textContent = `PASS: ${name}`; }
  catch (error) { row.textContent = `FAIL: ${name}: ${error}`; }
  finally {
    await act(async () => root.render(null));
    if (original === null) localStorage.removeItem(PLAY_MEMORY_KEY); else localStorage.setItem(PLAY_MEMORY_KEY, original);
  }
};
const progress = () => Number(host.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow'));
async function completeCake() {
  for (let round = 0; round < 3; round++) {
    for (let i = 0; i < 6; i++) await click('.creative-action-tool');
    if (round < 2) await waitFor(() => progress() === round + 1, 'cake did not advance within 1.4 seconds', 1400);
  }
}
if (import.meta.hot) import.meta.hot.dispose(() => { act(() => root.unmount()); });

document.querySelector<HTMLButtonElement>('#run')!.onclick = async event => {
  const runButton = event.currentTarget as HTMLButtonElement;
  runButton.disabled = true;
  setAudioPreferences(false, false);
  results.replaceChildren();
  await show('홈 그림 카드·3개 바로가기·전체 목록을 함께 유지', async () => {
    await render(<HomeScreen {...{ selectedCharacter: 'jelly', step: 'games', onChangeStep() {}, onSelectCharacter() {}, onStartGame() {}, onStartDay() {}, onOpenDrawing() {}, onOpenAquarium() {}, onOpenCharacterPark() {}, onOpenCharacterTalk() {}, soundEnabled: false, childProfile: { name: '유하', birthDate: '2023-01-03', ageMonths: 46, ageGroup: 'sprout' } }} />);
    assert(host.querySelectorAll('.picture-game-card').length === availableGameIds('sprout').length, 'catalog was paged or truncated');
    assert(host.querySelectorAll('.quick-game').length === 3, 'personal shelf missing');
    assert(!host.querySelector('.game-card-caption,.card-floating-badge'), 'visible card text returned');
  });
  await show('케이크 선택 색을 즉시 적용·64px 도구·3회 뒤 자동 반복', async () => {
    let completed = 0;
    await render(stage('cake_deco', <CakeDecoGame {...props} onCompleteQuiz={() => completed++}/>));
    const tools = [...host.querySelectorAll<HTMLElement>('.creative-tool')];
    assert(tools.every(tool => tool.getBoundingClientRect().width >= 63.5 && tool.getBoundingClientRect().height >= 63.5), 'small creative tools');
    await click('[aria-label="초코크림 칠하기"]');
    assert(memory().favoriteColor?.hex.toLowerCase() === '#92400e', 'painted the stale previous color');
    // One layer is already painted; five actions finish this cake.
    for (let i = 0; i < 5; i++) await click('.creative-action-tool');
    await waitFor(() => progress() === 1, 'first cake stalled', 1400);
    for (let round = 1; round < 3; round++) {
      for (let i = 0; i < 6; i++) await click('.creative-action-tool');
      if (round === 1) await waitFor(() => progress() === 2, 'second cake stalled', 1400);
    }
    await waitFor(() => completed === 1, 'cake completion missing');
    await waitFor(() => progress() === 0 && !host.querySelector<HTMLButtonElement>('.creative-action-tool')?.disabled, 'cake did not repeat');
    assert(memory().latestCake?.toppings.length === 2, 'created cake was not retained');
  });
  await show('살롱·물풍선 색칠이 마지막 장면 뒤에도 자동 반복', async () => {
    for (const [id, Game] of [['beauty_salon', BeautySalonGame], ['splash_color', SplashColorGame]] as const) {
      let completed = 0;
      await render(stage(id, <Game {...props} onCompleteQuiz={() => completed++}/>));
      for (let round = 0; round < 3; round++) {
        for (let i = 0; i < 5; i++) await click('.creative-action-tool');
        if (round < 2) await waitFor(() => progress() === round + 1, `${id} intermediate stage stalled`, 1400);
      }
      await waitFor(() => completed === 1, `${id} completion missing`);
      await waitFor(() => progress() === 0, `${id} did not repeat`);
      await act(async () => root.render(null));
    }
    assert(memory().paintedRide?.kind === 'rocket', 'painted vehicle was not saved');
  });
  await show('스크래치가 지팡이로 완성되고 3장 뒤 자동 반복', async () => {
    let completed = 0;
    await render(stage('scratch_art', <ScratchArtGame {...props} onCompleteQuiz={() => completed++}/>));
    for (let round = 0; round < 3; round++) {
      for (let i = 0; i < 40 && !host.querySelector<HTMLButtonElement>('.creative-tool')?.disabled; i++) await click('.creative-tool');
      assert(host.querySelector<HTMLButtonElement>('.creative-tool')?.disabled, 'wand cannot uncover enough foil');
      if (round < 2) await waitFor(() => progress() === round + 1, 'scratch intermediate stage stalled', 1400);
    }
    await waitFor(() => completed === 1, 'scratch completion missing');
    await waitFor(() => progress() === 0, 'scratch did not repeat');
  });
  await show('부모 인증 중 색칠 입력·다음 장면이 멈추고 한 번만 재개', async () => {
    const game = () => stage('beauty_salon', <BeautySalonGame {...props} onCompleteQuiz={() => {}}/>);
    await render(game());
    for (let i = 0; i < 5; i++) await click('.creative-action-tool');
    await render(game(), true);
    await pause(850);
    assert(progress() === 0, 'stage advanced behind parent gate');
    await render(game());
    await waitFor(() => progress() === 1, 'stage did not resume');
    await pause(800);
    assert(progress() === 1, 'stage advanced twice');
  });
  await show('수확 과일이 먹여주기에 등장하고 먹은 한 개만 소비', async () => {
    await render(stage('fruit_harvest', <FruitHarvestGame {...props} onCompleteQuiz={() => {}}/>));
    await click('[data-drag-piece="fruit-0"]'); await click('[data-drop-slot="apple"]');
    assert(memory().fruitBasket.length === 1, 'actual harvest not saved');
    const harvested = memory().fruitBasket[0].id;
    await render(stage('feeding', <FeedingGame {...props} onCompleteQuiz={() => {}}/>));
    assert(host.querySelector('.our-keepsake-plate'), 'harvested plate missing');
    await click('.our-keepsake-plate');
    await waitFor(() => host.querySelector('[data-drag-piece]'), 'meal did not open');
    await click(`[data-drag-piece="picked-${harvested}"]`); await click('[data-drop-slot="mouth"]');
    assert(memory().fruitBasket.length === 0, 'accepted fruit was not consumed');
  });
  await show('생일 이야기 케이크 → 먹기 → 음악회 → 다음 이야기 자동 연결', async () => {
    const completed: GameId[] = [];
    await render(<FriendDayScreen {...props} onGoHome={() => {}} onCompleteGame={id => completed.push(id)}/>);
    await click('[aria-label="친구의 생일 파티 시작"]');
    await waitFor(() => host.querySelector('.cake-deco-stage'), 'cake scene did not load');
    await completeCake();
    await waitFor(() => host.querySelector('.our-keepsake-plate'), 'birthday did not reach own cake meal');
    await click('.our-keepsake-plate');
    await waitFor(() => host.querySelector('[data-drag-piece="my-cake"]'), 'own cake was not playable');
    await click('[data-drag-piece="my-cake"]'); await click('[data-drop-slot="mouth"]');
    await waitFor(() => host.querySelector('[data-drag-piece="drink"]'), 'water routine missing');
    await click('[data-drag-piece="drink"]'); await click('[data-drop-slot="care-target"]');
    await waitFor(() => host.querySelector('[data-drag-piece="wipe"]'), 'wipe routine missing');
    await click('[data-drag-piece="wipe"]'); await click('[data-drop-slot="care-target"]');
    await waitFor(() => host.querySelector('.animal-key'), 'music did not follow food', 6000);
    for (let i = 0; i < 12; i++) { await click(`.animal-key:nth-child(${i % 8 + 1})`); await pause(100); }
    await waitFor(() => host.querySelector('.feeding-play'), 'next bedtime story did not start automatically', 9000);
    assert(completed.join(',') === 'cake_deco,feeding,animal_xylophone', 'duplicate or missing story completion');
  });
  await show('공통 자석 퍼즐 도움 강화 후 한 번 누르기로 정확한 그림 배치', async () => {
    let completed = 0;
    await render(<DragMatch resetKey="help" tapToPlace choiceIds={['right', 'wrong', 'other']} canDrop={id => id === 'right'} hint={{ pieceId: 'right', targetId: 'slot' }} onDrop={id => {
      if (id !== 'right') return false;
      completed++;
      return true;
    }}><DragPiece id="right" label="사과">사과</DragPiece><DragPiece id="wrong" label="배">배</DragPiece><DragPiece id="other" label="감">감</DragPiece><DropSlot id="slot" label="사과 바구니">바구니</DropSlot></DragMatch>);
    for (let i = 0; i < 4; i++) { await click('[data-drag-piece="wrong"]'); await click('[data-drop-slot="slot"]'); }
    assert(completed === 0, 'wrong attempts awarded an answer');
    assert(host.querySelector('[data-drag-piece="right"][data-guided="true"]'), 'guided piece missing after misses');
    await click('[data-drag-piece="right"]');
    assert(completed === 1, 'correct one-tap alternative did not finish once');
  });
  await show('색칠한 탈것은 선택 친구 한 명만 태우고 다시 내려줌', async () => {
    localStorage.setItem(PLAY_MEMORY_KEY, JSON.stringify({ paintedRide: { kind: 'car', colors: ['#f472b6', '#38bdf8'] } }));
    await render(<CharacterParkScreen buddy="jelly" soundEnabled={false}/>);
    await click('.park-painted-ride');
    assert(host.querySelector('.park-friend[data-park-friend="jelly"]')?.getAttribute('aria-hidden') === 'true', 'rider duplicated in park');
    assert(host.querySelectorAll('[data-park-friend]').length === 8, 'roster changed');
    await waitFor(() => !host.querySelector('.park-friend[data-riding="true"]'), 'rider never returned', 2600);
  });
  runButton.disabled = false;
};
