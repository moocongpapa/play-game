import { randomEffectPitch } from './juice';
import { BACKGROUND_MUSIC, SLEEP_MUSIC, type MusicTrack } from '../data/backgroundMusic';
import { ANIMAL_RECORDINGS, resolveAnimalSound } from '../data/animalSounds';
import { createRoundDeck } from './roundDeck';
import { createRecordedAudioPlayer, type PlaybackResult } from './recordedAudio';
// Web Audio API & Multi-Engine Speech Synthesis for Toddlers (Ages 3~4)
// High-fidelity sound effects, nursery rhyme procedural BGM, and warm kindergarten teacher voices.

import { playGeminiSpeech, stopGeminiAudio, isGeminiTTSEnabled, getCachedGeminiVoiceAvailability } from '../services/geminiTTS';

let masterSoundEnabled = true;
let speechEnabled = true;

export function setAudioPreferences(sound: boolean, speech = true) {
  masterSoundEnabled = sound;
  speechEnabled = speech;
  if (!sound || !speech) stopAllSpeech();
  if (!sound) { stopPlaySounds(); stopBGM(); void audioCtx?.suspend(); }
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

const nextMusic = createRoundDeck();
let currentTrack: MusicTrack | null = null;
let bgmScene: 'play' | 'sleep' = 'play';
export function setBGMScene(scene: 'play' | 'sleep') {
  if (scene === bgmScene) return;
  stopBGM(); bgmScene = scene;
}
const nextBgmTrack = () => bgmScene === 'sleep' ? SLEEP_MUSIC : nextMusic(BACKGROUND_MUSIC, 'music');
let noteIndex = 0;
let phraseCount = 0;
let requestedBgmVolume = .15;
const bgmDucks = new Set<string>();
const bgmNotes = new Set<OscillatorNode>();

function applyBgmVolume() {
  if (!bgmVolumeNode || !audioCtx) return;
  const gain = requestedBgmVolume * (bgmScene === 'sleep' ? .55 : 1) * (bgmDucks.size ? .3 : 1);
  bgmVolumeNode.gain.cancelScheduledValues(audioCtx.currentTime);
  bgmVolumeNode.gain.setTargetAtTime(gain, audioCtx.currentTime, bgmDucks.size ? .09 : .32);
}

export function setBGMDucked(reason: 'speech' | 'animal' | 'rhythm' | 'instrument' | 'effect', ducked: boolean) {
  if (ducked) bgmDucks.add(reason); else bgmDucks.delete(reason);
  applyBgmVolume();
}

function musicNote(ctx: AudioContext, midi: number, duration: number, bass = false) {
  if (!bgmVolumeNode || !currentTrack || !midi) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  osc.type = currentTrack.instrument === 'marimba' && !bass ? 'triangle' : 'sine';
  osc.frequency.value = 440 * 2 ** ((midi - 69) / 12);
  const peak = bass ? .09 : .16;
  const attack = currentTrack.instrument === 'flute' ? .09 : .02;
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.linearRampToValueAtTime(peak, now + attack);
  gain.gain.exponentialRampToValueAtTime(.0001, now + Math.max(.15, duration * .94));
  osc.connect(gain);
  gain.connect(bgmVolumeNode);
  bgmNotes.add(osc);
  osc.onended = () => { bgmNotes.delete(osc); osc.disconnect(); gain.disconnect(); };
  osc.start(now);
  osc.stop(now + duration);
  if (!bass && currentTrack.instrument === 'musicbox') {
    musicNote(ctx, midi + 12, duration * .7, true);
  }
}

export function startBGM(volume = requestedBgmVolume) {
  requestedBgmVolume = Math.max(0, Math.min(.3, volume));
  if (isBgmPlaying || !masterSoundEnabled) { applyBgmVolume(); return; }
  try {
    const ctx = getAudioContext();
    isBgmPlaying = true;
    currentTrack = nextBgmTrack();
    noteIndex = 0;
    phraseCount = 0;
    bgmVolumeNode = ctx.createGain();
    bgmVolumeNode.gain.setValueAtTime(0, ctx.currentTime);
    bgmVolumeNode.connect(ctx.destination);
    applyBgmVolume();
    const step = () => {
      if (!isBgmPlaying || !currentTrack) return;
      // Do not queue notes at time zero while autoplay is awaiting the first tap.
      if (ctx.state !== 'running') {
        bgmOscillatorInterval = window.setTimeout(step, 250);
        return;
      }
      const duration = currentTrack.beats[noteIndex] * 60 / currentTrack.bpm;
      musicNote(ctx, currentTrack.notes[noteIndex], duration);
      if (noteIndex % 4 === 0) musicNote(ctx, currentTrack.bass[Math.floor(noteIndex / 4) % currentTrack.bass.length], duration * 1.6, true);
      noteIndex += 1;
      let pause = 0;
      if (noteIndex === currentTrack.notes.length) {
        noteIndex = 0;
        phraseCount += 1;
        if (phraseCount === 2) {
          currentTrack = nextBgmTrack();
          phraseCount = 0;
          pause = .8;
        }
      }
      bgmOscillatorInterval = window.setTimeout(step, (duration + pause) * 1000);
    };
    step();
  } catch {
    stopBGM();
  }
}

export function stopBGM() {
  isBgmPlaying = false;
  if (bgmOscillatorInterval !== null) window.clearTimeout(bgmOscillatorInterval);
  bgmOscillatorInterval = null;
  for (const osc of bgmNotes) { try { osc.stop(); } catch { /* already ended */ } }
  bgmNotes.clear();
  bgmVolumeNode?.disconnect();
  bgmVolumeNode = null;
}

export function setBGMVolume(vol: number) {
  requestedBgmVolume = Math.max(0, Math.min(.3, vol));
  applyBgmVolume();
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
    const pitch = randomEffectPitch();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(320 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(680 * pitch, now + 0.07);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    trackEffect(osc, gain);
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
    const pitch = randomEffectPitch();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220 * pitch, now);
    osc.frequency.linearRampToValueAtTime(540 * pitch, now + 0.08);
    osc.frequency.linearRampToValueAtTime(380 * pitch, now + 0.16);
    osc.frequency.linearRampToValueAtTime(480 * pitch, now + 0.22);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);

    trackEffect(osc, gain);
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
    const pitch = randomEffectPitch();
    const now = ctx.currentTime;
    duckForEffect(220);

    // 1. Noise burst for high frequency "snap"
    if (!popNoise || popNoise.sampleRate !== ctx.sampleRate) {
      const bufferSize = Math.ceil(ctx.sampleRate * .06);
      popNoise = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = popNoise.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * .012));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = popNoise;
    noise.playbackRate.setValueAtTime(pitch, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    trackEffect(noise, noiseGain);
    noise.start(now);

    // 2. Body thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(50 * pitch, now + 0.09);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    trackEffect(osc, gain);
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
    duckForEffect(650);
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

      trackEffect(osc, gain);
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
    duckForEffect(500);
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

      trackEffect(osc, gain);
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
    duckForEffect(1000);
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

      trackEffect(osc, gain);
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
    const pitch = randomEffectPitch();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(260 * pitch, now);
    osc.frequency.exponentialRampToValueAtTime(140 * pitch, now + 0.22);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    trackEffect(osc, gain);
    osc.start(now);
    osc.stop(now + 0.22);
  } catch (e) {
    console.warn(e);
  }
}

