import test from 'node:test';
import assert from 'node:assert/strict';
import { makeMelodyEcho } from './melody';

test('echo preserves the last six notes and their rhythm with no input mutation', () => {
  const notes = Array.from({ length: 8 }, (_, key) => ({ key, at: key * 300 }));
  const copy = structuredClone(notes);
  assert.deepEqual(makeMelodyEcho(notes), [2,3,4,5,6,7].map((key,i) => ({ key, at: i * 300 })));
  assert.deepEqual(notes, copy);
});
test('echo bounds long pauses, simultaneous notes and invalid samples', () => {
  assert.deepEqual(makeMelodyEcho([{ key: -1, at: 0 }, { key: 8, at: 0 }, { key: 2, at: NaN }]), []);
  assert.deepEqual(makeMelodyEcho([{ key: 0, at: 0 }, { key: 7, at: 0 }, { key: 1, at: 9999 }]), [{ key: 0, at: 0 }, { key: 7, at: 160 }, { key: 1, at: 710 }]);
});
