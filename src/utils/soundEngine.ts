// Web Audio API & Multi-Engine Speech Synthesis for Toddlers (Ages 3~4)
// High-fidelity sound effects, nursery rhyme procedural BGM, and warm kindergarten teacher voices.

import { playGeminiSpeech, stopGeminiAudio, isGeminiTTSEnabled, getCachedGeminiVoiceAvailability } from '../services/geminiTTS';

let masterSoundEnabled = true;
let speechEnabled = true;

export function setAudioPreferences(sound: boolean, speech = true) {
  masterSoundEnabled = sound;
  speechEnabled = speech;
  if (!sound || !speech) stopAllSpeech();
  if (!sound) { stopBGM(); void audioCtx?.suspend(); }
}

let audioCtx: AudioContext | null = null;
let bgmOscillatorInterval: number | null = null;
let isBgmPlaying = false;
let bgmVolumeNode: GainNode | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// BGM Procedural Sweet Nursery Melody (Lullaby / Kindergarten Theme)
const BGM_MELODY = [
  { note: 523.25, dur: 0.5 }, { note: 587.33, dur: 0.5 }, { note: 659.25, dur: 0.5 }, { note: 698.46, dur: 0.5 },
  { note: 783.99, dur: 1.0 }, { note: 783.99, dur: 1.0 },
  { note: 880.00, dur: 0.5 }, { note: 880.00, dur: 0.5 }, { note: 880.00, dur: 0.5 }, { note: 880.00, dur: 0.5 },
  { note: 783.99, dur: 2.0 },
  { note: 698.46, dur: 0.5 }, { note: 698.46, dur: 0.5 }, { note: 659.25, dur: 0.5 }, { note: 659.25, dur: 0.5 },
  { note: 587.33, dur: 0.5 }, { note: 587.33, dur: 0.5 }, { note: 523.25, dur: 2.0 },
];

let noteIndex = 0;

export function startBGM(volume = 0.15) {
  if (isBgmPlaying || !masterSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    isBgmPlaying = true;
    bgmVolumeNode = ctx.createGain();
    bgmVolumeNode.gain.setValueAtTime(Math.min(0.3, volume), ctx.currentTime);
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
    console.warn('BGM initialization deferred to user interaction', e);
  }
}

export function stopBGM() {
  isBgmPlaying = false;
  bgmVolumeNode?.disconnect();
  bgmVolumeNode = null;
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

// ========================================================
// High-Fidelity Synthesized Sound Effects (Zero Latency)
// ========================================================

/**
 * 뿅 / 젤리 터치 소리 (통통 튀는 탄성 스프링 사운드)
 */
export function playJellyTap(enabled = true) {
  if (!enabled || !masterSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.07);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  } catch (e) {
    console.warn(e);
  }
}

/**
 * 통통 튀는 스프링 리액션 사운드
 */
export function playBouncyBoing(enabled = true) {
  if (!enabled || !masterSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(540, now + 0.08);
    osc.frequency.linearRampToValueAtTime(380, now + 0.16);
    osc.frequency.linearRampToValueAtTime(480, now + 0.22);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.24);
  } catch (e) {
    console.warn(e);
  }
}

/**
 * 풍선 팡! 터뜨리기 효과음 (타격감 있는 노이즈 버스트 + 서브 킥)
 */
export function playBalloonPop(enabled = true) {
  if (!enabled || !masterSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // 1. Noise burst for high frequency "snap"
    const bufferSize = ctx.sampleRate * 0.06;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.012));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // 2. Body thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.09);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  } catch (e) {
    console.warn(e);
  }
}

export function playBubblePop(enabled = true) {
  playBalloonPop(enabled);
}

/**
 * 맑은 실로폰 딩-동-댕 화음 (C5 -> E5 -> G5)
 */
export function playDingDongDang(enabled = true) {
  if (!enabled || !masterSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    const chords = [
      { freq: 523.25, time: 0.0 },  // 딩 (C5)
      { freq: 659.25, time: 0.12 }, // 동 (E5)
      { freq: 783.99, time: 0.24 }, // 댕 (G5)
    ];

    chords.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const now = ctx.currentTime + time;
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    });
  } catch (e) {
    console.warn(e);
  }
}

/**
 * 반짝반짝 별가루 / 보석 차임 효과음
 */
export function playSparkleChime(enabled = true) {
  if (!enabled || !masterSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    const pitches = [1046.50, 1318.51, 1567.98, 2093.00, 2637.02]; // C6, E6, G6, C7, E7
    pitches.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const now = ctx.currentTime + idx * 0.05;
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    });
  } catch (e) {
    console.warn(e);
  }
}

