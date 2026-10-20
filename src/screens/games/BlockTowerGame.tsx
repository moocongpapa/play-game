import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Sparkles } from 'lucide-react';
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
} from '../../utils/soundEngine';
import { fireConfetti, fireStarExplosion } from '../../utils/confetti';
import { emitJuice, subscribeWindGust, JUICE_SPRING } from '../../utils/juice';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';

interface BlockTowerGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup?: AgeGroup;
  childName?: string;
}

interface StackedBlock {
  id: number;
  offsetX: number; // px offset from tower center (-36 to +36)
  paletteIdx: number;
  emoji: string;
  perfect: boolean;
}

const BLOCK_PALETTES = [
  { bg: 'from-[#FF8FA3] to-[#FF4D6D]', border: '#C9184A', hex: 0xff4d6d, emoji: '🍓' },
  { bg: 'from-[#FDE047] to-[#F59E0B]', border: '#B45309', hex: 0xf59e0b, emoji: '⭐' },
  { bg: 'from-[#6EE7B7] to-[#10B981]', border: '#047857', hex: 0x10b981, emoji: '🍀' },
  { bg: 'from-[#7DD3FC] to-[#0284C7]', border: '#0369A1', hex: 0x0284c7, emoji: '🐬' },
  { bg: 'from-[#D8B4FE] to-[#9333EA]', border: '#6B21A8', hex: 0x9333ea, emoji: '🦄' },
  { bg: 'from-[#FDBA74] to-[#EA580C]', border: '#9A3412', hex: 0xea580c, emoji: '🍊' },
];

const GUIDE = '화면을 톡 눌러서 알록달록 블록 탑을 높이 쌓아 볼까?';

