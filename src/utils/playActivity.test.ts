import assert from 'node:assert/strict';
import test from 'node:test';
import { GAME_CATALOG } from '../data/gameCatalog';
import { summarizePlayActivity } from './playActivity';

test('every catalog game contributes exactly once to the parent report', () => {
  for (const id of Object.keys(GAME_CATALOG)) {
    const totals = summarizePlayActivity({ [id]: 3 });
    assert.equal(Object.values(totals).reduce((sum, value) => sum + value, 0), 3, id);
  }
  const counts = Object.fromEntries(Object.keys(GAME_CATALOG).map((id, i) => [id, i + 1]));
  assert.equal(Object.values(summarizePlayActivity(counts)).reduce((a, b) => a + b, 0), Object.values(counts).reduce((a, b) => a + b, 0));
  assert.deepEqual(summarizePlayActivity({}), { language: 0, logic: 0, care: 0, creative: 0 });
});
