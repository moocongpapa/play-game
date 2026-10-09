import { GENERATED_MUSIC, generatedMusicUrl } from '../data/generatedMusic';
import { createRoundDeck } from '../utils/roundDeck';
import { isPageHidden } from '../utils/pageVisibility';

const nextTrack = createRoundDeck();
const buffers = new Map<string, AudioBuffer>();
let generation = 0;
let controller: AbortController | null = null;
let active: AudioBufferSourceNode | null = null;
let activeGain: GainNode | null = null;

export function stopGeneratedMusic() {
  generation++;
  controller?.abort(); controller = null;
  if (active) {
    const source = active; active = null;
    source.onended = null;
    try { source.stop(); } catch { /* Finished. */ }
    source.disconnect();
  }
  activeGain?.disconnect(); activeGain = null;
}

/** Static originals: no music generation request is ever made by the child UI. */
export function startGeneratedMusic(ctx: AudioContext, destination: AudioNode, scene: 'play' | 'sleep', onReady: () => void, onUnavailable: () => void) {
  stopGeneratedMusic();
  if (typeof document === 'undefined') return;
  const version = generation;
  const current = () => version === generation && !isPageHidden();
  controller = new AbortController();
  const signal = controller.signal;
  const choices = GENERATED_MUSIC.filter(track => track.scene === scene);
  const load = async (id: string) => {
    if (buffers.has(id)) return buffers.get(id)!;
    const response = await fetch(generatedMusicUrl(id), { signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]) });
    if (!response.ok) throw new Error('Music file unavailable');
    const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
    if (buffers.size >= 2) buffers.delete(buffers.keys().next().value!);
    buffers.set(id, buffer);
    return buffer;
  };
  const play = async (track = nextTrack(choices, scene)) => {
    try {
      const buffer = await load(track.id);
      if (!current() || ctx.state !== 'running') return;
      const source = ctx.createBufferSource(), gain = ctx.createGain();
      source.buffer = buffer;
      const now = ctx.currentTime, length = buffer.duration;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(.65, now + Math.min(.4, length / 4));
      gain.gain.setValueAtTime(.65, now + Math.max(.4, length - .7));
      gain.gain.linearRampToValueAtTime(0, now + length);
      source.connect(gain); gain.connect(destination); active = source; activeGain = gain;
      const following = nextTrack(choices, scene);
      source.onended = () => {
        source.disconnect(); gain.disconnect();
        if (active !== source || !current()) return;
        active = null; activeGain = null; void play(following);
      };
      onReady(); source.start();
      void load(following.id).catch(() => { /* Retry once at the actual boundary. */ });
    } catch { if (current()) onUnavailable(); }
  };
  void play();
}
