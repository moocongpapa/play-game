import React from 'react';
import type { CharacterId, GameId } from '../types';
import { GAME_CATALOG } from '../data/gameCatalog';
import { PlayVoiceContext } from './PlayFlowContext';
import './GameStage.css';

export function GameStage({ gameId, buddy, children, soundEnabled = false }: { gameId: GameId; buddy: CharacterId; children: React.ReactNode; soundEnabled?: boolean }) {
  const game = GAME_CATALOG[gameId];
  return <section className={`game-stage theme-${game.theme}`} aria-label={game.title}>
    <h1 className="sr-only">{game.title}</h1>
    <PlayVoiceContext.Provider value={{ buddy, soundEnabled }}><div className="game-surface" data-game={gameId}>{children}</div></PlayVoiceContext.Provider>
  </section>;
}
