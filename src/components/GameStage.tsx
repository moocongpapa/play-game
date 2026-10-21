import React, { lazy, Suspense, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Wind } from 'lucide-react';
import type { CharacterId, GameId } from '../types';
import { GAME_CATALOG } from '../data/gameCatalog';
import { PlayHintsPausedContext, PlayVoiceContext } from './PlayFlowContext';
import { subscribeCombo, resetCombo, getComboState, setPlayFeedbackMode, JUICE_SPRING, type ComboState } from '../utils/juice';
import { feedbackModeForGame, WIND_GAMES } from '../utils/playFeedback';
import { useBlowSensor } from '../hooks/useBlowSensor';
import './GameStage.css';

const PlayEffects = lazy(() => import('./PixiStageOverlay').then(m => ({ default: m.PixiStageOverlay })));
const LOCAL_FEEDBACK_GAMES = new Set<GameId>(['fruit_munch', 'trampoline_jump', 'bubble_bath', 'block_tower', 'mirror_maze', 'forest_peekaboo']);

export function GameStage({ gameId, buddy, children, soundEnabled = false, microphoneEnabled = false }: {
  gameId: GameId; buddy: CharacterId; children: React.ReactNode; soundEnabled?: boolean; microphoneEnabled?: boolean;
}) {
  const game = GAME_CATALOG[gameId];
  const mode = feedbackModeForGame(gameId);
  const reduced = useReducedMotion();
  const paused = useContext(PlayHintsPausedContext);
  const [comboState, setComboState] = useState<ComboState>(() => getComboState());
  const { micActive, blowing, toggleOrBlow } = useBlowSensor(soundEnabled, undefined, microphoneEnabled && WIND_GAMES.has(gameId) && !paused);
  useLayoutEffect(() => {
    setPlayFeedbackMode(mode);
    resetCombo();
    return () => { setPlayFeedbackMode('play'); resetCombo(); };
  }, [gameId, mode]);
  useEffect(() => subscribeCombo(setComboState), []);

  return <section className={`game-stage theme-${game.theme}`} data-feedback={mode} aria-label={game.title}>
    <h1 className="sr-only">{game.title}</h1>
    {mode !== 'quiet' && !LOCAL_FEEDBACK_GAMES.has(gameId) && <Suspense fallback={null}>
      <PlayEffects ambientKind={game.theme} className="z-20 rounded-[inherit]" />
    </Suspense>}
    <div className="game-stage-hud">
      {mode === 'play' && comboState.combo > 0 && <output className="sr-only" aria-label={`함께 해낸 놀이 ${comboState.combo}번`}>{comboState.combo}</output>}
      {WIND_GAMES.has(gameId) && <motion.button type="button" whileTap={reduced ? undefined : { scale: .94 }} transition={JUICE_SPRING}
        onClick={toggleOrBlow} data-listening={micActive || undefined} data-blowing={blowing || undefined}
        className="game-blow-btn" aria-label="바람 불기"><Wind aria-hidden="true" /></motion.button>}
    </div>
    <PlayVoiceContext.Provider value={{ buddy, soundEnabled }}><div className="game-surface" data-game={gameId}>{children}</div></PlayVoiceContext.Provider>
  </section>;
}
