import test from 'node:test';
import assert from 'node:assert/strict';
import { createHaptics, emitJuice, randomEffectPitch, subscribeJuice } from './juice';
import { createTouchParticles, MAX_TOUCH_PARTICLES } from './touchParticles';

test('sustained multitouch keeps a bounded particle pool that drains and clears', () => {
  const pool = createTouchParticles(() => .5);
  for (let i = 0; i < 500; i++) pool.emit(i, i, true);
  assert.equal(pool.particles.length, MAX_TOUCH_PARTICLES);
  pool.step(.2);
  assert.ok(pool.particles.every(p => Number.isFinite(p.x) && p.age === .2));
  pool.step(1);
  assert.equal(pool.particles.length, 0);
  pool.emit(100, 100); pool.clear();
  assert.equal(pool.particles.length, 0);
});

test('haptics throttle ticks, prioritize the success pattern and safely stop', () => {
  let now = 0;
  const patterns: (number | number[])[] = [];
  const haptics = createHaptics(pattern => patterns.push(pattern), () => now);
  haptics.play('tap'); haptics.play('tap');
  assert.deepEqual(patterns, [12]);
  now = 10; haptics.play('success');
  now = 30; haptics.play('tap'); haptics.play('success');
  assert.deepEqual(patterns, [12, [20, 30, 40]]);
  now = 200; haptics.play('tap'); haptics.stop();
  assert.deepEqual(patterns.slice(-2), [12, 0]);
  const unsupported = createHaptics(() => { throw new Error('denied'); });
  assert.doesNotThrow(() => { unsupported.play('tap'); unsupported.stop(); });
});

test('effect pitch is bounded and leaving a screen unsubscribes its impacts', () => {
  assert.equal(randomEffectPitch(() => 0), .95);
  assert.equal(randomEffectPitch(() => 1), 1.05);
  let count = 0;
  const stop = subscribeJuice(() => count++);
  emitJuice({ kind: 'pop' }); stop(); emitJuice({ kind: 'success' });
  assert.equal(count, 1);
});

test('a magnetic landing delivers one gentle 15ms tick and throttles duplicate impacts', () => {
  const patterns: (number | number[])[] = [];
  const haptics = createHaptics(pattern => patterns.push(pattern), () => 0);
  haptics.play('snap'); haptics.play('snap'); haptics.play('tap');
  assert.deepEqual(patterns, [[15]]);
});
