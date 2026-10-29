import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Flame } from 'lucide-react';
import type { CharacterId, AgeGroup } from '../../types';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { PlayGuide, PlayProgress } from '../../components/ToddlerPlay';
import { PixiStageOverlay, type PixiStageHandle } from '../../components/PixiStageOverlay';
import {
  speakText,
  stopAllSpeech,
  playSparkleChime,
  playCorrectFanfare,
  playCelebrationFanfare,
  playBalloonPop,
  playBouncyBoing,
  playJellyTap,
  playStarGain,
  playRisingStepChime,
  playCareSound,
} from '../../utils/soundEngine';
import { fireConfetti, fireStarExplosion } from '../../utils/confetti';
import { emitJuice } from '../../utils/juice';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import { useGameActivity } from '../../hooks/useGameActivity';
import { RoundContinuation } from '../../components/RoundContinuation';

interface PipeConnectGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup?: AgeGroup;
  childName?: string;
}

type FlavorId = 'butter' | 'caramel' | 'rainbow';

interface FlavorRound {
  id: FlavorId;
  title: string;
  badge: string;
  toppingEmoji: string;
  guideText: string;
  seasonedVoice: string;
  accentColor: string;
  puffFill: string;
  puffShade: string;
  glazeFill: string;
  particleColors: number[];
}

const FLAVOR_ROUNDS: FlavorRound[] = [
  {
    id: 'butter',
    title: '고소한 버터 팝콘',
    badge: '🧈 고소한 버터맛',
    toppingEmoji: '🧈',
    guideText: '옥수수 알맹이나 프라이팬을 톡톡 두드려 고소한 버터 팝콘을 팡팡 튀겨 볼까?',
    seasonedVoice: '와아! 고소한 버터 팝콘 완성! 바삭바삭 정말 맛있다!',
    accentColor: '#F59E0B',
    puffFill: '#FFFBEB',
    puffShade: '#FDE68A',
    glazeFill: '#FBBF24',
    particleColors: [0xFBBF24, 0xFDE68A, 0xFFFBEB, 0xF59E0B],
  },
  {
    id: 'caramel',
    title: '달콤 카라멜 팝콘',
    badge: '🍯 달콤 카라멜맛',
    toppingEmoji: '🍯',
    guideText: '이번엔 달콤한 카라멜 팝콘이야! 알맹이를 톡톡 눌러 팡팡 터뜨려 봐!',
    seasonedVoice: '우와! 달콤하고 바삭한 카라멜 팝콘이 가득해! 냠냠 고마워!',
    accentColor: '#D97706',
    puffFill: '#FEF3C7',
    puffShade: '#FCD34D',
    glazeFill: '#D97706',
    particleColors: [0xF59E0B, 0xD97706, 0xFDE68A, 0xFB923C],
  },
  {
    id: 'rainbow',
    title: '무지개 치즈 팝콘',
    badge: '🌈 무지개 치즈맛',
    toppingEmoji: '🧀',
    guideText: '마지막은 특별 메뉴! 왕옥수수와 알맹이를 톡톡 눌러 무지개 팝콘을 만들어 봐!',
    seasonedVoice: '대단해! 알록달록 무지개 팝콘 요리사 최고야!',
    accentColor: '#EC4899',
    puffFill: '#FFFDF7',
    puffShade: '#FCE7F3',
    glazeFill: '#EC4899',
    particleColors: [0xEC4899, 0xA855F7, 0x38BDF8, 0xFBBF24, 0x4ADE80],
  },
];

const POP_WORDS = ['퐁!', '팡팡!', '톡!', '바삭!', '고소해~!', '슈웅!', '왕바삭!'];

interface KernelItem {
  id: number;
  x: number; // percentage inside pan (-34 to 34)
  y: number; // percentage inside pan (-30 to 30)
  isKing: boolean;
  popped: boolean;
  popWord: string;
  bounceCount: number;
  rotation: number;
  rainbowTint?: string;
}

const KERNEL_LAYOUTS: Array<{ x: number; y: number }> = [
  { x: 0, y: -2 },
  { x: -24, y: -16 },
  { x: 24, y: -15 },
  { x: -25, y: 16 },
  { x: 24, y: 17 },
  { x: 0, y: -25 },
  { x: -1, y: 24 },
  { x: -31, y: 1 },
];

