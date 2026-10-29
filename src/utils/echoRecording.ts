export type EchoRecordingPhase = 'idle' | 'requesting' | 'recording' | 'decoding';

interface EchoRecordingOptions<T> {
  requestStream: () => Promise<MediaStream>;
  createRecorder: (stream: MediaStream) => MediaRecorder;
  decode: (blob: Blob) => Promise<T>;
  canContinue: () => boolean;
  onPhase: (phase: EchoRecordingPhase) => void;
  onProgress: (progress: number) => void;
  onReady: (buffer: T) => void;
  onError: (error: unknown) => void;
  setInterval: (callback: () => void, delay: number) => number;
  clearInterval: (id: number) => void;
}

/** One recording owns its stream, chunks, timer and decode result until cancelled. */
export function createEchoRecording<T>(options: EchoRecordingOptions<T>) {
  interface Session {
    stream: MediaStream | null;
    recorder: MediaRecorder | null;
    interval: number | null;
    chunks: Blob[];
  }
  let current: Session | null = null;
  let requesting = false;
  let phase: EchoRecordingPhase = 'idle';

  const setPhase = (next: EchoRecordingPhase) => {
    phase = next;
    options.onPhase(next);
  };
  const clearTimer = (session: Session) => {
    if (session.interval !== null) options.clearInterval(session.interval);
    session.interval = null;
  };
  const release = (session: Session) => {
    clearTimer(session);
    session.stream?.getTracks().forEach(track => track.stop());
    session.stream = null;
    if (session.recorder) {
      session.recorder.ondataavailable = null;
      session.recorder.onstop = null;
      session.recorder.onerror = null;
      if (session.recorder.state !== 'inactive') {
        try { session.recorder.stop(); } catch { /* Already stopped by the browser. */ }
      }
      session.recorder = null;
    }
    session.chunks = [];
  };
  const valid = (session: Session) => current === session && options.canContinue();
  const cancel = () => {
    const session = current;
    current = null;
    if (session) release(session);
    setPhase('idle');
  };
  const discard = (session: Session) => {
    release(session);
    if (current === session) {
      current = null;
      setPhase('idle');
    }
  };
  const fail = (session: Session, error: unknown) => {
    if (!valid(session)) { discard(session); return; }
    current = null;
    release(session);
    setPhase('idle');
    options.onError(error);
  };
  const finish = () => {
    const session = current;
    if (!session || phase !== 'recording') return;
    clearTimer(session);
    setPhase('decoding');
    try { session.recorder?.stop(); } catch (error) { fail(session, error); }
    // Stop the hardware immediately; the recorder's final data event is queued.
    session.stream?.getTracks().forEach(track => track.stop());
    session.stream = null;
  };

  return {
    get phase() { return phase; },
    async start() {
      // The OS permission promise can outlive closing/reopening the dialog.
      // Keep this lock until it settles, even after cancelling that session.
      if (requesting || current || !options.canContinue()) return false;
      const session: Session = { stream: null, recorder: null, interval: null, chunks: [] };
      current = session;
      requesting = true;
      setPhase('requesting');
      try {
        const stream = await options.requestStream();
        requesting = false;
        session.stream = stream;
        if (!valid(session)) { discard(session); return false; }
        const recorder = options.createRecorder(stream);
        session.recorder = recorder;
        recorder.ondataavailable = event => {
          if (valid(session) && event.data.size > 0) session.chunks.push(event.data);
        };
        recorder.onerror = event => fail(session, event);
        recorder.onstop = async () => {
          if (!valid(session)) { discard(session); return; }
          // Safari may record MP4; preserve the browser's actual MIME type.
          const blob = new Blob(session.chunks, { type: recorder.mimeType || session.chunks[0]?.type });
          release(session);
          setPhase('decoding');
          try {
            const buffer = await options.decode(blob);
            if (!valid(session)) { discard(session); return; }
            current = null;
            setPhase('idle');
            options.onReady(buffer);
          } catch (error) { fail(session, error); }
        };
        recorder.start();
        setPhase('recording');
        let elapsed = 0;
        session.interval = options.setInterval(() => {
          if (!valid(session)) { cancel(); return; }
          elapsed += 100;
          options.onProgress(Math.min(100, elapsed / 28));
          if (elapsed >= 2800) finish();
        }, 100);
        return true;
      } catch (error) {
        requesting = false;
        fail(session, error);
        return false;
      }
    },
    finish,
    cancel,
  };
}
