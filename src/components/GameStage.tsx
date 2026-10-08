import React from 'react';
import type { CharacterId, GameId } from '../types';
import { CHARACTERS } from '../data/characters';
import { GAME_CATALOG } from '../data/gameCatalog';
import { CharacterAvatar } from './CharacterAvatar';
import { GameArtwork } from './GameArtwork';

export function GameStage({ gameId, buddy, children }: { gameId: GameId; buddy: CharacterId; children: React.ReactNode }) {
  const game = GAME_CATALOG[gameId];
  return <section className={`game-stage theme-${game.theme}`} aria-label={game.title}>
    <div className="game-stage-intro"><div className="game-stage-miniature"><GameArtwork gameId={gameId} buddy={buddy} /></div><div><p className="eyebrow">{CHARACTERS[buddy].name}와 함께</p><h1>{game.title}</h1></div><CharacterAvatar id={buddy} size="sm" mood="waving" /></div>
    <div className="game-surface" data-game={gameId}>{children}</div>
  </section>;
}
