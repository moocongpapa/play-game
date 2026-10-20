import assert from 'node:assert/strict';
import test from 'node:test';
import { createPhysicsWorld } from './physics2d';
import { detectBlowEnergy } from '../hooks/useBlowSensor';
import { emitJuice, getComboState, resetCombo, subscribeCombo, emitWindGust, subscribeWindGust } from './juice';

test('2D rigid-body physics world integrates gravity, floor bounce, and circle-circle collisions', () => {
  const world = createPhysicsWorld({ width: 400, height: 300 });
  const a = world.spawn({ x: 185, y: 100, vx: 6, vy: 0, radius: 20, restitution: 0.75 });
  const b = world.spawn({ x: 215, y: 100, vx: -6, vy: 0, radius: 20, restitution: 0.75 });

  // Step 1 frame: overlapping circles should separate and exchange horizontal velocity
  world.step(1);
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  assert.ok(dist >= 32, `Expected colliding circles to separate, got distance ${dist}`);
  assert.ok(a.vx < 0 && b.vx > 0, 'Expected elastic impulse to reverse horizontal velocities');

  // Step 60 frames: bodies should fall under gravity and stay bounded inside floor
  for (let i = 0; i < 60; i += 1) {
    world.step(1);
  }
  assert.ok(a.y <= 300 - a.radius + 0.5, 'Body A should not sink below floor');
  assert.ok(b.y <= 300 - b.radius + 0.5, 'Body B should not sink below floor');

  // Wind and pointer impulse should accelerate bodies upward
  const prevVy = a.vy;
  world.applyWind(4, -6);
  assert.ok(a.vy < prevVy, 'Wind should impart upward velocity');

  const hit = world.impulseAt(a.x, a.y, 90);
  assert.ok(hit >= 1, 'impulseAt should affect nearby bodies');
});

test('detectBlowEnergy distinguishes breath noise from silence', () => {
  const silence = new Uint8Array(32);
  assert.equal(detectBlowEnergy(silence), 0);

  const breath = new Uint8Array(32);
  for (let i = 1; i <= 10; i += 1) {
    breath[i] = 190;
  }
  const energy = detectBlowEnergy(breath);
  assert.ok(energy > 0.3, `Expected positive blow energy, got ${energy}`);
});

test('Combo Fever state and Wind Gust pub-sub work across consecutive actions', () => {
  resetCombo();
  assert.deepEqual(getComboState(), { combo: 0, fever: false });

  const states: { combo: number; fever: boolean }[] = [];
  const unsubCombo = subscribeCombo((s) => states.push(s));

  emitJuice({ kind: 'snap' });
  emitJuice({ kind: 'snap' });
  assert.equal(getComboState().combo, 2);
  assert.equal(getComboState().fever, false);

  emitJuice({ kind: 'success' });
  assert.equal(getComboState().combo, 3);
  assert.equal(getComboState().fever, true);
  assert.equal(states.length, 4);

  let windReceived = 0;
  const unsubWind = subscribeWindGust((intensity) => {
    windReceived = intensity;
  });
  emitWindGust(0.95);
  assert.equal(windReceived, 0.95);

  unsubCombo();
  unsubWind();
  resetCombo();
});
