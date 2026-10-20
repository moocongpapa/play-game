import React, { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import { Application, Container, Graphics } from 'pixi.js';
import { subscribeJuice } from '../utils/juice';
import type { GameTheme } from '../data/gameCatalog';

export interface PixiBurstOptions {
  x: number;
  y: number;
  color?: number;
  secondaryColor?: number;
  count?: number;
  kind?: 'juice' | 'star' | 'bubble' | 'water' | 'bounce';
}

export interface PixiStageHandle {
  emitBurst: (options: PixiBurstOptions) => void;
  emitWaterSpray: (x: number, y: number) => void;
  emitBounceWave: (x: number, y: number, power?: number) => void;
}

interface Particle {
  graphic: Graphics;
  vx: number;
  vy: number;
  gravity: number;
  drag: number;
  life: number;
  maxLife: number;
  spin: number;
  scaleStart: number;
  scaleEnd: number;
  kind: 'juice' | 'star' | 'bubble' | 'water' | 'bounce' | 'ring';
}

export type PixiAmbientKind = GameTheme | 'bath' | 'none';

interface PixiStageOverlayProps {
  className?: string;
  ambientKind?: PixiAmbientKind;
}

export const PixiStageOverlay = forwardRef<PixiStageHandle, PixiStageOverlayProps>(
  ({ className = '', ambientKind = 'none' }, ref) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const layerRef = useRef<Container | null>(null);
    const reducedMotionRef = useRef(false);

    useEffect(() => {
      reducedMotionRef.current =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    }, []);

    const spawnParticles = (options: PixiBurstOptions) => {
      const layer = layerRef.current;
      if (!layer || reducedMotionRef.current) return;

      const {
        x,
        y,
        color = 0xff6b8b,
        secondaryColor = 0xffd166,
        count = 18,
        kind = 'juice',
      } = options;

      // Expanding double shockwave ring for juice, star, or bounce bursts
      if (kind === 'juice' || kind === 'star' || kind === 'bounce') {
        const ring = new Graphics();
        ring.circle(0, 0, 22);
        ring.stroke({ width: 4.5, color, alpha: 0.88 });
        ring.position.set(x, y);
        layer.addChild(ring);
        particlesRef.current.push({
          graphic: ring,
          vx: 0,
          vy: 0,
          gravity: 0,
          drag: 1,
          life: 0,
          maxLife: 24,
          spin: 0,
          scaleStart: 0.35,
          scaleEnd: kind === 'bounce' ? 3.4 : 2.6,
          kind: 'ring',
        });

        if (kind === 'star' || kind === 'bounce') {
          const innerRing = new Graphics();
          innerRing.circle(0, 0, 16);
          innerRing.stroke({ width: 3, color: secondaryColor, alpha: 0.78 });
          innerRing.position.set(x, y);
          layer.addChild(innerRing);
          particlesRef.current.push({
            graphic: innerRing,
            vx: 0,
            vy: 0,
            gravity: 0,
            drag: 1,
            life: 0,
            maxLife: 30,
            spin: 0,
            scaleStart: 0.25,
            scaleEnd: 3.1,
            kind: 'ring',
          });
        }
      }

      const boundedCount = Math.min(count, Math.max(0, 140 - particlesRef.current.length));
      for (let i = 0; i < boundedCount; i++) {
        const g = new Graphics();
        const isSecondary = i % 2 === 1;
        const fill = isSecondary ? secondaryColor : color;

        if (kind === 'star') {
          if (i % 4 === 0) {
            // Four-point diamond sparkle
            g.star(0, 0, 4, 11, 3.5);
            g.fill({ color: 0xffffff, alpha: 0.96 });
            g.stroke({ width: 1.5, color: fill, alpha: 0.9 });
          } else {
            g.star(0, 0, 5, 10 + (i % 3) * 2, 5);
            g.fill({ color: fill, alpha: 0.95 });
            g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.85 });
          }
        } else if (kind === 'bubble') {
          const radius = 7 + (i % 4) * 3.5;
          g.circle(0, 0, radius);
          g.fill({ color: 0xe0f7ff, alpha: 0.45 });
          g.stroke({ width: 2, color: fill, alpha: 0.85 });
          g.circle(-radius * 0.32, -radius * 0.32, radius * 0.25);
          g.fill({ color: 0xffffff, alpha: 0.85 });
        } else if (kind === 'water') {
          g.ellipse(0, 0, 4.5, 7.5);
          g.fill({ color: 0x38bdf8, alpha: 0.82 });
          g.circle(-1.2, -2, 1.5);
          g.fill({ color: 0xffffff, alpha: 0.75 });
        } else {
          // Juicy droplet / confetti pill
          const radius = 5 + (i % 3) * 3;
          if (i % 3 === 0) {
            g.roundRect(-radius * 0.7, -radius * 1.2, radius * 1.4, radius * 2.4, radius * 0.6);
            g.fill({ color: fill, alpha: 0.94 });
          } else {
            g.circle(0, 0, radius);
            g.fill({ color: fill, alpha: 0.92 });
            g.circle(-radius * 0.28, -radius * 0.28, radius * 0.3);
            g.fill({ color: 0xffffff, alpha: 0.75 });
          }
        }

        const angle =
          kind === 'water'
            ? Math.PI * 0.35 + (Math.random() - 0.5) * 0.9
            : (Math.PI * 2 * i) / boundedCount + (Math.random() - 0.5) * 0.45;
        const speed =
          kind === 'bubble'
            ? 1.4 + Math.random() * 2.6
            : kind === 'water'
            ? 2.5 + Math.random() * 4.2
            : 3.8 + Math.random() * 6.8;

        g.position.set(x, y);
        layer.addChild(g);

        particlesRef.current.push({
          graphic: g,
          vx: Math.cos(angle) * speed,
          vy:
            kind === 'bubble'
              ? -1.2 - Math.random() * 2.4
              : kind === 'water'
              ? Math.sin(angle) * speed
              : Math.sin(angle) * speed - 2.6,
          gravity: kind === 'bubble' ? -0.04 : kind === 'water' ? 0.28 : 0.22,
          drag: kind === 'bubble' ? 0.985 : 0.96,
          life: 0,
          maxLife: kind === 'bubble' ? 52 : kind === 'water' ? 28 : 38,
          spin: (Math.random() - 0.5) * 0.22,
          scaleStart: 1,
          scaleEnd: kind === 'bubble' ? 1.35 : 0.18,
          kind,
        });
      }
    };

    useImperativeHandle(ref, () => ({
      emitBurst: (options) => spawnParticles(options),
      emitWaterSpray: (x, y) =>
        spawnParticles({
          x,
          y,
          color: 0x38bdf8,
          secondaryColor: 0xbae6fd,
          count: 7,
          kind: 'water',
        }),
      emitBounceWave: (x, y, power = 1) =>
        spawnParticles({
          x,
          y,
          color: 0xf472b6,
          secondaryColor: 0xfef08a,
          count: Math.round(10 * power),
          kind: 'bounce',
        }),
    }));

    // Interactive 60fps Magic Stardust Finger Trail across all stages
    useEffect(() => {
      if (typeof window === 'undefined') return;
      let lastTrailTime = 0;
      let lastX = 0;
      let lastY = 0;
      const trailPalette = [0xfacc15, 0xf472b6, 0x38bdf8, 0x4ade80, 0xc084fc, 0xfb923c];
      let colorIdx = 0;

      const spawnTrailSparkle = (clientX: number, clientY: number, isDown = false) => {
        const host = hostRef.current;
        const layer = layerRef.current;
        if (!host || !layer || reducedMotionRef.current || document.hidden) return;
        const rect = host.getBoundingClientRect();
        if (
          clientX < rect.left ||
          clientX > rect.right ||
          clientY < rect.top ||
          clientY > rect.bottom
        ) {
          return;
        }
        const localX = clientX - rect.left;
        const localY = clientY - rect.top;
        const count = isDown ? 4 : 1;
        for (let i = 0; i < count; i++) {
          if (particlesRef.current.length >= 135) break;
          const g = new Graphics();
          const c = trailPalette[colorIdx++ % trailPalette.length];
          if (i % 2 === 0) {
            g.star(0, 0, 4, isDown ? 8 : 6.5, 2.5);
            g.fill({ color: c, alpha: 0.9 });
            g.stroke({ width: 1, color: 0xffffff, alpha: 0.85 });
          } else {
            g.circle(0, 0, isDown ? 4.5 : 3.5);
            g.fill({ color: 0xffffff, alpha: 0.9 });
            g.stroke({ width: 1.5, color: c, alpha: 0.85 });
          }
          g.position.set(
            localX + (Math.random() - 0.5) * 10,
            localY + (Math.random() - 0.5) * 10
          );
          layer.addChild(g);
          particlesRef.current.push({
            graphic: g,
            vx: (Math.random() - 0.5) * (isDown ? 3.2 : 1.6),
            vy: -0.8 - Math.random() * (isDown ? 2.2 : 1.2),
            gravity: 0.04,
            drag: 0.96,
            life: 0,
            maxLife: isDown ? 26 : 20,
            spin: (Math.random() - 0.5) * 0.2,
            scaleStart: 1,
            scaleEnd: 0.1,
            kind: 'star',
          });
        }
      };

      const onPointerMove = (e: PointerEvent) => {
        const now = performance.now();
        if (now - lastTrailTime < 26) return;
        const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
        if (dist < 10) return;
        lastTrailTime = now;
        lastX = e.clientX;
        lastY = e.clientY;
        spawnTrailSparkle(e.clientX, e.clientY, false);
      };

      const onPointerDown = (e: PointerEvent) => {
        lastX = e.clientX;
        lastY = e.clientY;
        spawnTrailSparkle(e.clientX, e.clientY, true);
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerdown', onPointerDown, { passive: true });
      return () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerdown', onPointerDown);
      };
    }, []);

    useEffect(() => {
      const stopJuice = subscribeJuice((impact) => {
        const host = hostRef.current;
        if (!host || reducedMotionRef.current || document.hidden) return;
        const rect = host.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const hasCoords = impact.x !== undefined && impact.y !== undefined;
        const localX = hasCoords
          ? Math.max(24, Math.min(rect.width - 24, impact.x! - rect.left))
          : rect.width * 0.5;
        const localY = hasCoords
          ? Math.max(24, Math.min(rect.height - 24, impact.y! - rect.top))
          : rect.height * 0.42;

        if (impact.kind === 'pop') {
          spawnParticles({
            x: localX,
            y: localY,
            color: 0xff6b8b,
            secondaryColor: 0x38bdf8,
            count: 18,
            kind: 'juice',
          });
        } else if (impact.kind === 'snap') {
          spawnParticles({
            x: localX,
            y: localY,
            color: 0xfbbf24,
            secondaryColor: 0x4ade80,
            count: 16,
            kind: 'star',
          });
        } else if (impact.kind === 'success') {
          spawnParticles({
            x: localX,
            y: localY,
            color: 0xfacc15,
            secondaryColor: 0xf472b6,
            count: 26,
            kind: 'star',
          });
          if (!hasCoords) {
            spawnParticles({
              x: Math.max(32, rect.width * 0.25),
              y: rect.height * 0.48,
              color: 0x38bdf8,
              secondaryColor: 0xa78bfa,
              count: 16,
              kind: 'juice',
            });
            spawnParticles({
              x: Math.min(rect.width - 32, rect.width * 0.75),
              y: rect.height * 0.48,
              color: 0x4ade80,
              secondaryColor: 0xfb923c,
              count: 16,
              kind: 'juice',
            });
          }
        }
      });
      return () => stopJuice();
    }, []);

    useEffect(() => {
      const host = hostRef.current;
      if (!host) return;

      let disposed = false;
      const app = new Application();
      let ambientTick = 0;

      const setup = async () => {
        try {
          await app.init({
            resizeTo: host,
            backgroundAlpha: 0,
            antialias: true,
            resolution: Math.min(2, window.devicePixelRatio || 1),
            autoDensity: true,
          });
          if (disposed) {
            app.destroy(true, { children: true });
            return;
          }
          host.appendChild(app.canvas);

          const ambientLayer = new Container();
          const fxLayer = new Container();
          app.stage.addChild(ambientLayer);
          app.stage.addChild(fxLayer);
          layerRef.current = fxLayer;

          // 1. Soft Volumetric Sunbeams (God-rays) for magical storybook depth
          const sunbeams: Array<{ g: Graphics; baseX: number; phase: number }> = [];
          // 2. Ambient floating motes
          const motes: Array<{ g: Graphics; baseX: number; baseY: number; speed: number; phase: number }> = [];
          // 3. Fluttering butterflies / drifting clouds / musical notes
          const critters: Array<{ root: Container; wings?: Graphics; baseX: number; baseY: number; speed: number; phase: number; kind: string }> = [];

          if (!reducedMotionRef.current && ambientKind !== 'none') {
            for (let b = 0; b < 3; b++) {
              const ray = new Graphics();
              ray.poly([-40, -20, 45, -20, 140, 420, -10, 420]);
              ray.fill({
                color: ambientKind === 'magic' ? 0xf3e8ff : 0xfffbeb,
                alpha: 0.11,
              });
              ambientLayer.addChild(ray);
              sunbeams.push({ g: ray, baseX: 0.18 + b * 0.32, phase: b * 1.7 });
            }

            for (let i = 0; i < 14; i++) {
              const m = new Graphics();
              if (ambientKind === 'bath') {
                const r = 6 + (i % 4) * 4;
                m.circle(0, 0, r);
                m.fill({ color: 0xffffff, alpha: 0.26 });
                m.stroke({ width: 1.5, color: i % 2 === 0 ? 0xbae6fd : 0xfbcfe8, alpha: 0.55 });
                m.circle(-r * 0.3, -r * 0.3, r * 0.22);
                m.fill({ color: 0xffffff, alpha: 0.65 });
              } else if (ambientKind === 'sky') {
                m.star(0, 0, 4, 6 + (i % 2) * 2.5, 2.8);
                m.fill({ color: i % 2 === 0 ? 0xffffff : 0xfef08a, alpha: 0.55 });
              } else if (ambientKind === 'magic') {
                m.star(0, 0, 5, 5 + (i % 3) * 2.5, 2.5);
                m.fill({ color: i % 2 === 0 ? 0xfef08a : 0xe9d5ff, alpha: 0.52 });
              } else if (ambientKind === 'music') {
                m.circle(0, 0, 4 + (i % 3) * 2.5);
                m.fill({ color: i % 2 === 0 ? 0xfbcfe8 : 0xddd6fe, alpha: 0.44 });
                m.stroke({ width: 1, color: 0xffffff, alpha: 0.5 });
              } else if (ambientKind === 'garden') {
                m.ellipse(0, 0, 5 + (i % 2) * 2, 3);
                m.fill({ color: i % 2 === 0 ? 0xfbcfe8 : 0xfef08a, alpha: 0.52 });
              } else {
                m.circle(0, 0, 4 + (i % 3) * 2);
                m.fill({ color: i % 2 === 0 ? 0xfffbeb : 0xfed7aa, alpha: 0.5 });
              }
              const bx = ((i * 97) % 100) / 100;
              const by = ((i * 61) % 100) / 100;
              ambientLayer.addChild(m);
              motes.push({ g: m, baseX: bx, baseY: by, speed: 0.38 + (i % 4) * 0.14, phase: i * 1.1 });
            }

            // Theme critters: fluttering butterflies for garden/picnic, soft clouds for sky, glowing orbs for magic/music
            if (ambientKind === 'garden' || ambientKind === 'picnic') {
              for (let c = 0; c < 2; c++) {
                const root = new Container();
                const wings = new Graphics();
                const wingColor = c === 0 ? 0xf472b6 : 0xfacc15;
                wings.ellipse(-5, -2, 6, 4.5);
                wings.ellipse(5, -2, 6, 4.5);
                wings.ellipse(-4, 3, 4.5, 3.5);
                wings.ellipse(4, 3, 4.5, 3.5);
                wings.fill({ color: wingColor, alpha: 0.48 });
                wings.stroke({ width: 1, color: 0xffffff, alpha: 0.6 });
                root.addChild(wings);
                ambientLayer.addChild(root);
                critters.push({
                  root,
                  wings,
                  baseX: 0.25 + c * 0.5,
                  baseY: 0.22 + c * 0.16,
                  speed: 0.55 + c * 0.2,
                  phase: c * 2.4,
                  kind: 'butterfly',
                });
              }
            }
          }

          app.ticker.add((ticker) => {
            const dt = Math.min(2.5, ticker.deltaTime);
            ambientTick += 0.02 * dt;

            const w = app.screen.width || 360;
            const h = app.screen.height || 480;

            for (const beam of sunbeams) {
              beam.g.x = beam.baseX * w + Math.sin(ambientTick * 0.4 + beam.phase) * 24;
              beam.g.alpha = 0.75 + Math.sin(ambientTick * 0.7 + beam.phase) * 0.25;
            }

            for (const mote of motes) {
              mote.g.x = mote.baseX * w + Math.sin(ambientTick * mote.speed + mote.phase) * 18;
              mote.g.y =
                ((mote.baseY * h - ambientTick * 12 * mote.speed) % h + h) % h;
              mote.g.rotation = Math.sin(ambientTick * mote.speed + mote.phase) * 0.4;
            }

            for (const critter of critters) {
              critter.root.x =
                critter.baseX * w + Math.sin(ambientTick * critter.speed + critter.phase) * 55;
              critter.root.y =
                critter.baseY * h + Math.cos(ambientTick * critter.speed * 1.4 + critter.phase) * 22;
              critter.root.rotation = Math.cos(ambientTick * critter.speed + critter.phase) * 0.22;
              if (critter.wings) {
                critter.wings.scale.x = 0.35 + Math.abs(Math.sin(ambientTick * 7 + critter.phase)) * 0.65;
              }
            }

            const list = particlesRef.current;
            for (let i = list.length - 1; i >= 0; i--) {
              const p = list[i];
              p.life += dt;
              const progress = Math.min(1, p.life / p.maxLife);
              if (progress >= 1) {
                p.graphic.destroy();
                list.splice(i, 1);
                continue;
              }
              p.vx *= p.drag;
              p.vy = p.vy * p.drag + p.gravity * dt;
              p.graphic.x += p.vx * dt;
              p.graphic.y += p.vy * dt;
              p.graphic.rotation += p.spin * dt;
              const scale = p.scaleStart + (p.scaleEnd - p.scaleStart) * progress;
              p.graphic.scale.set(scale);
              p.graphic.alpha = p.kind === 'ring' ? 1 - progress : 1 - Math.pow(progress, 1.6);
            }
          });
        } catch {
          // Graceful fallback in headless or non-WebGL environments
        }
      };

      void setup();

      return () => {
        disposed = true;
        layerRef.current = null;
        particlesRef.current.length = 0;
        try {
          if (app.renderer) {
            app.destroy(true, { children: true });
          }
        } catch {
          // Ignore teardown errors if init was still in flight
        }
      };
    }, [ambientKind]);

    return (
      <div
        ref={hostRef}
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
        aria-hidden="true"
      />
    );
  }
);
