/** Only called by the parent control in a direct user gesture. No recording is kept. */
export async function requestBlowPermission(): Promise<boolean> {
  if (!navigator.mediaDevices?.getUserMedia) return false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch { return false; }
}

/** Cancelling invalidates even an unresolved OS permission request. */
export function createMediaRequestGuard() {
  let generation = 0;
  let pending = false;
  let active: MediaStream | null = null;
  return {
    async acquire(request: () => Promise<MediaStream>) {
      if (pending || active) return null;
      pending = true;
      const version = generation;
      try {
        const stream = await request();
        if (version !== generation) { stream.getTracks().forEach(track => track.stop()); return null; }
        active = stream;
        return stream;
      } finally { if (version === generation) pending = false; }
    },
    stop() {
      generation++; pending = false;
      active?.getTracks().forEach(track => track.stop()); active = null;
    },
  };
}
