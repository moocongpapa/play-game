import test from 'node:test';
import assert from 'node:assert/strict';
import { createGentleHelp } from './gentleHelp';

function setup() {
  let now = 0, sequence = 0;
  const jobs = new Map<number, { at: number; run: () => void }>();
  const levels: number[] = [];
  const controller = createGentleHelp(level => levels.push(level), {
    setTimeout(run, ms) { const id = ++sequence; jobs.set(id, { at: now + ms, run }); return id; },
    clearTimeout(id) { jobs.delete(id); },
  });
  const advance = (ms: number) => {
    const end = now + ms;
    for (;;) {
      const next = [...jobs].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > end) break;
      now = next[1].at; jobs.delete(next[0]); next[1].run();
    }
    now = end;
  };
  return { controller, advance, levels, jobs };
}
test('idle help escalates once through source, destination and gesture, then stops', () => {
  const h = setup(); h.advance(6499); assert.deepEqual(h.levels, []);
  h.advance(1); assert.deepEqual(h.levels, [1]);
  h.advance(6500); assert.deepEqual(h.levels, [1, 2]);
  h.advance(7500); assert.deepEqual(h.levels, [1, 2, 3]);
  h.advance(60000); assert.equal(h.jobs.size, 0);
});
test('success resets accumulated mistakes and the help delay', () => {
  const h = setup(); h.controller.miss(); h.controller.miss();
  assert.deepEqual(h.levels, [1, 2]); h.controller.progress(); h.advance(6499);
  assert.equal(h.levels.at(-1), 0); h.controller.miss(); assert.equal(h.levels.at(-1), 1);
});
test('holding and hidden pauses are independent; disposal cannot restart callbacks', () => {
  const h = setup(); h.controller.pause('gesture'); h.controller.pause('hidden');
  h.advance(60000); h.controller.resume('gesture'); h.advance(60000); assert.deepEqual(h.levels, []);
  h.controller.resume('hidden'); h.advance(6500); assert.deepEqual(h.levels, [1]);
  h.controller.dispose(); h.controller.resume('hidden'); h.controller.miss(); h.advance(60000);
  assert.deepEqual(h.levels, [1]); assert.equal(h.jobs.size, 0);
});
