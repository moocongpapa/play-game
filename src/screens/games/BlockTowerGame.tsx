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
  { bg: 'from-[#FF758F] to-[#FF4D6D]', border: '#A4133C', stud: '#FFB3C1', hex: 0xff4d6d, emoji: '🍓' },
  { bg: 'from-[#FDE047] to-[#F59E0B]', border: '#92400E', stud: '#FEF08A', hex: 0xf59e0b, emoji: '⭐' },
  { bg: 'from-[#34D399] to-[#059669]', border: '#065F46', stud: '#A7F3D0', hex: 0x10b981, emoji: '🍀' },
  { bg: 'from-[#38BDF8] to-[#0284C7]', border: '#075985', stud: '#BAE6FD', hex: 0x0284c7, emoji: '🐬' },
  { bg: 'from-[#C084FC] to-[#7C3AED]', border: '#5B21B6', stud: '#E9D5FF', hex: 0x9333ea, emoji: '🦄' },
  { bg: 'from-[#FB923C] to-[#EA580C]', border: '#9A3412', stud: '#FED7AA', hex: 0xea580c, emoji: '🍊' },
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

  const targetBlocks = ageGroup === 'baby' ? 5 : ageGroup === 'sprout' ? 6 : 7;

  const [blocks, setBlocks] = useState<StackedBlock[]>([]);
  const [craneX, setCraneX] = useState(0); // integer px from center
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
      setTowerSway((prev) => (prev >= 0 ? -5 * intensity : 5 * intensity));
      scheduleGameTimeout(() => setTowerSway(0), 650);
    });
  }, [scheduleGameTimeout]);

  // 60fps crane sway with integer-pixel rounding (no CSS transition lag or subpixel blur)
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    const speed = ageGroup === 'baby' ? 1.45 : ageGroup === 'sprout' ? 1.85 : 2.25;

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (!completedRef.current && !droppingRef.current) {
        craneTimeRef.current += dt * speed;
        const nextX = Math.round(Math.sin(craneTimeRef.current) * 96);
        if (nextX !== craneXRef.current) {
          craneXRef.current = nextX;
          setCraneX(nextX);
        }
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
      // Forgiving magnetic clamp rounded to integer pixels for crisp alignment
      const prevOffset = currentCount > 0 ? blocksRef.current[currentCount - 1].offsetX : 0;
      const clampedOffset = Math.round(
        Math.max(-42, Math.min(42, prevOffset * 0.45 + releaseX * 0.45)),
      );
      const isPerfect = Math.abs(releaseX - prevOffset) < 26;

      playBouncyBoing(soundEnabled);
      setDroppingBlock({
        x: releaseX,
        y: 68,
        targetY: 280 - currentCount * 46,
        paletteIdx,
      });

      const rect = stageRef.current?.getBoundingClientRect();
      const hitX = (rect?.width || 400) * 0.5 + clampedOffset;
      const hitY = (rect?.height || 560) - 110 - currentCount * 46;

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

        // Gentle spring wobble on impact
        setTowerSway(clampedOffset * 0.1 + (currentCount % 2 === 0 ? 2 : -2));
        scheduleGameTimeout(() => setTowerSway(0), 380);

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
          count: isPerfect ? 24 : 16,
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
      }, 220);
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
      className="block-tower-stage relative flex flex-col justify-between w-full h-[var(--game-play-height,calc(100dvh-84px))] min-h-[var(--game-play-height,calc(100dvh-84px))] rounded-3xl overflow-hidden select-none cursor-pointer bg-gradient-to-b from-[#7DD3FC] via-[#BAE6FD] to-[#FEF08A] border-3 border-[#38BDF8] p-3 sm:p-5"
    >
      {/* Crisp vector sky backdrop (no translucent fog over blocks) */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-10 right-8 w-28 h-28 rounded-full bg-[#FDE047] border-4 border-[#F59E0B] shadow-[0_0_0_12px_rgba(253,224,71,0.35)]" />
        <div className="absolute top-16 left-6 w-28 h-10 rounded-full bg-white border-2 border-[#BAE6FD]" />
        <div className="absolute top-24 right-16 w-36 h-12 rounded-full bg-white border-2 border-[#BAE6FD]" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#4ADE80] to-[#86EFAC] border-t-4 border-[#22C55E]" />
      </div>

      {/* Burst-only Pixi overlay (ambientKind="none" keeps blocks 100% sharp and vivid) */}
      <PixiStageOverlay ref={pixiRef} ambientKind="none" className="z-30" />

      {/* Top HUD: Guide + Progress */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        <PlayGuide
          buddy={buddy}
          soundEnabled={soundEnabled}
          title="차곡차곡 블록 탑"
          guide={GUIDE}
          happy={isCompleted}
        />
        <div className="pointer-events-none">
          <PlayProgress total={targetBlocks} done={blocks.length} label="쌓은 블록" />
        </div>
      </div>

      {/* Full-Height Interactive Block Arena */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-between py-1 pointer-events-none">
        {/* Moving Cloud Crane */}
        <div
          style={{ transform: `translate3d(${craneX}px, 0, 0)` }}
          className="relative flex flex-col items-center mt-0.5 will-change-transform"
        >
          {/* Crane Track Pill */}
          <div className="px-6 py-2 rounded-full bg-white border-3 border-[#0284C7] shadow-[0_4px_0_#0369A1] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" aria-hidden="true" />
            <span className="text-sm sm:text-base font-black text-sky-900 tracking-tight">
              화면을 톡! 눌러 놓기
            </span>
          </div>
          <div className="w-1.5 h-4 bg-[#0284C7]" />
          {/* Held Block */}
          {!droppingBlock && !isCompleted && (
            <div
              style={{ borderColor: currentPalette.border }}
              className={`relative w-44 sm:w-56 h-12 sm:h-14 rounded-2xl border-4 bg-gradient-to-b ${currentPalette.bg} shadow-[inset_0_4px_0_rgba(255,255,255,0.75),0_6px_0_rgba(0,0,0,0.22)] flex items-center justify-between px-4`}
            >
              <span
                style={{ backgroundColor: currentPalette.stud, borderColor: currentPalette.border }}
                className="w-5 h-3 -mt-6 rounded-t-md border-2"
              />
              <span className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center drop-shadow-sm">
                <ToyArtwork emoji={currentPalette.emoji} />
              </span>
              <span
                style={{ backgroundColor: currentPalette.stud, borderColor: currentPalette.border }}
                className="w-5 h-3 -mt-6 rounded-t-md border-2"
              />
            </div>
          )}
        </div>

        {/* Dropping Block Animation */}
        <AnimatePresence>
          {droppingBlock && (
            <motion.div
              key="dropping"
              initial={{ x: droppingBlock.x, y: -140, scale: 1.04 }}
              animate={{ x: Math.round(droppingBlock.x * 0.5), y: 0, scale: [1, 1.12, 0.94, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeIn' }}
              style={{ borderColor: BLOCK_PALETTES[droppingBlock.paletteIdx].border }}
              className={`w-44 sm:w-56 h-12 sm:h-14 rounded-2xl border-4 bg-gradient-to-b ${BLOCK_PALETTES[droppingBlock.paletteIdx].bg} shadow-xl flex items-center justify-center`}
            >
              <span className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
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
              animate={{ scale: 1, opacity: 1, y: -4 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={JUICE_SPRING}
              className="absolute top-20 z-30 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-400 text-amber-950 font-black text-sm border-3 border-white shadow-lg"
            >
              <Crown className="w-4 h-4 fill-current" />
              <span>정가운데 PERFECT!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stacked Tower + Cheering Buddy */}
        <motion.div
          animate={{ rotate: towerSway }}
          transition={{ type: 'spring', stiffness: 300, damping: 16 }}
          style={{ transformOrigin: 'bottom center' }}
          className="relative flex flex-col-reverse items-center justify-start mt-auto mb-1"
        >
          {/* Wide Castle Foundation Pedestal */}
          <div className="w-64 sm:w-80 h-6 sm:h-7 rounded-full bg-gradient-to-b from-[#4ADE80] to-[#16A34A] border-4 border-[#14532D] shadow-[0_6px_0_#14532D]" />

          {/* Stacked Blocks */}
          {blocks.map((block) => {
            const pal = BLOCK_PALETTES[block.paletteIdx];
            return (
              <motion.div
                key={block.id}
                initial={{ scaleY: 0.7, scaleX: 1.15, y: -14 }}
                animate={{ scaleY: 1, scaleX: 1, y: 0, x: block.offsetX }}
                transition={JUICE_SPRING}
                style={{ borderColor: pal.border }}
                className={`relative w-44 sm:w-56 h-11 sm:h-13 -mb-1 rounded-2xl border-4 bg-gradient-to-b ${pal.bg} shadow-[inset_0_4px_0_rgba(255,255,255,0.75),0_5px_0_rgba(0,0,0,0.18)] flex items-center justify-between px-4`}
              >
                <span className="w-3.5 h-5 rounded-full bg-white/85 border-2 border-white shadow-sm" />
                <span className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                  <ToyArtwork emoji={block.emoji} />
                </span>
                <span className="w-3.5 h-5 rounded-full bg-white/85 border-2 border-white shadow-sm" />
              </motion.div>
            );
          })}

          {/* Buddy Riding on Top of the Tower */}
          <motion.div
            animate={{
              x: topBlockOffset,
              y: isCompleted ? [0, -16, 0] : [0, -5, 0],
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
                className="mb-1 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-sky-500 text-white text-sm font-black border-3 border-white shadow-lg flex items-center gap-1.5"
              >
                <Crown className="w-4 h-4 fill-current" />
                <span>무지개 블록 성 완성!</span>
              </motion.div>
            )}
            <CharacterAvatar
              id={buddy}
              size="lg"
              mood={isCompleted ? 'dancing' : blocks.length > 0 ? 'happy' : 'waving'}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

