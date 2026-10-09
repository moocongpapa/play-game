import { PLAY_EFFECTS, PLAY_EFFECT_REVISION, type PlayEffectId } from '../data/audioExperience';
import { isPageHidden } from '../utils/pageVisibility';
import { readSavedAudio, saveAudio, deleteSavedAudio } from './audioCache';
import { isGeminiTTSEnabled } from './geminiTTS';

const buffers = new Map<PlayEffectId, AudioBuffer>();
const sources = new Set<AudioBufferSourceNode>();
const retryAfter = new Map<PlayEffectId, number>();
let warming: AbortController | null = null;
let generation = 0;
let enabled = true;

export function setGeneratedEffectsEnabled(value: boolean) {
  enabled = value;
  if (!value) stopGeneratedEffects();
}

async function warmEffect(id: PlayEffectId, ctx: AudioContext) {
  if (warming || !enabled || !isGeminiTTSEnabled() || isPageHidden() || Date.now() < (retryAfter.get(id) || 0)) return;
  const controller = new AbortController();
  warming = controller;
  const version = generation;
  const current = () => version === generation && enabled && isGeminiTTSEnabled() && !isPageHidden();
  const timeout = setTimeout(() => controller.abort(), 22000);
  const key = `${PLAY_EFFECT_REVISION}:${id}`;
  try {
    const saved = await readSavedAudio(key);
    if (saved) {
      try {
        const buffer = await ctx.decodeAudioData(saved.bytes);
        if (current()) buffers.set(id, buffer);
        return;
      } catch { void deleteSavedAudio(key); }
    }
    if (!current()) return;
    // Bundled originals are shared by every installation and cost no credits to replay.
    try {
      const asset = await fetch(`/audio/elevenlabs/${PLAY_EFFECT_REVISION}-${id}.mp3`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(4000)]) });
      if (asset.ok) {
        const bytes = await asset.arrayBuffer();
        const buffer = await ctx.decodeAudioData(bytes.slice(0));
        if (current()) {
          buffers.set(id, buffer);
          void saveAudio({ key, bytes, playbackRate: 1, savedAt: Date.now() });
        }
        return;
      }
    } catch { /* A missing or slow bundled clip uses the immediate procedural sound. */ }
    // Every catalog effect is shipped with the app. Delivery failures must never
    // spend credits regenerating it, or retry its download on every finger tap.
    if (current()) retryAfter.set(id, Date.now() + 60_000);
  } catch { /* The immediate procedural effect has already played. */ }
  finally { clearTimeout(timeout); if (warming === controller) warming = null; }
}

/** False means the caller should play its immediate procedural sound. */
export function tryGeneratedEffect(id: PlayEffectId, ctx: AudioContext): boolean {
  if (typeof document === 'undefined' || !enabled || !isGeminiTTSEnabled() || isPageHidden()) return false;
  const buffer = buffers.get(id);
  if (!buffer) { void warmEffect(id, ctx); return false; }
  if (ctx.state !== 'running') return false;
  while (sources.size >= 8) {
    const oldest = sources.values().next().value!;
    sources.delete(oldest);
    try { oldest.stop(); } catch { /* Finished. */ }
  }
  const source = ctx.createBufferSource(), gain = ctx.createGain();
  source.buffer = buffer;
  source.playbackRate.value = .95 + Math.random() * .1;
  gain.gain.value = PLAY_EFFECTS[id].volume;
  source.connect(gain); gain.connect(ctx.destination);
  sources.add(source);
  source.onended = () => { sources.delete(source); source.disconnect(); gain.disconnect(); };
  source.start();
  return true;
}

export function stopGeneratedEffects() {
  generation++;
  warming?.abort(); warming = null;
  for (const source of sources) { try { source.stop(); } catch { /* Finished. */ } }
  sources.clear();
}