const animalPlayer = createRecordedAudioPlayer(src => new Audio(src));
let animalRequest = 0;

export function stopAnimalSound() {
  animalRequest += 1;
  animalPlayer.stop();
  setBGMDucked('animal', false);
}

/** Real field recordings, stored with the app; never imitate animals with oscillators. */
export async function playAnimalSound(animal: string, enabled = true): Promise<PlaybackResult> {
  stopAnimalSound();
  if (!enabled || !masterSoundEnabled) return 'cancelled';
  stopAllSpeech();
  const id = resolveAnimalSound(animal);
  if (!id) return 'unavailable';
  const request = ++animalRequest;
  setBGMDucked('animal', true);
  const result = await animalPlayer.play(ANIMAL_RECORDINGS[id]);
  if (request !== animalRequest) return 'cancelled';
  setBGMDucked('animal', false);
  return result;
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
  pingu: { pitch: 1.09, rate: 0.88, prefixSFX: 'pingu' },    // 맑고 다정하게 말하는 핑구
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
  const originalOptions = options;
  const finish = (callback?: () => void) => {
    if (requestId !== speechRequestId) return;
    setBGMDucked('speech', false);
    callback?.();
  };
  options = { ...originalOptions,
    onEnd: () => finish(originalOptions.onEnd),
    onError: () => finish(originalOptions.onError),
  };

  const clean = text.trim();
  if (!clean) return;
  setBGMDucked('speech', true);

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
  stopAnimalSound();
  setBGMDucked('speech', false);
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

// Short, bounded voices for care play and the freely playable instrument.
const playVoices = new Set<OscillatorNode>();
const effectVoices = new Set<AudioScheduledSourceNode>();
let popNoise: AudioBuffer | null = null;
let effectDuckTimer: number | null = null;
let effectDuckUntil = 0;
function duckForEffect(duration: number) {
  if (effectDuckTimer !== null) window.clearTimeout(effectDuckTimer);
  const now = performance.now();
  effectDuckUntil = Math.max(effectDuckUntil, now + duration);
  setBGMDucked('effect', true);
  effectDuckTimer = window.setTimeout(() => {
    effectDuckTimer = null; effectDuckUntil = 0; setBGMDucked('effect', false);
  }, effectDuckUntil - now);
}
function trackEffect(voice: AudioScheduledSourceNode, gain: GainNode) {
  while (effectVoices.size >= 32) {
    const oldest = effectVoices.values().next().value!;
    effectVoices.delete(oldest);
    try { oldest.stop(); } catch { /* Already ended. */ }
  }
  effectVoices.add(voice);
  voice.onended = () => { effectVoices.delete(voice); voice.disconnect(); gain.disconnect(); };
}
export function stopPlaySounds() {
  if (effectDuckTimer !== null) window.clearTimeout(effectDuckTimer);
  effectDuckTimer = null;
  effectDuckUntil = 0;
  setBGMDucked('effect', false);
  for (const voice of [...effectVoices]) { try { voice.stop(); } catch { /* Already ended. */ } }
  effectVoices.clear();
  for (const voice of [...playVoices]) { try { voice.stop(); } catch { /* Already ended. */ } }
  playVoices.clear();
  setBGMDucked('instrument', false);
}
function playToyTone(frequency: number, duration: number, volume: number, endFrequency = frequency, delay = 0) {
  const ctx = getAudioContext();
  while (playVoices.size >= 32) {
    const oldest = playVoices.values().next().value!;
    playVoices.delete(oldest);
    try { oldest.stop(); } catch { /* Already ended. */ }
  }
  const voice = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime + delay;
  voice.type = 'sine';
  voice.frequency.setValueAtTime(frequency, now);
  voice.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + .008);
  gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
  voice.connect(gain);
  gain.connect(ctx.destination);
  playVoices.add(voice);
  voice.onended = () => { playVoices.delete(voice); voice.disconnect(); gain.disconnect(); };
  voice.start(now);
  voice.stop(now + duration + .02);
}

