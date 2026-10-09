import { DEFAULT_SPEECH_LANGUAGE, chooseSpeechVoice, localizeSpeech, type SpeechLanguage } from './speechLanguage';
import { getCharacterVoice } from '../data/characterVoices';
import { randomEffectPitch } from './juice';
import { BACKGROUND_MUSIC, SLEEP_MUSIC, type MusicTrack } from '../data/backgroundMusic';
import { ANIMAL_RECORDINGS, resolveAnimalSound } from '../data/animalSounds';
import { createRoundDeck } from './roundDeck';
import { createRecordedAudioPlayer, type PlaybackResult } from './recordedAudio';
import { isPageHidden } from './pageVisibility';
import { resumeAudioContext } from './audioContextLifecycle';
import { startGeneratedMusic, stopGeneratedMusic } from '../services/generatedMusic';
import { tryGeneratedEffect, stopGeneratedEffects, setGeneratedEffectsEnabled } from '../services/generatedEffects';
import { CARE_REACTIONS, type CareReaction } from '../data/careReactions';
import { CARE_VOICE_DURATIONS } from '../data/generatedCareVoiceDurations';
import { speechSynthesisKey } from '../data/speechSynthesis';
// Web Audio API & Multi-Engine Speech Synthesis for Toddlers (Ages 3~4)
// High-fidelity sound effects, nursery rhyme procedural BGM, and warm kindergarten teacher voices.

import { playGeminiSpeech, preloadBundledSpeech, stopGeminiAudio, isGeminiTTSEnabled } from '../services/geminiTTS';

let masterSoundEnabled = true;
let speechEnabled = true;
let speechLanguage: SpeechLanguage = DEFAULT_SPEECH_LANGUAGE;
let spokenChildName = '유하';

export function setSpeechLanguage(language: SpeechLanguage, childName = spokenChildName) {
  spokenChildName = childName;
  if (speechLanguage === language) return;
  stopAllSpeech();
  speechLanguage = language;
  selectedVoice = findBestVoice();
}

export function setAudioPreferences(sound: boolean, speech = true) {
  masterSoundEnabled = sound;
  setGeneratedEffectsEnabled(sound);
  speechEnabled = speech;
  if (!sound || !speech) stopAllSpeech();
  if (!sound) {
    stopPlaySounds(); stopBGM();
    if (audioCtx && audioCtx.state !== 'closed') void audioCtx.suspend().catch(() => {});
  }
}

let audioCtx: AudioContext | null = null;
let bgmOscillatorInterval: number | null = null;
let isBgmPlaying = false;
let bgmVolumeNode: GainNode | null = null;

export function getAudioContext(): AudioContext {
  let restartMusic = false;
  if (audioCtx?.state === 'closed') {
    restartMusic = isBgmPlaying;
    stopBGM();
    stopPlaySounds();
    audioCtx = null;
  }
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (masterSoundEnabled && !isPageHidden()) void resumeAudioContext(audioCtx);
  if (restartMusic) startBGM();
  return audioCtx;
}

/** Call after pausing/releasing the video, while its close tap is still active. */
export function resumeAfterVideoPlayback() {
  stopAllSpeech();
  stopPlaySounds();
  setBGMDucked('video', false);
  if (!masterSoundEnabled || isPageHidden()) return;
  // Recorded music can lose its source/end callback during an iOS media-session
  // interruption. Rebuild only the music session that was already enabled.
  const restartMusic = isBgmPlaying;
  if (restartMusic) stopBGM();
  try {
    getAudioContext();
    if (restartMusic) startBGM();
  } catch { /* Retry on the next play gesture if the device is still unavailable. */ }
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
  const gain = requestedBgmVolume * (bgmScene === 'sleep' ? .55 : 1) * (bgmDucks.has('video') ? 0 : bgmDucks.size ? .3 : 1);
  bgmVolumeNode.gain.cancelScheduledValues(audioCtx.currentTime);
  bgmVolumeNode.gain.setTargetAtTime(gain, audioCtx.currentTime, bgmDucks.size ? .09 : .32);
}

