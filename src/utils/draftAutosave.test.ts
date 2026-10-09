import assert from 'node:assert/strict';
import test from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { createDraftAutosave } from './draftAutosave';

test('leaving before the debounce saves the latest drawing and cancels the old timer', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const writes: string[] = [];
  const save = createDraftAutosave(async draft => { writes.push(draft as string); }, assert.fail);
  save.schedule('first stroke');
  t.mock.timers.tick(500);
  save.schedule('last stroke');
  save.flush(); // Home navigation, hide, pagehide, or unmount.
  assert.deepEqual(writes, ['last stroke']);
  save.flush();
  t.mock.timers.tick(2000);
  assert.deepEqual(writes, ['last stroke']);
});

test('an old failed save cannot restore itself over a newer successful edit', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let rejectOld: (error: Error) => void;
  const writes: string[] = [];
  const save = createDraftAutosave<string>(async draft => {
    writes.push(draft);
    if (draft === 'old') await new Promise<void>((_, reject) => { rejectOld = reject; });
  }, () => {});
  save.schedule('old'); save.flush();
  save.schedule('new'); save.flush();
  rejectOld!(new Error('storage interrupted'));
  await setImmediate();
  save.flush();
  assert.deepEqual(writes, ['old', 'new']);
});

test('the latest failed edit is retained for a later flush', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let attempts = 0;
  const save = createDraftAutosave(async () => { if (++attempts === 1) throw new Error('busy'); }, () => {});
  save.schedule('drawing'); save.flush();
  await setImmediate();
  save.flush();
  assert.equal(attempts, 2);
});