export function playXylophoneNote(frequency: number, enabled = true, animalIndex = 0) {
  if (!enabled || !masterSoundEnabled) return;
  try {
    // Bell-like partials give each key a distinct, gently decaying wooden-bar timbre.
    playToyTone(frequency, .85, .13);
    playToyTone(frequency * 2.76, .32, .045);
    playToyTone(frequency * 5.4, .14, .012);
    // A quiet toy-animal chirp follows the same pitch; no voice request delays a key.
    const chirps = [0.75, 1.25, 1.5, 0.5, 2, 1.75, 2.5, 1];
    const chirp = chirps[animalIndex] ?? 1;
    playToyTone(frequency * chirp, .13, .018, frequency, .035);
  } catch { /* Visual play remains available without Web Audio. */ }
}

export function playCareSound(kind: 'brush' | 'chew' | 'bubble', enabled = true) {
  if (!enabled || !masterSoundEnabled) return;
  try {
    const pitch = randomEffectPitch();
    if (kind === 'brush') playToyTone(900 * pitch, .12, .045, 1500 * pitch);
    else if (kind === 'chew') {
      playToyTone(210 * pitch, .16, .075, 130 * pitch);
      playToyTone(250 * pitch, .18, .055, 160 * pitch, .18);
    } else {
      const frequency = 920 * pitch;
      duckForEffect(200);
      playToyTone(frequency, .2, .085, frequency * 1.65);
      playToyTone(frequency * 2, .1, .02);
    }
  } catch { /* Visual feedback still works when audio is unavailable. */ }
}

let sleepNoise: AudioBuffer | null = null;
export function playSleepBreath(enabled = true) {
  if (!enabled || !masterSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!sleepNoise || sleepNoise.sampleRate !== ctx.sampleRate) {
      sleepNoise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 1.3), ctx.sampleRate);
      const data = sleepNoise.getChannelData(0); let smooth = 0;
      for (let i = 0; i < data.length; i++) { smooth = smooth * .96 + (Math.random() * 2 - 1) * .04; data[i] = smooth; }
    }
    const source = ctx.createBufferSource(), gain = ctx.createGain(), now = ctx.currentTime;
    source.buffer = sleepNoise; source.playbackRate.value = randomEffectPitch();
    gain.gain.setValueAtTime(.0001, now); gain.gain.linearRampToValueAtTime(.08, now + .5); gain.gain.exponentialRampToValueAtTime(.0001, now + 1.3);
    source.connect(gain); gain.connect(ctx.destination); trackEffect(source, gain); source.start(now);
  } catch { /* Sleeping remains peaceful when audio is unavailable. */ }
}
