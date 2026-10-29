import { areSoundEffectsEnabled, getAudioContext, getSfxDestination } from './soundEngine';

export type EchoVoiceFilter = 'chipmunk' | 'bear' | 'robot';

/** Recorded voices share the parent's volume/mute bus and release every audio node. */
export function playEchoBuffer(buffer: AudioBuffer, filter: EchoVoiceFilter, onEnded: () => void) {
  if (!areSoundEffectsEnabled()) return null;
  const context = getAudioContext();
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = filter === 'chipmunk' ? 1.62 : filter === 'bear' ? .72 : 1.05;
  let lfo: OscillatorNode | null = null;
  let tremolo: GainNode | null = null;
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    source.onended = null;
    try { source.stop(); } catch { /* Already ended. */ }
    try { lfo?.stop(); } catch { /* Already ended. */ }
    source.disconnect();
    lfo?.disconnect();
    tremolo?.disconnect();
  };
  try {
    if (filter === 'robot') {
      tremolo = context.createGain();
      lfo = context.createOscillator();
      lfo.type = 'square';
      lfo.frequency.value = 45;
      lfo.connect(tremolo.gain);
      source.connect(tremolo);
      tremolo.connect(getSfxDestination(context));
      lfo.start();
    } else source.connect(getSfxDestination(context));
    source.onended = () => { stop(); onEnded(); };
    source.start();
    return { stop };
  } catch (error) {
    stop();
    throw error;
  }
}
