import type { CharacterId, GameId } from '../types';
import { GAME_CATALOG } from '../data/gameCatalog';

export const PLAY_MEMORY_KEY = 'ITSME_PLAY_MEMORY_V1';
export interface RememberedColor { hex: string; label: string }
export interface HarvestFruit { id: string; kind: 'apple' | 'orange' | 'peach'; label: string }
export interface PlayCake { title: string; colors: string[]; toppings: string[] }
export interface PaintedRide { kind: 'car' | 'rocket' | 'boat'; colors: string[] }
export interface PlayMemory {
  recentGames: GameId[];
  visits: Partial<Record<GameId, number>>;
  fruitBasket: HarvestFruit[];
  favoriteColor?: RememberedColor;
  latestCake?: PlayCake;
  paintedRide?: PaintedRide;
  lastBuddy?: CharacterId;
}
export const EMPTY_PLAY_MEMORY: PlayMemory = { recentGames: [], visits: {}, fruitBasket: [] };
const isGame = (id: unknown): id is GameId => typeof id === 'string' && Object.hasOwn(GAME_CATALOG, id);
const hex = (value: unknown): value is string => typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);
const label = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 80;
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const colors = (value: unknown) => Array.isArray(value) ? value.filter(hex).slice(0, 6) : [];

/** Local play keepsakes are small, validated, and independent of artwork/audio stores. */
export function normalizePlayMemory(value: unknown): PlayMemory {
  if (!record(value)) return { ...EMPTY_PLAY_MEMORY };
  const visits: PlayMemory['visits'] = {};
  if (record(value.visits)) for (const [id, count] of Object.entries(value.visits)) {
    if (isGame(id) && typeof count === 'number' && Number.isFinite(count) && count > 0) visits[id] = Math.min(99999, Math.floor(count));
  }
  const fruitBasket: HarvestFruit[] = [];
  if (Array.isArray(value.fruitBasket)) for (const item of value.fruitBasket.slice(-6)) {
    if (record(item) && label(item.id) && label(item.label) && ['apple', 'orange', 'peach'].includes(String(item.kind)) && !fruitBasket.some(fruit => fruit.id === item.id)) {
      fruitBasket.push({ id: item.id, kind: item.kind as HarvestFruit['kind'], label: item.label });
    }
  }
  const memory: PlayMemory = {
    recentGames: Array.isArray(value.recentGames) ? [...new Set(value.recentGames.filter(isGame))].slice(0, 6) : [],
    visits, fruitBasket,
  };
  if (record(value.favoriteColor) && hex(value.favoriteColor.hex) && label(value.favoriteColor.label)) {
    memory.favoriteColor = { hex: value.favoriteColor.hex, label: value.favoriteColor.label };
  }
  if (record(value.latestCake) && label(value.latestCake.title) && colors(value.latestCake.colors).length) {
    memory.latestCake = { title: value.latestCake.title, colors: colors(value.latestCake.colors),
      toppings: Array.isArray(value.latestCake.toppings) ? value.latestCake.toppings.filter(label).slice(0, 6) : [] };
  }
  if (record(value.paintedRide) && ['car', 'rocket', 'boat'].includes(String(value.paintedRide.kind)) && colors(value.paintedRide.colors).length) {
    memory.paintedRide = { kind: value.paintedRide.kind as PaintedRide['kind'], colors: colors(value.paintedRide.colors) };
  }
  if (['ggomi', 'rano', 'jelly', 'dochi', 'ggulgguli', 'eumme', 'nurungji', 'pingu'].includes(String(value.lastBuddy))) memory.lastBuddy = value.lastBuddy as CharacterId;
  return memory;
}

export function recordGameVisit(memory: PlayMemory, game: GameId, buddy: CharacterId): PlayMemory {
  return { ...memory, recentGames: [game, ...memory.recentGames.filter(id => id !== game)].slice(0, 6),
    visits: { ...memory.visits, [game]: Math.min(99999, (memory.visits[game] || 0) + 1) }, lastBuddy: buddy };
}

/** Only this small shelf changes; the full catalog retains its learned positions. */
export function homeQuickGames(memory: PlayMemory, available: GameId[]): GameId[] {
  const allowed = new Set(available);
  const recent = memory.recentGames.filter(id => allowed.has(id));
  const popular = available.filter(id => memory.visits[id]).sort((a, b) => (memory.visits[b] || 0) - (memory.visits[a] || 0));
  return [...new Set([...recent.slice(0, 1), ...popular, ...recent.slice(1), 'fruit_harvest' as GameId, 'cake_deco' as GameId, 'bubble_pop' as GameId, ...available])]
    .filter(id => allowed.has(id)).slice(0, 3);
}

export function addHarvestFruit(memory: PlayMemory, fruit: HarvestFruit): PlayMemory {
  if (memory.fruitBasket.some(item => item.id === fruit.id)) return memory;
  return normalizePlayMemory({ ...memory, fruitBasket: [...memory.fruitBasket, fruit] });
}
