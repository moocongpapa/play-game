import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { createParkFriends, reactParkFriend, stepParkFriends, type ParkFriend } from '../utils/characterParkMotion';
import type { CharacterId } from '../types';
import { aimHabitatFriend, moveHabitatFriend, resizeHabitatFriend, type HabitatPlacement } from '../utils/habitatMotion';

/** One 30 fps transform loop. React only rerenders for a child's reaction, never for walking. */
export function useCharacterParkMotion(field: RefObject<HTMLDivElement>, active: boolean) {
  const nodes = useRef(new Map<CharacterId, HTMLButtonElement>());
  const held = useRef(new Set<CharacterId>());
  const friends = useRef<ParkFriend[]>([]);
  const measured = useRef({ width: 0, height: 0 });
  const radiusRef = useRef(45);
  const draw = useCallback(() => {
    for (const friend of friends.current) {
      const node = nodes.current.get(friend.id);
      if (!node) continue;
      node.style.transform = `translate3d(${friend.x}px, ${friend.y}px, 0)`;
      node.style.setProperty('--park-facing', friend.vx < 0 ? '-1' : '1');
      node.style.zIndex = String(Math.round(friend.y) + (friend.action === 'walk' ? 0 : 1000));
      if (node.dataset.action !== friend.action) node.dataset.action = friend.action;
    }
  }, []);
  const react = useCallback((id: CharacterId) => {
    const friend = friends.current.find(item => item.id === id);
    if (!friend) return null;
    const action = reactParkFriend(friend);
    draw();
    return action;
  }, [draw]);
  const getPosition = useCallback((id: CharacterId) => friends.current.find(friend => friend.id === id), []);
  const move = useCallback((id: CharacterId, point: HabitatPlacement) => {
    friends.current = friends.current.map(friend => friend.id === id ? moveHabitatFriend(friend, point, measured.current, radiusRef.current) : friend); draw();
  }, [draw]);
  const release = useCallback((id: CharacterId, direction: HabitatPlacement) => {
    friends.current = friends.current.map(friend => friend.id === id ? { ...aimHabitatFriend(friend, direction), action: 'walk', remaining: 0, nextPlay: 2 } : friend); draw();
  }, [draw]);

  useEffect(() => {
    const element = field.current;
    if (!element) return;
    let frame = 0, last = 0;
    let bounds = { width: 0, height: 0 }, radius = 45;
    const resize = () => {
      const nextBounds = { width: element.clientWidth, height: element.clientHeight };
      // Preserve the child's placements on rotation as well as pause/resume.
      const resized = nextBounds.width !== measured.current.width || nextBounds.height !== measured.current.height;
      const previousBounds = measured.current;
      bounds = nextBounds;
      measured.current = nextBounds;
      const firstNode = nodes.current.values().next().value;
      radius = (firstNode?.offsetWidth || 84) / 2 + 5;
      radiusRef.current = radius;
      if (!friends.current.length) friends.current = createParkFriends(bounds, radius);
      else if (resized) friends.current = friends.current.map(friend => resizeHabitatFriend(friend, previousBounds, bounds, radius));
      draw();
    };
    const tick = (now: number) => {
      if (!last || now - last >= 32) {
        friends.current = stepParkFriends(friends.current, last ? (now - last) / 1000 : 0, bounds, radius, held.current);
        last = now;
        draw();
      }
      frame = requestAnimationFrame(tick);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    if (active) frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [field, active, draw]);

  return { nodes, held, react, getPosition, move, release };
}
