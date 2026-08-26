// Web Audio API Synthesizer & Speech Helper for Kids App

let audioCtx: AudioContext | null = null;
let bgmOscillatorInterval: number | null = null;
let isBgmPlaying = false;
let bgmVolumeNode: GainNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// BGM Procedural Nursery Melody Player
const BGM_MELODY = [
  // C major sweet nursery rhyme notes (frequency in Hz, duration in beats)
  { note: 523.25, dur: 0.5 }, { note: 587.33, dur: 0.5 }, { note: 659.25, dur: 0.5 }, { note: 698.46, dur: 0.5 },
  { note: 783.99, dur: 1.0 }, { note: 783.99, dur: 1.0 },
  { note: 880.00, dur: 0.5 }, { note: 880.00, dur: 0.5 }, { note: 880.00, dur: 0.5 }, { note: 880.00, dur: 0.5 },
  { note: 783.99, dur: 2.0 },
  { note: 698.46, dur: 0.5 }, { note: 698.46, dur: 0.5 }, { note: 659.25, dur: 0.5 }, { note: 659.25, dur: 0.5 },
  { note: 587.33, dur: 0.5 }, { note: 587.33, dur: 0.5 }, { note: 523.25, dur: 2.0 },
];

let noteIndex = 0;

export function startBGM(volume = 0.15) {
  if (isBgmPlaying) return;
  try {
    const ctx = getAudioContext();
    isBgmPlaying = true;
    bgmVolumeNode = ctx.createGain();
    bgmVolumeNode.gain.setValueAtTime(volume, ctx.currentTime);
    bgmVolumeNode.connect(ctx.destination);

    const step = () => {
      if (!isBgmPlaying || !bgmVolumeNode) return;
      const current = BGM_MELODY[noteIndex];
      noteIndex = (noteIndex + 1) % BGM_MELODY.length;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = current.note;

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + current.dur * 0.4);

      osc.connect(gain);
      gain.connect(bgmVolumeNode);

      osc.start(now);
      osc.stop(now + current.dur * 0.42);

      bgmOscillatorInterval = window.setTimeout(step, current.dur * 450);
    };

    step();
  } catch (e) {
    console.warn('BGM initialization deferred to user touch', e);
  }
}

export function stopBGM() {
  isBgmPlaying = false;
  if (bgmOscillatorInterval) {
    clearTimeout(bgmOscillatorInterval);
    bgmOscillatorInterval = null;
  }
}

export function setBGMVolume(vol: number) {
  if (bgmVolumeNode && audioCtx) {
    bgmVolumeNode.gain.setValueAtTime(Math.max(0, Math.min(0.3, vol)), audioCtx.currentTime);
  }
}

// SFX Generator
export function playJellyTap(enabled = true) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    const now = ctx.currentTime;
    
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  } catch (e) {
    console.warn(e);
  }
}

export function playBubblePop(enabled = true) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    const now = ctx.currentTime;
    
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  } catch (e) {
    console.warn(e);
  }
}

export function playCorrectFanfare(enabled = true) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const now = ctx.currentTime + idx * 0.1;
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    });
  } catch (e) {
    console.warn(e);
  }
}

export function playWelcomeFanfare(enabled = true) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const now = ctx.currentTime + idx * 0.08;
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    });
  } catch (e) {
    console.warn(e);
  }
}

export function playWrongBoing(enabled = true) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    const now = ctx.currentTime;
    
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {
    console.warn(e);
  }
}

export function playStarGain(enabled = true) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    const notes = [659.25, 880, 1174.66, 1318.51];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const now = ctx.currentTime + i * 0.06;
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    });
  } catch (e) {
    console.warn(e);
  }
}

export function playCharacterVoiceSFX(characterId: string, enabled = true) {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    switch (characterId) {
      case 'ggomi': // Bear giggle
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.1);
        osc.frequency.linearRampToValueAtTime(500, now + 0.2);
        break;
      case 'rano': // Dino cute roar
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.25);
        break;
      case 'jelly': // Bunny squeak
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.linearRampToValueAtTime(1100, now + 0.12);
        break;
      case 'dochi': // Hedgehog snuffle
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.linearRampToValueAtTime(500, now + 0.15);
        break;
      case 'ggulgguli': // Pig oink
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(220, now + 0.15);
        break;
      case 'eumme': // Sheep baa
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.linearRampToValueAtTime(380, now + 0.2);
        break;
      case 'nurungji': // Dog woof
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        break;
      default:
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        break;
    }

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  } catch (e) {
    console.warn(e);
  }
}

