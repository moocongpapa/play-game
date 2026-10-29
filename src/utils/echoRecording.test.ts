import assert from 'node:assert/strict';
import test from 'node:test';
import { createEchoRecording, type EchoRecordingPhase } from './echoRecording';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

function recordingHarness(requestStream: () => Promise<MediaStream>, decode: (blob: Blob) => Promise<string>) {
  const intervals = new Map<number, () => void>();
  const phases: EchoRecordingPhase[] = [];
  const ready: string[] = [];
  const recorders: FakeRecorder[] = [];
  let nextTimer = 0, errors = 0, available = true;
  class FakeRecorder {
    state = 'inactive'; mimeType = 'audio/mp4'; stops = 0;
    ondataavailable: ((event: { data: Blob }) => void) | null = null;
    onstop: (() => void) | null = null;
    onerror: (() => void) | null = null;
    start() { this.state = 'recording'; }
    stop() {
      this.stops++;
      this.state = 'inactive';
      this.ondataavailable?.({ data: new Blob(['spoken'], { type: this.mimeType }) });
      this.onstop?.();
    }
  }
  const recording = createEchoRecording({
    requestStream,
    createRecorder: () => {
      const recorder = new FakeRecorder(); recorders.push(recorder);
      return recorder as unknown as MediaRecorder;
    },
    decode, canContinue: () => available,
    onPhase: phase => phases.push(phase), onProgress() {},
    onReady: buffer => ready.push(buffer), onError: () => errors++,
    setInterval: callback => { intervals.set(++nextTimer, callback); return nextTimer; },
    clearInterval: id => { intervals.delete(id); },
  });
  return { recording, recorders, ready, phases, intervals, get errors() { return errors; }, hide() { available = false; recording.cancel(); } };
}

test('echo rapid taps share one permission request and close discards a late stream', async () => {
  const permission = deferred<MediaStream>();
  let requests = 0, stops = 0;
  const h = recordingHarness(() => { requests++; return permission.promise; }, async () => 'decoded');
  const first = h.recording.start();
  assert.equal(await h.recording.start(), false);
  assert.equal(requests, 1);
  h.recording.cancel();
  assert.equal(await h.recording.start(), false, 'reopening cannot create a second OS permission prompt');
  permission.resolve({ getTracks: () => [{ stop() { stops++; } }] } as unknown as MediaStream);
  assert.equal(await first, false);
  assert.equal(stops, 1);
  assert.equal(h.recorders.length, 0);
  assert.equal(h.intervals.size, 0);
  assert.deepEqual(h.ready, []);
});

test('echo close, parent pause or hiding stops recording hardware and detaches recorder callbacks', async () => {
  for (const cancel of ['close', 'parent', 'hidden']) {
    let stops = 0;
    const h = recordingHarness(async () => ({ getTracks: () => [{ stop() { stops++; } }] }) as unknown as MediaStream, async () => 'decoded');
    assert.equal(await h.recording.start(), true);
    assert.equal(h.intervals.size, 1);
    const recorder = h.recorders[0];
    const lateData = recorder.ondataavailable, lateStop = recorder.onstop;
    if (cancel === 'hidden') h.hide(); else h.recording.cancel();
    lateData?.({ data: new Blob(['too late']) });
    await lateStop?.();
    assert.equal(stops, 1, cancel);
    assert.equal(recorder.stops, 1, cancel);
    assert.equal(recorder.ondataavailable, null);
    assert.equal(recorder.onstop, null);
    assert.equal(h.intervals.size, 0);
    assert.deepEqual(h.ready, []);
    assert.equal(h.recording.phase, 'idle');
  }
});

test('echo cancelled decode cannot autoplay or overwrite a newer recording', async () => {
  const decodes = [deferred<string>(), deferred<string>()];
  let decodeIndex = 0;
  const h = recordingHarness(async () => ({ getTracks: () => [{ stop() {} }] }) as unknown as MediaStream, async blob => {
    assert.equal(blob.type, 'audio/mp4', 'Safari recording MIME is retained');
    return decodes[decodeIndex++].promise;
  });
  await h.recording.start(); h.recording.finish();
  assert.equal(h.recording.phase, 'decoding');
  assert.equal(h.intervals.size, 0);
  h.recording.cancel();
  await h.recording.start(); h.recording.finish();
  decodes[0].resolve('old');
  await new Promise<void>(done => setImmediate(done));
  assert.deepEqual(h.ready, []);
  assert.equal(h.recording.phase, 'decoding');
  decodes[1].resolve('new');
  await new Promise<void>(done => setImmediate(done));
  assert.deepEqual(h.ready, ['new']);
  assert.equal(h.recording.phase, 'idle');
  assert.equal(h.errors, 0);
});

test('echo automatic 2.8 second stop releases every stream and interval before decoding', async () => {
  let stops = 0;
  const h = recordingHarness(async () => ({ getTracks: () => [{ stop() { stops++; } }] }) as unknown as MediaStream, async () => 'voice');
  await h.recording.start();
  for (let i = 0; i < 28; i++) for (const tick of h.intervals.values()) tick();
  await new Promise<void>(done => setImmediate(done));
  assert.equal(stops, 1);
  assert.equal(h.intervals.size, 0);
  assert.deepEqual(h.ready, ['voice']);
  assert.equal(h.recording.phase, 'idle');
});
