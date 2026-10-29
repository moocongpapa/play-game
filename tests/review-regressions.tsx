/** Open /tests/review-regressions.html through `npm run dev`. No paid audio or app data is used. */
import React, { act, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { RoundContinuation } from '../src/components/RoundContinuation';
import { PlayHintsPausedContext } from '../src/components/PlayFlowContext';
import { useRoundTimer } from '../src/hooks/useRoundTimer';
import { useGameTimeouts } from '../src/hooks/useGameTimeouts';
import { BalloonPopGame } from '../src/screens/games/BalloonPopGame';
import { TrampolineJumpGame } from '../src/screens/games/TrampolineJumpGame';
import { MagicPotionGame } from '../src/screens/games/MagicPotionGame';
import { PipeConnectGame } from '../src/screens/games/PipeConnectGame';
import { setAudioPreferences } from '../src/utils/soundEngine';
import { renderCharacterSprite } from '../src/sketch/render';
import { contentBounds, type Artwork, type Stroke } from '../src/sketch/model';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const assert = (value: unknown, message: string) => { if (!value) throw new Error(message); };
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const waitFor = async (check: () => unknown, message: string, timeout = 4500) => {
  const until = performance.now() + timeout;
  while (!check() && performance.now() < until) await act(async () => { await delay(75); });
  assert(check(), message);
};
const host = document.querySelector('#fixture')!;
const root = createRoot(host);
if (import.meta.hot) import.meta.hot.dispose(() => { act(() => root.unmount()); });
const results = document.querySelector('#results')!;
const artHost = document.querySelector('#art')!;
const show = async (name: string, run: () => void | Promise<void>) => {
  const row = document.createElement('li'); results.append(row);
  try { await run(); row.textContent = `PASS: ${name}`; }
  catch (error) { row.textContent = `FAIL: ${name}: ${error}`; }
  finally { await act(async () => root.render(null)); }
};
const blank = (): Artwork => ({ version: 1, id: 'test', updatedAt: 0, background: 'white', template: null, fills: {}, stickers: [], strokes: [] });
const stroke = (x: number, y: number, brush: Stroke['brush'] = 'pen'): Stroke => ({ id: `${x}:${y}:${brush}`, brush, color: '#00ff00', size: 60, glitter: false, seed: 1, points: [{ x, y }] });
async function sprite(art: Artwork) {
  const image = new Image(); image.src = renderCharacterSprite(art); await image.decode();
  const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0);
  image.style.cssText = 'width:140px;max-height:240px;object-fit:contain;background:#e8efff;border:1px solid #b5bed0;margin:8px';
  artHost.append(image);
  const bounds = contentBounds(art), scale = canvas.width / bounds.width;
  return (x: number, y: number) => [...context.getImageData(Math.round((x - bounds.x) * scale), Math.round((y - bounds.y) * scale), 1, 1).data];
}
let timerControl: ReturnType<typeof useRoundTimer>;
let delayed: ReturnType<typeof useGameTimeouts>;
function TimerFixture({ expired }: { expired: () => void }) {
  timerControl = useRoundTimer(.3, expired);
  useEffect(() => { timerControl.startRoundTimer(); }, []);
  return <output>{timerControl.timeLeft}:{String(timerControl.timeOut)}</output>;
}
function TimeoutFixture() { delayed = useGameTimeouts(); return null; }

