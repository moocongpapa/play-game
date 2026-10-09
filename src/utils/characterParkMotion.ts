import { CHARACTER_LIST } from '../data/characters';
import { PARK_ACTIONS, PARK_PERSONALITIES, type ParkAction } from '../data/characterPark';
import { placeHabitatFriend, stepHabitatFriend, type HabitatBounds, type HabitatPosition } from './habitatMotion';
import type { CharacterId } from '../types';

export interface ParkFriend extends HabitatPosition {
  id: CharacterId;
  action: ParkAction | 'walk';
  remaining: number;
  nextPlay: number;
  taps: number;
}

/** The roster is fixed: exactly one of each existing character, with no spawn operation. */
export function createParkFriends(bounds: HabitatBounds, radius: number): ParkFriend[] {
  const columns = bounds.width >= bounds.height ? 4 : 2;
  const rows = Math.ceil(CHARACTER_LIST.length / columns);
  return CHARACTER_LIST.map((friend, index) => ({
    ...placeHabitatFriend(index, CHARACTER_LIST.length, bounds, radius, PARK_PERSONALITIES[friend.id].speed * 1.8, () => index % 2 ? .75 : .25,
      { x: (index % columns + .5) / columns, y: (Math.floor(index / columns) + .5) / rows }),
    id: friend.id, action: 'walk', remaining: 0, nextPlay: .8 + index * .45, taps: 0, wander: .5,
  }));
}

export function reactParkFriend(friend: ParkFriend): ParkAction {
  const actions = PARK_PERSONALITIES[friend.id].actions;
  const action = actions[friend.taps++ % actions.length];
  friend.action = action;
  friend.remaining = PARK_ACTIONS[action].duration;
  friend.nextPlay = 8;
  if (action === 'turn') { friend.vx *= -1; friend.vy *= -1; }
  return action;
}

/** Pure bounded simulation; callers own the clock, so hidden/paused scenes do no work. */
export function stepParkFriends(friends: readonly ParkFriend[], elapsed: number, bounds: HabitatBounds, radius: number, held: ReadonlySet<CharacterId>, random = Math.random): ParkFriend[] {
  const dt = Math.max(0, Math.min(.05, elapsed));
  const next = friends.map(friend => {
    const nextFriend = { ...friend };
    nextFriend.remaining = Math.max(0, friend.remaining - dt);
    if (!nextFriend.remaining) nextFriend.action = 'walk';
    nextFriend.nextPlay -= dt;
    if (nextFriend.nextPlay <= 0 && !held.has(friend.id)) {
      const moves = PARK_PERSONALITIES[friend.id].actions;
      nextFriend.action = moves[Math.min(moves.length - 1, Math.floor(random() * moves.length))];
      nextFriend.remaining = PARK_ACTIONS[nextFriend.action].duration;
      nextFriend.nextPlay = 3 + random() * 4;
      if (nextFriend.action === 'turn') { nextFriend.vx *= -1; nextFriend.vy *= -1; }
    }
    if (held.has(friend.id) || !['walk', 'run', 'turn'].includes(nextFriend.action)) return nextFriend;
    const speed = nextFriend.action === 'run' ? 2.1 : 1;
    const moved = stepHabitatFriend({ ...nextFriend, vx: nextFriend.vx * speed, vy: nextFriend.vy * speed }, dt, bounds, radius);
    return { ...nextFriend, ...moved, vx: moved.vx / speed, vy: moved.vy / speed };
  });
  // Turn away from a neighbour rather than stacking everyone against one boundary.
  for (let i = 0; i < next.length; i++) for (let j = i + 1; j < next.length; j++) {
    const a = next[i], b = next[j];
    const dx = b.x - a.x, dy = b.y - a.y;
    const distance = Math.hypot(dx, dy);
    if (distance >= radius * 1.85) continue;
    const nx = distance < .01 ? (i % 2 ? 1 : -1) : dx / distance;
    const ny = distance < .01 ? 0 : dy / distance;
    const push = Math.min(1.5, (radius * 1.85 - distance) * .18);
    if (!held.has(a.id)) { a.x -= nx * push; a.y -= ny * push; a.vx = -Math.sign(nx || 1) * Math.abs(a.vx); }
    if (!held.has(b.id)) { b.x += nx * push; b.y += ny * push; b.vx = Math.sign(nx || 1) * Math.abs(b.vx); }
  }
  return next.map(friend => ({ ...friend, ...stepHabitatFriend(friend, 0, bounds, radius) }));
}