/**
 * 축하 팡파르 (경쾌하고 웅장한 트럼펫 화음)
 */
export function playCelebrationFanfare(enabled = true) {
  if (!enabled || !masterSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    const melody = [
      { f: 523.25, t: 0.00, d: 0.12 }, // C5
      { f: 659.25, t: 0.10, d: 0.12 }, // E5
      { f: 783.99, t: 0.20, d: 0.12 }, // G5
      { f: 1046.50, t: 0.30, d: 0.45 }, // C6
      { f: 1318.51, t: 0.45, d: 0.50 }, // E6
    ];

    melody.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;

      const now = ctx.currentTime + t;
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + d);
    });
  } catch (e) {
    console.warn(e);
  }
}

export function playCorrectFanfare(enabled = true) {
  playDingDongDang(enabled);
}

export function playWelcomeFanfare(enabled = true) {
  playCelebrationFanfare(enabled);
}

export function playStarGain(enabled = true) {
  playSparkleChime(enabled);
}

/**
 * 띠로리~ 귀여운 오답 피드백 (부드러운 통통 boing)
 */
export function playWrongBoing(enabled = true) {
  if (!enabled || !masterSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  } catch (e) {
    console.warn(e);
  }
}

/**
 * 실감나는 동물 울음소리 신시사이저 (Level 1 동물 짝 맞추기 지원)
 */
export function playAnimalSound(animal: string, enabled = true) {
  if (!enabled || !masterSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const a = animal.toLowerCase();

    if (a.includes('dog') || a.includes('개') || a.includes('강아지') || a.includes('nurungji')) {
      // 멍멍! (2번의 스타카토 바운스)
      [0, 0.16].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now + offset);
        osc.frequency.exponentialRampToValueAtTime(620, now + offset + 0.05);
        osc.frequency.exponentialRampToValueAtTime(280, now + offset + 0.12);
        gain.gain.setValueAtTime(0.3, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.12);
      });
    } else if (a.includes('cat') || a.includes('고양이')) {
      // 야옹~ (미야옹 글라이드)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.linearRampToValueAtTime(920, now + 0.22);
      osc.frequency.exponentialRampToValueAtTime(460, now + 0.48);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.48);
    } else if (a.includes('duck') || a.includes('오리')) {
      // 꽥꽥!
      [0, 0.18].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(420, now + offset);
        osc.frequency.linearRampToValueAtTime(310, now + offset + 0.12);
        gain.gain.setValueAtTime(0.18, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.12);
      });
    } else if (a.includes('cow') || a.includes('소') || a.includes('음메') || a.includes('eumme')) {
      // 음~메~
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(240, now + 0.25);
      osc.frequency.linearRampToValueAtTime(170, now + 0.6);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (a.includes('pig') || a.includes('돼지') || a.includes('꿀꿀') || a.includes('ggulgguli')) {
      // 꿀꿀!
      [0, 0.16].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(190, now + offset);
        osc.frequency.linearRampToValueAtTime(140, now + offset + 0.12);
        gain.gain.setValueAtTime(0.15, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.12);
      });
    } else if (a.includes('lion') || a.includes('사자') || a.includes('호랑이')) {
      // 어흥!
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.45);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (a.includes('frog') || a.includes('개구리')) {
      // 개굴개굴!
      [0, 0.14].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now + offset);
        osc.frequency.exponentialRampToValueAtTime(420, now + offset + 0.08);
        gain.gain.setValueAtTime(0.22, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.1);
      });
    } else {
      // 기본 귀여운 동물 차임
      playJellyTap(enabled);
    }
  } catch (e) {
    console.warn(e);
  }
}

export function playCharacterVoiceSFX(characterId: string, enabled = true) {
  playAnimalSound(characterId, enabled);
}

// ========================================================
// Kindergarten Teacher Voice & Speech Engine (TTS)
// ========================================================

let selectedVoice: SpeechSynthesisVoice | null = null;
let activeBrowserUtterance: SpeechSynthesisUtterance | null = null;
let browserSpeechStartTimer: number | null = null;
let currentVoiceToneMode: 'cheerful' | 'gentle' | 'energetic' = 'cheerful';
let speechRequestId = 0;

function clearBrowserSpeechStartTimer() {
  if (browserSpeechStartTimer === null) return;
  window.clearTimeout(browserSpeechStartTimer);
  browserSpeechStartTimer = null;
}

