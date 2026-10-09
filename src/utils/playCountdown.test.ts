import assert from 'node:assert/strict';
import test from 'node:test';
import { createPlayCountdown } from './playCountdown';

function setup() {
  let now = 0, id = 0, left = 0, expired = 0, hidden = false, parentOpen = false;
  const pending = new Map<number, { at: number; run: () => void }>();
  const clock = {
    now: () => now,
    setTimeout: (run: () => void, ms: number) => { pending.set(++id, { at: now + ms, run }); return id; },
    clearTimeout: (key: number) => { pending.delete(key); },
  };
  const timer = createPlayCountdown(clock, () => hidden || parentOpen, value => { left = value; }, () => { expired++; });
  const advance = (ms: number) => {
    const end = now + ms;
    while (pending.size) {
      const [key, task] = [...pending].sort((a, b) => a[1].at - b[1].at)[0];
      if (task.at > end) break;
      now = task.at; pending.delete(key); task.run();
    }
    now = end;
  };
  return { timer, advance, pending, get left() { return left; }, get expired() { return expired; },
    hide(value: boolean) { hidden = value; timer.sync(); },
    parent(value: boolean) { parentOpen = value; timer.sync(); },
  };
}

test('question time survives overlapping parent/background pauses, including fractional seconds', () => {
  const s = setup();
  s.timer.start(30); s.advance(1250);
  assert.equal(s.left, 29);
  s.parent(true); s.advance(5000); s.hide(true); s.parent(false); s.advance(60000);
  assert.equal(s.left, 29); assert.equal(s.expired, 0);
  s.hide(false); s.advance(749); assert.equal(s.left, 29);
  s.advance(1); assert.equal(s.left, 28);
  s.advance(27999); assert.equal(s.expired, 0);
  s.advance(1); assert.equal(s.expired, 1); assert.equal(s.left, 0);
  s.timer.sync(); s.advance(60000); assert.equal(s.expired, 1);
});

test('stopping or restarting a question invalidates callbacks already queued by the browser', () => {
  const s = setup();
  s.timer.start(20);
  const stale = [...s.pending.values()][0].run;
  s.timer.stop(); stale(); s.advance(30000);
  assert.equal(s.expired, 0);
  s.parent(true); s.timer.start(30); s.advance(60000);
  assert.equal(s.left, 30);
  s.parent(false); s.advance(1000); assert.equal(s.left, 29);
  s.timer.start(20); stale(); assert.equal(s.left, 20);
  s.timer.start(0); s.advance(60000);
  assert.equal(s.expired, 0, 'younger children keep unlimited rounds');
  assert.equal(s.pending.size, 0);
});
