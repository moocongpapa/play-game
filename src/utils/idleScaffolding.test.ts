import test from 'node:test';
import assert from 'node:assert/strict';
import { createIdleScaffolding } from './idleScaffolding';

function setup() {
  let now = 0, sequence = 0;
  const jobs = new Map<number, { at: number; run: () => void }>();
  const states: boolean[] = [];
  const help = createIdleScaffolding(idle => states.push(idle), {
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
  return { help, states, advance, jobs };
}

test('a full four quiet seconds are required after every interaction; prompts do not loop', () => {
  const h = setup(); h.advance(3999); assert.deepEqual(h.states, []);
  h.help.reset(); h.advance(3999); assert.deepEqual(h.states, []);
  h.advance(1); assert.equal(h.help.isIdle(), true);
  h.advance(60000); assert.deepEqual(h.states, [true]); assert.equal(h.jobs.size, 0);
  h.help.reset(); assert.deepEqual(h.states, [true, false]);
  h.advance(3999); assert.equal(h.help.isIdle(), false);
  h.advance(1); assert.equal(h.help.isIdle(), true);
});

test('held gestures, hidden tabs and blur pause independently and resume with a fresh delay', () => {
  const h = setup(); h.advance(4000); h.help.pause('pointer');
  assert.equal(h.help.isIdle(), false);
  h.help.pause('hidden'); h.help.pause('blur'); h.advance(60000);
  h.help.resume('pointer'); h.help.reset(); h.help.resume('hidden'); h.advance(60000);
  assert.deepEqual(h.states, [true, false]);
  h.help.resume('blur'); h.advance(3999); assert.equal(h.help.isIdle(), false);
  h.advance(1); assert.equal(h.help.isIdle(), true);
});

test('leaving or changing stage cancels both active hints and future callbacks', () => {
  const h = setup(); h.advance(3000); h.help.dispose();
  h.help.reset(); h.help.resume('blur'); h.advance(60000);
  assert.equal(h.jobs.size, 0); assert.deepEqual(h.states, []);
  const next = setup(); next.advance(4000); next.help.dispose();
  assert.equal(next.help.isIdle(), false);
});