// ==========================================
// Advanced High-Quality Natural Human-like Speech Engine
// ==========================================

let cachedVoices: SpeechSynthesisVoice[] = [];
let selectedVoice: SpeechSynthesisVoice | null = null;
let currentVoiceToneMode: 'cheerful' | 'gentle' | 'energetic' = 'cheerful';

// Character-specific natural voice profiles (Pitch, Rate, Pitch-bend)
const CHARACTER_VOICE_PROFILES: Record<string, { pitch: number; rate: number; prefixSFX: string }> = {
  ggomi: { pitch: 1.22, rate: 0.94, prefixSFX: 'ggomi' },     // 따뜻하고 포근한 꼬미 곰
  rano: { pitch: 1.15, rate: 1.02, prefixSFX: 'rano' },       // 에너지 넘치고 씩씩한 라노 공룡
  jelly: { pitch: 1.42, rate: 0.96, prefixSFX: 'jelly' },     // 깜찍하고 통통 튀는 젤리 토끼
  dochi: { pitch: 1.28, rate: 0.90, prefixSFX: 'dochi' },     // 호기심 많은 귀여운 도치 고슴도치
  ggulgguli: { pitch: 1.18, rate: 0.92, prefixSFX: 'ggulgguli' }, // 유쾌하고 신난 꿀꿀이 돼지
  eumme: { pitch: 1.35, rate: 0.86, prefixSFX: 'eumme' },     // 부드럽고 상냥한 음메 양
  nurungji: { pitch: 1.28, rate: 1.02, prefixSFX: 'nurungji' }, // 신나고 기분 좋은 누룽지 강아지
};

export function setVoiceToneMode(mode: 'cheerful' | 'gentle' | 'energetic') {
  currentVoiceToneMode = mode;
}

// Find the best, most human-sounding Korean voice available in the browser
function findBestKoreanVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  cachedVoices = voices;

  // Filter Korean voices
  const koVoices = voices.filter(
    (v) => v.lang.includes('ko') || v.lang.includes('KO') || v.lang.toLowerCase().includes('korean')
  );

  if (koVoices.length === 0) return null;

  // Prioritize high-quality human / neural / natural female voices
  // 1. Google 한국어 / Google ko-KR
  const googleVoice = koVoices.find(
    (v) => v.name.includes('Google') || v.name.includes('구글')
  );
  if (googleVoice) return googleVoice;

  // 2. Microsoft Natural / Neural voices
  const naturalVoice = koVoices.find(
    (v) => v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('neural')
  );
  if (naturalVoice) return naturalVoice;

  // 3. Apple/Samsung Natural Voices (Yuna, Heami, SunHi, Hyeryun)
  const premiumVoice = koVoices.find(
    (v) =>
      v.name.includes('Yuna') ||
      v.name.includes('Heami') ||
      v.name.includes('SunHi') ||
      v.name.includes('유나') ||
      v.name.includes('혜련') ||
      v.name.includes('Ko-KR')
  );
  if (premiumVoice) return premiumVoice;

  return koVoices[0];
}

// Initialize voices listener for browsers loading voices asynchronously
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    selectedVoice = findBestKoreanVoice();
  };
  // Initial attempt
  selectedVoice = findBestKoreanVoice();
}

/**
 * Clean string for SpeechSynthesis so that symbols, emojis, and punctuation 
 * (like ~, ,, !, ?, ., quotes, tildes, brackets, emojis) are stripped out completely.
 * Ensures the TTS ONLY reads out Korean syllables, letters, numbers, and words.
 */
export function cleanTextForTTS(text: string): string {
  if (!text) return '';
  return text
    .replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g, ' ') // Strip all non-word non-Korean symbols
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Enhanced expressive text formatter for natural speech cadence and emotional intonation.
 */
