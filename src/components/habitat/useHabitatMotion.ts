import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { aimHabitatFriend, moveHabitatFriend, placeHabitatFriend, resizeHabitatFriend, spaceHabitatFriends, stepHabitatFriend, type HabitatPlacement, type HabitatPosition } from '../../utils/habitatMotion';
import type { HabitatFriend } from '../../data/habitatFriends';

export interface LivingFriend { uid: string; species: HabitatFriend; position?: HabitatPlacement }

/** One transform loop, no per-frame React renders, no offscreen or paused animation work. */
export function useHabitatMotion(field: RefObject<HTMLDivElement>, friends: LivingFriend[], active: boolean) {
  const nodes = useRef(new Map<string, HTMLButtonElement>());
  const held = useRef(new Set<string>());
  const positions = useRef(new Map<string, HabitatPosition>());
  const measuredBounds = useRef({ width: 0, height: 0 });
  const radii = useRef(new Map<string, number>());
  const sizes = useRef(new Map<string, { width: number; height: number }>());
  const draw = useCallback(() => {
    positions.current.forEach((position, id) => {
      const node = nodes.current.get(id), size = sizes.current.get(id);
      if (!node || !size) return;
      node.style.transform = `translate3d(${position.x - size.width / 2}px, ${position.y - size.height / 2}px, 0)`;
      node.style.setProperty('--facing', position.vx < 0 ? '-1' : '1');
    });
  }, []);
  const getPosition = useCallback((id: string) => positions.current.get(id), []);
  const move = useCallback((id: string, point: HabitatPlacement) => {
    const old = positions.current.get(id);
    if (!old) return;
    positions.current.set(id, moveHabitatFriend(old, point, measuredBounds.current, radii.current.get(id) || 43)); draw();
  }, [draw]);
  const release = useCallback((id: string, direction: HabitatPlacement) => {
    const old = positions.current.get(id);
    if (old) positions.current.set(id, aimHabitatFriend(old, direction)); draw();
  }, [draw]);
  useEffect(() => {
    const element = field.current;
    if (!element) return;
    let frame = 0;
    let last = 0;
    let bounds = { width: element.clientWidth, height: element.clientHeight };
    const ids = new Set(friends.map(friend => friend.uid));
    for (const id of positions.current.keys()) if (!ids.has(id)) { positions.current.delete(id); held.current.delete(id); radii.current.delete(id); sizes.current.delete(id); }
    const resize = () => {
      bounds = { width: element.clientWidth, height: element.clientHeight };
      const previous = measuredBounds.current;
      const changed = Math.abs(bounds.width - previous.width) > 1 || Math.abs(bounds.height - previous.height) > 1;
      measuredBounds.current = bounds;
      friends.forEach((friend, i) => {
        const node = nodes.current.get(friend.uid);
        const size = { width: node?.offsetWidth || 72, height: node?.offsetHeight || 72 };
        sizes.current.set(friend.uid, size);
        const radius = Math.max(size.width, size.height) / 2 + 7;
        radii.current.set(friend.uid, radius);
        const old = positions.current.get(friend.uid);
        positions.current.set(friend.uid, old ? changed ? resizeHabitatFriend(old, previous, bounds, radius) : stepHabitatFriend(old, 0, bounds, radius)
          : { ...placeHabitatFriend(i, friends.length, bounds, radius, friend.species.speed * 1.8, Math.random, friend.position), wander: friend.species.motion === 'crawl' ? .25 : .7 });
      });
      draw();
    };
    const tick = (now: number) => {
      if (!last || now - last >= 32) {
        const dt = last ? (now - last) / 1000 : 0;
        last = now;
        for (const friend of friends) {
          if (held.current.has(friend.uid)) continue;
          const position = positions.current.get(friend.uid);
          if (position) positions.current.set(friend.uid, stepHabitatFriend(position, dt, bounds, radii.current.get(friend.uid) || 43));
        }
        const spaced = spaceHabitatFriends(friends.map(friend => ({ position: positions.current.get(friend.uid)!, radius: radii.current.get(friend.uid) || 43, held: held.current.has(friend.uid) })), bounds);
        friends.forEach((friend, i) => positions.current.set(friend.uid, spaced[i]));
        draw();
      }
      frame = requestAnimationFrame(tick);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    if (active) frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [field, friends, active, draw]);
  return { nodes, held, getPosition, move, release };
}