export function setVoiceToneMode(mode: 'cheerful' | 'gentle' | 'energetic') {
  currentVoiceToneMode = mode;
}

// Character-specific natural voice profiles (Pitch, Rate, Prefix SFX)
const CHARACTER_VOICE_PROFILES: Record<string, { pitch: number; rate: number; prefixSFX: string }> = {
  ggomi: { pitch: 1.05, rate: 0.90, prefixSFX: 'ggomi' },     // 따뜻하고 포근한 꼬미 곰
  rano: { pitch: 1.08, rate: 0.93, prefixSFX: 'rano' },       // 에너지 넘치고 씩씩한 라노
  jelly: { pitch: 1.12, rate: 0.92, prefixSFX: 'jelly' },     // 깜찍하고 통통 튀는 젤리
  dochi: { pitch: 1.06, rate: 0.88, prefixSFX: 'dochi' },     // 호기심 많은 귀여운 도치
  ggulgguli: { pitch: 1.05, rate: 0.90, prefixSFX: 'ggulgguli' }, // 유쾌하고 신난 꿀꿀이
  eumme: { pitch: 1.04, rate: 0.86, prefixSFX: 'eumme' },     // 부드럽고 상냥한 음메
  nurungji: { pitch: 1.06, rate: 0.92, prefixSFX: 'nurungji' }, // 신나고 기분 좋은 누룽지
};

/**
 * Filter and select the best Korean voice.
 * Prioritizes high-definition Natural/Neural voices (Microsoft Natural SunHi, Apple Yuna/Siri, Samsung Natural)
 * and avoids robotic legacy Google TTS voices.
 */
function findBestKoreanVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const koVoices = voices.filter(
    (v) => v.lang.includes('ko') || v.lang.includes('KO') || v.lang.toLowerCase().includes('korean')
  );

  if (koVoices.length === 0) return null;

  // 1. Edge / Windows Microsoft Natural Neural Voices (SunHi, InJoon - highest quality human speech)
  const msNatural = koVoices.find(
    (v) =>
      v.name.toLowerCase().includes('natural') ||
      v.name.toLowerCase().includes('neural') ||
      v.name.includes('SunHi') ||
      v.name.includes('선희')
  );
  if (msNatural) return msNatural;

  // 2. Apple Siri / Premium / Enhanced Voices (macOS / iOS Yuna Premium)
  const appleNatural = koVoices.find(
    (v) =>
      v.name.toLowerCase().includes('premium') ||
      v.name.toLowerCase().includes('enhanced') ||
      v.name.toLowerCase().includes('siri') ||
      v.name.includes('Yuna') ||
      v.name.includes('유나')
  );
  if (appleNatural) return appleNatural;

  // 3. Samsung or other Korean female/gentle high-quality voices
  const otherHighQuality = koVoices.find(
    (v) =>
      v.name.includes('Heami') ||
      v.name.includes('혜미') ||
      v.name.includes('Hyeryun') ||
      v.name.includes('kof')
  );
  if (otherHighQuality) return otherHighQuality;

  // 4. Any voice that is NOT the older robotic Google legacy voice
  const nonRoboticGoogle = koVoices.find(
    (v) => !v.name.includes('Google') && !v.name.includes('구글')
  );
  if (nonRoboticGoogle) return nonRoboticGoogle;

  // 5. Fallback to first available Korean voice
  return koVoices[0];
}

/**
 * Checks whether the voice is known to be a robotic legacy synthesizer
 */
function isRoboticVoice(voice: SpeechSynthesisVoice | null): boolean {
  if (!voice) return true;
  const name = voice.name.toLowerCase();
  // Legacy desktop/Android Chrome Google Korean synthesizer sounds metallic when pitch shifted
  if ((name.includes('google') || name.includes('구글')) && !name.includes('natural') && !name.includes('neural')) {
    return true;
  }
  return false;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    selectedVoice = findBestKoreanVoice();
  };
  selectedVoice = findBestKoreanVoice();
}

/**
 * Format Korean speech to sound warm, friendly and melodic like a kindergarten teacher.
 * Adds conversational pauses and cheerful exclamations for natural human pacing.
 */
export function formatKindergartenTeacherText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[#*`_~]/g, '')
    .replace(/!+/g, '! ')
    .replace(/\?+/g, '? ')
    .replace(/\.{2,}/g, '... ')
    .replace(/정답이에요/g, '정답이에요, 정말 최고야!')
    .replace(/참 잘했어요/g, '참 잘했어요, 멋져요!')
    .replace(/정말 잘했어/g, '정말 잘했어, 최고야!')
    .replace(/맞았어요/g, '맞았어요, 딩동댕!')
    .trim();
}

