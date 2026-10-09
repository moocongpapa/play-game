import { normalizeSpeechLanguage, type SpeechLanguage } from '../utils/speechLanguage';
import { isPageHidden } from '../utils/pageVisibility';
import { CHARACTER_VOICE_REVISION, getCharacterVoice } from '../data/characterVoices';
import type { CharacterAudioStatus } from '../data/audioExperience';
import { normalizeSpokenText, speechAssetId } from '../data/speechSynthesis';
import { bundledSpeechId, hasBundledSpeech, loadBundledSpeech } from './bundledSpeech';
import { readSavedAudio, saveAudio, deleteSavedAudio } from './audioCache';
// Provider keys and the SDK stay on the server; the legacy public API is preserved.
const audioBufferCache = new Map<string, { buffer: AudioBuffer; playbackRate: number }>();
let activeSourceNode: AudioBufferSourceNode | null = null;
let activeRequest: AbortController | null = null;
let generation = 0;
let audioStatus: CharacterAudioStatus | null = null;
let availabilityExpires = 0;
let retryAfter = 0;
let availabilityRequest: Promise<CharacterAudioStatus> | null = null;

export function isGeminiTTSEnabled(): boolean {
  try { return localStorage.getItem('ITSME_GEMINI_TTS_ENABLED') !== 'false'; } catch { return true; }
}

export function setGeminiTTSEnabled(enabled: boolean) {
  try { localStorage.setItem('ITSME_GEMINI_TTS_ENABLED', String(enabled)); } catch { /* Optional persistence. */ }
  if (!enabled) stopGeminiAudio();
}

const unavailable: CharacterAudioStatus = { available: false, engine: 'none' };
export async function getCharacterAudioStatus(): Promise<CharacterAudioStatus> {
  if (audioStatus && Date.now() < availabilityExpires) return audioStatus;
  if (!availabilityRequest) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    availabilityRequest = fetch('/api/speech', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) return unavailable;
        audioStatus = await response.json() as CharacterAudioStatus;
        availabilityExpires = Date.now() + 60000;
        return audioStatus;
      })
      .catch(() => unavailable)
      .finally(() => { clearTimeout(timeout); availabilityRequest = null; });
  }
  return availabilityRequest;
}

export async function isGeminiVoiceAvailable(): Promise<boolean> {
  return Date.now() >= retryAfter && (await getCharacterAudioStatus()).available;
}

export function rememberAudioResponse(response: Response) {
  if (response.status === 429 || response.status === 503) {
    const seconds = Number(response.headers.get('Retry-After')) || 60;
    retryAfter = Date.now() + Math.max(1, Math.min(3600, seconds)) * 1000;
    availabilityExpires = 0;
  }
}

export function stopGeminiAudio() {
  generation += 1;
  activeRequest?.abort();
  activeRequest = null;
  if (activeSourceNode) {
    activeSourceNode.onended = null;
    try { activeSourceNode.stop(); } catch { /* already stopped */ }
    activeSourceNode.disconnect();
    activeSourceNode = null;
  }
}

