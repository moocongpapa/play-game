import { templateBounds } from './template-bounds';
export const WIDTH = 1200,
  HEIGHT = 900;
export type Brush =
  | 'crayon'
  | 'pen'
  | 'pencil'
  | 'water'
  | 'eraser'
  | 'rainbow'
  | 'neon'
  | 'bubble';
export type Point = { x: number; y: number };
export type Stroke = {
  id: string;
  brush: Brush;
  color: string;
  size: number;
  glitter: boolean;
  seed: number;
  points: Point[];
};
export type Sticker = {
  id: string;
  kind: string;
  x: number;
  y: number;
  rotation: number;
  scale?: number;
};
export type Artwork = {
  version: 1;
  viewBox?: ViewBox;
  id: string;
  updatedAt: number;
  background: string;
  template: string | null;
  fills: Record<string, string>;
  strokes: Stroke[];
  stickers: Sticker[];
};
export type History = { past: Artwork[]; present: Artwork; future: Artwork[] };
export const backgrounds = [
  { id: 'white', label: '하얀 도화지', color: '#ffffff' },
  { id: 'grid', label: '격자 노트', color: '#ffffff' },
  { id: 'pink', label: '분홍 색종이', color: '#ffe3e8' },
  { id: 'sky', label: '하늘 색종이', color: '#dff1ff' },
  { id: 'yellow', label: '노랑 색종이', color: '#fff3c8' },
  { id: 'green', label: '연두 색종이', color: '#e5f2d6' },
  { id: 'night', label: '별빛 밤하늘', color: '#16192e' },
  { id: 'chalkboard', label: '초록 칠판', color: '#1d3e2b' },
  { id: 'dots', label: '도트 색종이', color: '#fff9f0' },
];
export const colors = [
  ['빨강', '#ef6570'],
  ['주황', '#f5955d'],
  ['노랑', '#f6cf59'],
  ['연두', '#b5cd70'],
  ['초록', '#63ad7c'],
  ['민트', '#6cc3bc'],
  ['하늘', '#7cbce3'],
  ['파랑', '#658bd6'],
  ['보라', '#aa8acd'],
  ['분홍', '#ea9ec0'],
  ['갈색', '#a97b5e'],
  ['검정', '#464751'],
  ['진한 빨강', '#bf4058'],
  ['살구', '#ffd1b3'],
  ['연노랑', '#f9e9a0'],
  ['올리브', '#7c994a'],
  ['진초록', '#357b63'],
  ['청록', '#388c9c'],
  ['남색', '#405f99'],
  ['연보라', '#d1c1ed'],
  ['자주', '#a45c98'],
  ['연분홍', '#ffd2e0'],
  ['회색', '#a5a6ad'],
  ['하양', '#ffffff'],
];
export const stickerKinds = [
  { id: 'heart', emoji: '💖', label: '하트' },
  { id: 'star', emoji: '⭐', label: '반짝별' },
  { id: 'rainbow', emoji: '🌈', label: '무지개' },
  { id: 'sparkles', emoji: '✨', label: '반짝이' },
  { id: 'ribbon', emoji: '🎀', label: '리본' },
  { id: 'smile', emoji: '🥰', label: '스마일' },
  { id: 'dog', emoji: '🐶', label: '강아지' },
  { id: 'cat', emoji: '🐱', label: '고양이' },
  { id: 'rabbit', emoji: '🐰', label: '토끼' },
  { id: 'bear', emoji: '🐻', label: '곰돌이' },
  { id: 'dino', emoji: '🦖', label: '공룡' },
  { id: 'chick', emoji: '🐥', label: '병아리' },
  { id: 'strawberry', emoji: '🍓', label: '딸기' },
  { id: 'icecream', emoji: '🍦', label: '아이스크림' },
  { id: 'candy', emoji: '🍭', label: '사탕' },
  { id: 'cake', emoji: '🎂', label: '케이크' },
  { id: 'car', emoji: '🚗', label: '자동차' },
  { id: 'rocket', emoji: '🚀', label: '로켓' },
  { id: 'crown', emoji: '👑', label: '왕관' },
  { id: 'balloon', emoji: '🎈', label: '풍선' },
  { id: 'flower', emoji: '🌸', label: '꽃' },
  { id: 'sun', emoji: '☀️', label: '햇님' },
  { id: 'paw', emoji: '🐾', label: '발자국' },
  { id: 'music', emoji: '🎵', label: '음표' },
];
export function freshArtwork(template: string | null = null): Artwork {
  return {
    version: 1,
    id: crypto.randomUUID(),
    updatedAt: Date.now(),
    background: 'white',
    template,
    fills: {},
    strokes: [],
    stickers: [],
  };
}
export function change(h: History, doc: Artwork): History {
  return {
    past: [...h.past, h.present].slice(-60),
    present: { ...doc, updatedAt: Date.now() },
    future: [],
  };
}
export function undo(h: History): History {
  return h.past.length
    ? {
        past: h.past.slice(0, -1),
        present: h.past[h.past.length - 1],
        future: [h.present, ...h.future],
      }
    : h;
}
export function redo(h: History): History {
  return h.future.length
    ? {
        past: [...h.past, h.present].slice(-60),
        present: h.future[0],
        future: h.future.slice(1),
      }
    : h;
}
export function coordinates(
  clientX: number,
  clientY: number,
  r: { left: number; top: number; width: number; height: number },
): Point {
  return {
    x: Math.max(0, Math.min(WIDTH, ((clientX - r.left) * WIDTH) / r.width)),
    y: Math.max(0, Math.min(HEIGHT, ((clientY - r.top) * HEIGHT) / r.height)),
  };
}
export function random(seed: number) {
  let n = seed | 0;
  return () => {
    n ^= n << 13;
    n ^= n >>> 17;
    n ^= n << 5;
    return (n >>> 0) / 4294967296;
  };
}
export function hasDrawing(a: Artwork) {
  return (
    a.strokes.length > 0 ||
    a.stickers.length > 0 ||
    Object.keys(a.fills).length > 0
  );
}
export function validArtwork(a: unknown): a is Artwork {
  if (!a || typeof a !== 'object') return false;
  const d = a as Artwork;
  return (
    d.version === 1 &&
    typeof d.id === 'string' &&
    Array.isArray(d.strokes) &&
    Array.isArray(d.stickers) &&
    typeof d.background === 'string' &&
    !!d.fills
  );
}

