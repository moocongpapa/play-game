// ElevenLabs AI High-Fidelity Voice Synthesis Service for Toddler Game
// Supports voice caching, pre-rendered asset fallbacks, and customizable voice IDs

const elevenLabsAudioCache = new Map<string, HTMLAudioElement>();
let activeElevenLabsAudio: HTMLAudioElement | null = null;

export function getElevenLabsApiKey(): string {
  const localKey = localStorage.getItem('ITSME_ELEVENLABS_API_KEY');
  if (localKey && localKey.trim()) return localKey.trim();

  const envKey = (import.meta.env.VITE_ELEVENLABS_API_KEY || import.meta.env.ELEVENLABS_API_KEY || '') as string;
  return envKey.trim();
}

export function setElevenLabsApiKey(key: string) {
  if (!key || !key.trim()) {
    localStorage.removeItem('ITSME_ELEVENLABS_API_KEY');
  } else {
    localStorage.setItem('ITSME_ELEVENLABS_API_KEY', key.trim());
  }
}

export function getElevenLabsVoiceId(): string {
  const localId = localStorage.getItem('ITSME_ELEVENLABS_VOICE_ID');
  if (localId && localId.trim()) return localId.trim();

  const envId = (import.meta.env.VITE_ELEVENLABS_VOICE_ID || import.meta.env.ELEVENLABS_VOICE_ID || '') as string;
  // Default to a warm, cheerful, gentle kindergarten teacher voice ID (e.g., 21m00Tcm4TlvDq8ikWAM - Rachel, or custom)
  return envId.trim() || '21m00Tcm4TlvDq8ikWAM';
}

export function setElevenLabsVoiceId(voiceId: string) {
  if (!voiceId || !voiceId.trim()) {
    localStorage.removeItem('ITSME_ELEVENLABS_VOICE_ID');
  } else {
    localStorage.setItem('ITSME_ELEVENLABS_VOICE_ID', voiceId.trim());
  }
}

export function isElevenLabsTTSEnabled(): boolean {
  const pref = localStorage.getItem('ITSME_ELEVENLABS_TTS_ENABLED');
  if (pref === null) return !!getElevenLabsApiKey();
  return pref === 'true';
}

export function setElevenLabsTTSEnabled(enabled: boolean) {
  localStorage.setItem('ITSME_ELEVENLABS_TTS_ENABLED', String(enabled));
}

export function stopElevenLabsAudio() {
  if (activeElevenLabsAudio) {
    try {
      activeElevenLabsAudio.pause();
      activeElevenLabsAudio.currentTime = 0;
    } catch {
      // ignore
    }
    activeElevenLabsAudio = null;
  }
}

// Pre-rendered Audio Asset Map for instant offline / zero-latency responses
// Can be populated with pre-rendered URLs or Data URIs for key phrases
const PRE_RENDERED_VOICE_ASSETS: Record<string, string> = {
  // e.g. '정답이에요': '/audio/correct.mp3'
};

export function registerPreRenderedVoiceAsset(phrase: string, audioUrl: string) {
  PRE_RENDERED_VOICE_ASSETS[phrase.trim()] = audioUrl;
}

/**
 * Play speech using ElevenLabs API (or cached/prerendered asset)
 * Returns true if successful, false if fallback is needed.
 */
export async function playElevenLabsSpeech(
  text: string,
  options: {
    voiceId?: string;
    onStart?: () => void;
    onEnd?: () => void;
  } = {}
): Promise<boolean> {
  const clean = text.trim();
  if (!clean) return false;

  // Check pre-rendered audio asset map first
  if (PRE_RENDERED_VOICE_ASSETS[clean]) {
    try {
      stopElevenLabsAudio();
      const audio = new Audio(PRE_RENDERED_VOICE_ASSETS[clean]);
      activeElevenLabsAudio = audio;
      if (options.onStart) audio.onplay = () => options.onStart?.();
      audio.onended = () => {
        if (activeElevenLabsAudio === audio) activeElevenLabsAudio = null;
        options.onEnd?.();
      };
      await audio.play();
      return true;
    } catch (e) {
      console.warn('Pre-rendered asset play failed:', e);
    }
  }

  // Check memory cache
  const voiceId = options.voiceId || getElevenLabsVoiceId();
  const cacheKey = `${voiceId}:${clean}`;
  const cachedAudio = elevenLabsAudioCache.get(cacheKey);

  if (cachedAudio) {
    try {
      stopElevenLabsAudio();
      cachedAudio.currentTime = 0;
      activeElevenLabsAudio = cachedAudio;
      if (options.onStart) cachedAudio.onplay = () => options.onStart?.();
      cachedAudio.onended = () => {
        if (activeElevenLabsAudio === cachedAudio) activeElevenLabsAudio = null;
        options.onEnd?.();
      };
      await cachedAudio.play();
      return true;
    } catch (e) {
      console.warn('Cached ElevenLabs audio play failed:', e);
    }
  }

  const apiKey = getElevenLabsApiKey();
  if (!apiKey || !isElevenLabsTTSEnabled()) {
    return false;
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: clean,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.85,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      console.warn('ElevenLabs API returned error:', response.status);
      return false;
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const audio = new Audio(objectUrl);

    if (elevenLabsAudioCache.size > 50) {
      const first = elevenLabsAudioCache.keys().next().value;
      if (first) elevenLabsAudioCache.delete(first);
    }
    elevenLabsAudioCache.set(cacheKey, audio);

    stopElevenLabsAudio();
    activeElevenLabsAudio = audio;
    if (options.onStart) audio.onplay = () => options.onStart?.();
    audio.onended = () => {
      if (activeElevenLabsAudio === audio) activeElevenLabsAudio = null;
      options.onEnd?.();
    };
    await audio.play();
    return true;
  } catch (err) {
    console.warn('ElevenLabs TTS call failed:', err);
    return false;
  }
}
