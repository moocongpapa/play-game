import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { CharacterId, GameId } from '../types';
import { GAME_CATALOG } from '../data/gameCatalog';
import { PlayVoiceContext } from './PlayFlowContext';
import { PixiStageOverlay } from './PixiStageOverlay';
import { CharacterAvatar } from './CharacterAvatar';
import { ToyArtwork } from './ToyArtwork';
import { subscribeJuice, JUICE_SPRING } from '../utils/juice';
import './GameStage.css';

const SELF_HOSTED_PIXI_GAMES = new Set<GameId>(['fruit_munch', 'trampoline_jump', 'bubble_bath']);

export function GameStage({ gameId, buddy, children, soundEnabled = false }: { gameId: GameId; buddy: CharacterId; children: React.ReactNode; soundEnabled?: boolean }) {
  const game = GAME_CATALOG[gameId];
  const [celebrationTick, setCelebrationTick] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = subscribeJuice((impact) => {
      if (impact.kind === 'success') {
        clearTimeout(timer);
        setCelebrationTick((n) => n + 1);
        timer = setTimeout(() => setCelebrationTick(0), 1650);
      }
    });
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [gameId]);

  return <section className={`game-stage theme-${game.theme}`} aria-label={game.title}>
    <h1 className="sr-only">{game.title}</h1>
    {!SELF_HOSTED_PIXI_GAMES.has(gameId) && <PixiStageOverlay ambientKind={game.theme} className="z-20 rounded-[inherit]" />}
    <PlayVoiceContext.Provider value={{ buddy, soundEnabled }}><div className="game-surface" data-game={gameId}>{children}</div></PlayVoiceContext.Provider>
    <AnimatePresence>
      {celebrationTick > 0 && (
        <motion.div
          key={celebrationTick}
          initial={{ scale: 0.5, opacity: 0, y: 28 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.75, opacity: 0, y: 16 }}
          transition={JUICE_SPRING}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 bg-gradient-to-r from-[#FFF9DB] via-white to-[#FFF0F6] border-3 border-[#FFD93D] rounded-full px-4 py-1.5 shadow-[0_7px_0_#F59E0B,0_14px_28px_rgba(245,158,11,0.32)]"
        >
          <span className="w-8 h-8 flex items-center justify-center animate-bounce"><ToyArtwork emoji="⭐" /></span>
          <div className="-my-1"><CharacterAvatar id={buddy} size="sm" mood="dancing" /></div>
          <span className="w-8 h-8 flex items-center justify-center animate-bounce" style={{ animationDelay: '0.12s' }}><ToyArtwork emoji="🌟" /></span>
        </motion.div>
      )}
    </AnimatePresence>
  </section>;
}
