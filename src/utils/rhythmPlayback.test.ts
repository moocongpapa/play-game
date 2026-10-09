import assert from 'node:assert/strict';
import test from 'node:test';
import { createRhythmPlayback, type GuideCompletion } from './rhythmPlayback';

function fixture() {
  let visible = true, sequence = 0, finished = 0, cancelled = 0;
  const tasks = new Map<number, () => void>();
  const notes: number[] = [];
  const playback = createRhythmPlayback({
    clock: { setTimeout: run => { tasks.set(++sequence, run); return sequence; }, clearTimeout: id => { tasks.delete(id); } },
    isVisible: () => visible, onNote: note => notes.push(note), onRest: () => {},
    onFinish: () => { finished++; }, onCancel: () => { cancelled++; },
  });
  const drain = () => { while (tasks.size) { const [id, run] = tasks.entries().next().value!; tasks.delete(id); run(); } };
  return { playback, tasks, notes, drain, hide: () => { visible = false; playback.cancel(); }, counts: () => ({ finished, cancelled }) };
}

test('notes wait for the actual voice ending, and repeated replay taps preserve the first guide', () => {
  const f = fixture();
  let voice: GuideCompletion, spoken = 0;
  f.playback.start([440, 660], callbacks => { voice = callbacks; spoken++; });
  f.drain();
  assert.deepEqual(f.notes, []);
  assert.equal(f.playback.start([440, 660], () => { spoken++; }), false);
  assert.equal(spoken, 1);
  voice!.onEnd(); voice!.onEnd();
  f.drain();
  assert.deepEqual(f.notes, [440, 660]);
  assert.equal(f.counts().finished, 1);
});

test('hiding or leaving cancels notes and ignores late voice callbacks', () => {
  const f = fixture();
  let voice: GuideCompletion;
  f.playback.start([440], callbacks => { voice = callbacks; });
  f.hide(); voice!.onEnd(); f.drain();
  assert.deepEqual(f.notes, []);
  assert.equal(f.playback.isPlaying(), false);
  assert.equal(f.counts().finished, 0);
});

test('muted or failed speech still permits visual play, and stopping clears pending notes', () => {
  const f = fixture();
  f.playback.start([440, 660], callbacks => callbacks.onError());
  assert.deepEqual(f.notes, [440]);
  f.playback.cancel(); f.drain();
  assert.deepEqual(f.notes, [440]);
  assert.equal(f.tasks.size, 0);
});
