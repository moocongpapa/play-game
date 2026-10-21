import assert from 'node:assert/strict';
import test from 'node:test';
import { availableGameIds } from '../data/gameCatalog';
import { emitJuice, feedbackPoint, getComboState, recordPlaySuccess, resetCombo, setPlayFeedbackMode, subscribeJuice } from './juice';
import { feedbackModeForGame, WIND_GAMES } from './playFeedback';
import { createMediaRequestGuard } from './microphonePermission';
import { CHARACTER_PERFORMANCE, connectCharacterVoice } from './characterPerformance';

test('one completed round awards one success; decorative snaps and duplicate celebrations award none', () => {
  setPlayFeedbackMode('play'); resetCombo();
  emitJuice({ kind: 'snap' }); emitJuice({ kind: 'success' }); emitJuice({ kind: 'success' });
  assert.equal(getComboState().combo, 0);
  recordPlaySuccess();
  assert.equal(getComboState().combo, 1);
  // Mounting a continuation or replaying a visual never changes the reward count.
  emitJuice({ kind: 'success' });
  assert.equal(getComboState().combo, 1);
  setPlayFeedbackMode('quiet');
  let impacts = 0; const stop = subscribeJuice(() => impacts++);
  emitJuice({ kind: 'snap' }); recordPlaySuccess();
  assert.equal(impacts, 0); assert.equal(getComboState().combo, 1);
  stop(); resetCombo(); setPlayFeedbackMode('play');
});

test('care feedback stays outside the face and quiet activities never expose a wind control', () => {
  setPlayFeedbackMode('care');
  assert.deepEqual(feedbackPoint(150, 200, 300, 400), { x: 276, y: 200 });
  assert.deepEqual(feedbackPoint(120, 600, 300, 400), { x: 24, y: 368 });
  for (const id of ['goodnight_sleep', 'sensory_paint', 'emotion_face'] as const) {
    assert.equal(feedbackModeForGame(id), 'quiet'); assert.equal(WIND_GAMES.has(id), false);
  }
  assert.equal(WIND_GAMES.has('feeding'), false);
  assert.equal(WIND_GAMES.has('balloon_pop'), true);
  setPlayFeedbackMode('play');
});

test('Yuha can discover numbers at 45 months and parent exclusions still apply', () => {
  assert.ok(availableGameIds('sprout').includes('number_parade'));
  assert.ok(availableGameIds('baby').includes('number_parade'));
  assert.equal(availableGameIds('sprout', ['number_parade']).includes('number_parade'), false);
});

test('leaving during microphone permission and repeated requests cannot leak recording tracks', async () => {
  const guard = createMediaRequestGuard(); let calls = 0, stops = 0;
  let resolve!: (value: MediaStream) => void;
  const request = () => { calls++; return new Promise<MediaStream>(done => { resolve = done; }); };
  const pending = guard.acquire(request);
  assert.equal(await guard.acquire(request), null);
  guard.stop();
  resolve({ getTracks: () => [{ stop: () => stops++ }] } as unknown as MediaStream);
  assert.equal(await pending, null); assert.equal(calls, 1); assert.equal(stops, 1);
  const stream = { getTracks: () => [{ stop: () => stops++ }] } as unknown as MediaStream;
  assert.equal(await guard.acquire(async () => stream), stream);
  guard.stop(); assert.equal(stops, 2);
});

test('eight restrained character colours reuse a recording without changing pitch or duration', () => {
  assert.equal(new Set(Object.values(CHARACTER_PERFORMANCE).map(p => p.warmth)).size, 8);
  const nodes: any[] = [];
  const ctx = { createBiquadFilter: () => { const node = { frequency: {}, Q: {}, gain: {}, connect() {}, disconnect() { this.disconnected = true; } }; nodes.push(node); return node; } } as unknown as AudioContext;
  const source = { connect() {}, playbackRate: { value: 1.12 } } as unknown as AudioBufferSourceNode;
  const release = connectCharacterVoice(source, {} as AudioNode, ctx, 'pingu');
  assert.equal(source.playbackRate.value, 1.12);
  assert.ok(nodes.every(n => Math.abs(n.gain.value) <= 1.2));
  release(); assert.ok(nodes.every(n => n.disconnected));
});