export function setBGMDucked(reason: 'speech' | 'animal' | 'rhythm' | 'instrument' | 'effect' | 'video', ducked: boolean) {
  if (ducked) bgmDucks.add(reason); else bgmDucks.delete(reason);
  applyBgmVolume();
}

function musicNote(ctx: AudioContext, midi: number, duration: number, bass = false, level = 1, pan = 0) {
  if (!bgmVolumeNode || !currentTrack || !midi) return;
  const instrument = currentTrack.instrument;
  // Additive voices: wooden resonances, soft flute harmonics, and little metal
  // tines. Higher partials decay sooner so the melody stays warm, never piercing.
  const partials = bass ? [[1, 1, 1], [2, .12, .65]]
    : instrument === 'marimba' ? [[1, 1, 1], [4, .16, .35], [10, .022, .12]]
    : instrument === 'flute' ? [[1, 1, 1], [2, .17, .85], [3, .055, .65]]
    : [[1, 1, 1], [2.76, .14, .5], [5.4, .025, .2]];
  const fundamental = 440 * 2 ** ((midi - 69) / 12);
  partials.forEach(([ratio, strength, decay], index) => {
    while (bgmNotes.size >= 64) {
      const oldest = bgmNotes.values().next().value!;
      bgmNotes.delete(oldest);
      try { oldest.stop(); } catch { /* Already ended. */ }
    }
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    const panner = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null;
    const now = ctx.currentTime;
    const length = Math.max(.12, duration * decay);
    const attack = !bass && instrument === 'flute' ? Math.min(.07, length * .25) : .009;
    const peak = (bass ? .075 : .13) * strength * level;
    osc.type = 'sine';
    osc.frequency.value = fundamental * ratio;
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + attack);
    gain.gain.exponentialRampToValueAtTime(.0001, now + length);
    osc.connect(gain);
    if (panner) { panner.pan.value = bass ? 0 : pan + (index - 1) * .06; gain.connect(panner); panner.connect(bgmVolumeNode!); }
    else gain.connect(bgmVolumeNode!);
    bgmNotes.add(osc);
    osc.onended = () => { bgmNotes.delete(osc); osc.disconnect(); gain.disconnect(); panner?.disconnect(); };
    osc.start(now); osc.stop(now + length + .025);
  });
}