document.querySelector<HTMLButtonElement>('#run')!.onclick = async event => {
  const button = event.currentTarget as HTMLButtonElement; button.disabled = true;
  // Component soundEnabled props are toggled below, but the real audio engine stays
  // disabled: this harness must never call a speech provider or play recorded audio.
  setAudioPreferences(false, false);
  results.replaceChildren(); artHost.replaceChildren();
  await show('세로 도화지 위·아래 그림이 PNG에 모두 남음', async () => {
    const pixel = await sprite({ ...blank(), strokes: [stroke(600, -340), stroke(600, 1240)] });
    assert(pixel(600, -340)[3] === 255 && pixel(600, 1240)[3] === 255, 'portrait strokes were clipped');
  });
  await show('지우개가 펜만 지우고 캐릭터 도안을 보존함', async () => {
    const art = { ...blank(), template: 'bear', fills: { face: '#ff99aa' } };
    const base = await sprite(art);
    const erased = await sprite({ ...art, strokes: [stroke(600, 400), stroke(600, 400, 'eraser')] });
    assert(base(600, 400)[3] === 255, 'test must cover the opaque face');
    assert(JSON.stringify(base(600, 400)) === JSON.stringify(erased(600, 400)), 'eraser damaged the template');
  });
  await show('부모 인증 중 자동 이어하기 중지·닫은 뒤 한 번만 재개', async () => {
    let next = 0;
    const render = (paused: boolean) => <PlayHintsPausedContext.Provider value={paused}><RoundContinuation delayMs={100} onNext={() => next++} /></PlayHintsPausedContext.Provider>;
    await act(async () => root.render(render(false)));
    await act(async () => root.render(render(true)));
    await act(async () => { await delay(200); });
    assert(next === 0, 'advanced behind parent gate');
    assert(!host.querySelector('button'), 'automatic continuation must not add a manual next button');
    await act(async () => root.render(render(false)));
    await act(async () => { await delay(150); });
    assert(next === 1, 'must resume exactly once');
  });
  await show('문제 타이머가 부모 인증·백그라운드 중 남은 시간을 보존함', async () => {
    let expired = 0;
    const hidden = Object.getOwnPropertyDescriptor(document, 'hidden');
    const render = (paused: boolean) => <PlayHintsPausedContext.Provider value={paused}><TimerFixture expired={() => expired++} /></PlayHintsPausedContext.Provider>;
    try {
      await act(async () => root.render(render(false)));
      await act(async () => { await delay(40); });
      await act(async () => root.render(render(true)));
      await act(async () => { await delay(350); });
      assert(expired === 0, 'parent gate spent the countdown');
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      await act(async () => { document.dispatchEvent(new Event('visibilitychange')); root.render(render(false)); });
      await act(async () => { await delay(350); });
      assert(expired === 0, 'hidden time spent the countdown');
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      await act(async () => { document.dispatchEvent(new Event('visibilitychange')); await delay(350); });
      assert(expired === 1 && timerControl.timeOut, 'countdown did not resume');
    } finally {
      if (hidden) Object.defineProperty(document, 'hidden', hidden); else Reflect.deleteProperty(document, 'hidden');
    }
  });
  await show('이전 재안내·움직임 타이머 취소 및 화면 이탈 정리', async () => {
    let stale = 0, current = 0;
    await act(async () => root.render(<TimeoutFixture />));
    const first = delayed.scheduleGameTimeout(() => stale++, 25);
    delayed.cancelGameTimeout(first);
    delayed.scheduleGameTimeout(() => current++, 50);
    await delay(80);
    assert(stale === 0 && current === 1, 'previous action interrupted the current action');
    delayed.scheduleGameTimeout(() => stale++, 20);
    await act(async () => root.render(null));
    await delay(40); assert(stale === 0, 'unmounted callback fired');
  });
  await show('공통 지연 작업이 부모 인증 뒤 남은 시간부터 이어지고 정지 중 취소도 유지됨', async () => {
    let completed = 0, cancelled = 0;
    const render = (paused: boolean) => <PlayHintsPausedContext.Provider value={paused}><TimeoutFixture /></PlayHintsPausedContext.Provider>;
    await act(async () => root.render(render(false)));
    delayed.scheduleGameTimeout(() => completed++, 400);
    await act(async () => { await delay(150); });
    await act(async () => root.render(render(true)));
    const cancelledId = delayed.scheduleGameTimeout(() => cancelled++, 20);
    delayed.cancelGameTimeout(cancelledId);
    await act(async () => { await delay(450); });
    assert(completed === 0 && cancelled === 0, 'paused jobs ran behind the parent gate');
    await act(async () => root.render(render(false)));
    await act(async () => { await delay(60); });
    assert(completed === 0, 'resume discarded the remaining delay');
    await act(async () => { await delay(240); });
    assert(completed === 1 && cancelled === 0, 'resume restarted the full delay or restored a cancelled job');
  });
  await show('트램펄린이 부모 재렌더에도 별을 보존하고 인증 중에는 물리 이동을 멈춤', async () => {
    const render = (paused: boolean) => <PlayHintsPausedContext.Provider value={paused}><div style={{ width: 360, height: 520 }}><TrampolineJumpGame buddy="jelly" ageGroup="sprout" soundEnabled={false} onCompleteQuiz={() => {}} /></div></PlayHintsPausedContext.Provider>;
    await act(async () => root.render(render(true)));
    const stars = [...host.querySelectorAll('.trampoline-sky-item')];
    assert(stars.length === 5, 'initial sky wave is missing');
    await act(async () => { await delay(30); root.render(render(true)); });
    const rerendered = [...host.querySelectorAll('.trampoline-sky-item')];
    assert(stars.every((node, index) => node === rerendered[index]), 'new parent callback rebuilt the current sky wave');
    await act(async () => root.render(render(false)));
    await act(async () => { await delay(100); });
    const jumper = host.querySelector<HTMLElement>('.trampoline-jumper-node')!;
    const moving = jumper.style.transform;
    await act(async () => { await delay(100); });
    assert(jumper.style.transform !== moving, 'trampoline physics never resumed');
    await act(async () => root.render(render(true)));
    const frozen = jumper.style.transform;
    await act(async () => { await delay(200); });
    assert(jumper.style.transform === frozen, 'trampoline kept jumping behind the parent gate');
  });
  await show('물약을 끓이는 중 소리 토글해도 3판이 완성되고 자동으로 다음 묶음이 열림', async () => {
    let completed = 0;
    const render = (soundEnabled = false) => <div style={{ width: 360, height: 620 }}><MagicPotionGame buddy="jelly" ageGroup="sprout" soundEnabled={soundEnabled} onCompleteQuiz={() => completed++} /></div>;
    await act(async () => root.render(render()));
    const recipes = [
      { parts: ['별가루', '보석 눈물'], creature: '별빛 아기 유니콘' },
      { parts: ['딸기 시럽', '달빛 민트'], creature: '무지개 아기 드래곤' },
      { parts: ['보라 마법가루', '황금 꿀'], creature: '날개 요정 친구' },
    ];
    for (const recipe of recipes) {
      await waitFor(() => host.querySelector<HTMLButtonElement>(`button[aria-label="${recipe.parts[0]}"]`)?.disabled === false, 'next potion never became playable');
      for (const part of recipe.parts) await act(async () => host.querySelector<HTMLButtonElement>(`button[aria-label="${part}"]`)!.click());
      await waitFor(() => host.querySelector('button[aria-label="솥을 톡톡 눌러 저어보기"]'), 'stir action missing');
      await act(async () => {
        const stir = host.querySelector<HTMLButtonElement>('button[aria-label="솥을 톡톡 눌러 저어보기"]')!;
        stir.click(); stir.click(); stir.click();
      });
      assert(host.querySelector('.potion-brewing-sparkle'), 'stirring never started brewing');
      await act(async () => root.render(render(true)));
      await act(async () => { await delay(50); root.render(render(false)); });
      await waitFor(() => host.querySelector(`button[aria-label="${recipe.creature}"]`), 'sound toggle cancelled the pending brew');
    }
    assert(completed === 1, 'three recipes must award exactly one completion');
    await waitFor(() => host.querySelector('.potion-recipe[aria-label="별사탕 아기 고양이의 재료"]'), 'final potion did not automatically continue into the next recipe set');
    assert(!host.querySelector('button[aria-label*="다음"]'), 'potion flow still needs a manual next button');
  });
  await show('팝콘 3가지 맛을 완성하면 보상이 한 번 나오고 자동으로 처음 맛이 다시 열림', async () => {
    let completed = 0;
    await act(async () => root.render(<div style={{ width: 360, height: 620 }}><PipeConnectGame buddy="jelly" ageGroup="baby" soundEnabled={false} onCompleteQuiz={() => completed++} /></div>));
    for (let round = 0; round < 3; round++) {
      await waitFor(() => host.querySelector('button[aria-label="황금 왕옥수수 터뜨리기"]'), 'next popcorn flavor never became playable');
      for (let attempt = 0; attempt < 6; attempt++) {
        const kernel = host.querySelector<HTMLButtonElement>('button[aria-label="황금 왕옥수수 터뜨리기"], button[aria-label="옥수수 알맹이 터뜨리기"]');
        if (!kernel) break;
        await act(async () => kernel.click());
      }
      assert(!host.querySelector('button[aria-label="옥수수 알맹이 터뜨리기"]'), 'not all kernels were popped');
      if (round < 2) await waitFor(() => host.querySelector(`[role="progressbar"][aria-label="${round + 2}/3"]`), 'seasoning did not automatically advance');
      else await waitFor(() => completed === 1, 'final flavor never completed');
    }
    await waitFor(() => host.querySelector('[role="progressbar"][aria-label="1/3"]') && host.querySelector('button[aria-label="황금 왕옥수수 터뜨리기"]'), 'popcorn stopped after the final flavor');
    assert(completed === 1, 'final popcorn reward was duplicated');
  });
  await show('일반 풍선 놀이가 5개마다 한 번 기록하고 계속 진행됨', async () => {
    let completions = 0;
    await act(async () => root.render(<BalloonPopGame buddy="jelly" ageGroup="sprout" childName="테스트" soundEnabled={false} onCompleteQuiz={() => completions++} />));
    for (let count = 1; count <= 10; count++) {
      let balloon = host.querySelector<HTMLButtonElement>('button[aria-label="풍선 터뜨리기"]');
      for (let attempt = 0; !balloon && attempt < 20; attempt++) {
        await act(async () => { await delay(150); });
        balloon = host.querySelector<HTMLButtonElement>('button[aria-label="풍선 터뜨리기"]');
      }
      assert(balloon, 'balloons must keep appearing after a milestone');
      const target = balloon;
      await act(async () => { target.click(); target.click(); });
      assert(completions === Math.floor(count / 5), 'missed or duplicated a five-pop milestone');
    }
    assert(!host.textContent?.includes('다시 놀기'), 'milestones must not stop free play');
  });
  button.disabled = false;
};
