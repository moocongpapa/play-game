import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Flame, Moon, Search } from 'lucide-react';
import type { CharacterId, AgeGroup } from '../../types';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { PlayGuide, PlayProgress } from '../../components/ToddlerPlay';
import { ToyArtwork } from '../../components/ToyArtwork';
import { PixiStageOverlay, type PixiStageHandle } from '../../components/PixiStageOverlay';
import {
  speakText,
  stopAllSpeech,
  playBouncyBoing,
  playSparkleChime,
  playCorrectFanfare,
  playComboChime,
  playJellyTap,
} from '../../utils/soundEngine';
import { fireConfetti, fireStarExplosion } from '../../utils/confetti';
import {
  emitJuice,
  recordPlaySuccess,
  resetCombo,
  subscribeCombo,
  JUICE_SPRING,
  type ComboState,
} from '../../utils/juice';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';

interface ForestPeekabooGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup?: AgeGroup;
  childName?: string;
}

type HoleOccupantType = 'target' | 'bear' | 'doll' | 'friend';

interface HoleState {
  id: number;
  occupant: HoleOccupantType | null;
  characterId?: CharacterId;
  toyEmoji?: string;
  peekUntil: number; // timestamp
  isHit?: boolean;
}

const GUIDE = '풀숲에서 까꿍 나오는 목표 친구를 톡 터치해 볼까? 잠자는 곰은 깨우지 마!';

const OTHER_FRIENDS: CharacterId[] = ['rano', 'jelly', 'dochi', 'ggulgguli', 'pingu'];

