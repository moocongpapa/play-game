import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { CharacterId, GameId } from '../types';
import { GAME_CATALOG } from '../data/gameCatalog';
import { PlayVoiceContext } from './PlayFlowContext';
import { PixiStageOverlay } from './PixiStageOverlay';
import { CharacterAvatar } from './CharacterAvatar';
import { ToyArtwork } from './ToyArtwork';
import { subscribeJuice, subscribeCombo, resetCombo, getComboState, JUICE_SPRING, type ComboState } from '../utils/juice';
import { playComboChime } from '../utils/soundEngine';
import { useBlowSensor } from '../hooks/useBlowSensor';
import './GameStage.css';

const SELF_HOSTED_PIXI_GAMES = new Set<GameId>(['fruit_munch', 'trampoline_jump', 'bubble_bath']);

export function GameStage({ gameId, buddy, children, soundEnabled = false }: { gameId: GameId; buddy: CharacterId; children: React.ReactNode; soundEnabled?: boolean }) {
  const game = GAME_CATALOG[gameId];
  const [celebrationTick, setCelebrationTick] = useState(0);
  const [comboState, setComboState] = useState<ComboState>(() => getComboState());
  const { micActive, blowing, toggleOrBlow } = useBlowSensor(soundEnabled);

  useEffect(() => {
    resetCombo();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubJuice = subscribeJuice((impact) => {
      if (impact.kind === 'success') {
        clearTimeout(timer);
        setCelebrationTick((n) => n + 1);
        timer = setTimeout(() => setCelebrationTick(0), 1650);
      }
    });
    let prevCombo = 0;
    const unsubCombo = subscribeCombo((state) => {
      setComboState(state);
      if (state.combo > prevCombo && state.combo >= 1) {
        playComboChime(state.combo, soundEnabled);
      }
      prevCombo = state.combo;
    });
    return () => {
      clearTimeout(timer);
      unsubJuice();
      unsubCombo();
    };
  }, [gameId, soundEnabled]);

  return <section className={`game-stage theme-${game.theme}`} data-fever={comboState.fever ? 'true' : undefined} aria-label={game.title}>
    <h1 className="sr-only">{game.title}</h1>
    {!SELF_HOSTED_PIXI_GAMES.has(gameId) && <PixiStageOverlay ambientKind={game.theme} className="z-20 rounded-[inherit]" />}
    <div className="game-stage-hud">
      <AnimatePresence>
        {comboState.combo >= 2 && (
          <motion.div
            key={comboState.combo}
            initial={{ scale: 0.55, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={JUICE_SPRING}
            aria-hidden="true"
            className={`game-fever-badge ${comboState.fever ? 'is-fever' : ''}`}
          >
            <span>{comboState.fever ? '🌈 FEVER' : '✨ COMBO'}</span>
            <strong>x{comboState.combo}</strong>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        onClick={toggleOrBlow}
        data-listening={micActive ? 'true' : undefined}
        data-blowing={blowing ? 'true' : undefined}
        className="game-blow-btn"
        aria-label={micActive ? '후~ 불기 마이크 켜짐 (탭하면 바람 불기)' : '후~ 바람 불기 및 마이크 켜기'}
        title="후~! 불거나 탭하면 바람이 불어요"
      >
        <span className="text-lg leading-none" aria-hidden="true">{blowing ? '🌪️' : '🌬️'}</span>
        <span className="text-xs font-extrabold tracking-tight" aria-hidden="true">후~</span>
      </motion.button>
    </div>
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
