import { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'motion/react';
import { createHaptics, JUICE_SPRING, subscribeJuice } from '../utils/juice';
import { createTouchParticles, drawTouchParticles } from '../utils/touchParticles';

type Spring = { x: number; y: number; controls: { stop: () => void }[] };
export function TouchEffects({ active, screenKey, hapticsEnabled }: { active: boolean; screenKey: string; hapticsEnabled: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!active) return;
    const node = canvas.current!;
    const ctx = node.getContext('2d');
    const particles = createTouchParticles();
    const pointers = new Map<number, { x: number; y: number; at: number; target: HTMLElement | null }>();
    const springs = new Map<HTMLElement, Spring>();
    const haptics = createHaptics(pattern => {
      if (hapticsEnabled && !reduced && typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
    });
    let frame = 0;
    let lastFrame = 0;
    let lastImpact = -Infinity;
    let shake: Animation | undefined;
    const clearSpring = (element: HTMLElement) => {
      springs.get(element)?.controls.forEach(control => control.stop());
      element.style.removeProperty('--juice-x'); element.style.removeProperty('--juice-y');
      springs.delete(element);
    };
    const spring = (element: HTMLElement, pressed: boolean) => {
      if (reduced || !element.isConnected) { clearSpring(element); return; }
      const state = springs.get(element) ?? { x: 1, y: 1, controls: [] };
      state.controls.forEach(control => control.stop());
      springs.set(element, state);
      let done = 0;
      state.controls = (['x', 'y'] as const).map(axis => animate(state[axis], pressed ? (axis === 'x' ? 1.15 : .85) : 1, {
        ...JUICE_SPRING, velocity: pressed ? 0 : (axis === 'x' ? -3 : 3),
        onUpdate: value => { state[axis] = value; element.style.setProperty(`--juice-${axis}`, String(value)); },
        onComplete: () => { if (++done === 2 && !pressed) clearSpring(element); },
      }));
    };
    const size = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      node.width = Math.round(window.innerWidth * ratio); node.height = Math.round(window.innerHeight * ratio);
      ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const draw = (now: number) => {
      frame = 0;
      particles.step(Math.min((now - lastFrame) / 1000, .04)); lastFrame = now;
      ctx?.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (ctx) drawTouchParticles(ctx, particles.particles);
      if (particles.particles.length) frame = requestAnimationFrame(draw);
    };
    const emit = (x: number, y: number, burst: boolean) => {
      if (reduced || !ctx || document.hidden) return;
      particles.emit(x, y, burst);
      if (!frame) { lastFrame = performance.now(); frame = requestAnimationFrame(draw); }
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || pointers.size >= 5 || !(event.target instanceof Element)) return;
      if (event.target.closest('input, textarea, select, [contenteditable="true"], [data-no-juice]')) return;
      const target = event.target.closest<HTMLElement>('button:not(:disabled), [role="button"], [data-juice-target]');
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, at: 0, target });
      emit(event.clientX, event.clientY, true);
      if (target) spring(target, true);
      if (target || event.target.closest('[data-juice-surface]')) haptics.play('tap');
    };
    const move = (event: PointerEvent) => {
      const pointer = pointers.get(event.pointerId);
      if (!pointer || event.timeStamp - pointer.at < 24 || Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) < 8) return;
      pointer.x = event.clientX; pointer.y = event.clientY; pointer.at = event.timeStamp;
      emit(pointer.x, pointer.y, false);
    };
    const up = (event: PointerEvent) => {
      const target = pointers.get(event.pointerId)?.target;
      pointers.delete(event.pointerId);
      if (target && ![...pointers.values()].some(pointer => pointer.target === target)) spring(target, false);
    };
    const reset = () => {
      cancelAnimationFrame(frame); frame = 0; particles.clear(); pointers.clear();
      ctx?.clearRect(0, 0, window.innerWidth, window.innerHeight);
      [...springs.keys()].forEach(clearSpring); shake?.cancel(); haptics.stop();
    };
    const hide = () => { if (document.hidden) reset(); };
    const resize = () => { reset(); size(); };
    const stop = subscribeJuice(impact => {
      if (document.hidden || reduced || performance.now() - lastImpact < 180) return;
      lastImpact = performance.now(); haptics.play(impact.kind === 'snap' ? 'snap' : 'success');
      if (impact.x !== undefined && impact.y !== undefined) emit(impact.x, impact.y, true);
      if (impact.kind === 'snap') return;
      // Keep navigation and fixed overlays still while the play surface briefly reacts.
      const scene = document.querySelector<HTMLElement>('.game-stage, .greeting-card');
      shake?.cancel();
      const power = impact.kind === 'pop' ? 1.5 : 2.5;
      shake = scene?.animate([{ translate: '0 0' }, { translate: `${power}px 1px` }, { translate: `${-power}px -1px` }, { translate: '1px 0' }, { translate: '0 0' }], { duration: 160, easing: 'ease-out' });
    });
    size();
    document.addEventListener('pointerdown', down, { capture: true, passive: true });
    document.addEventListener('pointermove', move, { capture: true, passive: true });
    document.addEventListener('pointerup', up, true); document.addEventListener('pointercancel', up, true);
    document.addEventListener('visibilitychange', hide); window.addEventListener('blur', reset); window.addEventListener('resize', resize);
    return () => {
      stop(); reset();
      document.removeEventListener('pointerdown', down, true); document.removeEventListener('pointermove', move, true);
      document.removeEventListener('pointerup', up, true); document.removeEventListener('pointercancel', up, true);
      document.removeEventListener('visibilitychange', hide); window.removeEventListener('blur', reset); window.removeEventListener('resize', resize);
    };
  }, [active, screenKey, hapticsEnabled, reduced]);
  return <canvas ref={canvas} className="touch-effects" aria-hidden="true" />;
}
