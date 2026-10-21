export const JUICE_SPRING = { type: 'spring' as const, stiffness: 450, damping: 15, mass: .8 };
export type JuiceImpact = { kind: 'pop' | 'success' | 'snap'; x?: number; y?: number };
const listeners = new Set<(impact: JuiceImpact) => void>();

export interface ComboState {
  combo: number;
  fever: boolean;
}
let currentCombo = 0;
const comboListeners = new Set<(state: ComboState) => void>();
const windListeners = new Set<(intensity: number) => void>();
export type PlayFeedbackMode = 'play' | 'care' | 'quiet';
let feedbackMode: PlayFeedbackMode = 'play';
export const getPlayFeedbackMode = () => feedbackMode;
export function setPlayFeedbackMode(mode: PlayFeedbackMode) { feedbackMode = mode; }

/** A solved round is a semantic event. Decorative stars/snaps never award combos. */
export function recordPlaySuccess() {
  if (feedbackMode !== 'play') return;
  currentCombo += 1;
  notifyCombo();
}

/** Keep care faces clear: feedback lands beside the portrait, not over its mouth. */
export function feedbackPoint(x: number, y: number, width: number, height: number) {
  if (feedbackMode !== 'care') return { x, y };
  return { x: x < width / 2 ? Math.min(24, width / 2) : Math.max(0, width - 24), y: Math.max(32, Math.min(height - 32, y)) };
}

function notifyCombo() {
  const state: ComboState = { combo: currentCombo, fever: currentCombo >= 3 };
  comboListeners.forEach(listener => listener(state));
}

export function subscribeCombo(listener: (state: ComboState) => void) {
  comboListeners.add(listener);
  listener({ combo: currentCombo, fever: currentCombo >= 3 });
  return () => { comboListeners.delete(listener); };
}

export function resetCombo() {
  if (currentCombo === 0) return;
  currentCombo = 0;
  notifyCombo();
}

export function getComboState(): ComboState {
  return { combo: currentCombo, fever: currentCombo >= 3 };
}

export function emitWindGust(intensity = 1) {
  const clamped = Math.max(0.2, Math.min(2, intensity));
  windListeners.forEach(listener => listener(clamped));
}

export function subscribeWindGust(listener: (intensity: number) => void) {
  windListeners.add(listener);
  return () => { windListeners.delete(listener); };
}

export function emitJuice(impact: JuiceImpact) {
  if (feedbackMode === 'quiet') return;
  listeners.forEach(listener => listener(impact));
}
export function subscribeJuice(listener: (impact: JuiceImpact) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export const randomEffectPitch = (random = Math.random) => .95 + Math.max(0, Math.min(1, random())) * .10;

/** A burst may replace a tick; subsequent ticks cannot cut a success pattern short. */
export function createHaptics(vibrate: (pattern: number | number[]) => unknown, clock = () => performance.now()) {
  let blockedUntil = 0;
  let lastBurst = -Infinity;
  return {
    play(kind: 'tap' | 'success' | 'snap') {
      const now = clock();
      if (kind === 'tap' ? now < blockedUntil : now - lastBurst < 180) return;
      try { vibrate(kind === 'tap' ? 12 : kind === 'snap' ? [15] : [20, 30, 40]); } catch { /* Unsupported or denied. */ }
      blockedUntil = now + (kind === 'tap' ? 45 : 120);
      if (kind !== 'tap') lastBurst = now;
    },
    stop() { try { vibrate(0); } catch { /* No vibration support. */ } blockedUntil = 0; },
  };
}
