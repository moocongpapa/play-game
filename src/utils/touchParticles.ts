export type TouchParticle = { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; color: string; shape: 'star' | 'heart' | 'ring'; angle: number };
const COLORS = ['#efb7c8', '#f1cb70', '#90c9c3', '#b9a6df', '#fff7dc'];
export const MAX_TOUCH_PARTICLES = 120;

/** Small bounded pool; pointer events never allocate React elements or schedule timers. */
export function createTouchParticles(random = Math.random) {
  let particles: TouchParticle[] = [];
  return {
    get particles() { return particles; },
    emit(x: number, y: number, burst = false) {
      const count = burst ? 7 : 2;
      for (let i = 0; i < count; i++) {
        const angle = random() * Math.PI * 2;
        const speed = burst ? 45 + random() * 90 : 12 + random() * 25;
        particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 20, age: 0,
          life: burst ? .5 + random() * .2 : .35 + random() * .2, size: burst ? 4 + random() * 5 : 3 + random() * 3,
          color: COLORS[Math.floor(random() * COLORS.length) % COLORS.length], shape: burst && i === 0 ? 'ring' : i % 3 === 0 ? 'heart' : 'star', angle });
      }
      if (particles.length > MAX_TOUCH_PARTICLES) particles.splice(0, particles.length - MAX_TOUCH_PARTICLES);
    },
    step(dt: number) {
      for (const p of particles) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 65 * dt; }
      particles = particles.filter(p => p.age < p.life);
    },
    clear() { particles = []; },
  };
}

export function drawTouchParticles(ctx: CanvasRenderingContext2D, particles: readonly TouchParticle[]) {
  for (const p of particles) {
    const remaining = 1 - p.age / p.life;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
    ctx.globalAlpha = remaining * .85; ctx.fillStyle = p.color; ctx.strokeStyle = p.color;
    const size = p.size * (.5 + remaining * .5);
    ctx.beginPath();
    if (p.shape === 'ring') {
      ctx.lineWidth = 2 * remaining;
      ctx.arc(0, 0, 7 + (1 - remaining) * 30, 0, Math.PI * 2); ctx.stroke();
    } else if (p.shape === 'heart') {
      ctx.moveTo(0, size); ctx.bezierCurveTo(-size * 2, -size * .3, -size, -size * 1.6, 0, -size * .4);
      ctx.bezierCurveTo(size, -size * 1.6, size * 2, -size * .3, 0, size); ctx.fill();
    } else {
      for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2; const r = i % 2 ? size * .42 : size; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
}
