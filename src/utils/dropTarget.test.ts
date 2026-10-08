import assert from 'node:assert/strict';
import test from 'node:test';
import { findDropTarget, placeMatchingValue } from './dropTarget';

const slots = [
  { id: 'left', left: 10, top: 20, right: 90, bottom: 100 },
  { id: 'right', left: 110, top: 20, right: 190, bottom: 100 },
];
test('finger inside a slot wins even when another slot is within the forgiving edge', () => {
  assert.equal(findDropTarget(88, 65, slots), 'left');
  assert.equal(findDropTarget(112, 65, slots), 'right');
});
test('small edge misses snap to nearest slot, distant releases do not count', () => {
  assert.equal(findDropTarget(95, 65, slots), 'left');
  assert.equal(findDropTarget(105, 65, slots), 'right');
  assert.equal(findDropTarget(50, 118, slots), 'left');
  assert.equal(findDropTarget(50, 140, slots), null);
  assert.equal(findDropTarget(50, 50, []), null);
});
test('word pieces can fill the last slot first and repeated letters occupy separate slots', () => {
  const expected = ['나', '나', '무'];
  const lastFirst = placeMatchingValue(expected, [], '무', 2)!;
  assert.deepEqual(lastFirst, [null, null, '무']);
  const repeated = placeMatchingValue(expected, lastFirst, '나', 1)!;
  assert.deepEqual(placeMatchingValue(expected, repeated, '나', 0), expected);
  assert.deepEqual(lastFirst, [null, null, '무']);
});
test('wrong, occupied and invalid destinations are rejected', () => {
  assert.equal(placeMatchingValue(['나', '무'], [], '무', 0), null);
  assert.equal(placeMatchingValue(['나', '무'], ['나', null], '나', 0), null);
  for (const index of [-1, 2, 0.5, NaN]) assert.equal(placeMatchingValue(['나', '무'], [], '나', index), null);
});
test('size ordering can start from the largest slot without requiring sequential clicks', () => {
  const expected = [2, 0, 1];
  const largestFirst = placeMatchingValue(expected, [], 1, 2)!;
  assert.deepEqual(largestFirst, [null, null, 1]);
  assert.equal(placeMatchingValue(expected, largestFirst, 0, 0), null);
  assert.deepEqual(placeMatchingValue(expected, largestFirst, 2, 0), [2, null, 1]);
});
