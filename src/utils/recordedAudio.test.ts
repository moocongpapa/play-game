import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecordedAudioPlayer } from './recordedAudio';

class AudioStub {
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  volume = 1;
  paused = false;
  removed = false;
  rejectPlay?: (error: Error) => void;
  play() { return new Promise<void>((_, reject) => { this.rejectPlay = reject; }); }
  pause() { this.paused = true; }
  removeAttribute() { this.removed = true; }
  load() {}
}

test('replay and navigation cancel clips even while play() is still pending', async () => {
  const clips: AudioStub[] = [];
  const player = createRecordedAudioPlayer(() => {
    const audio = new AudioStub(); clips.push(audio);
    return audio as unknown as HTMLAudioElement;
  });
  const first = player.play('dog.mp3');
  const second = player.play('cat.mp3');
  assert.equal(await first, 'cancelled');
  assert.ok(clips[0].paused && clips[0].removed);
  clips[0].rejectPlay?.(new Error('late cancellation'));
  player.stop();
  assert.equal(await second, 'cancelled');
  assert.ok(clips[1].paused);
});

test('end, missing asset and autoplay rejection settle correctly and release their audio', async () => {
  for (const event of ['end', 'error', 'rejected'] as const) {
    const audio = new AudioStub();
    const player = createRecordedAudioPlayer(() => audio as unknown as HTMLAudioElement);
    const result = player.play('animal.mp3');
    if (event === 'end') audio.onended?.();
    else if (event === 'error') audio.onerror?.();
    else audio.rejectPlay?.(new Error('autoplay blocked'));
    assert.equal(await result, event === 'end' ? 'ended' : 'unavailable');
    assert.ok(audio.paused && audio.removed);
    assert.equal(audio.onended, null);
  }
});
