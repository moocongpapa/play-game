export const JUICE_SPRING = { type: 'spring' as const, stiffness: 450, damping: 15, mass: .8 };
export type JuiceImpact = { kind: 'pop' | 'success'; x?: number; y?: number };
const listeners = new Set<(impact: JuiceImpact) => void>();
export function emitJuice(impact: JuiceImpact) { listeners.forEach(listener => listener(impact)); }
export function subscribeJuice(listener: (impact: JuiceImpact) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export const randomEffectPitch = (random = Math.random) => .95 + Math.max(0, Math.min(1, random())) * .13;

/** A burst may replace a tick; subsequent ticks cannot cut a success pattern short. */
export function createHaptics(vibrate: (pattern: number | number[]) => unknown, clock = () => performance.now()) {
  let blockedUntil = 0;
  let lastBurst = -Infinity;
  return {
    play(kind: 'tap' | 'success') {
      const now = clock();
      if (kind === 'tap' ? now < blockedUntil : now - lastBurst < 180) return;
      try { vibrate(kind === 'tap' ? 12 : [30, 20, 50]); } catch { /* Unsupported or denied. */ }
      blockedUntil = now + (kind === 'tap' ? 45 : 120);
      if (kind === 'success') lastBurst = now;
    },
    stop() { try { vibrate(0); } catch { /* No vibration support. */ } blockedUntil = 0; },
  };
}