export const BlockTowerGame: React.FC<BlockTowerGameProps> = ({
  buddy,
  onCompleteQuiz,
  soundEnabled,
  ageGroup = 'sprout',
}) => {
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const pixiRef = useRef<PixiStageHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const targetBlocks = ageGroup === 'baby' ? 4 : ageGroup === 'sprout' ? 5 : 6;

  const [blocks, setBlocks] = useState<StackedBlock[]>([]);
  const [craneX, setCraneX] = useState(0); // -90 to +90 px from center
  const [droppingBlock, setDroppingBlock] = useState<{
    x: number;
    y: number;
    targetY: number;
    paletteIdx: number;
  } | null>(null);
  const [towerSway, setTowerSway] = useState(0);
  const [perfectPopup, setPerfectPopup] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const craneTimeRef = useRef(0);
  const craneXRef = useRef(0);
  const blocksRef = useRef<StackedBlock[]>([]);
  blocksRef.current = blocks;
  const droppingRef = useRef(droppingBlock);
  droppingRef.current = droppingBlock;
  const completedRef = useRef(isCompleted);
  completedRef.current = isCompleted;

  useEffect(() => {
    stopAllSpeech();
    speakText(GUIDE, soundEnabled, { characterId: buddy });
    return () => {
      clearGameTimeouts();
      stopAllSpeech();
    };
  }, [buddy, soundEnabled, clearGameTimeouts]);

  // Subscribe to wind gusts ("후~!") so blowing sways the tower playfully
  useEffect(() => {
    return subscribeWindGust((intensity) => {
      setTowerSway((prev) => (prev >= 0 ? -6 * intensity : 6 * intensity));
      scheduleGameTimeout(() => setTowerSway(0), 650);
    });
  }, [scheduleGameTimeout]);

  // 60fps crane sway + dropping block physics loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    const speed = ageGroup === 'baby' ? 1.5 : ageGroup === 'sprout' ? 1.9 : 2.3;

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (!completedRef.current && !droppingRef.current) {
        craneTimeRef.current += dt * speed;
        const nextX = Math.sin(craneTimeRef.current) * 76;
        craneXRef.current = nextX;
        setCraneX(nextX);
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [ageGroup]);

  const handleDropBlock = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 || droppingRef.current || completedRef.current) return;

      const currentCount = blocksRef.current.length;
      if (currentCount >= targetBlocks) return;

      const paletteIdx = currentCount % BLOCK_PALETTES.length;
      const releaseX = craneXRef.current;
      // Forgiving magnetic clamp so toddlers never lose a block off the tower
      const prevOffset = currentCount > 0 ? blocksRef.current[currentCount - 1].offsetX : 0;
      const clampedOffset = Math.max(-34, Math.min(34, prevOffset * 0.45 + releaseX * 0.45));
      const isPerfect = Math.abs(releaseX - prevOffset) < 22;

      playBouncyBoing(soundEnabled);
      setDroppingBlock({
        x: releaseX,
        y: 64,
        targetY: 260 - currentCount * 38,
        paletteIdx,
      });

      const rect = stageRef.current?.getBoundingClientRect();
      const hitX = (rect?.width || 360) * 0.5 + clampedOffset;
      const hitY = (rect?.height || 440) - 96 - currentCount * 38;

      scheduleGameTimeout(() => {
        const nextBlock: StackedBlock = {
          id: currentCount + 1,
          offsetX: clampedOffset,
          paletteIdx,
          emoji: BLOCK_PALETTES[paletteIdx].emoji,
          perfect: isPerfect,
        };
        const updated = [...blocksRef.current, nextBlock];
        setBlocks(updated);
        setDroppingBlock(null);

        // Tower spring wobble on impact
        setTowerSway(clampedOffset * 0.14 + (currentCount % 2 === 0 ? 2.5 : -2.5));
        scheduleGameTimeout(() => setTowerSway(0), 420);

        playComboChime(updated.length, soundEnabled);
        emitJuice({
          kind: isPerfect ? 'success' : 'snap',
          x: (rect?.left || 0) + hitX,
          y: (rect?.top || 0) + hitY,
        });

        pixiRef.current?.emitBurst({
          x: hitX,
          y: hitY,
          color: BLOCK_PALETTES[paletteIdx].hex,
          secondaryColor: 0xfde047,
          count: isPerfect ? 22 : 14,
          kind: isPerfect ? 'star' : 'bounce',
        });

        if (isPerfect && updated.length < targetBlocks) {
          setPerfectPopup((n) => n + 1);
          playSparkleChime(soundEnabled);
          speakText('반짝반짝! 정가운데에 꼭 맞게 쌓았어!', soundEnabled, {
            characterId: buddy,
            playIntroSFX: false,
          });
        }

        if (updated.length >= targetBlocks) {
          setIsCompleted(true);
          playCorrectFanfare(soundEnabled);
          fireConfetti();
          fireStarExplosion();
          onCompleteQuiz(10);
          stopAllSpeech();
          speakText('우와! 알록달록 멋진 무지개 블록 성이 완성되었어요!', soundEnabled, {
            characterId: buddy,
          });

          scheduleGameTimeout(() => {
            setBlocks([]);
            setIsCompleted(false);
            setPerfectPopup(0);
          }, 2900);
        }
      }, 240);
    },
    [targetBlocks, soundEnabled, scheduleGameTimeout, buddy, onCompleteQuiz],
  );

  const currentPalette = BLOCK_PALETTES[blocks.length % BLOCK_PALETTES.length];
  const topBlockOffset = blocks.length > 0 ? blocks[blocks.length - 1].offsetX : 0;

  return (
    <div
      ref={stageRef}
      onPointerDown={handleDropBlock}
      role="button"
      tabIndex={0}
      aria-label="차곡차곡 무지개 블록 탑 쌓기 무대 (화면을 눌러 블록 내려놓기)"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleDropBlock({ button: 0 } as React.PointerEvent<HTMLDivElement>);
        }
      }}
      className="relative flex flex-col justify-between w-full min-h-[430px] sm:min-h-[480px] rounded-3xl overflow-hidden select-none cursor-pointer bg-gradient-to-b from-[#E0F2FE] via-[#F0F9FF] to-[#FEF9C3] border-3 border-[#BAE6FD] p-3 sm:p-4 shadow-inner"
    >
      <PixiStageOverlay ref={pixiRef} ambientKind="sky" className="z-20" />

      {/* Top Guide */}
      <div className="relative z-30 flex items-center justify-between gap-2 pointer-events-auto">
        <PlayGuide
          buddy={buddy}
          soundEnabled={soundEnabled}
          title="차곡차곡 블록 탑"
          guide={GUIDE}
          happy={isCompleted}
        />
      </div>

      {/* Moving Cloud Crane */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-between py-2 pointer-events-none">
        <div
          style={{ transform: `translate3d(${craneX}px, 0, 0)` }}
          className="relative flex flex-col items-center mt-1 transition-transform duration-75"
        >
          {/* Fluffy Cloud Crane */}
          <div className="px-5 py-1.5 rounded-full bg-white/95 border-2 border-[#7DD3FC] shadow-[0_4px_0_#38BDF8] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <span className="text-xs font-black text-sky-700">톡! 놓기</span>
          </div>
          <div className="w-1 h-4 bg-sky-300" />
          {/* Held Block */}
          {!droppingBlock && !isCompleted && (
            <div
              style={{ borderColor: currentPalette.border }}
              className={`w-28 sm:w-32 h-10 rounded-2xl border-3 bg-gradient-to-b ${currentPalette.bg} shadow-[inset_0_3px_0_rgba(255,255,255,0.6),0_5px_0_rgba(0,0,0,0.15)] flex items-center justify-center`}
            >
              <span className="w-7 h-7 flex items-center justify-center">
                <ToyArtwork emoji={currentPalette.emoji} />
              </span>
            </div>
          )}
        </div>

        {/* Dropping Block Animation */}
        <AnimatePresence>
          {droppingBlock && (
            <motion.div
              key="dropping"
              initial={{ x: droppingBlock.x, y: -120, scale: 1.05 }}
              animate={{ x: droppingBlock.x * 0.5, y: 0, scale: [1, 1.14, 0.92, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeIn' }}
              style={{ borderColor: BLOCK_PALETTES[droppingBlock.paletteIdx].border }}
              className={`w-28 sm:w-32 h-10 rounded-2xl border-3 bg-gradient-to-b ${BLOCK_PALETTES[droppingBlock.paletteIdx].bg} shadow-lg flex items-center justify-center`}
            >
              <span className="w-7 h-7 flex items-center justify-center">
                <ToyArtwork emoji={BLOCK_PALETTES[droppingBlock.paletteIdx].emoji} />
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Perfect Landing Badge */}
        <AnimatePresence>
          {perfectPopup > 0 && !isCompleted && (
            <motion.div
              key={perfectPopup}
              initial={{ scale: 0.5, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: -6 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={JUICE_SPRING}
              className="absolute top-16 z-30 flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400 text-amber-950 font-black text-xs border-2 border-white shadow-md"
            >
              <Crown className="w-4 h-4 fill-current" />
              <span>PERFECT!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stacked Tower + Cheering Buddy */}
        <motion.div
          animate={{ rotate: towerSway }}
          transition={{ type: 'spring', stiffness: 280, damping: 14 }}
          style={{ transformOrigin: 'bottom center' }}
          className="relative flex flex-col-reverse items-center justify-start mt-auto mb-1"
        >
          {/* Meadow Pedestal */}
          <div className="w-48 sm:w-56 h-5 rounded-full bg-gradient-to-b from-[#86EFAC] to-[#22C55E] border-2 border-[#15803D] shadow-[0_4px_0_#166534]" />

          {/* Stacked Blocks */}
          {blocks.map((block) => {
            const pal = BLOCK_PALETTES[block.paletteIdx];
            return (
              <motion.div
                key={block.id}
                initial={{ scaleY: 0.65, scaleX: 1.2, y: -14 }}
                animate={{ scaleY: 1, scaleX: 1, y: 0, x: block.offsetX }}
                transition={JUICE_SPRING}
                style={{ borderColor: pal.border }}
                className={`relative w-28 sm:w-32 h-10 -mb-0.5 rounded-2xl border-3 bg-gradient-to-b ${pal.bg} shadow-[inset_0_3px_0_rgba(255,255,255,0.65),0_4px_0_rgba(0,0,0,0.12)] flex items-center justify-between px-3`}
              >
                <span className="w-3 h-4 rounded-t-full bg-white/75 border border-white" />
                <span className="w-7 h-7 flex items-center justify-center">
                  <ToyArtwork emoji={block.emoji} />
                </span>
                <span className="w-3 h-4 rounded-t-full bg-white/75 border border-white" />
              </motion.div>
            );
          })}

          {/* Buddy Riding on Top of the Tower */}
          <motion.div
            animate={{
              x: topBlockOffset,
              y: isCompleted ? [0, -14, 0] : [0, -4, 0],
            }}
            transition={{
              y: { duration: isCompleted ? 0.55 : 1.4, repeat: Infinity },
              x: JUICE_SPRING,
            }}
            className="relative -mb-2 z-20 flex flex-col items-center"
          >
            {isCompleted && (
              <motion.div
                initial={{ scale: 0, y: 12 }}
                animate={{ scale: 1, y: 0 }}
                transition={JUICE_SPRING}
                className="mb-0.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-pink-400 to-sky-400 text-white text-xs font-black border-2 border-white shadow-md flex items-center gap-1"
              >
                <Crown className="w-4 h-4 fill-current" />
                <span>무지개 성 완성!</span>
              </motion.div>
            )}
            <CharacterAvatar
              id={buddy}
              size="md"
              mood={isCompleted ? 'dancing' : blocks.length > 0 ? 'happy' : 'waving'}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="relative z-30 pointer-events-none">
        <PlayProgress total={targetBlocks} done={blocks.length} label="쌓은 블록" />
      </div>
    </div>
  );
};
