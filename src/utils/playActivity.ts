import { GAME_CATALOG, type DevelopmentArea } from '../data/gameCatalog';

/** Use the home catalog so every recorded game belongs to one report area. */
export function summarizePlayActivity(completedGames: Record<string, number>) {
  const totals: Record<DevelopmentArea, number> = { language: 0, logic: 0, care: 0, creative: 0 };
  for (const [id, game] of Object.entries(GAME_CATALOG)) {
    totals[game.developmentArea] += completedGames[id] || 0;
  }
  return totals;
}
