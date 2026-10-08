export interface DropBounds {
  id: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** CSS pixels, independent of screen density. Give tablet fingers a wider landing area. */
export const magnetTolerance = (viewportWidth: number) => viewportWidth >= 768 ? 90 : 60;
export const MAGNET_SPRING = { type: 'spring' as const, stiffness: 400, damping: 20, mass: .8 };

/** An explicit drop inside another slot still counts as that choice; nearby valid slots attract. */
export function findMagnetTarget(x: number, y: number, targets: DropBounds[], tolerance: number, accepts?: (id: string) => boolean) {
  const direct = findDropTarget(x, y, targets, 0);
  if (direct) return direct;
  return findDropTarget(x, y, accepts ? targets.filter(target => accepts(target.id)) : targets, tolerance);
}

/** Prefer the slot under the finger; forgive small misses without choosing a distant slot. */
export function findDropTarget(x: number, y: number, targets: DropBounds[], tolerance = 22): string | null {
  const candidates = targets.map(target => {
    const dx = Math.max(target.left - x, 0, x - target.right);
    const dy = Math.max(target.top - y, 0, y - target.bottom);
    return {
      id: target.id,
      edgeDistance: Math.hypot(dx, dy),
      centerDistance: Math.hypot(x - (target.left + target.right) / 2, y - (target.top + target.bottom) / 2),
    };
  }).filter(target => target.edgeDistance <= tolerance);
  candidates.sort((a, b) => a.edgeDistance - b.edgeDistance || a.centerDistance - b.centerDistance);
  return candidates[0]?.id ?? null;
}

/** Fill any matching empty slot, including repeated letters; never overwrite a filled slot. */
export function placeMatchingValue<T>(expected: readonly T[], placed: readonly (T | null)[], value: T, index: number): (T | null)[] | null {
  if (!Number.isInteger(index) || index < 0 || index >= expected.length || placed[index] != null || expected[index] !== value) return null;
  const next = Array.from({ length: expected.length }, (_, i) => placed[i] ?? null);
  next[index] = value;
  return next;
}
