// Google Gemini 2.0 AI Audio Speech (TTS) Service

// Memory AudioBuffer Cache (text + voice -> AudioBuffer)
const audioBufferCache = new Map<string, AudioBuffer>();

// Character Voice Mappings for Gemini 2.0
export const GEMINI_CHARACTER_VOICES: Record<string, { voiceName: string; toneDescription: string }> = {
  ggomi: { voiceName: 'Aoede', toneDescription: '다정하고 포근한 따뜻한 여성 목소리' }, // 꼬미 (곰)
  rano: { voiceName: 'Puck', toneDescription: '씩씩하고 쾌활한 남자아이 목소리' },       // 라노 (공룡)
  jelly: { voiceName: 'Kore', toneDescription: '밝고 깜찍한 여성 목소리' },            // 젤리 (토끼)
  dochi: { voiceName: 'Fenrir', toneDescription: '차분하고 호기심 많은 소년 목소리' },   // 도치 (고슴도치)
  ggulgguli: { voiceName: 'Puck', toneDescription: '신나고 유쾌한 목소리' },            // 꿀꿀이 (돼지)
  eumme: { voiceName: 'Aoede', toneDescription: '부드럽고 상냥한 목소리' },             // 음메 (양)
  nurungji: { voiceName: 'Puck', toneDescription: '명랑하고 활기찬 강아지 친구' },       // 누룽지 (강아지)
};

/**
 * Get active Gemini API Key from LocalStorage or Environment Variables
 */
export function getGeminiApiKey(): string {
  const localKey = localStorage.getItem('ITSME_GEMINI_API_KEY');
  if (localKey && localKey.trim()) return localKey.trim();

  const envKey = (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '') as string;
  return envKey.trim();
}

/**
 * Save Gemini API Key to LocalStorage
 */
export function setGeminiApiKey(apiKey: string) {
  if (!apiKey || !apiKey.trim()) {
    localStorage.removeItem('ITSME_GEMINI_API_KEY');
  } else {
    localStorage.setItem('ITSME_GEMINI_API_KEY', apiKey.trim());
  }
}

/**
 * Check if Gemini TTS is enabled (can be toggled by parent)
 */
export function isGeminiTTSEnabled(): boolean {
  const pref = localStorage.getItem('ITSME_GEMINI_TTS_ENABLED');
  // Default is true if API key is present
  if (pref === null) return !!getGeminiApiKey();
  return pref === 'true';
}

export function setGeminiTTSEnabled(enabled: boolean) {
  localStorage.setItem('ITSME_GEMINI_TTS_ENABLED', String(enabled));
}

let activeSourceNode: AudioBufferSourceNode | null = null;

export function stopGeminiAudio() {
  if (activeSourceNode) {
    try {
      activeSourceNode.stop();
      activeSourceNode.disconnect();
    } catch {
      // ignore
    }
    activeSourceNode = null;
  }
}

/**
 * Convert Base64 PCM/WAV to Web Audio API AudioBuffer
 */
async function decodeAudioData(dataBase64: string, mimeType: string, audioCtx: AudioContext): Promise<AudioBuffer> {
  const binaryString = atob(dataBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Handle Raw PCM (Gemini defaults to 24000Hz 16-bit mono PCM)
  if (mimeType.includes('pcm') || mimeType.includes('raw')) {
    // Determine sample rate
    let sampleRate = 24000;
    const match = mimeType.match(/rate=(\d+)/);
    if (match && match[1]) {
      sampleRate = parseInt(match[1], 10);
    }

    const int16 = new Int16Array(bytes.buffer);
    const audioBuffer = audioCtx.createBuffer(1, int16.length, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < int16.length; i++) {
      channelData[i] = int16[i] / 32768.0;
    }
    return audioBuffer;
  }

  // Handle WAV/MP3 container formats
  return await audioCtx.decodeAudioData(bytes.buffer);
}

/**
 * Generate and play speech using Gemini 2.0 Audio API
 * Returns true if speech was successfully generated and played, false otherwise.
 */
export async function playGeminiSpeech(
  text: string,
  options: {
    characterId?: string;
    audioCtx: AudioContext;
    onStart?: () => void;
    onEnd?: () => void;
  }
): Promise<boolean> {
  const apiKey = getGeminiApiKey();
  if (!apiKey || !isGeminiTTSEnabled()) {
    return false;
  }

  const cleanText = text.trim();
  if (!cleanText) return false;

  const characterId = options.characterId || 'ggomi';
  const voiceConfig = GEMINI_CHARACTER_VOICES[characterId] || GEMINI_CHARACTER_VOICES.ggomi;
  const cacheKey = `${voiceConfig.voiceName}:${cleanText}`;

  try {
    const ctx = options.audioCtx;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    let audioBuffer = audioBufferCache.get(cacheKey);

    // If not in memory cache, fetch from Gemini 2.0 Audio API
    if (!audioBuffer) {
      const prompt = `Read the following Korean text in a warm, cheerful, clear, and friendly voice for a lovely young child. Do not add any greeting or explanation, just speak this exact text: "${cleanText}"`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: voiceConfig.voiceName,
                  },
                },
              },
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Gemini Audio API error response:', errorText);
        return false;
      }

      const json = await response.json();
      const part = json.candidates?.[0]?.content?.parts?.[0];
      const inlineData = part?.inlineData;

      if (!inlineData || !inlineData.data) {
        console.warn('Gemini Audio response missing inline audio data', json);
        return false;
      }

      const mimeType = inlineData.mimeType || 'audio/pcm;rate=24000';
      audioBuffer = await decodeAudioData(inlineData.data, mimeType, ctx);

      // Cache up to 100 recent audio phrases
      if (audioBufferCache.size > 100) {
        const firstKey = audioBufferCache.keys().next().value;
        if (firstKey) audioBufferCache.delete(firstKey);
      }
      audioBufferCache.set(cacheKey, audioBuffer);
    }

    // Stop any previous speech
    stopGeminiAudio();

    // Play the AudioBuffer
    const sourceNode = ctx.createBufferSource();
    sourceNode.buffer = audioBuffer;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(1.0, ctx.currentTime);

    sourceNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    activeSourceNode = sourceNode;

    sourceNode.onended = () => {
      if (activeSourceNode === sourceNode) {
        activeSourceNode = null;
      }
      if (options.onEnd) options.onEnd();
    };

    if (options.onStart) options.onStart();
    sourceNode.start(0);

    return true;
  } catch (error) {
    console.warn('Failed to generate or play Gemini speech:', error);
    return false;
  }
}

/**
 * Clear in-memory audio cache
 */
export function clearGeminiAudioCache() {
  audioBufferCache.clear();
}
