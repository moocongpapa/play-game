/** Open /tests/review-regressions.html through `npm run dev`. No paid audio or app data is used. */
import React, { act, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { RoundContinuation } from '../src/components/RoundContinuation';
import { PlayHintsPausedContext } from '../src/components/PlayFlowContext';
import { useRoundTimer } from '../src/hooks/useRoundTimer';
import { useGameTimeouts } from '../src/hooks/useGameTimeouts';
import { BalloonPopGame } from '../src/screens/games/BalloonPopGame';
import { renderCharacterSprite } from '../src/sketch/render';
import { contentBounds, type Artwork, type Stroke } from '../src/sketch/model';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const assert = (value: unknown, message: string) => { if (!value) throw new Error(message); };
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
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
    assert(host.querySelector('button')?.disabled, 'manual advance must be disabled');
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
