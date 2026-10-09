import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject, type PointerEvent, type KeyboardEvent } from 'react';
import type { HabitatPlacement } from '../utils/habitatMotion';

interface Drag<Id> {
  id: Id; node: HTMLButtonElement; pointer: number; start: HabitatPlacement;
  offset: HabitatPlacement; last: HabitatPlacement; direction: HabitatPlacement; moved: boolean;
}
interface Options<Id extends string> {
  field: RefObject<HTMLDivElement>; held: RefObject<Set<Id>>; blocked: boolean;
  getPosition: (id: Id) => HabitatPlacement | undefined;
  move: (id: Id, point: HabitatPlacement) => void;
  release: (id: Id, direction: HabitatPlacement) => void;
  onTap: (id: Id, point: HabitatPlacement) => void;
  onDrop: (id: Id, point: HabitatPlacement) => void;
}

/** Pointer capture, grab offset and a forgiving tap threshold, shared by all three playgrounds. */
export function useRoamingDrag<Id extends string>(options: Options<Id>) {
  const latest = useRef(options);
  useLayoutEffect(() => { latest.current = options; });
  const gestures = useRef(new Map<number, Drag<Id>>());
  const flashes = useRef(new Map<HTMLButtonElement, ReturnType<typeof setTimeout>>());
  const clear = useCallback((drag: Drag<Id>) => {
    gestures.current.delete(drag.pointer);
    latest.current.held.current.delete(drag.id);
    delete drag.node.dataset.grabbed; delete drag.node.dataset.dragging;
    if (drag.node.hasPointerCapture(drag.pointer)) drag.node.releasePointerCapture(drag.pointer);
  }, []);
  const cancelAll = useCallback(() => { for (const drag of [...gestures.current.values()]) clear(drag); }, [clear]);
  useEffect(() => {
    window.addEventListener('blur', cancelAll); window.addEventListener('resize', cancelAll);
    return () => {
      cancelAll(); window.removeEventListener('blur', cancelAll); window.removeEventListener('resize', cancelAll);
      for (const [node, timer] of flashes.current) { clearTimeout(timer); delete node.dataset.dropped; }
      flashes.current.clear();
    };
  }, [cancelAll]);
  useEffect(() => { if (options.blocked) cancelAll(); }, [options.blocked, cancelAll]);
  const movePointer = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = gestures.current.get(event.pointerId);
    const current = latest.current, field = current.field.current;
    if (!drag || !field || current.blocked) return;
    const delta = { x: event.clientX - drag.last.x, y: event.clientY - drag.last.y };
    if (Math.hypot(delta.x, delta.y) > .5) drag.direction = delta;
    drag.last = { x: event.clientX, y: event.clientY };
    if (!drag.moved && Math.hypot(event.clientX - drag.start.x, event.clientY - drag.start.y) < 8) return;
    drag.moved = true; drag.node.dataset.dragging = 'true';
    const rect = field.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    current.move(drag.id, { x: (event.clientX - rect.left) * field.clientWidth / rect.width - drag.offset.x,
      y: (event.clientY - rect.top) * field.clientHeight / rect.height - drag.offset.y });
  };
  const handlers = (id: Id) => ({
    onPointerDown(event: PointerEvent<HTMLButtonElement>) {
      const current = latest.current, field = current.field.current, position = current.getPosition(id);
      if (event.button !== 0 || current.blocked || !field || !position || [...gestures.current.values()].some(drag => drag.id === id)) return;
      const rect = field.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId); current.held.current.add(id);
      const previousFlash = flashes.current.get(event.currentTarget);
      if (previousFlash) clearTimeout(previousFlash);
      flashes.current.delete(event.currentTarget); delete event.currentTarget.dataset.dropped;
      event.currentTarget.dataset.grabbed = 'true';
      const start = { x: event.clientX, y: event.clientY };
      gestures.current.set(event.pointerId, { id, node: event.currentTarget, pointer: event.pointerId, start, last: start,
        offset: { x: (start.x - rect.left) * field.clientWidth / rect.width - position.x,
          y: (start.y - rect.top) * field.clientHeight / rect.height - position.y }, direction: { x: 0, y: 0 }, moved: false });
    },
    onPointerMove: movePointer,
    onPointerUp(event: PointerEvent<HTMLButtonElement>) {
      movePointer(event);
      const drag = gestures.current.get(event.pointerId);
      if (!drag) return;
      clear(drag);
      if (latest.current.blocked) return;
      const point = { x: event.clientX, y: event.clientY };
      if (drag.moved) {
        latest.current.release(drag.id, drag.direction); latest.current.onDrop(drag.id, point);
        drag.node.dataset.dropped = 'true';
        flashes.current.set(drag.node, setTimeout(() => { delete drag.node.dataset.dropped; flashes.current.delete(drag.node); }, 280));
      } else latest.current.onTap(drag.id, point);
    },
    onPointerCancel(event: PointerEvent<HTMLButtonElement>) { const drag = gestures.current.get(event.pointerId); if (drag) clear(drag); },
    onLostPointerCapture(event: PointerEvent<HTMLButtonElement>) { const drag = gestures.current.get(event.pointerId); if (drag) clear(drag); },
    onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
      const delta = { ArrowLeft: [-32, 0], ArrowRight: [32, 0], ArrowUp: [0, -32], ArrowDown: [0, 32] }[event.key];
      const point = latest.current.getPosition(id);
      if (!delta || !point || latest.current.blocked) return;
      event.preventDefault(); latest.current.move(id, { x: point.x + delta[0], y: point.y + delta[1] });
    },
  });
  return { handlers, cancelAll };
}
