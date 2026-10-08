import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placeHabitatFriend, spaceHabitatFriends, stepHabitatFriend } from './habitatMotion.ts';

test('edge taps keep the complete creature touch target in the habitat', () => {
  const bounds = { width: 350, height: 280 };
  for (const position of [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: -1, y: 2 }]) {
    const friend = placeHabitatFriend(0, 12, bounds, 43, 18, () => .5, position);
    assert.ok(friend.x >= 43 && friend.x <= 307);
    assert.ok(friend.y >= 43 && friend.y <= 237);
  }
});

test('swimming stays within the field and turns away from its edges', () => {
  const bounds = { width: 350, height: 280 };
  let friend = { x: 306, y: 140, vx: 40, vy: 0, phase: 0 };
  friend = stepHabitatFriend(friend, .05, bounds, 43);
  assert.ok(friend.vx < 0);
  for (let i = 0; i < 6000; i++) {
    friend = stepHabitatFriend(friend, .033, bounds, 43);
    assert.ok(friend.x >= 43 && friend.x <= 307);
    assert.ok(friend.y >= 43 && friend.y <= 237);
  }
});

test('rotation and very small fields cannot strand creatures outside the screen', () => {
  const friend = { x: 760, y: 900, vx: 12, vy: 2, phase: 0 };
  const rotated = stepHabitatFriend(friend, 0, { width: 340, height: 180 }, 50);
  assert.equal(rotated.x, 290);
  assert.equal(rotated.y, 130);
  const small = stepHabitatFriend(friend, 0, { width: 80, height: 50 }, 50);
  assert.equal(small.x, 40);
  assert.equal(small.y, 25);
});

test('returning from a suspended tab cannot teleport swimming friends', () => {
  const friend = { x: 150, y: 150, vx: 20, vy: 0, phase: 0 };
  const next = stepHabitatFriend(friend, 90, { width: 350, height: 280 }, 43);
  assert.ok(Math.abs(next.x - friend.x) <= 1);
  assert.ok(Math.abs(next.y - friend.y) <= .2);
});

test('overlapping friends separate gently without moving a held target or escaping the field', () => {
  const held = { x: 150, y: 140, vx: 20, vy: 0, phase: 0 };
  const next = spaceHabitatFriends([
    { position: held, radius: 43, held: true },
    { position: { ...held }, radius: 43, held: false },
    { position: { ...held, x: 43, y: 43 }, radius: 43, held: false },
    { position: { ...held, x: 44, y: 44 }, radius: 43, held: false },
  ], { width: 350, height: 280 });
  assert.deepEqual(next[0], held);
  assert.ok(Math.hypot(next[1].x - held.x, next[1].y - held.y) > 0);
  assert.ok(Math.hypot(next[1].x - held.x, next[1].y - held.y) <= 2.01);
  for (const friend of next) {
    assert.ok(friend.x >= 43 && friend.x <= 307);
    assert.ok(friend.y >= 43 && friend.y <= 237);
  }
});
