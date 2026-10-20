import React from 'react';
import type { CharacterId, GameId } from '../types';
import { GAME_CATALOG } from '../data/gameCatalog';
import { PlayVoiceContext } from './PlayFlowContext';
import { PixiStageOverlay } from './PixiStageOverlay';
import './GameStage.css';

const SELF_HOSTED_PIXI_GAMES = new Set<GameId>(['fruit_munch', 'trampoline_jump', 'bubble_bath']);

export function GameStage({ gameId, buddy, children, soundEnabled = false }: { gameId: GameId; buddy: CharacterId; children: React.ReactNode; soundEnabled?: boolean }) {
  const game = GAME_CATALOG[gameId];
  return <section className={`game-stage theme-${game.theme}`} aria-label={game.title}>
    <h1 className="sr-only">{game.title}</h1>
    {!SELF_HOSTED_PIXI_GAMES.has(gameId) && <PixiStageOverlay ambientKind={game.theme} className="z-20 rounded-[inherit]" />}
    <PlayVoiceContext.Provider value={{ buddy, soundEnabled }}><div className="game-surface" data-game={gameId}>{children}</div></PlayVoiceContext.Provider>
  </section>;
}
