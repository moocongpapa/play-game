/** Fisher–Yates shuffle; never mutate the content library. */
export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createRoundDeck(random = Math.random) {
  const decks = new Map<string, { remaining: string[]; last?: string; signature: string }>();
  return <T extends { id: string }>(pool: readonly T[], key: string): T => {
    if (!pool.length) throw new Error(`Empty content deck: ${key}`);
    const signature = pool.map(item => item.id).join('|');
    let deck = decks.get(key);
    if (!deck || deck.signature !== signature) {
      deck = { remaining: [], signature };
      decks.set(key, deck);
    }
    if (!deck.remaining.length) {
      deck.remaining = shuffle(pool.map(item => item.id), random);
      // Even the first card of a new cycle differs from the previous one.
      if (deck.remaining.length > 1 && deck.remaining[0] === deck.last) {
        [deck.remaining[0], deck.remaining[1]] = [deck.remaining[1], deck.remaining[0]];
      }
    }
    const id = deck.remaining.shift()!;
    deck.last = id;
    return pool.find(item => item.id === id)!;
  };
}

// A session deck survives home → game navigation. No progress or saved rewards change.
export const pickNextRound = createRoundDeck();
