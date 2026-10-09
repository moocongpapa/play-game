'use client';
import { useEffect, useLayoutEffect, useRef, type PointerEvent } from 'react';
import {
  defaultView,
  artworkView,
  viewPoint,
  type Artwork,
  type Brush,
  type Stroke,
  type Sticker,
  type Point,
} from './model';
import {
  drawBase,
  drawStroke,
  drawSticker,
  hitRegion,
  hitSticker,
  prepareView,
} from './render';
type Props = {
  artwork: Artwork;
  tool: Brush | 'fill' | 'magic' | 'sticker';
  color: string;
  size: number;
  glitter: boolean;
  stickerKind: string;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onChange: (a: Artwork) => void;
  onGestureChange: (active: boolean) => void;
  onStamp: () => void;
  onDrawSound: (tool: Brush | 'fill', strength?: number) => void;
  disabled: boolean;
};
type Gesture = {
  pointer: number;
  rect?: DOMRect;
  stroke?: Stroke;
  sticker?: Sticker;
  offset?: Point;
};
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  shape: 'star' | 'circle';
};
export default function DrawingCanvas(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null),
    latest = useRef(props),
    view = useRef(defaultView);
  const layers = useRef<{
      base: HTMLCanvasElement;
      ink: HTMLCanvasElement;
      scratch: HTMLCanvasElement;
    } | null>(null),
    gesture = useRef<Gesture | null>(null),
    frame = useRef(0),
    resizePending = useRef(false),
    previous = useRef<Stroke[]>([]),
    lastId = useRef(''),
    pop = useRef<{ id: string; time: number } | null>(null),
    particles = useRef<Particle[]>([]);
  const actions = useRef({
    paint: () => {},
    refresh: () => {},
    resize: () => {},
  });
  useLayoutEffect(() => {
    latest.current = props;
  });
  function schedule() {
    if (!frame.current)
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        actions.current.paint();
      });
  }
  function update(a: Artwork) {
    latest.current.onChange({ ...a, viewBox: { ...view.current } });
  }
  function finish() {
    const g = gesture.current;
    if (!g) return;
    gesture.current = null;
    latest.current.onGestureChange(false);
    const a = latest.current.artwork;
    if (g.stroke) update({ ...a, strokes: [...a.strokes, g.stroke] });
    if (g.sticker)
      update({
        ...a,
        stickers: a.stickers.map((s) =>
          s.id === g.sticker!.id ? g.sticker! : s,
        ),
      });
    // Refresh only after React has committed the completed gesture.
    schedule();
  }
  useLayoutEffect(() => {
    actions.current.paint = () => {
      const l = layers.current,
        c = canvas.current?.getContext('2d');
      if (!l || !c) return;
      const p = latest.current;
      c.resetTransform();
      c.clearRect(0, 0, c.canvas.width, c.canvas.height);
      c.drawImage(l.base, 0, 0);
      const s = gesture.current?.stroke;
      if (s) {
        const sc = l.scratch.getContext('2d')!;
        sc.resetTransform();
        sc.clearRect(0, 0, sc.canvas.width, sc.canvas.height);
        sc.drawImage(l.ink, 0, 0);
        prepareView(sc, view.current);
        drawStroke(sc, s);
        c.drawImage(l.scratch, 0, 0);
      } else c.drawImage(l.ink, 0, 0);
      prepareView(c, view.current);
      for (const sticker of p.artwork.stickers) {
        const item =
          gesture.current?.sticker?.id === sticker.id
            ? gesture.current.sticker
            : sticker;
        let scale = 1;
        if (
          pop.current?.id === item.id &&
          !matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
          const t = (performance.now() - pop.current.time) / 280;
          if (t < 1) {
            scale = 0.7 + Math.sin(t * Math.PI * 0.65) * 0.34;
            schedule();
          } else pop.current = null;
        }
        drawSticker(c, item, scale);
        if (p.selected === item.id && p.tool === 'sticker') {
          const rad = 54 * (item.scale ?? 1);
          c.save();
          c.strokeStyle = '#799957';
          c.lineWidth = 3;
          c.setLineDash([8, 7]);
          c.strokeRect(item.x - rad, item.y - rad, rad * 2, rad * 2);
          c.restore();
        }
      }
      if (particles.current.length > 0) {
        for (let i = particles.current.length - 1; i >= 0; i--) {
          const pt = particles.current[i];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.vx *= 0.95;
          pt.vy *= 0.95;
          pt.alpha -= pt.decay;
          if (pt.alpha <= 0) {
            particles.current.splice(i, 1);
            continue;
          }
          c.save();
          c.globalAlpha = pt.alpha;
          c.fillStyle = pt.color;
          if (pt.shape === 'star') {
            const r = pt.size;
            c.beginPath();
            c.moveTo(pt.x, pt.y - r);
            c.lineTo(pt.x + r * 0.3, pt.y - r * 0.3);
            c.lineTo(pt.x + r, pt.y);
            c.lineTo(pt.x + r * 0.3, pt.y + r * 0.3);
            c.lineTo(pt.x, pt.y + r);
            c.lineTo(pt.x - r * 0.3, pt.y + r * 0.3);
            c.lineTo(pt.x - r, pt.y);
            c.lineTo(pt.x - r * 0.3, pt.y - r * 0.3);
            c.closePath();
            c.fill();
          } else {
            c.beginPath();
            c.arc(pt.x, pt.y, pt.size / 2, 0, Math.PI * 2);
            c.fill();
          }
          c.restore();
        }
        if (particles.current.length > 0) schedule();
      }
      c.resetTransform();
    };
    actions.current.refresh = () => {
      const l = layers.current;
      if (!l) return;
      const a = latest.current.artwork;
      const bc = l.base.getContext('2d')!;
      prepareView(bc, view.current);
      drawBase(bc, a, view.current);
      const c = l.ink.getContext('2d')!,
        old = previous.current;
      const append =
        lastId.current === a.id &&
        a.strokes.length >= old.length &&
        old.every((s, i) => s === a.strokes[i]);
      if (!append) {
        c.resetTransform();
        c.clearRect(0, 0, c.canvas.width, c.canvas.height);
      }
      prepareView(c, view.current);
      a.strokes.slice(append ? old.length : 0).forEach((s) => drawStroke(c, s));
      previous.current = a.strokes;
      lastId.current = a.id;
      schedule();
    };
    actions.current.resize = () => {
      const el = canvas.current,
        l = layers.current;
      if (!el || !l) return;
      // Safari's browser chrome can resize the viewport during a touch.
      // Never terminate the active stroke in response to ResizeObserver.
      if (gesture.current) {
        resizePending.current = true;
        return;
      }
      resizePending.current = false;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        2,
        2000 / Math.max(r.width, r.height),
      );
      for (const c of [el, l.base, l.ink, l.scratch]) {
        c.width = Math.round(r.width * ratio);
        c.height = Math.round(r.height * ratio);
      }
      view.current = artworkView(
        latest.current.artwork,
        r.width,
        r.height,
      );
      previous.current = [];
      lastId.current = '';
      actions.current.refresh();
    };
  });
  useEffect(() => {
    const make = () => document.createElement('canvas');
    layers.current = { base: make(), ink: make(), scratch: make() };
    const observer = new ResizeObserver(() => actions.current.resize());
    observer.observe(canvas.current!);
    actions.current.resize();
    const stop = () => finish(),
      hide = () => {
        if (document.visibilityState === 'hidden') finish();
      },
      prevent = (e: Event) => e.preventDefault();
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', hide);
    const el = canvas.current!;
    el.addEventListener('gesturestart', prevent);
    el.addEventListener('gesturechange', prevent);
    el.addEventListener('touchstart', prevent, { passive: false });
    el.addEventListener('touchmove', prevent, { passive: false });
    return () => {
      if (gesture.current) {
        gesture.current = null;
        latest.current.onGestureChange(false);
      }
      observer.disconnect();
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      layers.current = null;
      previous.current = [];
      lastId.current = '';
      window.removeEventListener('blur', stop);
      document.removeEventListener('visibilitychange', hide);
      el.removeEventListener('gesturestart', prevent);
      el.removeEventListener('gesturechange', prevent);
      el.removeEventListener('touchstart', prevent);
      el.removeEventListener('touchmove', prevent);
    };
  }, []);
  useEffect(() => {
    if (resizePending.current || lastId.current !== props.artwork.id) actions.current.resize();
    else actions.current.refresh();
  }, [props.artwork]);
  useEffect(() => schedule(), [props.selected, props.tool]);
  const point = (e: { clientX: number; clientY: number }) =>
    viewPoint(
      e.clientX,
      e.clientY,
      gesture.current?.rect || canvas.current!.getBoundingClientRect(),
      view.current,
    );
  function emitSparkles(
    x: number,
    y: number,
    count = 6,
    customColors?: string[],
  ) {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const palette = customColors || [
      '#ffea78',
      '#ff7ebb',
      '#7ee0ff',
      '#9dff88',
      '#ffad60',
    ];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 3.5;
      particles.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: palette[Math.floor(Math.random() * palette.length)],
        size: 3 + Math.random() * 5,
        alpha: 1,
        decay: 0.025 + Math.random() * 0.03,
        shape: Math.random() > 0.4 ? 'star' : 'circle',
      });
    }
    schedule();
  }
  const clampSticker = (p: Point, scale = 1) => {
    const margin = 55 * scale;
    return {
      x: Math.max(
        view.current.x + margin,
        Math.min(view.current.x + view.current.width - margin, p.x),
      ),
      y: Math.max(
        view.current.y + margin,
        Math.min(view.current.y + view.current.height - margin, p.y),
      ),
    };
  };
  function down(e: PointerEvent<HTMLCanvasElement>) {
    if (
      latest.current.disabled ||
      gesture.current ||
      !e.isPrimary ||
      e.button > 0
    )
      return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    latest.current.onGestureChange(true);
    const p = point(e),
      a = props.artwork;
    if (props.tool === 'fill' || props.tool === 'magic') {
      gesture.current = { pointer: e.pointerId };
      const id = hitRegion(layers.current!.base.getContext('2d')!, a, p);
      if (id) {
        if (props.tool === 'magic') {
          const magicPalette = [
            '#ef6570',
            '#f5955d',
            '#f6cf59',
            '#b5cd70',
            '#63ad7c',
            '#6cc3bc',
            '#7cbce3',
            '#658bd6',
            '#aa8acd',
            '#ea9ec0',
            '#ffd1b3',
            '#d1c1ed',
          ];
          const cur = a.fills[id];
          const candidates = magicPalette.filter((c) => c !== cur);
          const chosen =
            candidates[Math.floor(Math.random() * candidates.length)] ||
            '#f6cf59';
          update({ ...a, fills: { ...a.fills, [id]: chosen } });
          latest.current.onDrawSound('fill', 1);
          emitSparkles(p.x, p.y, 16, [chosen, '#ffe485', '#ffffff']);
        } else if (a.fills[id] !== props.color) {
          update({ ...a, fills: { ...a.fills, [id]: props.color } });
          latest.current.onDrawSound('fill', 1);
          emitSparkles(p.x, p.y, 12, [props.color, '#ffe485', '#ffffff']);
        }
      }
      return;
    }
    if (props.tool === 'sticker') {
      const hit = hitSticker(a.stickers, p);
      if (hit) {
        props.onSelect(hit.id);
        gesture.current = {
          pointer: e.pointerId,
          sticker: { ...hit },
          offset: { x: p.x - hit.x, y: p.y - hit.y },
        };
      } else {
        const s = {
          id: crypto.randomUUID(),
          kind: props.stickerKind,
          ...clampSticker(p),
          rotation: (Math.random() - 0.5) * 0.3,
        };
        pop.current = { id: s.id, time: performance.now() };
        update({ ...a, stickers: [...a.stickers, s] });
        props.onSelect(s.id);
        props.onStamp();
        emitSparkles(s.x, s.y, 10);
        gesture.current = { pointer: e.pointerId };
      }
      return;
    }
    props.onSelect(null);
    gesture.current = {
      pointer: e.pointerId,
      rect: e.currentTarget.getBoundingClientRect(),
      stroke: {
        id: crypto.randomUUID(),
        brush: props.tool,
        color: props.color,
        size: props.size,
        glitter: props.glitter,
        seed: Math.floor(Math.random() * 2147483646) + 1,
        points: [p],
      },
    };
    latest.current.onDrawSound(props.tool, 0.35);
    schedule();
  }
  function move(e: PointerEvent<HTMLCanvasElement>) {
    const g = gesture.current;
    if (!g || g.pointer !== e.pointerId) return;
    e.preventDefault();
    if (g.stroke) {
      const coalesced = e.nativeEvent.getCoalescedEvents?.() || [];
      let distance = 0;
      for (const ev of coalesced.length ? coalesced : [e]) {
        const p = point(ev),
          last = g.stroke.points.at(-1)!;
        const moved = Math.hypot(p.x - last.x, p.y - last.y);
        if (moved > 0.8) {
          g.stroke.points.push(p);
          distance += moved;
        }
      }
      if (distance > 0) {
        latest.current.onDrawSound(g.stroke.brush, Math.min(1, distance / 36));
        const lastP = g.stroke.points.at(-1);
        if (
          lastP &&
          (props.glitter ||
            g.stroke.brush === 'rainbow' ||
            g.stroke.brush === 'neon' ||
            g.stroke.brush === 'bubble')
        ) {
          if (Math.random() > 0.45) emitSparkles(lastP.x, lastP.y, 1);
        }
      }
    }
    if (g.sticker) {
      const p = point(e);
      g.sticker = {
        ...g.sticker,
        ...clampSticker(
          { x: p.x - g.offset!.x, y: p.y - g.offset!.y },
          g.sticker.scale ?? 1,
        ),
      };
    }
    schedule();
  }
  return (
    <canvas
      ref={canvas}
      className="block h-full w-full touch-none"
      aria-label="그림 그리는 도화지"
      data-testid="drawing-canvas"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={(e) => {
        if (gesture.current?.pointer === e.pointerId) {
          move(e);
          finish();
        }
      }}
      onPointerCancel={(e) => {
        if (gesture.current?.pointer === e.pointerId) finish();
      }}
      onLostPointerCapture={(e) => {
        if (gesture.current?.pointer === e.pointerId) finish();
      }}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
