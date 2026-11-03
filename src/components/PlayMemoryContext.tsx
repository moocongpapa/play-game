import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CharacterId, GameId } from '../types';
import { addHarvestFruit, EMPTY_PLAY_MEMORY, normalizePlayMemory, PLAY_MEMORY_KEY, recordGameVisit,
  type HarvestFruit, type PaintedRide, type PlayCake, type PlayMemory, type RememberedColor } from '../utils/playMemory';

const noop = () => {};
const PlayMemoryContext = createContext({
  memory: EMPTY_PLAY_MEMORY,
  rememberVisit: noop as (id: GameId, buddy: CharacterId) => void,
  rememberColor: noop as (color: RememberedColor) => void,
  saveCake: noop as (cake: PlayCake) => void,
  rememberRide: noop as (ride: PaintedRide) => void,
  collectFruit: noop as (fruit: HarvestFruit) => void,
  takeFruit: noop as (id: string) => void,
});

export function PlayMemoryProvider({ children }: { children: ReactNode }) {
  const [memory, setMemory] = useState<PlayMemory>(() => {
    try { return normalizePlayMemory(JSON.parse(localStorage.getItem(PLAY_MEMORY_KEY) || 'null')); }
    catch { return normalizePlayMemory(null); }
  });
  useEffect(() => {
    try { localStorage.setItem(PLAY_MEMORY_KEY, JSON.stringify(memory)); } catch { /* Play also works with unavailable storage. */ }
  }, [memory]);
  const rememberVisit = useCallback((id: GameId, buddy: CharacterId) => setMemory(previous => recordGameVisit(previous, id, buddy)), []);
  const rememberColor = useCallback((color: RememberedColor) => setMemory(previous => {
    if (previous.favoriteColor?.hex === color.hex && previous.favoriteColor.label === color.label) return previous;
    return normalizePlayMemory({ ...previous, favoriteColor: color });
  }), []);
  const saveCake = useCallback((cake: PlayCake) => setMemory(previous => normalizePlayMemory({ ...previous, latestCake: cake })), []);
  const rememberRide = useCallback((ride: PaintedRide) => setMemory(previous => normalizePlayMemory({ ...previous, paintedRide: ride })), []);
  const collectFruit = useCallback((fruit: HarvestFruit) => setMemory(previous => addHarvestFruit(previous, fruit)), []);
  const takeFruit = useCallback((id: string) => setMemory(previous => ({ ...previous, fruitBasket: previous.fruitBasket.filter(fruit => fruit.id !== id) })), []);
  const value = useMemo(() => ({ memory, rememberVisit, rememberColor, saveCake, rememberRide, collectFruit, takeFruit }),
    [memory, rememberVisit, rememberColor, saveCake, rememberRide, collectFruit, takeFruit]);
  return <PlayMemoryContext.Provider value={value}>{children}</PlayMemoryContext.Provider>;
}
export const usePlayMemory = () => useContext(PlayMemoryContext);
