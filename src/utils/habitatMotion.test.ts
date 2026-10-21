import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aimHabitatFriend, moveHabitatFriend, placeHabitatFriend, resizeHabitatFriend, spaceHabitatFriends, stepHabitatFriend, type HabitatPosition } from './habitatMotion.ts';

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

test('drag placement keeps the entire target visible and preserves identity, direction and motion phase', () => {
  const friend = { x: 100, y: 150, vx: 32, vy: -8, phase: 2, wander: .7, id: 'whale' };
  const bounds = { width: 350, height: 560 };
  const placed = moveHabitatFriend(friend, { x: 250, y: 420 }, bounds, 55);
  assert.deepEqual(placed, { ...friend, x: 250, y: 420 });
  assert.deepEqual(friend, { x: 100, y: 150, vx: 32, vy: -8, phase: 2, wander: .7, id: 'whale' }, 'gesture simulation does not mutate the previous state');
  const edge = moveHabitatFriend(placed, { x: -500, y: 900 }, bounds, 55);
  assert.equal(edge.x, 55); assert.equal(edge.y, 505);
  const tiny = moveHabitatFriend(friend, { x: -200, y: 900 }, { width: 50, height: 40 }, 55);
  assert.equal(tiny.x, 25); assert.equal(tiny.y, 20);
  const aimed = aimHabitatFriend(placed, { x: -120, y: 60 });
  assert.ok(aimed.vx < 0 && aimed.vy > 0);
  assert.ok(Math.abs(Math.hypot(aimed.vx, aimed.vy) - Math.hypot(friend.vx, friend.vy)) < .001, 'drop cannot fling a friend too fast');
  const moving = stepHabitatFriend(aimed, .033, bounds, 55);
  assert.ok(Math.hypot(moving.x - placed.x, moving.y - placed.y) < 2);
  assert.ok(moving.x > 240 && moving.y > 410, 'resuming starts at the drop point, never the spawn point');
  const rotated = resizeHabitatFriend(placed, bounds, { width: 700, height: 280 }, 55);
  assert.equal(rotated.x, 500); assert.equal(rotated.y, 210);
});

test('free roaming curves change heading, preserve speed and remain bounded through long play', () => {
  const bounds = { width: 350, height: 560 };
  let friend: HabitatPosition = { x: 175, y: 280, vx: 40, vy: 0, phase: .5, wander: .7 };
  const startSpeed = Math.hypot(friend.vx, friend.vy);
  for (let i = 0; i < 12000; i++) {
    friend = stepHabitatFriend(friend, .033, bounds, 55);
    assert.ok(friend.x >= 55 && friend.x <= 295 && friend.y >= 55 && friend.y <= 505);
    assert.ok(Math.abs(Math.hypot(friend.vx, friend.vy) - startSpeed) < .001);
    if (i === 60) assert.ok(Math.abs(friend.vy) > 4, 'friends explore vertically instead of only crossing horizontal lanes');
  }
});

test('habitat spawns 5 random initial friends and supports up to 50 friends stably', async () => {
  const { AQUARIUM_FRIENDS, GARDEN_FRIENDS, INITIAL_HABITAT_FRIENDS, MAX_HABITAT_FRIENDS, pickRandomHabitatFriends } = await import('../data/habitatFriends.ts');
  assert.equal(INITIAL_HABITAT_FRIENDS, 5);
  assert.equal(MAX_HABITAT_FRIENDS, 50);

  const initialAquarium = pickRandomHabitatFriends(AQUARIUM_FRIENDS);
  assert.equal(initialAquarium.length, 5);
  const aquariumIds = new Set(initialAquarium.map(f => f.id));
  assert.equal(aquariumIds.size, 5, '5 initial creatures must be unique species');

  const initialGarden = pickRandomHabitatFriends(GARDEN_FRIENDS);
  assert.equal(initialGarden.length, 5);
  const gardenIds = new Set(initialGarden.map(f => f.id));
  assert.equal(gardenIds.size, 5, '5 initial garden friends must be unique species');

  // Verify spacing with 50 simultaneous friends in the habitat
  const bounds = { width: 1000, height: 600 };
  const fiftyFriends = Array.from({ length: 50 }, (_, i) => ({
    position: placeHabitatFriend(i, 50, bounds, 40, 15, Math.random),
    radius: 40,
    held: false,
  }));
  const spaced = spaceHabitatFriends(fiftyFriends, bounds);
  assert.equal(spaced.length, 50);
  for (const pos of spaced) {
    assert.ok(pos.x >= 40 && pos.x <= 960);
    assert.ok(pos.y >= 40 && pos.y <= 560);
  }
});
