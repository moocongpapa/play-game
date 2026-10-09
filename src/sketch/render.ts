import {
  backgrounds,
  defaultView,
  exportBounds,
  contentBounds,
  type ViewBox,
  random,
  stickerKinds,
  type Artwork,
  type Stroke,
  type Sticker,
  type Point,
} from './model';
import { templates } from './art';
const paths = new Map<string, Path2D>();
const path = (d: string) => {
  let p = paths.get(d);
  if (!p) {
    p = new Path2D(d);
    paths.set(d, p);
  }
  return p;
};
export function drawBase(
  c: CanvasRenderingContext2D,
  a: Artwork,
  view: ViewBox = defaultView,
) {
  c.clearRect(view.x, view.y, view.width, view.height);
  c.fillStyle = backgrounds.find((b) => b.id === a.background)?.color || '#fff';
  c.fillRect(view.x, view.y, view.width, view.height);
  if (a.background === 'grid') {
    c.strokeStyle = '#dce8ef';
    c.lineWidth = 1;
    c.beginPath();
    for (
      let x = Math.floor(view.x / 40) * 40;
      x < view.x + view.width;
      x += 40
    ) {
      c.moveTo(x, view.y);
      c.lineTo(x, view.y + view.height);
    }
    for (
      let y = Math.floor(view.y / 40) * 40;
      y < view.y + view.height;
      y += 40
    ) {
      c.moveTo(view.x, y);
      c.lineTo(view.x + view.width, y);
    }
    c.stroke();
  } else if (a.background === 'night') {
    const rand = random(1024);
    for (let i = 0; i < 70; i++) {
      const sx = view.x + rand() * view.width;
      const sy = view.y + rand() * view.height;
      const sr = 1 + rand() * 2.2;
      c.fillStyle = rand() > 0.35 ? '#ffffffdd' : '#fbe382dd';
      c.beginPath();
      c.arc(sx, sy, sr, 0, Math.PI * 2);
      c.fill();
    }
  } else if (a.background === 'chalkboard') {
    const rand = random(512);
    c.fillStyle = '#ffffff08';
    for (let i = 0; i < 3000; i++) {
      c.fillRect(
        view.x + rand() * view.width,
        view.y + rand() * view.height,
        2,
        2,
      );
    }
  } else if (a.background === 'dots') {
    c.fillStyle = '#e8b89838';
    const step = 45;
    for (
      let x = Math.floor(view.x / step) * step;
      x < view.x + view.width;
      x += step
    ) {
      for (
        let y = Math.floor(view.y / step) * step;
        y < view.y + view.height;
        y += step
      ) {
        c.beginPath();
        c.arc(x, y, 3.2, 0, Math.PI * 2);
        c.fill();
      }
    }
  } else if (a.background !== 'white') {
    const rand = random(743);
    c.fillStyle = '#806e4110';
    for (let i = 0; i < 4500; i++)
      c.fillRect(
        view.x + rand() * view.width,
        view.y + rand() * view.height,
        1.5,
        1.5,
      );
  }
  drawTemplate(c, a);
}