export interface SpeakOptions {
  characterId?: string;
  pitch?: number;
  rate?: number;
  playIntroSFX?: boolean;
  onStart?: (provider: 'ai' | 'browser') => void;
  onEnd?: () => void;
  onError?: () => void;
}

/**
 * Fallback browser SpeechSynthesis speaker optimized for toddlers.
 * Intelligently adjusts pitch and rate: prevents robotic chipmunk artifacts on legacy voices.
 */
function speakWithBrowserTTS(text: string, enabled = true, options: SpeakOptions = {}) {
  if (!enabled || !masterSoundEnabled) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    options.onError?.();
    return;
  }

  try {
    const formatted = formatKindergartenTeacherText(text);
    if (!formatted) return;

    const utterance = new SpeechSynthesisUtterance(formatted);
    activeBrowserUtterance = utterance;

    if (!selectedVoice) {
      selectedVoice = findBestKoreanVoice();
    }
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = 'ko-KR';
    }

    const isRobotic = isRoboticVoice(selectedVoice);

    // If it's a robotic voice, DO NOT boost pitch! Boosting pitch on robotic synthesizers
    // creates metallic harsh artifacts. Keep pitch 1.0 and pace at 0.92 for warm clarity.
    let basePitch = isRobotic ? 1.0 : 1.06;
    let baseRate = 0.92;

    if (options.characterId && CHARACTER_VOICE_PROFILES[options.characterId]) {
      const charProfile = CHARACTER_VOICE_PROFILES[options.characterId];
      basePitch = isRobotic ? 1.0 : charProfile.pitch;
      baseRate = charProfile.rate;
    }

    utterance.pitch = options.pitch ?? basePitch;
    utterance.rate = options.rate ?? baseRate;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      if (activeBrowserUtterance !== utterance) return;
      clearBrowserSpeechStartTimer();
      options.onStart?.('browser');
    };
    utterance.onend = () => {
      if (activeBrowserUtterance !== utterance) return;
      clearBrowserSpeechStartTimer();
      activeBrowserUtterance = null;
      options.onEnd?.();
    };
    utterance.onerror = (event) => {
      if (activeBrowserUtterance !== utterance) return;
      clearBrowserSpeechStartTimer();
      activeBrowserUtterance = null;
      if (event.error === 'canceled' || event.error === 'interrupted') return;
      console.warn('Browser speech synthesis failed:', event.error);
      options.onError?.();
    };

    browserSpeechStartTimer = window.setTimeout(() => {
      if (activeBrowserUtterance !== utterance) return;
      activeBrowserUtterance = null;
      window.speechSynthesis.cancel();
      options.onError?.();
    }, 8000);
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    clearBrowserSpeechStartTimer();
    activeBrowserUtterance = null;
    console.warn('Speech synthesis error:', e);
    options.onError?.();
  }
}

/**
 * Master voice speaker:
 * Gemini character audio when configured, with browser speech as the fallback.
 */
export function speakText(text: string, enabled = true, options: SpeakOptions = {}) {
  if (!enabled || !masterSoundEnabled || !speechEnabled) return;

  stopAllSpeech();
  const requestId = speechRequestId;

  const clean = text.trim();
  if (!clean) return;

  if (isGeminiTTSEnabled() && getCachedGeminiVoiceAvailability() !== false) {
    try {
      const ctx = getAudioContext();
      playGeminiSpeech(clean, {
        characterId: options.characterId,
        audioCtx: ctx,
        onStart: () => options.onStart?.('ai'),
        onEnd: options.onEnd,
      }).then((ok) => {
        if (!ok && requestId === speechRequestId) speakWithBrowserTTS(clean, enabled, options);
      }).catch(() => {
        if (requestId === speechRequestId) speakWithBrowserTTS(clean, enabled, options);
      });
    } catch (error) {
      console.warn('Gemini audio unavailable:', error);
      if (requestId === speechRequestId) speakWithBrowserTTS(clean, enabled, options);
    }
    return;
  }

  speakWithBrowserTTS(clean, enabled, options);
}

/**
 * Halts all voice speech across all engines immediately
 */
export function stopAllSpeech() {
  speechRequestId += 1;
  if (typeof window !== 'undefined') clearBrowserSpeechStartTimer();
  activeBrowserUtterance = null;
  stopGeminiAudio();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

export function speakCharacterText(characterId: string, text: string, enabled = true) {
  speakText(text, enabled, { characterId, playIntroSFX: true });
}
