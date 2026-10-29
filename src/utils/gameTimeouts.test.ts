import assert from 'node:assert/strict';
import test from 'node:test';
import { createGameTimeouts } from './gameTimeouts';

test('game transitions retain remaining time across parent/visibility pauses and can be cancelled after resuming', () => {
  let now = 0, sequence = 0;
  const tasks = new Map<number, { at: number; run: () => void }>();
  const timers = createGameTimeouts({ now: () => now,
    setTimeout: (run, delay) => { const id = ++sequence; tasks.set(id, { at: now + delay, run }); return id; },
    clearTimeout: id => { tasks.delete(id); },
  });
  const tick = (ms: number) => {
    now += ms;
    for (const [id, task] of [...tasks]) if (task.at <= now) { tasks.delete(id); task.run(); }
  };
  let completed = 0;
  timers.schedule(() => completed++, 1000);
  tick(400); timers.setPaused(true); tick(10000);
  assert.equal(completed, 0);
  const cancelled = timers.schedule(() => completed += 100, 200);
  timers.setPaused(false); timers.cancel(cancelled);
  tick(599); assert.equal(completed, 0);
  tick(1); assert.equal(completed, 1);
  tick(5000); assert.equal(completed, 1);
  timers.schedule(() => completed++, 0);
  timers.clear(); tick(1000); assert.equal(completed, 1, 'leaving cancels every delayed action');
});

test('stale queued callbacks cannot fire after pause or clear, even when native cancellation races', () => {
  let now = 0;
  const queued: (() => void)[] = [];
  const timers = createGameTimeouts({ now: () => now, setTimeout: run => queued.push(run), clearTimeout() {} });
  let completed = 0;
  timers.schedule(() => completed++, 500);
  now = 100; timers.setPaused(true); timers.setPaused(false);
  queued[0](); assert.equal(completed, 0);
  queued[1](); assert.equal(completed, 1);
  timers.schedule(() => completed++, 500);
  timers.clear(); queued[2](); assert.equal(completed, 1);
});
