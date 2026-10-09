import test from 'node:test';
import assert from 'node:assert/strict';
import { brushRow, brushStroke, CLEAN_STROKES, TEETH } from './brushing';

test('holding still, tiny jitter and rubbing outside the mouth cannot clean teeth', () => {
  const empty = TEETH.map(() => 0);
  assert.deepEqual(brushStroke(empty, TEETH[0], TEETH[0]), empty);
  assert.deepEqual(brushStroke(empty, TEETH[0], { x: 95, y: 148 }), empty);
  assert.deepEqual(brushStroke(empty, { x: 30, y: 50 }, { x: 270, y: 50 }), empty);
});

test('fast strokes clean crossed teeth, preserve the other row, and need repeated rubbing', () => {
  const empty = TEETH.map(() => 0);
  const from = { x: 70, y: 148 };
  const to = { x: 230, y: 148 };
  const first = brushStroke(empty, from, to);
  assert.deepEqual(first, [28, 28, 28, 28, 0, 0, 0, 0]);
  assert.deepEqual(empty, Array(8).fill(0), 'input progress is immutable');
  const second = brushStroke(first, to, from);
  assert.ok(second.slice(0, 4).every(value => value < CLEAN_STROKES));
  let progress = brushStroke(second, from, to);
  for (let i = 0; i < 4; i++) progress = brushStroke(progress, { x: 70, y: 187 }, { x: 230, y: 187 });
  assert.deepEqual(progress, Array(8).fill(CLEAN_STROKES), 'both rows can finish without overshooting');
});

test('the guided row preserves past work and cannot finish the following scene early', () => {
  const empty = Array(8).fill(0);
  assert.deepEqual(brushRow(empty, { x: 70, y: 187 }, { x: 230, y: 187 }, 0), empty);
  let clean = empty;
  for (let i = 0; i < 3; i++) clean = brushRow(clean, { x: 70, y: 148 }, { x: 230, y: 148 }, 0);
  assert.deepEqual(clean, [80,80,80,80,0,0,0,0]);
  for (let i = 0; i < 3; i++) clean = brushRow(clean, { x: 70, y: 187 }, { x: 230, y: 187 }, 1);
  assert.deepEqual(clean, Array(8).fill(80));
});
