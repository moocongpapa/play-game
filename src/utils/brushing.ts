export type BrushPoint = { x: number; y: number };
export const TEETH = Array.from({ length: 8 }, (_, index) => ({
  x: 94 + (index % 4) * 37,
  y: index < 4 ? 148 : 187,
}));
export const CLEAN_STROKES = 80;

function distanceToStroke(point: BrushPoint, from: BrushPoint, to: BrushPoint) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared ? Math.max(0, Math.min(1, ((point.x - from.x) * dx + (point.y - from.y) * dy) / lengthSquared)) : 0;
  return Math.hypot(point.x - from.x - t * dx, point.y - from.y - t * dy);
}

/** Accumulate actual rubbing, never elapsed time or merely holding a finger still. */
export function brushStroke(progress: readonly number[], from: BrushPoint, to: BrushPoint): number[] {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  if (distance < 2) return [...progress];
  return TEETH.map((tooth, index) => distanceToStroke(tooth, from, to) <= 24
    ? Math.min(CLEAN_STROKES, (progress[index] || 0) + Math.min(28, distance))
    : progress[index] || 0);
}

/** A row stays clean between scenes; incidental strokes cannot skip the next row. */
export function brushRow(progress: readonly number[], from: BrushPoint, to: BrushPoint, row: number): number[] {
  return brushStroke(progress, from, to).map((value, i) => Math.floor(i / 4) === row ? value : progress[i]);
}