/** World coordinates stay unchanged when the screen rotates. */
export type ViewBox = { x: number; y: number; width: number; height: number };
export const defaultView: ViewBox = {
  x: 0,
  y: 0,
  width: WIDTH,
  height: HEIGHT,
};
export function contentBounds(a: Artwork): ViewBox {
  const base = (a.template && templateBounds[a.template]) || defaultView;
  let left = base.x,
    top = base.y,
    right = base.x + base.width,
    bottom = base.y + base.height;
  for (const s of a.strokes) {
    if (s.brush === 'eraser') continue;
    const padding = s.size * 2 + 8;
    for (const p of s.points) {
      left = Math.min(left, p.x - padding);
      top = Math.min(top, p.y - padding);
      right = Math.max(right, p.x + padding);
      bottom = Math.max(bottom, p.y + padding);
    }
  }
  for (const s of a.stickers) {
    const radius = 70 * (s.scale ?? 1);
    left = Math.min(left, s.x - radius);
    top = Math.min(top, s.y - radius);
    right = Math.max(right, s.x + radius);
    bottom = Math.max(bottom, s.y + radius);
  }
  return { x: left, y: top, width: right - left, height: bottom - top };
}
export function fitView(
  bounds: ViewBox,
  width: number,
  height: number,
): ViewBox {
  const scale = Math.min(width / bounds.width, height / bounds.height);
  const w = width / scale,
    h = height / scale;
  return {
    x: bounds.x - (w - bounds.width) / 2,
    y: bounds.y - (h - bounds.height) / 2,
    width: w,
    height: h,
  };
}
export function viewPoint(
  x: number,
  y: number,
  r: { left: number; top: number; width: number; height: number },
  view: ViewBox,
): Point {
  return {
    x: view.x + Math.max(0, Math.min(1, (x - r.left) / r.width)) * view.width,
    y: view.y + Math.max(0, Math.min(1, (y - r.top) / r.height)) * view.height,
  };
}
/** Fit the actual character inside the area above the floating controls. */
export function artworkView(a: Artwork, width: number, height: number): ViewBox {
  const bounds = contentBounds(a);
  if (!a.template) return fitView(bounds, width, height);
  const side = Math.min(16, width * 0.04);
  const top = Math.min(44, height * 0.1);
  const bottom = Math.min(100, height * 0.22);
  const availableWidth = width - side * 2;
  const availableHeight = height - top - bottom;
  const scale = Math.min(availableWidth / bounds.width, availableHeight / bounds.height);
  return {
    x: bounds.x + bounds.width / 2 - width / (2 * scale),
    y: bounds.y + bounds.height / 2 - (top + availableHeight / 2) / scale,
    width: width / scale,
    height: height / scale,
  };
}
export function exportBounds(a: Artwork): ViewBox {
  const b = contentBounds(a),
    v = a.viewBox || b;
  const x = Math.min(b.x, v.x),
    y = Math.min(b.y, v.y);
  return {
    x,
    y,
    width: Math.max(b.x + b.width, v.x + v.width) - x,
    height: Math.max(b.y + b.height, v.y + v.height) - y,
  };
}