export const ForestPeekabooGame: React.FC<ForestPeekabooGameProps> = ({
  buddy,
  onCompleteQuiz,
  soundEnabled,
  ageGroup = 'sprout',
}) => {
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const pixiRef = useRef<PixiStageHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const holeCount = ageGroup === 'baby' ? 4 : ageGroup === 'sprout' ? 6 : 6;
  const targetCatches = ageGroup === 'baby' ? 4 : ageGroup === 'sprout' ? 5 : 6;
  const peekDurationMs = ageGroup === 'baby' ? 2800 : ageGroup === 'sprout' ? 2000 : 1500;
  const spawnIntervalMs = ageGroup === 'baby' ? 1400 : ageGroup === 'sprout' ? 1000 : 800;

  const [holes, setHoles] = useState<HoleState[]>(() =>
    Array.from({ length: holeCount }, (_, i) => ({
      id: i,
      occupant: null,
      peekUntil: 0,
    })),
  );
  const holesRef = useRef(holes);
  holesRef.current = holes;

  const [catches, setCatches] = useState(0);
  const catchesRef = useRef(catches);
  catchesRef.current = catches;

  const [comboState, setComboState] = useState<ComboState>({ combo: 0, fever: false });
  const [isCompleted, setIsCompleted] = useState(false);
  const completedRef = useRef(isCompleted);
  completedRef.current = isCompleted;

  // Listen to global combo / fever state
  useEffect(() => {
    return subscribeCombo((state) => {
      setComboState(state);
    });
  }, []);

  // Guide speech on load
  useEffect(() => {
    stopAllSpeech();
    resetCombo();
    speakText(GUIDE, soundEnabled, { characterId: buddy });
    return () => {
      clearGameTimeouts();
      stopAllSpeech();
      resetCombo();
    };
  }, [buddy, soundEnabled, clearGameTimeouts]);

  // Main Emergence Loop
  useEffect(() => {
    if (isCompleted) return;

    const interval = setInterval(() => {
      if (completedRef.current) return;

      const now = Date.now();
      setHoles((prev) => {
        // First, hide any expired occupants
        const updated = prev.map((h) => {
          if (h.occupant && now >= h.peekUntil) {
            return { ...h, occupant: null, isHit: false };
          }
          return h;
        });

        // Find available idle holes
        const idleHoles = updated.filter((h) => !h.occupant);
        if (idleHoles.length === 0) return updated;

        // Pick one random idle hole to spawn
        const targetHole = idleHoles[Math.floor(Math.random() * idleHoles.length)];

        // Roll occupant type:
        // 60% Target Friend (our main buddy)
        // 25% Sleeping Bear (distractor)
        // 15% Clumsy Doll or Other friend
        const roll = Math.random();
        let occupantType: HoleOccupantType = 'target';
        let occupantChar: CharacterId | undefined = buddy;
        let occupantEmoji: string | undefined = undefined;

        if (roll < 0.58) {
          occupantType = 'target';
          occupantChar = buddy;
        } else if (roll < 0.82) {
          occupantType = 'bear';
          occupantEmoji = '🐻';
        } else {
          occupantType = 'doll';
          occupantEmoji = '🧸';
        }

        return updated.map((h) => {
          if (h.id === targetHole.id) {
            return {
              ...h,
              occupant: occupantType,
              characterId: occupantChar,
              toyEmoji: occupantEmoji,
              peekUntil: now + peekDurationMs,
              isHit: false,
            };
          }
          return h;
        });
      });
    }, spawnIntervalMs);

    return () => clearInterval(interval);
  }, [isCompleted, buddy, peekDurationMs, spawnIntervalMs]);

  // Handle tapping a hole
  const handleTapHole = useCallback(
    (hole: HoleState, e: React.PointerEvent<HTMLButtonElement>) => {
      if (isCompleted || !hole.occupant || hole.isHit) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = rect.left + rect.width / 2;
      const clickY = rect.top + rect.height / 2;

      // 1. Correct: Target Friend tapped!
      if (hole.occupant === 'target') {
        const nextCatches = catchesRef.current + 1;
        setCatches(nextCatches);
        catchesRef.current = nextCatches;

        recordPlaySuccess(); // bumps combo in juice.ts
        const nextCombo = comboState.combo + 1;
        playComboChime(nextCombo, soundEnabled);
        playJellyTap(soundEnabled);

        emitJuice({ kind: 'pop', x: clickX, y: clickY });
        pixiRef.current?.emitBurst({
          x: clickX - (stageRef.current?.getBoundingClientRect().left || 0),
          y: clickY - (stageRef.current?.getBoundingClientRect().top || 0),
          color: 0xfbbf24,
          secondaryColor: 0xec4899,
          count: comboState.fever ? 28 : 16,
          kind: 'star',
        });

        // Mark as hit & sink down
        setHoles((prev) =>
          prev.map((h) => (h.id === hole.id ? { ...h, isHit: true, peekUntil: Date.now() + 240 } : h)),
        );

        // Announce Fever
        if (nextCombo === 3) {
          playSparkleChime(soundEnabled);
          fireStarExplosion();
          speakText('우와! 콤보 피버! 신나게 팡팡!', soundEnabled, {
            characterId: buddy,
            playIntroSFX: false,
          });
        } else if (nextCatches < targetCatches) {
          speakText('찾았다! 까꿍!', soundEnabled, {
            characterId: buddy,
            playIntroSFX: false,
          });
        }

        // Win Condition
        if (nextCatches >= targetCatches) {
          setIsCompleted(true);
          completedRef.current = true;
          playCorrectFanfare(soundEnabled);
          fireConfetti();
          fireStarExplosion();
          onCompleteQuiz(10);
          stopAllSpeech();
          speakText('우와! 빠른 손놀림으로 숲속 친구들을 모두 찾았어!', soundEnabled, {
            characterId: buddy,
          });

          scheduleGameTimeout(() => {
            setCatches(0);
            catchesRef.current = 0;
            resetCombo();
            setIsCompleted(false);
            completedRef.current = false;
          }, 3200);
        }
        return;
      }

      // 2. Distractor: Sleeping Bear tapped!
      if (hole.occupant === 'bear') {
        playBouncyBoing(soundEnabled);
        resetCombo();
        emitJuice({ kind: 'snap', x: clickX, y: clickY });

        setHoles((prev) =>
          prev.map((h) => (h.id === hole.id ? { ...h, isHit: true, peekUntil: Date.now() + 400 } : h)),
        );

        speakText('쉿! 곰이 쿨쿨 자고 있어!', soundEnabled, {
          characterId: buddy,
          playIntroSFX: false,
        });
        return;
      }

      // 3. Clumsy Doll tapped
      playBouncyBoing(soundEnabled);
      resetCombo();
      setHoles((prev) =>
        prev.map((h) => (h.id === hole.id ? { ...h, isHit: true, peekUntil: Date.now() + 300 } : h)),
      );
    },
    [isCompleted, comboState, soundEnabled, buddy, targetCatches, onCompleteQuiz, scheduleGameTimeout],
  );

  return (
    <div
      ref={stageRef}
      className={`forest-peekaboo-stage relative flex flex-col justify-between w-full h-[var(--game-play-height,calc(100dvh-84px))] min-h-[var(--game-play-height,calc(100dvh-84px))] rounded-3xl overflow-hidden select-none bg-gradient-to-b from-[#A7F3D0] via-[#6EE7B7] to-[#10B981] border-3 ${
        comboState.fever ? 'border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.6)]' : 'border-[#059669]'
      } p-3 sm:p-5`}
    >
      {/* Background Forest Scenery */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-12 -left-10 w-44 h-44 rounded-full bg-emerald-400/30 blur-2xl" />
        <div className="absolute top-10 right-4 w-36 h-36 rounded-full bg-amber-300/35 blur-xl" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#047857] to-transparent opacity-40" />
      </div>

      <PixiStageOverlay ref={pixiRef} ambientKind="none" className="z-30" />

      {/* Top HUD: Guide & Progress */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        <PlayGuide
          buddy={buddy}
          soundEnabled={soundEnabled}
          title="숲속 까꿍 팡팡"
          guide={GUIDE}
          happy={isCompleted || comboState.fever}
        />
        <div className="pointer-events-none flex items-center gap-2">
          {comboState.fever && (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 text-white font-black text-xs flex items-center gap-1 shadow-md border-2 border-white"
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>FEVER x{comboState.combo}!</span>
            </motion.div>
          )}
          <PlayProgress total={targetCatches} done={catches} label="찾은 친구" />
        </div>
      </div>

      {/* Target Friend Banner */}
      <div className="relative z-20 flex justify-center my-1 pointer-events-none">
        <div className="px-5 py-2 rounded-2xl bg-white/95 border-3 border-emerald-600 shadow-md flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-700" />
          <span className="text-xs sm:text-sm font-black text-emerald-950">
            까꿍! 찾아야 할 친구:
          </span>
          <div className="scale-75 -my-2 flex items-center justify-center">
            <CharacterAvatar id={buddy} size="sm" mood="happy" />
          </div>
          <span className="text-xs text-rose-600 font-bold ml-1">
            (잠자는 곰 🐻💤 깨우지 마!)
          </span>
        </div>
      </div>

      {/* Holes Meadow Arena */}
      <div className="relative z-20 flex-1 flex items-center justify-center p-2 sm:p-4 pointer-events-auto">
        <div
          className={`grid gap-4 sm:gap-6 w-full max-w-[560px] ${
            holeCount === 4 ? 'grid-cols-2' : 'grid-cols-3'
          }`}
        >
          {holes.map((hole) => {
            const isTarget = hole.occupant === 'target';
            const isBear = hole.occupant === 'bear';
            const isDoll = hole.occupant === 'doll';

            return (
              <div
                key={hole.id}
                className="relative flex flex-col items-center justify-end h-32 sm:h-36 overflow-hidden rounded-3xl"
              >
                {/* Hole Rim / Mound in Background */}
                <div className="absolute inset-x-2 bottom-0 h-16 sm:h-18 rounded-full bg-[#3D2614] border-4 border-[#241408] shadow-[inset_0_8px_16px_rgba(0,0,0,0.6)]" />

                {/* Peeking Creature / Character */}
                <AnimatePresence>
                  {hole.occupant && (
                    <motion.button
                      key={`${hole.id}-${hole.occupant}`}
                      type="button"
                      onPointerDown={(e) => handleTapHole(hole, e)}
                      aria-label={`${
                        isTarget ? '목표 친구' : isBear ? '잠자는 곰' : '인형'
                      } 터치하기`}
                      initial={{ y: 70, scale: 0.7 }}
                      animate={{
                        y: hole.isHit ? 60 : 0,
                        scale: hole.isHit ? 1.15 : 1,
                        rotate: isBear ? [0, -6, 6, 0] : 0,
                      }}
                      exit={{ y: 70, scale: 0.6, opacity: 0 }}
                      transition={JUICE_SPRING}
                      className="relative z-10 mb-4 sm:mb-5 flex flex-col items-center justify-center cursor-pointer active:scale-90 touch-manipulation"
                    >
                      {/* Heart / Sparkle on Hit */}
                      {hole.isHit && (
                        <motion.div
                          initial={{ scale: 0, y: 0 }}
                          animate={{ scale: 1.2, y: -24 }}
                          className="absolute -top-4 z-30 text-2xl font-black"
                        >
                          {isTarget ? '💖' : '💤'}
                        </motion.div>
                      )}

                      {/* Occupant Visual */}
                      {isTarget && (
                        <div className="relative flex flex-col items-center">
                          <CharacterAvatar
                            id={buddy}
                            size="md"
                            mood={hole.isHit ? 'dancing' : 'happy'}
                          />
                        </div>
                      )}

                      {isBear && (
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-800 border-3 border-amber-950 flex flex-col items-center justify-center shadow-lg">
                          <span className="text-3xl sm:text-4xl">🐻</span>
                          <span className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5 rounded-full bg-indigo-900 text-sky-200 font-black border border-white flex items-center gap-0.5">
                            <Moon className="w-3 h-3 fill-current" /> Zzz
                          </span>
                        </div>
                      )}

                      {isDoll && (
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-400 border-3 border-rose-600 flex items-center justify-center shadow-lg">
                          <span className="text-3xl sm:text-4xl">🧸</span>
                        </div>
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Foreground Grass / Moss Clump Covering the Hole Bottom */}
                <div className="relative z-20 w-full h-8 sm:h-10 -mt-2 bg-gradient-to-t from-[#15803D] to-[#22C55E] border-t-4 border-[#166534] rounded-t-2xl shadow-md flex items-center justify-around px-2 pointer-events-none">
                  <span className="w-2.5 h-4 bg-emerald-400 rounded-t-full rotate-6" />
                  <span className="text-xs">🌸</span>
                  <span className="w-3 h-5 bg-emerald-300 rounded-t-full -rotate-12" />
                  <span className="text-xs">🍀</span>
                  <span className="w-2.5 h-4 bg-emerald-400 rounded-t-full rotate-12" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Combo & Status Ribbon */}
      <div className="relative z-30 flex items-center justify-center gap-2 pointer-events-none">
        <div className="px-5 py-1.5 rounded-full bg-emerald-950/85 text-emerald-100 border-2 border-emerald-400/60 shadow-md flex items-center gap-2 text-xs sm:text-sm font-black">
          <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span>
            {comboState.fever
              ? '✨ 피버 모드 진행 중! 사운드와 함께 신나게 터치해요!'
              : comboState.combo > 0
                ? `연속 성공 ${comboState.combo}콤보! 3콤보가 되면 피버 발동!`
                : '친구가 고개를 쏙 내밀 때 빠르게 콕 눌러봐요!'}
          </span>
        </div>
      </div>
    </div>
  );
};
