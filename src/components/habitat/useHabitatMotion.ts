import { useEffect, useRef, type RefObject } from 'react';
import { placeHabitatFriend, spaceHabitatFriends, stepHabitatFriend, type HabitatPlacement, type HabitatPosition } from '../../utils/habitatMotion';
import type { HabitatFriend } from '../../data/habitatFriends';

export interface LivingFriend { uid: string; species: HabitatFriend; position?: HabitatPlacement }

/** One transform loop, no per-frame React renders, no offscreen or paused animation work. */
export function useHabitatMotion(field: RefObject<HTMLDivElement>, friends: LivingFriend[], active: boolean, happyUid: string | null) {
  const nodes = useRef(new Map<string, HTMLButtonElement>());
  const held = useRef(new Set<string>());
  const positions = useRef(new Map<string, HabitatPosition>());
  const measuredBounds = useRef({ width: 0, height: 0 });
  const happy = useRef(happyUid);
  happy.current = happyUid;
  useEffect(() => {
    const element = field.current;
    if (!element) return;
    let frame = 0;
    let last = 0;
    let bounds = { width: element.clientWidth, height: element.clientHeight };
    const radii = new Map<string, number>();
    const sizes = new Map<string, { width: number; height: number }>();
    const ids = new Set(friends.map(friend => friend.uid));
    for (const id of positions.current.keys()) if (!ids.has(id)) { positions.current.delete(id); held.current.delete(id); }
    const draw = () => friends.forEach(friend => {
      const node = nodes.current.get(friend.uid);
      const position = positions.current.get(friend.uid);
      const size = sizes.get(friend.uid);
      if (!node || !position || !size) return;
      node.style.transform = `translate3d(${position.x - size.width / 2}px, ${position.y - size.height / 2}px, 0)`;
      node.style.setProperty('--facing', position.vx < 0 ? '-1' : '1');
    });
    const resize = () => {
      bounds = { width: element.clientWidth, height: element.clientHeight };
      const changed = Math.abs(bounds.width - measuredBounds.current.width) > 1 || Math.abs(bounds.height - measuredBounds.current.height) > 1;
      measuredBounds.current = bounds;
      friends.forEach((friend, i) => {
        const node = nodes.current.get(friend.uid);
        const size = { width: node?.offsetWidth || 72, height: node?.offsetHeight || 72 };
        sizes.set(friend.uid, size);
        const radius = Math.max(size.width, size.height) / 2 + 7;
        radii.set(friend.uid, radius);
        const old = positions.current.get(friend.uid);
        positions.current.set(friend.uid, old && !changed ? stepHabitatFriend(old, 0, bounds, radius) : placeHabitatFriend(i, friends.length, bounds, radius, friend.species.speed, Math.random, old ? undefined : friend.position));
      });
      draw();
    };
    const tick = (now: number) => {
      if (!last || now - last >= 32) {
        const dt = last ? (now - last) / 1000 : 0;
        last = now;
        for (const friend of friends) {
          if (held.current.has(friend.uid) || happy.current === friend.uid) continue;
          const position = positions.current.get(friend.uid);
          if (position) positions.current.set(friend.uid, stepHabitatFriend(position, dt, bounds, radii.get(friend.uid) || 43));
        }
        const spaced = spaceHabitatFriends(friends.map(friend => ({ position: positions.current.get(friend.uid)!, radius: radii.get(friend.uid) || 43, held: held.current.has(friend.uid) || happy.current === friend.uid })), bounds);
        friends.forEach((friend, i) => positions.current.set(friend.uid, spaced[i]));
        draw();
      }
      frame = requestAnimationFrame(tick);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    if (active) frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); held.current.clear(); };
  }, [field, friends, active]);
  return { nodes, held };
}
