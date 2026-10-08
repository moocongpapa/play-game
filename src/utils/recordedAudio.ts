export type PlaybackResult = 'ended' | 'unavailable' | 'cancelled';

/** One foreground clip at a time. Cancelling also settles pending load/play promises. */
export function createRecordedAudioPlayer(createAudio: (src: string) => HTMLAudioElement) {
  let cancelActive: (() => void) | undefined;
  return {
    stop() { cancelActive?.(); },
    play(src: string): Promise<PlaybackResult> {
      cancelActive?.();
      return new Promise(resolve => {
        let audio: HTMLAudioElement;
        try { audio = createAudio(src); } catch { resolve('unavailable'); return; }
        let settled = false;
        const finish = (result: PlaybackResult) => {
          if (settled) return;
          settled = true;
          clearTimeout(watchdog);
          audio.onended = null;
          audio.onerror = null;
          audio.pause();
          audio.removeAttribute('src');
          audio.load();
          if (cancelActive === cancel) cancelActive = undefined;
          resolve(result);
        };
        const cancel = () => finish('cancelled');
        const watchdog = setTimeout(() => finish('unavailable'), 10000);
        cancelActive = cancel;
        audio.volume = .85;
        audio.onended = () => finish('ended');
        audio.onerror = () => finish('unavailable');
        try { void audio.play().catch(() => finish('unavailable')); }
        catch { finish('unavailable'); }
      });
    },
  };
}