const RAINBOW_TINTS = ['#F472B6', '#60A5FA', '#A78BFA', '#34D399', '#FBBF24', '#FB7185'];

export const PipeConnectGame: React.FC<PipeConnectGameProps> = ({
  buddy,
  onCompleteQuiz,
  soundEnabled,
  ageGroup = 'sprout',
}) => {
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const { paused, isBlocked } = useGameActivity();
  const latest = useRef({ soundEnabled, buddy, onCompleteQuiz });
  latest.current = { soundEnabled, buddy, onCompleteQuiz };
  const pixiRef = useRef<PixiStageHandle>(null);
  const panRef = useRef<HTMLDivElement>(null);
  const roundDoneRef = useRef(false);
  const seasoningQueuedRef = useRef(false);
  const kernelsRef = useRef<KernelItem[]>([]);
  const [completed, setCompleted] = useState(false);

  const [round, setRound] = useState(0);
  const totalRounds = 3;
  const currentFlavor = FLAVOR_ROUNDS[round] || FLAVOR_ROUNDS[0];

  const kernelCount = ageGroup === 'baby' ? 5 : ageGroup === 'sprout' ? 6 : 7;

  const [kernels, setKernels] = useState<KernelItem[]>([]);
  const [panShakeKey, setPanShakeKey] = useState(0);
  const [isSeasoned, setIsSeasoned] = useState(false);
  const [buddyBubble, setBuddyBubble] = useState<string>('옥수수를 톡톡 눌러 팝콘을 튀겨줘!');
  const [floatingBursts, setFloatingBursts] = useState<Array<{ id: number; x: number; y: number; text: string }>>([]);

  const buildRoundKernels = useCallback((roundIdx: number) => {
    roundDoneRef.current = false;
    seasoningQueuedRef.current = false;
    setCompleted(false);
    setFloatingBursts([]);
    setIsSeasoned(false);
    const flavor = FLAVOR_ROUNDS[roundIdx] || FLAVOR_ROUNDS[0];
    setBuddyBubble(`${flavor.title} 먹고 싶어! 톡톡 튀겨줘!`);

    const items: KernelItem[] = KERNEL_LAYOUTS.slice(0, kernelCount).map((pos, idx) => ({
      id: idx,
      x: pos.x,
      y: pos.y,
      isKing: idx === 0, // Center kernel is the giant king kernel!
      popped: false,
      popWord: POP_WORDS[idx % POP_WORDS.length],
      bounceCount: 0,
      rotation: ((idx * 37) % 40) - 20,
      rainbowTint: RAINBOW_TINTS[idx % RAINBOW_TINTS.length],
    }));
    kernelsRef.current = items;
    setKernels(items);
  }, [kernelCount]);

  useEffect(() => {
    buildRoundKernels(round);
  }, [round, buildRoundKernels]);

  useEffect(() => {
    const flavor = FLAVOR_ROUNDS[round] || FLAVOR_ROUNDS[0];
    if (!isBlocked()) speakText(flavor.guideText, soundEnabled, { characterId: buddy });
  }, [round, soundEnabled, buddy, isBlocked]);

  useEffect(() => {
    return () => {
      clearGameTimeouts();
      stopAllSpeech();
    };
  }, [clearGameTimeouts]);

  const finishRoundWithSeasoning = useCallback(
    (flavor: FlavorRound, currentRound: number) => {
      if (roundDoneRef.current) return;
      roundDoneRef.current = true;
      setIsSeasoned(true);

      playCorrectFanfare(latest.current.soundEnabled);
      playCareSound('chew', latest.current.soundEnabled);
      setBuddyBubble('와아! 바삭바삭 팝콘 최고야! 냠냠!');
      speakText(flavor.seasonedVoice, latest.current.soundEnabled, { characterId: latest.current.buddy });

      if (panRef.current) {
        const rect = panRef.current.getBoundingClientRect();
        fireStarExplosion();
        pixiRef.current?.emitBurst({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          color: flavor.particleColors[0],
          count: 28,
          kind: 'star',
        });
      }

      scheduleGameTimeout(() => {
        if (currentRound + 1 < totalRounds) {
          playStarGain(latest.current.soundEnabled);
          setRound((r) => r + 1);
        } else {
          playCelebrationFanfare(latest.current.soundEnabled);
          fireConfetti();
          setCompleted(true);
          latest.current.onCompleteQuiz(3);
        }
      }, 1400);
    },
    [scheduleGameTimeout]
  );

  const spawnFloatingText = useCallback((x: number, y: number, text: string) => {
    const burstId = Date.now() + Math.floor(Math.random() * 1000);
    setFloatingBursts((prev) => [...prev.slice(-5), { id: burstId, x, y, text }]);
  }, []);

  const triggerKernelPop = useCallback(
    (targetId: number, clientX?: number, clientY?: number) => {
      if (isBlocked() || roundDoneRef.current || seasoningQueuedRef.current) return;
      const previous = kernelsRef.current;
      const target = previous.find(kernel => kernel.id === targetId);
      if (!target) return;
      setPanShakeKey(k => k + 1);
      if (clientX !== undefined && clientY !== undefined) {
        emitJuice({ kind: 'pop', x: clientX, y: clientY });
        pixiRef.current?.emitBurst({ x: clientX, y: clientY, color: currentFlavor.particleColors[0], count: 16, kind: 'star' });
      }
      if (target.popped) {
        playBouncyBoing(soundEnabled);
        playSparkleChime(soundEnabled);
        spawnFloatingText(target.x, target.y, '바삭바삭! ✨');
        const next = previous.map(kernel => kernel.id === targetId ? { ...kernel, bounceCount: kernel.bounceCount + 1, rotation: kernel.rotation + 25 } : kernel);
        kernelsRef.current = next;
        setKernels(next);
        return;
      }
      const extra = target.isKing ? previous.find(kernel => !kernel.popped && kernel.id !== targetId) : undefined;
      const next = previous.map(kernel => kernel.id === targetId || kernel.id === extra?.id ? { ...kernel, popped: true, bounceCount: kernel.bounceCount + 1 } : kernel);
      kernelsRef.current = next;
      setKernels(next);
      const poppedNow = next.filter(kernel => kernel.popped).length;
      playBalloonPop(soundEnabled);
      playRisingStepChime(poppedNow, next.length, soundEnabled);
      spawnFloatingText(target.x, target.y, target.isKing ? '왕팝콘 팡팡!! 👑' : target.popWord);
      if (poppedNow === next.length) {
        seasoningQueuedRef.current = true;
        setBuddyBubble('우와! 다 튀겨졌다! 양념 뿌려 냠냠 먹자!');
        scheduleGameTimeout(() => finishRoundWithSeasoning(currentFlavor, round), 650);
      } else {
        setBuddyBubble(target.isKing ? '우와! 왕옥수수가 팡 터졌어!' : `고소해~! ${next.length - poppedNow}개 더 튀겨볼까?`);
      }
    },
    [currentFlavor, finishRoundWithSeasoning, round, scheduleGameTimeout, soundEnabled, spawnFloatingText, isBlocked]
  );

  // Shaking the pan or tapping the pan handle pops the next 1-2 unpopped kernels!
  const handleShakePan = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      if (isBlocked() || roundDoneRef.current || seasoningQueuedRef.current) return;

      playJellyTap(soundEnabled);
      setPanShakeKey((k) => k + 1);

      const unpopped = kernels.filter((k) => !k.popped);
      if (unpopped.length > 0) {
        const pick = unpopped[Math.floor(Math.random() * unpopped.length)];
        triggerKernelPop(pick.id, e.clientX, e.clientY);
      } else {
        finishRoundWithSeasoning(currentFlavor, round);
      }
    },
    [currentFlavor, finishRoundWithSeasoning, kernels, round, soundEnabled, triggerKernelPop, isBlocked]
  );

  const poppedCount = kernels.filter((k) => k.popped).length;
  const allPopped = kernels.length > 0 && poppedCount === kernels.length;

  return (
    <div
      ref={panRef}
      inert={paused}
      className="pipe-connect-stage popcorn-pan-stage relative flex flex-col justify-between w-full h-[var(--game-play-height,calc(100dvh-84px))] min-h-[var(--game-play-height,calc(100dvh-84px))] rounded-3xl overflow-hidden select-none bg-gradient-to-b from-[#FFF7ED] via-[#FFEDD5] to-[#FDE68A] border-3 border-[#F59E0B] p-3 sm:p-5"
    >
      <style>{`
        @keyframes flameFlicker {
          0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.9; }
          50% { transform: scaleY(1.12) scaleX(1.06); opacity: 1; }
        }
        @keyframes kernelSizzle {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(-4deg); }
          50% { transform: translate3d(0, -4px, 0) rotate(5deg); }
        }
        .popcorn-flame-anim {
          animation: flameFlicker 1.1s ease-in-out infinite;
          @media (prefers-reduced-motion: reduce) {
            animation: none;
          }
        }
        .kernel-sizzle-anim {
          animation: kernelSizzle 0.75s ease-in-out infinite;
          @media (prefers-reduced-motion: reduce) {
            animation: none;
          }
        }
      `}</style>

      <PixiStageOverlay ref={pixiRef} className="z-20 pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-30 flex items-center justify-between w-full gap-2">
        <PlayGuide
          buddy={buddy}
          title="통통 팝콘 프라이팬"
          guide={currentFlavor.guideText}
          soundEnabled={soundEnabled}
          happy={isSeasoned}
        />

        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border-2 border-[#F59E0B]">
          <span className="text-lg" aria-hidden="true">{currentFlavor.toppingEmoji}</span>
          <span className="font-black text-[#B45309] text-xs sm:text-sm whitespace-nowrap">
            {currentFlavor.badge} · {poppedCount}/{kernels.length}
          </span>
        </div>

        <PlayProgress total={totalRounds} done={round} label={`${round + 1}/${totalRounds}`} />
      </div>

      {/* Chef Buddy & Popcorn Bucket Row */}
      <div className="relative z-20 flex items-center justify-center gap-3 my-1">
        <motion.div
          animate={
            isSeasoned
              ? { y: [0, -12, 0], scale: [1, 1.1, 1] }
              : poppedCount > 0
              ? { y: [0, -5, 0] }
              : {}
          }
          transition={{ duration: 0.5 }}
          className="relative flex items-center gap-2.5 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-3xl border-2 border-[#FCD34D] shadow-md"
        >
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
            <CharacterAvatar
              id={buddy}
              size="md"
              mood={isSeasoned ? 'excited' : poppedCount > 0 ? 'happy' : 'still'}
            />
            <span
              className="absolute -top-2 -right-1 text-xl drop-shadow-sm pointer-events-none"
              aria-hidden="true"
            >
              👩‍🍳
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-[#D97706]">
              {round + 1}단계 · {currentFlavor.title}
            </span>
            <span className="text-sm sm:text-base font-black text-[#78350F]">
              {buddyBubble}
            </span>
          </div>

          <div
            className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#FEF3C7] border-2 border-[#F59E0B] text-2xl shadow-inner"
            aria-hidden="true"
          >
            🍿
          </div>
        </motion.div>
      </div>

      {/* Main Frying Pan Stage */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center min-h-0 my-1">
        {/* Stove Flame Halo Under the Pan */}
        <div
          className="popcorn-flame-anim absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(251,146,60,0.45) 0%, rgba(245,158,11,0.22) 58%, rgba(251,191,36,0) 76%)',
          }}
          aria-hidden="true"
        />

        {/* Circular Frying Pan Body */}
        <motion.div
          key={panShakeKey}
          initial={{ rotate: 0, scale: 1 }}
          animate={
            panShakeKey > 0
              ? {
                  rotate: [0, -4, 4, -2, 0],
                  scale: [1, 1.03, 0.99, 1],
                  y: [0, -6, 0],
                }
              : {}
          }
          transition={{ duration: 0.32 }}
          onClick={handleShakePan}
          role="button"
          tabIndex={0}
          aria-label="프라이팬 두드려서 팝콘 튀기기"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              const unpopped = kernels.find((k) => !k.popped);
              if (unpopped) triggerKernelPop(unpopped.id);
            }
          }}
          className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full cursor-pointer flex items-center justify-center shadow-[0_18px_36px_rgba(120,53,15,0.32)] border-[10px] border-[#475569] bg-gradient-to-br from-[#334155] via-[#1E293B] to-[#0F172A]"
        >
          {/* Inner Non-stick Warm Copper Ring */}
          <div className="w-[88%] h-[88%] rounded-full border-4 border-[#F59E0B]/50 bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E1B4B] relative flex items-center justify-center overflow-visible shadow-inner">
            {/* Melted Butter / Caramel / Cheese Sizzle Puddle */}
            <svg
              viewBox="0 0 200 200"
              className="absolute inset-0 w-full h-full opacity-35 pointer-events-none"
              aria-hidden="true"
            >
              <circle cx="100" cy="100" r="76" fill="none" stroke="#FBBF24" strokeWidth="2" strokeDasharray="6 8" />
              <path
                d="M55,95 Q70,60 108,68 T152,102 Q145,142 102,144 T55,95 Z"
                fill={currentFlavor.glazeFill}
                opacity="0.45"
              />
            </svg>

            {/* Corn Kernels & Popped Popcorn Pieces */}
            {kernels.map((kernel) => (
              <motion.button
                key={`${round}-${kernel.id}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerKernelPop(kernel.id, e.clientX, e.clientY);
                }}
                style={{
                  left: `${50 + kernel.x}%`,
                  top: `${50 + kernel.y}%`,
                }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={
                  kernel.popped
                    ? {
                        scale: [1.35, 0.92, 1.08],
                        y: [0, -22, 0],
                        rotate: kernel.rotation,
                        opacity: 1,
                      }
                    : {
                        scale: kernel.isKing ? 1.18 : 1,
                        y: 0,
                        rotate: kernel.rotation,
                        opacity: 1,
                      }
                }
                whileTap={{ scale: 0.86 }}
                transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                aria-label={
                  kernel.popped
                    ? '튀겨진 바삭 팝콘'
                    : kernel.isKing
                    ? '황금 왕옥수수 터뜨리기'
                    : '옥수수 알맹이 터뜨리기'
                }
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full focus:outline-none ${
                  !kernel.popped ? 'kernel-sizzle-anim' : ''
                }`}
              >
                {!kernel.popped ? (
                  /* Cute Unpopped Golden Corn Kernel SVG */
                  <svg viewBox="0 0 80 80" className="w-full h-full drop-shadow-md overflow-visible">
                    {kernel.isKing && (
                      <path
                        d="M24,18 L30,6 L40,14 L50,6 L56,18 Z"
                        fill="#FDE047"
                        stroke="#CA8A04"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                      />
                    )}
                    {/* Golden teardrop kernel body */}
                    <path
                      d="M40,15 C58,15 65,34 62,52 C59,64 50,69 40,69 C30,69 21,64 18,52 C15,34 22,15 40,15 Z"
                      fill={kernel.isKing ? '#FDE047' : '#FBBF24'}
                      stroke="#D97706"
                      strokeWidth="3.5"
                    />
                    {/* Creamy tip at bottom */}
                    <ellipse cx="40" cy="61" rx="11" ry="6" fill="#FEF3C7" />
                    {/* Gloss highlight */}
                    <ellipse cx="30" cy="30" rx="5" ry="9" transform="rotate(-18 30 30)" fill="#FFFBEB" opacity="0.8" />
                    {/* Cute kawaii eyes & smile */}
                    <circle cx="33" cy="43" r="3.4" fill="#451A03" />
                    <circle cx="47" cy="43" r="3.4" fill="#451A03" />
                    <circle cx="32" cy="41.8" r="1.2" fill="#FFFFFF" />
                    <circle cx="46" cy="41.8" r="1.2" fill="#FFFFFF" />
                    <ellipse cx="27" cy="48" rx="3.5" ry="2" fill="#FB7185" opacity="0.65" />
                    <ellipse cx="53" cy="48" rx="3.5" ry="2" fill="#FB7185" opacity="0.65" />
                    <path
                      d="M35,48 Q40,53 45,48"
                      fill="none"
                      stroke="#451A03"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  /* Fluffy Popped Popcorn Cloud SVG */
                  <svg viewBox="0 0 90 90" className="w-full h-full drop-shadow-lg overflow-visible">
                    {/* Puffy popcorn lobes */}
                    <circle cx="30" cy="36" r="18" fill={currentFlavor.puffShade} stroke="#D97706" strokeWidth="2.8" />
                    <circle cx="58" cy="35" r="18" fill={currentFlavor.puffShade} stroke="#D97706" strokeWidth="2.8" />
                    <circle cx="26" cy="56" r="17" fill={currentFlavor.puffFill} stroke="#D97706" strokeWidth="2.8" />
                    <circle cx="62" cy="56" r="17" fill={currentFlavor.puffFill} stroke="#D97706" strokeWidth="2.8" />
                    <circle cx="45" cy="26" r="19" fill={currentFlavor.puffFill} stroke="#D97706" strokeWidth="2.8" />
                    <circle cx="45" cy="48" r="22" fill={currentFlavor.puffFill} />
                    {/* Golden roasted hull center */}
                    <path
                      d="M36,38 Q45,28 54,38 Q49,47 45,45 Q41,47 36,38 Z"
                      fill={
                        currentFlavor.id === 'rainbow'
                          ? kernel.rainbowTint || '#EC4899'
                          : currentFlavor.glazeFill
                      }
                    />
                    {/* Happy eyes on popped popcorn */}
                    <path d="M34,50 Q37,46 40,50" fill="none" stroke="#78350F" strokeWidth="2.8" strokeLinecap="round" />
                    <path d="M50,50 Q53,46 56,50" fill="none" stroke="#78350F" strokeWidth="2.8" strokeLinecap="round" />
                    <path d="M41,56 Q45,61 49,56" fill="none" stroke="#78350F" strokeWidth="2.8" strokeLinecap="round" />
                    <ellipse cx="31" cy="55" rx="3.5" ry="2" fill="#FB7185" opacity="0.65" />
                    <ellipse cx="59" cy="55" rx="3.5" ry="2" fill="#FB7185" opacity="0.65" />
                    {/* Extra seasoning sparkles when seasoned */}
                    {(isSeasoned || kernel.bounceCount > 1) && (
                      <>
                        <circle cx="26" cy="26" r="3.5" fill="#FACC15" />
                        <circle cx="64" cy="28" r="3.5" fill="#FB7185" />
                        <circle cx="46" cy="68" r="3.5" fill="#38BDF8" />
                      </>
                    )}
                  </svg>
                )}
              </motion.button>
            ))}

            {/* Floating Pop Word Badges ("퐁!", "팡팡!", "바삭!") */}
            <AnimatePresence>
              {floatingBursts.map((b) => (
                <motion.div
                  key={b.id}
                  style={{
                    left: `${50 + b.x}%`,
                    top: `${50 + b.y}%`,
                  }}
                  initial={{ opacity: 1, scale: 0.7, y: -6 }}
                  animate={{ opacity: 0, scale: 1.25, y: -42 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.65 }}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-30 px-2.5 py-0.5 rounded-full bg-[#FEF08A] border-2 border-[#CA8A04] text-[#78350F] font-black text-xs sm:text-sm shadow-md whitespace-nowrap"
                >
                  {b.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Tactile Pan Handle + Quick Shake / Seasoning Action Bar */}
        <div className="relative z-30 mt-3 flex items-center justify-center gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={handleShakePan}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-sm sm:text-base text-white shadow-lg border-3 border-[#78350F] bg-gradient-to-r from-[#EA580C] via-[#F59E0B] to-[#D97706]"
          >
            <Flame className="w-5 h-5 fill-yellow-200 text-yellow-100" />
            <span>
              {allPopped
                ? `${currentFlavor.toppingEmoji} 양념 솔솔~ 냠냠 먹기!`
                : '프라이팬 흔들기 🍳 팡팡!'}
            </span>
            <Sparkles className="w-5 h-5 text-yellow-100" />
          </motion.button>
        </div>
      </div>
      {completed && <RoundContinuation delayMs={900} onNext={() => { setCompleted(false); setRound(0); }}/>}
    </div>
  );
};
