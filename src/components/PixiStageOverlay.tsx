import React, { useContext, useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import { Application, Container, Graphics } from 'pixi.js';
import { feedbackPoint, getPlayFeedbackMode, subscribeJuice, subscribeWindGust } from '../utils/juice';
import { useReducedMotion } from 'motion/react';
import { PlayHintsPausedContext } from './PlayFlowContext';
import { createPhysicsWorld } from '../utils/physics2d';
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
    const physicsLayerRef = useRef<Container | null>(null);
    const physicsWorldRef = useRef(createPhysicsWorld({ width: 400, height: 600, maxBodies: 24 }));
    const physicsGraphicsRef = useRef<Map<number, Graphics>>(new Map());
    const windBoostRef = useRef(0);
    const reducedMotion = useReducedMotion();
    const reducedMotionRef = useRef(Boolean(reducedMotion));
    reducedMotionRef.current = Boolean(reducedMotion);
    const paused = useContext(PlayHintsPausedContext);
    const pausedRef = useRef(paused);
    pausedRef.current = paused;
    const appRef = useRef<Application | null>(null);
    useEffect(() => {
      const app = appRef.current;
      if (!app?.renderer) return;
      if (paused || document.hidden) app.stop(); else app.start();
    }, [paused]);

    const spawnPhysicsCandies = (x: number, y: number, count = 4) => {
      const physLayer = physicsLayerRef.current;
      if (!physLayer || reducedMotionRef.current || getPlayFeedbackMode() !== 'play') return;
      const world = physicsWorldRef.current;
      const palette = [
        [0xfacc15, 0xfef08a],
        [0xf472b6, 0xfbcfe8],
        [0x38bdf8, 0xbae6fd],
        [0x4ade80, 0xbbf7d0],
        [0xc084fc, 0xe9d5ff],
        [0xfb923c, 0xfed7aa],
      ];
      for (let i = 0; i < count; i++) {
        const [color, secondaryColor] = palette[(world.bodies.length + i) % palette.length];
        const radius = 11 + (i % 3) * 3;
        const kind = i % 2 === 0 ? 'star' : 'candy';
        const body = world.spawn({
          x: x + (Math.random() - 0.5) * 36,
          y: Math.max(24, y - 10),
          vx: (Math.random() - 0.5) * 9,
          vy: -4.5 - Math.random() * 5.5,
          radius,
          restitution: 0.76,
          color,
          secondaryColor,
          kind,
          maxLife: 240,
        });

        const g = new Graphics();
        g.circle(0, 0, radius);
        g.fill({ color, alpha: 0.94 });
        g.stroke({ width: 2.2, color: 0xffffff, alpha: 0.9 });
        // 3D specular highlight & inner star emblem
        g.circle(-radius * 0.3, -radius * 0.32, radius * 0.28);
        g.fill({ color: 0xffffff, alpha: 0.78 });
        if (kind === 'star') {
          g.star(0, 0, 5, radius * 0.58, radius * 0.28);
          g.fill({ color: secondaryColor, alpha: 0.95 });
        }
        g.position.set(body.x, body.y);
        physLayer.addChild(g);
        physicsGraphicsRef.current.set(body.id, g);
      }
    };

    const spawnParticles = (options: PixiBurstOptions) => {
      const layer = layerRef.current;
      if (!layer || reducedMotionRef.current || pausedRef.current || getPlayFeedbackMode() === 'quiet') return;

      const {
        x,
        y,
        color = 0xff6b8b,
        secondaryColor = 0xffd166,
        count = 18,
        kind = 'juice',
      } = { ...options, ...feedbackPoint(options.x, options.y, hostRef.current?.clientWidth || 400, hostRef.current?.clientHeight || 600),
        count: Math.min(options.count ?? 18, getPlayFeedbackMode() === 'care' ? 7 : 20) };

      // Expanding double shockwave ring for juice, star, or bounce bursts
      if (getPlayFeedbackMode() !== 'care' && (kind === 'juice' || kind === 'star' || kind === 'bounce')) {
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
        if (!host || !layer || reducedMotionRef.current || pausedRef.current || document.hidden || getPlayFeedbackMode() !== 'play') return;
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
        const host = hostRef.current;
        if (host) {
          const rect = host.getBoundingClientRect();
          physicsWorldRef.current.impulseAt(e.clientX - rect.left, e.clientY - rect.top, 48);
        }
      };

      const onPointerDown = (e: PointerEvent) => {
        lastX = e.clientX;
        lastY = e.clientY;
        spawnTrailSparkle(e.clientX, e.clientY, true);
        const host = hostRef.current;
        if (host) {
          const rect = host.getBoundingClientRect();
          physicsWorldRef.current.impulseAt(e.clientX - rect.left, e.clientY - rect.top, 75);
        }
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerdown', onPointerDown, { passive: true });
      return () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerdown', onPointerDown);
      };
    }, []);

    useEffect(() => {
      const stopWind = subscribeWindGust((intensity) => {
        const host = hostRef.current;
        const layer = layerRef.current;
        if (!host || !layer || reducedMotionRef.current || pausedRef.current || document.hidden || getPlayFeedbackMode() !== 'play') return;
        const rect = host.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        windBoostRef.current = Math.min(3.5, windBoostRef.current + intensity * 1.8);
        physicsWorldRef.current.applyWind(7.5 * intensity, -4.2 * intensity);

        // Spawn a sweeping magical breeze of soap bubbles & dandelion star seeds across the stage
        const count = Math.min(20, Math.max(0, 140 - particlesRef.current.length));
        const breezeColors = [0xbae6fd, 0xfef08a, 0xfbcfe8, 0xbbf7d0, 0xe9d5ff];
        for (let i = 0; i < count; i++) {
          const g = new Graphics();
          const c = breezeColors[i % breezeColors.length];
          if (i % 2 === 0) {
            const r = 6 + (i % 4) * 3.5;
            g.circle(0, 0, r);
            g.fill({ color: 0xffffff, alpha: 0.45 });
            g.stroke({ width: 1.8, color: c, alpha: 0.85 });
            g.circle(-r * 0.3, -r * 0.3, r * 0.25);
            g.fill({ color: 0xffffff, alpha: 0.85 });
          } else {
            g.star(0, 0, 5, 8, 3.5);
            g.fill({ color: c, alpha: 0.9 });
            g.stroke({ width: 1.2, color: 0xffffff, alpha: 0.85 });
          }
          g.position.set(16 + Math.random() * 60, rect.height * (0.2 + Math.random() * 0.65));
          layer.addChild(g);
          particlesRef.current.push({
            graphic: g,
            vx: (4.5 + Math.random() * 6.5) * intensity,
            vy: -1.5 + (Math.random() - 0.5) * 3.2,
            gravity: -0.03,
            drag: 0.985,
            life: 0,
            maxLife: 56,
            spin: (Math.random() - 0.5) * 0.22,
            scaleStart: 0.9,
            scaleEnd: 1.25,
            kind: 'bubble',
          });
        }
      });

      const stopJuice = subscribeJuice((impact) => {
        const host = hostRef.current;
        if (!host || reducedMotionRef.current || pausedRef.current || document.hidden || getPlayFeedbackMode() === 'quiet') return;
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
          spawnPhysicsCandies(localX, localY, 2);
        } else if (impact.kind === 'success') {
          spawnParticles({
            x: localX,
            y: localY,
            color: 0xfacc15,
            secondaryColor: 0xf472b6,
            count: 26,
            kind: 'star',
          });
          spawnPhysicsCandies(localX, localY, 6);
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
      return () => {
        stopWind();
        stopJuice();
      };
    }, []);

    useEffect(() => {
      const host = hostRef.current;
      if (!host) return;

      if (reducedMotion) return;
      let disposed = false;
      const app = new Application();
      appRef.current = app;
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
          const physicsLayer = new Container();
          const fxLayer = new Container();
          app.stage.addChild(ambientLayer);
          app.stage.addChild(physicsLayer);
          app.stage.addChild(fxLayer);
          layerRef.current = fxLayer;
          physicsLayerRef.current = physicsLayer;

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

            // Theme critters: fluttering butterflies for garden/picnic
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
            if (document.hidden || pausedRef.current) return;
            const dt = Math.min(2.5, ticker.deltaTime);
            windBoostRef.current *= 0.95;
            ambientTick += (0.02 + windBoostRef.current * 0.025) * dt;

            const w = app.screen.width || 360;
            const h = app.screen.height || 480;

            for (const beam of sunbeams) {
              beam.g.x = beam.baseX * w + Math.sin(ambientTick * 0.4 + beam.phase) * 24;
              beam.g.alpha = 0.75 + Math.sin(ambientTick * 0.7 + beam.phase) * 0.25;
            }

            for (const mote of motes) {
              mote.g.x = mote.baseX * w + Math.sin(ambientTick * mote.speed + mote.phase) * (18 + windBoostRef.current * 24);
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

            // Step 2D Rigid-Body Physics World & sync graphics
            const world = physicsWorldRef.current;
            world.resize(w, h);
            world.step(dt);
            const activeIds = new Set<number>();
            for (const body of world.bodies) {
              activeIds.add(body.id);
              const g = physicsGraphicsRef.current.get(body.id);
              if (g) {
                g.x = body.x;
                g.y = body.y;
                g.rotation = body.angle;
                const fadeProgress = Math.max(0, (body.life - body.maxLife * 0.75) / (body.maxLife * 0.25));
                g.alpha = 1 - fadeProgress;
                g.scale.set(1 - fadeProgress * 0.3);
              }
            }
            for (const [id, g] of physicsGraphicsRef.current.entries()) {
              if (!activeIds.has(id)) {
                g.destroy();
                physicsGraphicsRef.current.delete(id);
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

      const syncVisibility = () => {
        if (disposed) return;
        if (!app.renderer) return;
        if (document.hidden || pausedRef.current) app.stop(); else app.start();
      };
      document.addEventListener('visibilitychange', syncVisibility);
      void setup().then(syncVisibility);

      return () => {
        document.removeEventListener('visibilitychange', syncVisibility);
        appRef.current = null;
        disposed = true;
        layerRef.current = null;
        physicsLayerRef.current = null;
        particlesRef.current.length = 0;
        physicsWorldRef.current.clear();
        physicsGraphicsRef.current.clear();
        try {
          if (app.renderer) {
            app.destroy(true, { children: true });
          }
        } catch {
          // Ignore teardown errors if init was still in flight
        }
      };
    }, [ambientKind, reducedMotion]);

    return (
      <div
        ref={hostRef}
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
        aria-hidden="true"
      />
    );
  }
);
