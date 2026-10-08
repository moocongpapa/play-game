export interface HabitatBounds { width: number; height: number }
export interface HabitatPosition { x: number; y: number; vx: number; vy: number; phase: number }
export interface HabitatPlacement { x: number; y: number }
const clampCenter = (value: number, extent: number, radius: number) => extent <= radius * 2 ? extent / 2 : Math.max(radius, Math.min(extent - radius, value));

export function placeHabitatFriend(index: number, count: number, bounds: HabitatBounds, radius: number, speed: number, random = Math.random, position?: HabitatPlacement): HabitatPosition {
  const columns = Math.max(1, Math.min(count, Math.round(Math.sqrt(count * bounds.width / Math.max(1, bounds.height)))));
  const rows = Math.ceil(count / columns);
  const x = position ? position.x * bounds.width : ((index % columns) + .5) * bounds.width / columns;
  const y = position ? position.y * bounds.height : (Math.floor(index / columns) + .5) * bounds.height / rows;
  return { x: clampCenter(x, bounds.width, radius), y: clampCenter(y, bounds.height, radius), vx: speed * (random() < .5 ? -1 : 1), vy: speed * (random() - .5) * .45, phase: random() * Math.PI * 2 };
}

/** Keep the whole touch target inside the field, including after rotation/resizing. */
export function stepHabitatFriend(friend: HabitatPosition, elapsed: number, bounds: HabitatBounds, radius: number): HabitatPosition {
  const dt = Math.max(0, Math.min(.05, elapsed));
  const phase = friend.phase + dt * 1.8;
  const x = clampCenter(friend.x + friend.vx * dt, bounds.width, radius);
  const y = clampCenter(friend.y + (friend.vy + Math.sin(phase) * 4) * dt, bounds.height, radius);
  return { x, y, phase,
    vx: x <= radius ? Math.abs(friend.vx) : x >= bounds.width - radius ? -Math.abs(friend.vx) : friend.vx,
    vy: y <= radius ? Math.abs(friend.vy) : y >= bounds.height - radius ? -Math.abs(friend.vy) : friend.vy,
  };
}

/** A gentle nudge keeps drifting friends from covering each other's faces. Held targets stay still. */
export function spaceHabitatFriends(friends: { position: HabitatPosition; radius: number; held: boolean }[], bounds: HabitatBounds): HabitatPosition[] {
  const next = friends.map(friend => ({ ...friend.position }));
  for (let i = 0; i < next.length; i++) for (let j = i + 1; j < next.length; j++) {
    let dx = next[j].x - next[i].x;
    let dy = next[j].y - next[i].y;
    const distance = Math.hypot(dx, dy);
    const overlap = (friends[i].radius + friends[j].radius) * .88 - distance;
    if (overlap <= 0) continue;
    if (distance < .01) { dx = Math.cos((i + j) * 2.4); dy = Math.sin((i + j) * 2.4); }
    else { dx /= distance; dy /= distance; }
    const push = Math.min(2, overlap * .15);
    if (!friends[i].held) { next[i].x -= dx * push; next[i].y -= dy * push; }
    if (!friends[j].held) { next[j].x += dx * push; next[j].y += dy * push; }
  }
  return next.map((position, i) => ({ ...position,
    x: clampCenter(position.x, bounds.width, friends[i].radius),
    y: clampCenter(position.y, bounds.height, friends[i].radius),
  }));
}