function drawTemplate(c: CanvasRenderingContext2D, a: Artwork) {
  const t = templates.find((t) => t.id === a.template);
  if (!t) return;
  c.save();
  c.scale(2, 2);
  c.strokeStyle = '#51493f';
  c.lineWidth = 4;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  for (const r of t.regions) {
    c.fillStyle = r.fixed || a.fills[r.id] || '#fff';
    c.fill(path(r.d));
    c.stroke(path(r.d));
  }
  for (const d of t.lines) c.stroke(path(d));
  c.restore();
}
export function hitRegion(c: CanvasRenderingContext2D, a: Artwork, p: Point) {
  const t = templates.find((t) => t.id === a.template);
  if (!t) return null;
  c.save();
  c.resetTransform();
  let hit: string | null = null;
  for (const r of [...t.regions].reverse()) {
    if (c.isPointInPath(path(r.d), p.x / 2, p.y / 2)) {
      hit = r.fixed ? null : r.id;
      break;
    }
  }
  c.restore();
  return hit;
}
export function drawStroke(c: CanvasRenderingContext2D, s: Stroke) {
  if (!s.points.length) return;
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.fillStyle = s.color;
  c.strokeStyle = s.color;
  c.lineWidth = s.size;
  if (s.brush === 'eraser') c.globalCompositeOperation = 'destination-out';
  if (s.brush === 'pen' || s.brush === 'eraser') {
    c.beginPath();
    const first = s.points[0];
    c.moveTo(first.x, first.y);
    for (let i = 1; i < s.points.length - 1; i++) {
      const p = s.points[i],
        next = s.points[i + 1];
      c.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2);
    }
    const last = s.points[s.points.length - 1];
    c.lineTo(last.x, last.y);
    c.stroke();
    if (s.points.length === 1) {
      c.beginPath();
      c.arc(first.x, first.y, s.size / 2, 0, Math.PI * 2);
      c.fill();
    }
  } else if (s.brush === 'rainbow') {
    if (s.points.length === 1) {
      const p = s.points[0];
      const hue = s.seed % 360;
      c.fillStyle = `hsl(${hue}, 95%, 58%)`;
      c.beginPath();
      c.arc(p.x, p.y, s.size / 2, 0, Math.PI * 2);
      c.fill();
    } else {
      for (let i = 0; i < s.points.length - 1; i++) {
        const p1 = s.points[i];
        const p2 = s.points[i + 1];
        const hue = (s.seed + i * 16) % 360;
        c.strokeStyle = `hsl(${hue}, 95%, 58%)`;
        c.lineWidth = s.size;
        c.beginPath();
        c.moveTo(p1.x, p1.y);
        c.lineTo(p2.x, p2.y);
        c.stroke();
      }
    }
  } else if (s.brush === 'neon') {
    const drawPath = () => {
      c.beginPath();
      const first = s.points[0];
      c.moveTo(first.x, first.y);
      for (let i = 1; i < s.points.length - 1; i++) {
        const p = s.points[i],
          next = s.points[i + 1];
        c.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2);
      }
      const last = s.points[s.points.length - 1];
      c.lineTo(last.x, last.y);
      c.stroke();
      if (s.points.length === 1) {
        c.beginPath();
        c.arc(first.x, first.y, c.lineWidth / 2, 0, Math.PI * 2);
        c.fill();
      }
    };
    c.save();
    c.shadowColor = s.color;
    c.shadowBlur = s.size * 1.5;
    c.strokeStyle = s.color;
    c.fillStyle = s.color;
    c.lineWidth = s.size;
    drawPath();
    c.restore();

    c.save();
    c.shadowColor = s.color;
    c.shadowBlur = s.size * 0.4;
    c.strokeStyle = '#ffffff';
    c.fillStyle = '#ffffff';
    c.lineWidth = Math.max(2, s.size * 0.35);
    drawPath();
    c.restore();
  } else if (s.brush === 'bubble') {
    const rand = random(s.seed);
    const step = Math.max(3, s.size * 0.38);
    const stampBubble = (x: number, y: number) => {
      const r = (s.size / 2) * (0.65 + rand() * 0.6);
      const ox = (rand() - 0.5) * s.size * 0.3;
      const oy = (rand() - 0.5) * s.size * 0.3;
      const bx = x + ox,
        by = y + oy;
      c.save();
      c.fillStyle = s.color + '2b';
      c.beginPath();
      c.arc(bx, by, r, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = s.color + 'cc';
      c.lineWidth = Math.max(1.5, r * 0.12);
      c.stroke();
      c.fillStyle = '#ffffffdd';
      c.beginPath();
      c.arc(
        bx - r * 0.35,
        by - r * 0.35,
        Math.max(1.2, r * 0.22),
        0,
        Math.PI * 2,
      );
      c.fill();
      c.restore();
    };
    stampBubble(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) {
      const a = s.points[i - 1],
        b = s.points[i],
        dist = Math.hypot(b.x - a.x, b.y - a.y),
        n = Math.max(1, Math.ceil(dist / step));
      for (let j = 1; j <= n; j++)
        stampBubble(a.x + ((b.x - a.x) * j) / n, a.y + ((b.y - a.y) * j) / n);
    }
  } else {
    const rand = random(s.seed);
    const step = Math.max(1.5, s.size * (s.brush === 'water' ? 0.24 : 0.13));
    const stamp = (x: number, y: number) => {
      if (s.brush === 'water') {
        const g = c.createRadialGradient(x, y, 0, x, y, s.size / 2);
        g.addColorStop(0, s.color + '22');
        g.addColorStop(0.68, s.color + '12');
        g.addColorStop(1, s.color + '00');
        c.fillStyle = g;
        c.fillRect(x - s.size / 2, y - s.size / 2, s.size, s.size);
      } else {
        c.globalAlpha = s.brush === 'pencil' ? 0.19 : 0.37;
        const n = s.brush === 'pencil' ? 6 : 14;
        for (let k = 0; k < n; k++) {
          const angle = rand() * Math.PI * 2,
            r = (Math.sqrt(rand()) * s.size) / 2;
          c.beginPath();
          c.arc(
            x + Math.cos(angle) * r,
            y + Math.sin(angle) * r,
            (s.brush === 'pencil' ? 0.5 : 1) + rand() * s.size * 0.045,
            0,
            Math.PI * 2,
          );
          c.fill();
        }
      }
    };
    stamp(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) {
      const a = s.points[i - 1],
        b = s.points[i],
        dist = Math.hypot(b.x - a.x, b.y - a.y),
        n = Math.max(1, Math.ceil(dist / step));
      for (let j = 1; j <= n; j++)
        stamp(a.x + ((b.x - a.x) * j) / n, a.y + ((b.y - a.y) * j) / n);
    }
  }
  if (s.glitter && s.brush !== 'eraser') {
    const rand = random(s.seed + 37);
    c.globalAlpha = 0.85;
    c.globalCompositeOperation = 'source-over';
    for (let i = 0; i < s.points.length; i += 2) {
      const p = s.points[i],
        x = p.x + (rand() - 0.5) * s.size * 1.8,
        y = p.y + (rand() - 0.5) * s.size * 1.8,
        r = 2 + rand() * 4;
      c.fillStyle = rand() > 0.5 ? '#ffdd65' : '#ffffff';
      c.beginPath();
      c.moveTo(x, y - r);
      c.lineTo(x + r * 0.3, y - r * 0.3);
      c.lineTo(x + r, y);
      c.lineTo(x + r * 0.3, y + r * 0.3);
      c.lineTo(x, y + r);
      c.lineTo(x - r * 0.3, y + r * 0.3);
      c.lineTo(x - r, y);
      c.lineTo(x - r * 0.3, y - r * 0.3);
      c.closePath();
      c.fill();
    }
  }
  c.restore();
}
export function drawSticker(
  c: CanvasRenderingContext2D,
  s: Sticker,
  scale = 1,
) {
  c.save();
  c.translate(s.x, s.y);
  c.rotate(s.rotation);
  const totalScale = (s.scale ?? 1) * scale;
  c.scale(totalScale, totalScale);
  c.font = '90px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(stickerKinds.find((k) => k.id === s.kind)?.emoji || '⭐', 0, 0);
  c.restore();
}
export function hitSticker(stickers: Sticker[], p: Point) {
  return [...stickers]
    .reverse()
    .find((s) => {
      const radius = 55 * (s.scale ?? 1);
      return Math.abs(s.x - p.x) < radius && Math.abs(s.y - p.y) < radius;
    });
}
export function prepareView(c: CanvasRenderingContext2D, view: ViewBox) {
  const scale = c.canvas.width / view.width;
  c.setTransform(scale, 0, 0, scale, -view.x * scale, -view.y * scale);
}
export function renderArtwork(a: Artwork, { transparent = false } = {}) {
  const view = transparent ? contentBounds(a) : exportBounds(a),
    scale = Math.min(transparent ? 2 : 1, 2400 / Math.max(view.width, view.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(view.width * scale);
  canvas.height = Math.round(view.height * scale);
  const c = canvas.getContext('2d')!;
  prepareView(c, view);
  if (transparent) drawTemplate(c, a);
  else drawBase(c, a, view);
  const ink = document.createElement('canvas');
  ink.width = canvas.width;
  ink.height = canvas.height;
  const ic = ink.getContext('2d')!;
  prepareView(ic, view);
  a.strokes.forEach((s) => drawStroke(ic, s));
  c.resetTransform();
  c.drawImage(ink, 0, 0);
  prepareView(c, view);
  a.stickers.forEach((s) => drawSticker(c, s));
  return canvas;
}

/**
 * Render character sprite on transparent background for living character animation
 */
export function renderCharacterSprite(a: Artwork): string {
  return renderArtwork(a, { transparent: true }).toDataURL('image/png');
}
