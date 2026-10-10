/** Route game audio through the same media category as video on iPadOS/iOS 17+. */
export function configureAudioPlaybackSession() {
  try {
    const session = (globalThis.navigator as Navigator & { audioSession?: { type: string } } | undefined)?.audioSession;
    if (session && session.type !== 'playback') session.type = 'playback';
  } catch { /* Optional API: older browsers keep their normal audio route. */ }
}

/** Touch activation occurs on release in Safari; capture survives child stopPropagation. */
export function listenForAudioGestures(target: Window, unlock: () => void): () => void {
  const events = ['pointerdown', 'pointerup', 'touchend', 'keydown'] as const;
  const options = { capture: true, passive: true };
  for (const event of events) target.addEventListener(event, unlock, options);
  return () => {
    for (const event of events) target.removeEventListener(event, unlock, options);
  };
}

/** iOS can interrupt Web Audio when HTML media takes the audio device. */
export async function resumeAudioContext(context: AudioContext): Promise<boolean> {
  if (context.state === 'closed') return false;
  // A running context can still be inaudible on Safari's default ambient route.
  configureAudioPlaybackSession();
  if (context.state === 'running') return true;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    // Invoke resume synchronously inside the caller's tap, including Safari's
    // `interrupted` state, and never leave speech waiting on a blocked device.
    return await Promise.race([
      context.resume().then(() => context.state === 'running'),
      new Promise<boolean>(resolve => { timeout = setTimeout(() => resolve(false), 3000); }),
    ]);
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
