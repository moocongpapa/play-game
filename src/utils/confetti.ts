import confetti from 'canvas-confetti';
import { feedbackPoint, getPlayFeedbackMode } from './juice';

let lastCelebration = -Infinity;
function claimCelebration() {
  if (getPlayFeedbackMode() === 'quiet' || document.hidden) return false;
  const now = performance.now();
  if (now - lastCelebration < 600) return false;
  lastCelebration = now;
  return true;
}
function safeOrigin(origin = { x: .5, y: .65 }) {
  const point = feedbackPoint(origin.x * innerWidth, origin.y * innerHeight, innerWidth, innerHeight);
  return { x: point.x / innerWidth, y: point.y / innerHeight };
}

/**
 * Standard cheerful multi-color candy confetti burst
 */
export function fireConfetti() {
  if (!claimCelebration()) return;
  confetti({
    disableForReducedMotion: true,
    particleCount: getPlayFeedbackMode() === 'care' ? 12 : 32,
    spread: 80,
    origin: safeOrigin(),
    colors: ['#FF6B8B', '#FFD15C', '#4ADE80', '#60A5FA', '#C084FC', '#F472B6'],
  });
}

/**
 * Golden star explosion for star badges and milestone unlocks
 */
export function fireStarExplosion(origin?: { x: number; y: number }) {
  if (!claimCelebration()) return;
  confetti({
    disableForReducedMotion: true,
    particleCount: getPlayFeedbackMode() === 'care' ? 10 : 24,
    spread: 90,
    startVelocity: 16,
    origin: safeOrigin(origin),
    shapes: ['star'],
    colors: ['#FFE066', '#FFA94D', '#FFD43B', '#FF922B', '#FFF3BF'],
    scalar: 1.3,
  });
}

/**
 * Balloon pop burst triggered at the exact screen touch position
 */
export function fireBalloonPopParticle(screenX: number, screenY: number, color = '#FF6B8B') {
  if (getPlayFeedbackMode() === 'quiet') return;
  const normX = Math.max(0, Math.min(1, screenX / window.innerWidth));
  const normY = Math.max(0, Math.min(1, screenY / window.innerHeight));

  confetti({
    disableForReducedMotion: true,
    particleCount: 14,
    spread: 360,
    startVelocity: 18,
    ticks: 40,
    origin: { x: normX, y: normY },
    colors: [color, '#FFFFFF', '#FFF9DB'],
    scalar: 0.9,
  });
}

/**
 * Grand Celebration Fireworks for Stage Clear & Final Trophy Party
 */
export function fireCelebrationFireworks(durationMs = 1800) {
  if (!claimCelebration()) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const generation = celebrationGeneration;
  const end = Date.now() + durationMs;
  const colors = ['#FF6B8B', '#FFD15C', '#4ADE80', '#60A5FA', '#BA68C8', '#FF8A65'];

  const frame = () => {
    if (generation !== celebrationGeneration) return;
    confetti({
      disableForReducedMotion: true,
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      disableForReducedMotion: true,
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}

let celebrationGeneration = 0;
export function stopCelebrations() {
  celebrationGeneration += 1;
  lastCelebration = -Infinity;
  confetti.reset();
}
