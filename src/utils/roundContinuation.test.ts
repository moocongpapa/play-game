import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRoundContinuation, ROUND_CONTINUATION_DELAY_MS } from './roundContinuation';

const clock = {
  setTimeout: (callback: () => void, delay: number) => setTimeout(callback, delay) as unknown as number,
  clearTimeout: (id: number) => clearTimeout(id),
};

test('a finished round advances automatically once, while an early tap consumes the same transition', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let rounds = 0;
  const automatic = createRoundContinuation(() => rounds++, ROUND_CONTINUATION_DELAY_MS, clock);
  automatic.resume();
  t.mock.timers.tick(ROUND_CONTINUATION_DELAY_MS - 1);
  assert.equal(rounds, 0, 'keep the celebration visible before advancing');
  t.mock.timers.tick(1);
  assert.equal(rounds, 1);
  automatic.advance();
  automatic.resume();
  t.mock.timers.tick(3000);
  assert.equal(rounds, 1, 'late taps cannot start another round');

  const manual = createRoundContinuation(() => rounds++, 3000, clock);
  manual.resume();
  t.mock.timers.tick(1000);
  manual.advance();
  manual.advance();
  t.mock.timers.tick(10000);
  assert.equal(rounds, 2, 'the pending automatic action is cancelled after a tap');
});

test('the shorter celebration waits for praise, but a stalled voice cannot stop the next round', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let speaking = true;
  let rounds = 0;
  const transition = createRoundContinuation(() => rounds++, ROUND_CONTINUATION_DELAY_MS, clock, () => !speaking);
  transition.resume();
  t.mock.timers.tick(ROUND_CONTINUATION_DELAY_MS);
  assert.equal(rounds, 0, 'normal praise is allowed to finish');
  speaking = false;
  t.mock.timers.tick(150);
  assert.equal(rounds, 1, 'the next round follows immediately after the voice ends');

  const stalled = createRoundContinuation(() => rounds++, ROUND_CONTINUATION_DELAY_MS, clock, () => false);
  stalled.resume();
  t.mock.timers.tick(ROUND_CONTINUATION_DELAY_MS);
  for (let attempt = 0; attempt < 30; attempt++) t.mock.timers.tick(150);
  assert.equal(rounds, 2, 'a missing speech-end event does not lock the game');
});

test('pausing or leaving during praise cancels pending readiness checks', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let rounds = 0;
  let ready = false;
  const transition = createRoundContinuation(() => rounds++, 1000, clock, () => ready);
  transition.resume();
  t.mock.timers.tick(1000);
  transition.pause();
  ready = true;
  t.mock.timers.tick(10000);
  assert.equal(rounds, 0, 'a queued audio check cannot advance behind a paused screen');
  transition.resume();
  t.mock.timers.tick(999);
  assert.equal(rounds, 0);
  transition.dispose();
  t.mock.timers.tick(10000);
  assert.equal(rounds, 0, 'leaving the game also cancels its restarted transition');
});

test('backgrounding pauses progression; leaving or reaching the play limit cancels it permanently', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let rounds = 0;
  const transition = createRoundContinuation(() => rounds++, 3000, clock);
  transition.resume();
  t.mock.timers.tick(2000);
  transition.pause();
  t.mock.timers.tick(10000);
  assert.equal(rounds, 0, 'do not create new rounds while hidden');
  transition.resume();
  t.mock.timers.tick(2999);
  assert.equal(rounds, 0, 'give a full celebration delay after returning');
  transition.dispose();
  transition.resume();
  transition.advance();
  t.mock.timers.tick(10000);
  assert.equal(rounds, 0, 'an unmounted game cannot advance or award anything');

  const nextGame = createRoundContinuation(() => rounds++, 5000, clock);
  nextGame.resume();
  t.mock.timers.tick(5000);
  assert.equal(rounds, 1, 'a fresh adventure still runs after the old game was disposed');
});
