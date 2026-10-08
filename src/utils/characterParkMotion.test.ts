import test from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTER_LIST } from '../data/characters';
import { PARK_ACTIONS, PARK_GUIDE, PARK_PERSONALITIES } from '../data/characterPark';
import { createParkFriends, reactParkFriend, stepParkFriends } from './characterParkMotion';
import { translateSpeech } from './speechLanguage';

test('repeated touches never spawn friends, and every character can jump, roll and reverse direction', () => {
  const friends = createParkFriends({ width: 360, height: 580 }, 52);
  for (const friend of friends) {
    const seen = new Set();
    for (let tap = 0; tap < 60; tap++) {
      const velocity = friend.vx;
      const action = reactParkFriend(friend);
      seen.add(action);
      if (action === 'turn') assert.equal(friend.vx, -velocity);
      assert.ok(friend.remaining > 0);
    }
    assert.deepEqual(seen, new Set(PARK_PERSONALITIES[friend.id].actions));
  }
  assert.deepEqual(friends.map(friend => friend.id), CHARACTER_LIST.map(friend => friend.id));
  assert.equal(new Set(friends.map(friend => friend.id)).size, 8);
});

test('all eight remain inside phone and tablet fields during long play, with large touch targets', () => {
  for (const [width, height, radius] of [[336, 573, 57], [296, 340, 48], [740, 203, 47], [615, 159, 41], [780, 864, 77]]) {
    const bounds = { width, height };
    let friends = createParkFriends(bounds, radius);
    for (let frame = 0; frame < 2500; frame++) {
      if (frame % 37 === 0) reactParkFriend(friends[frame % 8]);
      friends = stepParkFriends(friends, .033, bounds, radius, new Set(), () => .4);
      for (const friend of friends) {
        assert.ok(friend.x >= radius && friend.x <= width - radius, `${friend.id} horizontal bounds`);
        assert.ok(friend.y >= radius && friend.y <= height - radius, `${friend.id} vertical bounds`);
      }
    }
    assert.equal(friends.length, 8);
  }
});

test('a held friend remains under the finger and a sleeping tab cannot teleport the roster', () => {
  const bounds = { width: 500, height: 640 };
  const friends = createParkFriends(bounds, 50);
  const held = friends[0];
  const next = stepParkFriends(friends, 90, bounds, 50, new Set([held.id]));
  assert.equal(next[0].x, held.x);
  assert.equal(next[0].y, held.y);
  next.forEach((friend, i) => assert.ok(Math.abs(friend.x - friends[i].x) < 2));
});

test('reactions complete automatically and neighbouring friends turn apart', () => {
  const bounds = { width: 500, height: 640 };
  let friends = createParkFriends(bounds, 50);
  reactParkFriend(friends[0]);
  for (let i = 0; i < 60; i++) friends = stepParkFriends(friends, .05, bounds, 50, new Set());
  assert.equal(friends[0].action, 'walk');
  friends[0] = { ...friends[0], x: 200, y: 300, vx: 20 };
  friends[1] = { ...friends[1], x: 205, y: 300, vx: -20 };
  const next = stepParkFriends(friends.slice(0, 2), .033, bounds, 50, new Set());
  assert.ok(next[0].vx < 0);
  assert.ok(next[1].vx > 0);
});

test('park welcome and all six reactions have authored English speech', () => {
  for (const copy of [PARK_GUIDE, ...Object.values(PARK_ACTIONS).map(action => action.speech)]) {
    const english = translateSpeech(copy);
    assert.ok(english);
    assert.doesNotMatch(english, /[가-힣]/);
  }
});