export async function playGeminiSpeech(
  text: string,
  options: {
    characterId?: string;
    language?: SpeechLanguage;
    audioCtx: AudioContext;
    onStart?: () => void;
    onEnd?: () => void;
  },
): Promise<boolean> {
  if (isPageHidden() || !isGeminiTTSEnabled() || !text.trim()) return false;
  const currentGeneration = generation;

  const cleanText = normalizeSpokenText(text);
  const language = normalizeSpeechLanguage(options.language);
  const cacheKey = `${CHARACTER_VOICE_REVISION}:${language}:${options.characterId || 'ggomi'}:${cleanText}`;
  try {
    const ctx = options.audioCtx;
    if (ctx.state === 'suspended') {
      // Autoplay/device restrictions can leave resume() pending indefinitely.
      let resumeTimer: ReturnType<typeof setTimeout> | undefined;
      try {
        const resumed = await Promise.race([
          ctx.resume().then(() => true),
          new Promise<boolean>(resolve => { resumeTimer = setTimeout(() => resolve(false), 3000); }),
        ]);
        if (!resumed) return false;
      } finally { clearTimeout(resumeTimer); }
    }
    if (currentGeneration !== generation || isPageHidden() || !isGeminiTTSEnabled()) return false;
    let clip = audioBufferCache.get(cacheKey);
    if (!clip) {
      const saved = await readSavedAudio(cacheKey);
      if (saved) {
        try { clip = { buffer: await ctx.decodeAudioData(saved.bytes), playbackRate: saved.playbackRate }; }
        catch { void deleteSavedAudio(cacheKey); }
      }
    }
    const assetId = bundledSpeechId(cleanText, options.characterId || 'ggomi', language) ||
      (!clip && globalThis.crypto?.subtle ? await speechAssetId(cleanText, options.characterId || 'ggomi', language) : null);
    const sharedKey = assetId ? `eleven:${assetId}` : cacheKey;
    const characterRate = getCharacterVoice(options.characterId || 'ggomi').fallbackPlaybackRate;
    if (!clip && assetId) {
      const shared = await readSavedAudio(sharedKey);
      if (shared) {
        try { clip = { buffer: await ctx.decodeAudioData(shared.bytes), playbackRate: characterRate }; }
        catch { void deleteSavedAudio(sharedKey); }
      }
    }
    if (!clip && assetId && hasBundledSpeech(assetId)) {
      if (currentGeneration !== generation || isPageHidden() || !isGeminiTTSEnabled()) return false;
      const request = new AbortController();
      activeRequest = request;
      try {
        const bytes = await loadBundledSpeech(assetId, request.signal);
        const buffer = await ctx.decodeAudioData(bytes.slice(0));
        void saveAudio({ key: sharedKey, bytes, playbackRate: 1, savedAt: Date.now() });
        clip = { buffer, playbackRate: characterRate };
      } finally { if (activeRequest === request) activeRequest = null; }
      // Errors propagate to device speech: never regenerate a temporarily missing shipped file.
    }
    if (!clip) {
      if (!(await isGeminiVoiceAvailable()) || currentGeneration !== generation || isPageHidden()) return false;
      const request = new AbortController();
      activeRequest = request;
      const timeout = setTimeout(() => request.abort(), 30000);
      let response: Response;
      let wav: ArrayBuffer;
      try {
        response = await fetch('/api/speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText, characterId: options.characterId || 'ggomi', language }),
          signal: request.signal,
        });
        rememberAudioResponse(response);
        if (!response.ok) throw new Error(`Speech server returned ${response.status}`);
        wav = await response.arrayBuffer();
      } finally {
        clearTimeout(timeout);
        if (activeRequest === request) activeRequest = null;
      }
      const buffer = await ctx.decodeAudioData(wav.slice(0));
      // A small lift gives the light female character voice a younger cartoon resonance.
      // The server requests slower speech, keeping the final pace near normal.
      // Gemini's directed child performance is played unmodified.
      const playbackRate = response.headers.get('X-Speech-Provider') === 'elevenlabs'
        ? characterRate : 1;
      clip = { buffer, playbackRate };
      if (response.headers.get('X-Speech-Provider') === 'elevenlabs') {
        void saveAudio({ key: sharedKey, bytes: wav, playbackRate: assetId ? 1 : playbackRate, savedAt: Date.now() });
      }
    }
    if (!audioBufferCache.has(cacheKey)) {
      if (audioBufferCache.size >= 60) audioBufferCache.delete(audioBufferCache.keys().next().value!);
      audioBufferCache.set(cacheKey, clip);
    }
    if (currentGeneration !== generation || isPageHidden() || !isGeminiTTSEnabled()) return false;

    const sourceNode = ctx.createBufferSource();
    sourceNode.buffer = clip.buffer;
    sourceNode.playbackRate.value = clip.playbackRate;
    sourceNode.connect(ctx.destination);
    activeSourceNode = sourceNode;
    sourceNode.onended = () => {
      if (activeSourceNode !== sourceNode) return;
      activeSourceNode = null;
      sourceNode.disconnect();
      options.onEnd?.();
    };
    sourceNode.start(0);
    options.onStart?.();
    return true;
  } catch (error) {
    if (currentGeneration === generation) console.warn('AI character voice unavailable:', error);
    return false;
  }
}

export function clearGeminiAudioCache() {
  audioBufferCache.clear();
}
