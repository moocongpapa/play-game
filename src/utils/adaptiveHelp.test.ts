import assert from 'node:assert/strict';
import test from 'node:test';
import { adaptiveHelpLevel, adaptiveMagnetTolerance, softenedChoiceIds } from './adaptiveHelp';
import { findMagnetTarget } from './dropTarget';

test('help grows after repeated misses and sustained idle without changing the answer', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 20].map(misses => adaptiveHelpLevel(misses)), [0, 0, 1, 1, 2, 2]);
  assert.equal(adaptiveHelpLevel(0, 1), 1);
  assert.equal(adaptiveHelpLevel(0, 2), 2);
  assert.equal(adaptiveHelpLevel(3, 2), 2);
  assert.equal(adaptiveHelpLevel(0, 0), 0, 'a fresh question has no carried difficulty reduction');
});

test('emphasis reduces gradually while keeping at least two choices clear and positions unchanged', () => {
  const ids = ['rocket', 'bear', 'car', 'bird'];
  assert.deepEqual(softenedChoiceIds(ids, 'car', 0), []);
  assert.deepEqual(softenedChoiceIds(ids, 'car', 1), ['bird']);
  assert.deepEqual(softenedChoiceIds(ids, 'car', 2), ['bear', 'bird']);
  assert.deepEqual(ids, ['rocket', 'bear', 'car', 'bird']);
  assert.deepEqual(softenedChoiceIds(['bear', 'car'], 'car', 2), []);
  assert.deepEqual(softenedChoiceIds(ids, 'missing', 2), []);
});

test('a correct card stays emphasized wherever it appears', () => {
  for (const ids of [['answer', 'one', 'two'], ['one', 'answer', 'two'], ['one', 'two', 'answer']]) {
    const softened = softenedChoiceIds(ids, 'answer', 2);
    assert.equal(softened.includes('answer'), false);
    assert.equal(ids.length - softened.length, 2);
  }
});

test('magnets grow in bounded steps for phones and tablets', () => {
  assert.deepEqual([0, 1, 2].map(level => adaptiveMagnetTolerance(60, level as 0 | 1 | 2)), [60, 80, 100]);
  assert.deepEqual([0, 1, 2].map(level => adaptiveMagnetTolerance(90, level as 0 | 1 | 2)), [90, 110, 130]);
});

test('expanded magnets still honor an explicit wrong destination and reject distant drops', () => {
  const slots = [{ id: 'wrong', left: 0, top: 0, right: 80, bottom: 80 }, { id: 'right', left: 120, top: 0, right: 200, bottom: 80 }];
  const radius = adaptiveMagnetTolerance(60, 2);
  assert.equal(findMagnetTarget(40, 40, slots, radius, id => id === 'right'), 'wrong');
  assert.equal(findMagnetTarget(250, 40, slots, radius, id => id === 'right'), 'right');
  assert.equal(findMagnetTarget(301, 40, slots, radius, id => id === 'right'), null);
  assert.equal(findMagnetTarget(250, 40, slots, radius, () => false), null);
});