export function startBGM(volume = requestedBgmVolume) {
  requestedBgmVolume = Math.max(0, Math.min(.3, volume));
  if (!masterSoundEnabled || isPageHidden()) { applyBgmVolume(); return; }
  try {
    const ctx = getAudioContext();
    if (isBgmPlaying) { applyBgmVolume(); return; }
    isBgmPlaying = true;
    currentTrack = nextBgmTrack();
    noteIndex = 0;
    phraseCount = 0;
    bgmVolumeNode = ctx.createGain();
    bgmVolumeNode.gain.setValueAtTime(0, ctx.currentTime);
    bgmVolumeNode.connect(ctx.destination);
    applyBgmVolume();
    let checkedRecordings = false;
    let recordedPlaying = false;
    const step = () => {
      if (!isBgmPlaying || !currentTrack) return;
      // Do not queue notes at time zero while autoplay is awaiting the first tap.
      if (ctx.state !== 'running') {
        bgmOscillatorInterval = window.setTimeout(step, 250);
        return;
      }
      if (!checkedRecordings) {
        checkedRecordings = true;
        startGeneratedMusic(ctx, bgmVolumeNode!, bgmScene, () => {
          if (!isBgmPlaying) return;
          recordedPlaying = true;
          if (bgmOscillatorInterval !== null) window.clearTimeout(bgmOscillatorInterval);
          bgmOscillatorInterval = null;
          for (const note of bgmNotes) { try { note.stop(); } catch { /* Finished. */ } }
          bgmNotes.clear();
        }, () => {
          if (recordedPlaying && isBgmPlaying) { recordedPlaying = false; step(); }
        });
      }
      const duration = currentTrack.beats[noteIndex] * 60 / currentTrack.bpm;
      musicNote(ctx, currentTrack.notes[noteIndex], duration);
      const root = currentTrack.bass[Math.floor(noteIndex / 4) % currentTrack.bass.length];
      if (noteIndex % 4 === 0) {
        musicNote(ctx, root, duration * 1.6, true);
        if (bgmScene !== 'sleep') musicNote(ctx, root + 19, duration * 1.3, false, .18, -.2);
      } else if (noteIndex % 4 === 2 && bgmScene !== 'sleep') {
        musicNote(ctx, root + 24, duration, false, .22, .2);
      }
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
  stopGeneratedMusic();
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
  if (!enabled || !masterSoundEnabled || isPageHidden()) return;
  try {
    const ctx = getAudioContext();
    if (tryGeneratedEffect('tap', ctx)) { return; }
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
  if (!enabled || !masterSoundEnabled || isPageHidden()) return;
  try {
    const ctx = getAudioContext();
    if (tryGeneratedEffect('bounce', ctx)) { return; }
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
  if (!enabled || !masterSoundEnabled || isPageHidden()) return;
  try {
    const ctx = getAudioContext();
    if (tryGeneratedEffect('pop', ctx)) { duckForEffect(550); return; }
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
  if (!enabled || !masterSoundEnabled || isPageHidden()) return;
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
  if (!enabled || !masterSoundEnabled || isPageHidden()) return;
  try {
    const ctx = getAudioContext();
    if (tryGeneratedEffect('sparkle', ctx)) { duckForEffect(1050); return; }
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
  if (!enabled || !masterSoundEnabled || isPageHidden()) return;
  try {
    const ctx = getAudioContext();
    if (tryGeneratedEffect('success', ctx)) { duckForEffect(1600); return; }
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
  if (!enabled || !masterSoundEnabled || isPageHidden()) return;
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
let animalClueActive = false;

export function stopAnimalSound() {
  animalRequest += 1;
  animalClueActive = false;
  animalPlayer.stop();
  setBGMDucked('animal', false);
}

/** Real field recordings, stored with the app; never imitate animals with oscillators. */
export async function playAnimalSound(animal: string, enabled = true): Promise<PlaybackResult> {
  stopAnimalSound();
  if (!enabled || !masterSoundEnabled || isPageHidden()) return 'cancelled';
  stopAllSpeech();
  const id = resolveAnimalSound(animal);
  if (!id) return 'unavailable';
  const request = ++animalRequest;
  animalClueActive = true;
  setBGMDucked('animal', true);
  const result = await animalPlayer.play(ANIMAL_RECORDINGS[id]);
  if (request !== animalRequest) return 'cancelled';
  animalClueActive = false;
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
let pendingBrowserSpeech: (() => void) | null = null;
let currentVoiceToneMode: 'cheerful' | 'gentle' | 'energetic' = 'cheerful';
let speechRequestId = 0;
let activeSpeech: { key: string; provider?: 'ai' | 'browser'; startedAt?: number; onCancel?: () => void } | null = null;

/** Read-only gate for story transitions; includes pending voice downloads. */
export function isSpeechBusy() { return activeSpeech !== null || animalClueActive; }

/** False means busy; the idle hook may try again if the child is still resting. */
export function trySpeakIdleHint(text: string, enabled: boolean, characterId: string): boolean {
  if (!enabled || !masterSoundEnabled || !speechEnabled || isPageHidden()) return true;
  if (activeSpeech || animalClueActive) return false;
  speakText(text, enabled, { characterId, playIntroSFX: false });
  return true;
}

function clearBrowserSpeechStartTimer() {
  if (browserSpeechStartTimer === null) return;
  window.clearTimeout(browserSpeechStartTimer);
  browserSpeechStartTimer = null;
}

export function setVoiceToneMode(mode: 'cheerful' | 'gentle' | 'energetic') {
  currentVoiceToneMode = mode;
}

/** Pick a natural voice in the selected language, never a voice from the other language. */
function findBestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  return chooseSpeechVoice(window.speechSynthesis.getVoices(), speechLanguage);
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
    selectedVoice = findBestVoice();
    if (selectedVoice && pendingBrowserSpeech) {
      const resume = pendingBrowserSpeech;
      pendingBrowserSpeech = null;
      clearBrowserSpeechStartTimer();
      resume();
    }
  };
  selectedVoice = findBestVoice();
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
  onCancel?: () => void;
}

/**
 * Fallback browser SpeechSynthesis speaker optimized for toddlers.
 * Intelligently adjusts pitch and rate: prevents robotic chipmunk artifacts on legacy voices.
 */
function speakWithBrowserTTS(text: string, enabled = true, options: SpeakOptions = {}) {
  if (!enabled || !masterSoundEnabled || !speechEnabled || isPageHidden()) {
    options.onError?.();
    return;
  }
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    options.onError?.();
    return;
  }

  try {
    const formatted = formatKindergartenTeacherText(text);
    if (!formatted) { options.onError?.(); return; }
    selectedVoice ||= findBestVoice();
    // Wait briefly for asynchronously loaded voices; never hand the choice to
    // an arbitrary OS default that could be a deep adult male or another language.
    if (!selectedVoice) {
      if (window.speechSynthesis.getVoices().length === 0) {
        pendingBrowserSpeech = () => speakWithBrowserTTS(text, enabled, options);
        browserSpeechStartTimer = window.setTimeout(() => {
          pendingBrowserSpeech = null;
          browserSpeechStartTimer = null;
          options.onError?.();
        }, 1500);
      } else options.onError?.();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(formatted);
    activeBrowserUtterance = utterance;
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;
    const profile = getCharacterVoice(options.characterId || 'ggomi');
    const childVoice = /\b(Ana|Maisie)(Neural)?\b/i.test(selectedVoice?.name || '');
    const basePitch = childVoice ? 1.0 : isRoboticVoice(selectedVoice) ? 1.10 : profile.browserPitch;
    const baseRate = profile.rate;

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
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        console.warn('Browser speech synthesis failed:', event.error);
      }
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
 * ElevenLabs character audio and saved clips when configured, with browser speech as the fallback.
 */
export function speakText(text: string, enabled = true, options: SpeakOptions = {}) {
  if (isPageHidden()) { options.onCancel?.(); return; }
  if (!enabled || !masterSoundEnabled || !speechEnabled) { options.onError?.(); return; }

  const clean = localizeSpeech(text.trim(), speechLanguage, spokenChildName);
  if (!clean) { options.onError?.(); return; }
  const key = JSON.stringify([
    clean.replace(/\s+/g, ' '), options.characterId || 'ggomi', speechLanguage,
    options.pitch ?? null, options.rate ?? null,
  ]);
  // Protect the first request from repeated taps, including AI download and
  // browser voice loading. Do not restart it or queue another copy behind it.
  if (activeSpeech?.key === key) {
    // A repeated preview click can still show the current playback status.
    if (activeSpeech.provider) options.onStart?.(activeSpeech.provider);
    return;
  }

  stopAllSpeech();
  const requestId = speechRequestId;
  activeSpeech = { key, onCancel: options.onCancel };
  const originalOptions = options;
  const finish = (callback?: () => void) => {
    if (requestId !== speechRequestId) return;
    activeSpeech = null;
    setBGMDucked('speech', false);
    callback?.();
  };
  options = { ...originalOptions,
    onStart: provider => {
      if (requestId !== speechRequestId || !activeSpeech) return;
      activeSpeech.provider = provider;
      activeSpeech.startedAt = performance.now();
      originalOptions.onStart?.(provider);
    },
    onEnd: () => finish(originalOptions.onEnd),
    onError: () => finish(originalOptions.onError),
  };

  setBGMDucked('speech', true);

  if (isGeminiTTSEnabled()) {
    try {
      const ctx = getAudioContext();
      playGeminiSpeech(clean, {
        language: speechLanguage,
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
      console.warn('Character audio unavailable:', error);
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
  const cancelled = activeSpeech?.onCancel;
  activeSpeech = null;
  stopAnimalSound();
  setBGMDucked('speech', false);
  speechRequestId += 1;
  if (typeof window !== 'undefined') clearBrowserSpeechStartTimer();
  activeBrowserUtterance = null;
  pendingBrowserSpeech = null;
  stopGeminiAudio();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
  cancelled?.();
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
  stopGeneratedEffects();
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

export function playRhythmTone(frequency: number, enabled = true, duration = .4) {
  if (!enabled || !masterSoundEnabled || isPageHidden()) return;
  try { playToyTone(frequency, duration, .2); } catch { /* Keep the visual rhythm available. */ }
}

export function playXylophoneNote(frequency: number, enabled = true, animalIndex = 0) {
  if (!enabled || !masterSoundEnabled || isPageHidden()) return;
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

export function playCareSound(kind: 'brush' | 'chew' | 'drink' | 'bubble', enabled = true) {
  if (!enabled || !masterSoundEnabled || isPageHidden()) return;
  try {
    const pitch = randomEffectPitch();
    if (kind === 'brush') {
      const ctx = getAudioContext();
      const noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * .12), ctx.sampleRate);
      const samples = noise.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / samples.length);
      const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      source.buffer = noise; filter.type = 'bandpass'; filter.frequency.value = 1100 * pitch; filter.Q.value = .7;
      gain.gain.value = .035; source.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      trackEffect(source, gain);
      const ended = source.onended;
      source.onended = event => { ended?.call(source, event); filter.disconnect(); };
      source.start();
    }
    else if (kind === 'chew') {
      playToyTone(210 * pitch, .16, .075, 130 * pitch);
      playToyTone(250 * pitch, .18, .055, 160 * pitch, .18);
    } else if (kind === 'drink') {
      playToyTone(420 * pitch, .14, .045, 220 * pitch);
      playToyTone(520 * pitch, .18, .035, 260 * pitch, .18);
    } else {
      if (tryGeneratedEffect('bubble', getAudioContext())) { duckForEffect(550); return; }
      const frequency = 920 * pitch;
      duckForEffect(200);
      playToyTone(frequency, .2, .085, frequency * 1.65);
      playToyTone(frequency * 2, .1, .02);
    }
  } catch { /* Visual feedback still works when audio is unavailable. */ }
}

/** The same speech channel provides deduplication, mute, language, ducking and navigation cleanup. */
export function playCareReaction(kind: CareReaction, enabled: boolean, characterId: string): number {
  const reaction = CARE_REACTIONS[kind];
  playCareSound(reaction.sound, enabled);
  speakText(reaction.ko, enabled, { characterId, playIntroSFX: false });
  if (!enabled || !masterSoundEnabled || !speechEnabled) return 0;
  const text = reaction[speechLanguage];
  const duration = (CARE_VOICE_DURATIONS[speechSynthesisKey(text, characterId, speechLanguage)] || 0) / getCharacterVoice(characterId).fallbackPlaybackRate * 1000;
  const elapsed = activeSpeech?.startedAt === undefined ? 0 : performance.now() - activeSpeech.startedAt;
  return Math.max(0, Math.ceil(duration - elapsed)) + 120;
}

export function warmCareReactions(characterId: string, enabled: boolean) {
  if (!enabled || !masterSoundEnabled || !speechEnabled || isPageHidden()) return;
  try {
    const ctx = getAudioContext();
    for (const reaction of Object.values(CARE_REACTIONS)) for (const language of ['ko', 'en'] as const) void preloadBundledSpeech(reaction[language], characterId, language, ctx);
  } catch { /* Audio availability never blocks play. */ }
}

let sleepNoise: AudioBuffer | null = null;
export function playSleepBreath(enabled = true) {
  if (!enabled || !masterSoundEnabled || isPageHidden()) return;
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