function formatExpressiveText(text: string): string {
  if (!text) return '';
  let formatted = text;

  // Enhance phrases with natural Korean words for emotional feel
  formatted = formatted
    .replace(/정답이에요/g, '정답이에요 와아')
    .replace(/참 잘했어요/g, '참 잘했어요 짝짝짝')
    .replace(/찾아보아요/g, '찾아보아요')
    .replace(/모아볼까요/g, '모아볼까요')
    .replace(/어디에 있을까요/g, '어디에 있을까요')
    .replace(/누구일까요/g, '누구일까요');

  return cleanTextForTTS(formatted);
}

import { playGeminiSpeech, stopGeminiAudio, isGeminiTTSEnabled, getGeminiApiKey } from '../services/geminiTTS';

export interface SpeakOptions {
  characterId?: string;
  pitch?: number;
  rate?: number;
  playIntroSFX?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * Fallback browser SpeechSynthesis speaker
 */
function speakWithBrowserTTS(text: string, enabled = true, options: SpeakOptions = {}) {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel(); // Cancel any lingering audio

    const expressiveText = formatExpressiveText(text);
    if (!expressiveText) return;

    const utterance = new SpeechSynthesisUtterance(expressiveText);

    // Get best Korean natural voice
    if (!selectedVoice) {
      selectedVoice = findBestKoreanVoice();
    }
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = 'ko-KR';
    }

    // Determine character prosody
    let basePitch = 1.3;
    let baseRate = 0.95;

    if (options.characterId && CHARACTER_VOICE_PROFILES[options.characterId]) {
      const profile = CHARACTER_VOICE_PROFILES[options.characterId];
      basePitch = profile.pitch;
      baseRate = profile.rate;

      if (options.playIntroSFX !== false) {
        playCharacterVoiceSFX(profile.prefixSFX, enabled);
      }
    }

    // Apply voice tone mode adjustments
    if (currentVoiceToneMode === 'gentle') {
      basePitch -= 0.1;
      baseRate -= 0.08;
    } else if (currentVoiceToneMode === 'energetic') {
      basePitch += 0.1;
      baseRate += 0.08;
    }

    // Allow inline override
    utterance.pitch = options.pitch ?? basePitch;
    utterance.rate = options.rate ?? baseRate;
    utterance.volume = 1.0;

    if (options.onStart) utterance.onstart = () => options.onStart?.();
    if (options.onEnd) utterance.onend = () => options.onEnd?.();

    // Speak with a tiny 100ms offset if intro SFX played so the voice sounds seamless
    if (options.characterId && options.playIntroSFX !== false) {
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 120);
    } else {
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    console.warn('Speech synthesis error:', e);
  }
}

/**
 * Main Speech Function:
 * Prioritizes Gemini 2.0 Human-like Audio AI TTS.
 * Gracefully falls back to browser speech if offline or API key is not configured.
 */
export function speakText(text: string, enabled = true, options: SpeakOptions = {}) {
  if (!enabled) return;

  // Stop any ongoing speech
  stopGeminiAudio();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  const clean = text.trim();
  if (!clean) return;

  // Try Gemini 2.0 AI Audio if enabled & configured
  if (isGeminiTTSEnabled() && getGeminiApiKey()) {
    try {
      const ctx = getAudioContext();
      
      // Optional intro sound effect
      if (options.characterId && options.playIntroSFX !== false && CHARACTER_VOICE_PROFILES[options.characterId]) {
        playCharacterVoiceSFX(CHARACTER_VOICE_PROFILES[options.characterId].prefixSFX, enabled);
      }

      playGeminiSpeech(clean, {
        characterId: options.characterId,
        audioCtx: ctx,
        onStart: options.onStart,
        onEnd: options.onEnd,
      }).then((success) => {
        if (!success) {
          // Gemini failed (e.g. rate limit, network), fallback to browser voice
          speakWithBrowserTTS(clean, enabled, options);
        }
      });
      return;
    } catch (e) {
      console.warn('Gemini TTS attempt failed, falling back to browser voice:', e);
    }
  }

  // Fallback to browser TTS
  speakWithBrowserTTS(clean, enabled, options);
}

/**
 * Speak with a specific character identity
 */
export function speakCharacterText(characterId: string, text: string, enabled = true) {
  speakText(text, enabled, { characterId, playIntroSFX: true });
}


