import confetti from 'canvas-confetti';

/**
 * Standard cheerful multi-color candy confetti burst
 */
export function fireConfetti() {
  confetti({
    particleCount: 70,
    spread: 80,
    origin: { y: 0.65 },
    colors: ['#FF6B8B', '#FFD15C', '#4ADE80', '#60A5FA', '#C084FC', '#F472B6'],
  });
}

/**
 * Golden star explosion for star badges and milestone unlocks
 */
export function fireStarExplosion(origin?: { x: number; y: number }) {
  confetti({
    particleCount: 45,
    spread: 360,
    startVelocity: 25,
    origin: origin || { x: 0.5, y: 0.5 },
    shapes: ['star'],
    colors: ['#FFE066', '#FFA94D', '#FFD43B', '#FF922B', '#FFF3BF'],
    scalar: 1.3,
  });
}

/**
 * Balloon pop burst triggered at the exact screen touch position
 */
export function fireBalloonPopParticle(screenX: number, screenY: number, color = '#FF6B8B') {
  const normX = Math.max(0, Math.min(1, screenX / window.innerWidth));
  const normY = Math.max(0, Math.min(1, screenY / window.innerHeight));

  confetti({
    particleCount: 30,
    spread: 360,
    startVelocity: 18,
    ticks: 40,
    origin: { x: normX, y: normY },
    colors: [color, '#FFFFFF', '#FFF9DB'],
    scalar: 0.9,
    disableForReducedMotion: true,
  });
}

/**
 * Grand Celebration Fireworks for Stage Clear & Final Trophy Party
 */
export function fireCelebrationFireworks(durationMs = 3000) {
  const end = Date.now() + durationMs;
  const colors = ['#FF6B8B', '#FFD15C', '#4ADE80', '#60A5FA', '#BA68C8', '#FF8A65'];

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
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
