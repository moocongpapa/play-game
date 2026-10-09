/** iOS can interrupt Web Audio when HTML media takes the audio device. */
export async function resumeAudioContext(context: AudioContext): Promise<boolean> {
  if (context.state === 'running') return true;
  if (context.state === 'closed') return false;
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
