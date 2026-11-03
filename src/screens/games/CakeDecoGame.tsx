import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
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
  playBouncyBoing,
  playJellyTap,
  playStarGain,
  playRisingStepChime,
  playCareSound,
} from '../../utils/soundEngine';
import { fireConfetti, fireStarExplosion } from '../../utils/confetti';
import { emitJuice } from '../../utils/juice';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';

interface CakeDecoGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup?: AgeGroup;
  childName?: string;
}

interface CakeRound {
  id: 'strawberry' | 'donut' | 'royal';
  title: string;
  badge: string;
  emoji: string;
  guideText: string;
  candleVoice: string;
  finishedVoice: string;
}

const CAKE_ROUNDS: CakeRound[] = [
  {
    id: 'strawberry',
    title: '달콤 딸기 2단 케이크',
    badge: '🎂 딸기 케이크 꾸미기',
    emoji: '🎂',
    guideText: '예쁜 크림 색깔을 골라 케이크에 쓱쓱 칠하고 달콤한 과일 토핑을 올려 볼까?',
    candleVoice: '우와! 맛있는 케이크 완성! 이제 촛불을 눌러 후~ 불어 꺼 봐!',
    finishedVoice: '후~! 생일 축하합니다! 달콤한 딸기 케이크 냠냠 정말 맛있다!',
  },
  {
    id: 'donut',
    title: '무지개 스프링클 도넛',
    badge: '🍩 무지개 도넛 색칠',
    emoji: '🍩',
    guideText: '이번엔 동그란 도넛에 알록달록 초코 시럽을 칠하고 토핑을 콕콕 올려 봐!',
    candleVoice: '달콤한 도넛이 완성됐어! 반짝이는 촛불을 후~ 불어 꺼 볼까?',
    finishedVoice: '와아! 쫀득쫀득 무지개 도넛 최고야! 고마워!',
  },
  {
    id: 'royal',
    title: '왕관 파티 생일 케이크',
    badge: '👑 왕관 파티 케이크',
    emoji: '👑',
    guideText: '마지막은 특별한 파티 케이크야! 내 맘대로 크림을 칠하고 왕관 토핑으로 꾸며 봐!',
    candleVoice: '멋진 파티 케이크 완성! 다 같이 촛불을 후~ 불어 꺼 보자!',
    finishedVoice: '대단해! 세상에서 제일 멋진 파티 케이크 요리사야!',
  },
];

const CREAM_COLORS = [
  { id: 'pink', label: '딸기크림', hex: '#F472B6', shade: '#FBCFE8', num: 0xF472B6 },
  { id: 'choco', label: '초코크림', hex: '#92400E', shade: '#D97706', num: 0xD97706 },
  { id: 'lemon', label: '레몬버터', hex: '#FACC15', shade: '#FEF08A', num: 0xFACC15 },
  { id: 'mint', label: '민트소다', hex: '#38BDF8', shade: '#BAE6FD', num: 0x38BDF8 },
  { id: 'grape', label: '포도크림', hex: '#A855F7', shade: '#E9D5FF', num: 0xA855F7 },
];

const TOPPING_ITEMS = ['🍓', '🍒', '🍫', '🍬', '👑'];

interface PlacedTopping {
  id: number;
  emoji: string;
  x: number;
  y: number;
}

const TOPPING_SPOTS = [
  { x: 112, y: 112 },
  { x: 160, y: 106 },
  { x: 208, y: 112 },
  { x: 96, y: 168 },
  { x: 160, y: 166 },
  { x: 224, y: 168 },
];

export const CakeDecoGame: React.FC<CakeDecoGameProps> = ({
  buddy,
  onCompleteQuiz,
  soundEnabled,
}) => {
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const pixiRef = useRef<PixiStageHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const roundDoneRef = useRef(false);

  const [round, setRound] = useState(0);
  const totalRounds = 3;
  const currentCake = CAKE_ROUNDS[round] || CAKE_ROUNDS[0];

  const [selectedColor, setSelectedColor] = useState(CREAM_COLORS[0]);
  const [layerColors, setLayerColors] = useState<[string | null, string | null, string | null]>([
    null,
    null,
    null,
  ]);
  const [toppings, setToppings] = useState<PlacedTopping[]>([]);
  const [candlesLit, setCandlesLit] = useState(false);
  const [candlesBlown, setCandlesBlown] = useState(false);
  const [buddyBubble, setBuddyBubble] = useState('하얀 케이크를 톡톡 눌러 크림을 칠해줘!');

  const setupRound = useCallback((roundIdx: number) => {
    roundDoneRef.current = false;
    setLayerColors([null, null, null]);
    setToppings([]);
    setCandlesLit(false);
    setCandlesBlown(false);
    setSelectedColor(CREAM_COLORS[roundIdx % CREAM_COLORS.length]);
    const cake = CAKE_ROUNDS[roundIdx] || CAKE_ROUNDS[0];
    setBuddyBubble(`${cake.title}에 맛있는 크림을 칠하고 토핑을 올려줘!`);
  }, []);

  useEffect(() => {
    setupRound(round);
  }, [round, setupRound]);

  useEffect(() => {
    const cake = CAKE_ROUNDS[round] || CAKE_ROUNDS[0];
    speakText(cake.guideText, soundEnabled, { characterId: buddy });
  }, [round, soundEnabled, buddy]);

  useEffect(() => {
    return () => {
      clearGameTimeouts();
      stopAllSpeech();
    };
  }, [clearGameTimeouts]);

  const checkReadyForCandles = useCallback(
    (nextLayers: [string | null, string | null, string | null], nextToppings: PlacedTopping[]) => {
      const coloredCount = nextLayers.filter(Boolean).length;
      if (coloredCount >= 3 && nextToppings.length >= 2 && !candlesLit && !roundDoneRef.current) {
        setCandlesLit(true);
        playSparkleChime(soundEnabled);
        setBuddyBubble('와! 촛불이 켜졌어! 촛불이나 아래 버튼을 눌러 후~ 불어 꺼 봐!');
        speakText(currentCake.candleVoice, soundEnabled, { characterId: buddy });
      }
    },
    [buddy, candlesLit, currentCake.candleVoice, soundEnabled]
  );

  const handlePaintLayer = useCallback(
    (layerIdx: 0 | 1 | 2, e?: React.MouseEvent<SVGElement | HTMLButtonElement>) => {
      if (e) e.stopPropagation();
      if (roundDoneRef.current) return;

      playJellyTap(soundEnabled);
      if (e) {
        emitJuice({ kind: 'pop', x: e.clientX, y: e.clientY });
        if (stageRef.current) {
          const rect = stageRef.current.getBoundingClientRect();
          pixiRef.current?.emitBurst({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            color: selectedColor.num,
            count: 14,
            kind: 'star',
          });
        }
      }

      setLayerColors((prev) => {
        const next: [string | null, string | null, string | null] = [...prev] as [
          string | null,
          string | null,
          string | null,
        ];
        next[layerIdx] = selectedColor.hex;
        const coloredCount = next.filter(Boolean).length;
        playRisingStepChime(coloredCount + toppings.length, 5, soundEnabled);
        checkReadyForCandles(next, toppings);
        return next;
      });
    },
    [checkReadyForCandles, selectedColor, soundEnabled, toppings]
  );

  const handleAddTopping = useCallback(
    (emoji: string, e?: React.MouseEvent<HTMLElement>) => {
      if (e) e.stopPropagation();
      if (roundDoneRef.current) return;

      playBouncyBoing(soundEnabled);
      if (e) {
        emitJuice({ kind: 'pop', x: e.clientX, y: e.clientY });
      }

      // Also auto-fill any uncolored layer if the child taps toppings right away!
      let updatedLayers = layerColors;
      const firstEmptyIdx = layerColors.findIndex((c) => c === null);
      if (firstEmptyIdx !== -1) {
        const copy: [string | null, string | null, string | null] = [...layerColors] as [
          string | null,
          string | null,
          string | null,
        ];
        copy[firstEmptyIdx] = selectedColor.hex;
        updatedLayers = copy;
        setLayerColors(copy);
      }

      setToppings((prev) => {
        const spot = TOPPING_SPOTS[prev.length % TOPPING_SPOTS.length];
        const next = [
          ...prev.slice(-5),
          {
            id: Date.now() + Math.floor(Math.random() * 1000),
            emoji,
            x: spot.x,
            y: spot.y,
          },
        ];
        checkReadyForCandles(updatedLayers, next);
        return next;
      });
    },
    [checkReadyForCandles, layerColors, selectedColor.hex, soundEnabled]
  );

  const handleBlowCandles = useCallback(
    (e?: React.MouseEvent<HTMLElement>) => {
      if (e) e.stopPropagation();
      if (roundDoneRef.current) return;

      // If not all decorated yet, one tap fills the next step automatically!
      if (!candlesLit) {
        const emptyIdx = layerColors.findIndex((c) => c === null);
        if (emptyIdx !== -1) {
          handlePaintLayer(emptyIdx as 0 | 1 | 2);
          return;
        }
        handleAddTopping(TOPPING_ITEMS[toppings.length % TOPPING_ITEMS.length], e);
        return;
      }

      roundDoneRef.current = true;
      setCandlesBlown(true);
      playCorrectFanfare(soundEnabled);
      playCareSound('chew', soundEnabled);
      setBuddyBubble('후~! 냠냠 달콤한 케이크 정말 맛있다! 고마워!');
      speakText(currentCake.finishedVoice, soundEnabled, { characterId: buddy });

      fireStarExplosion();
      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        pixiRef.current?.emitBurst({
          x: rect.width / 2,
          y: rect.height / 2,
          color: 0xF472B6,
          count: 32,
          kind: 'star',
        });
      }

      scheduleGameTimeout(() => {
        if (round + 1 < totalRounds) {
          playStarGain(soundEnabled);
          setRound((r) => r + 1);
        } else {
          playCelebrationFanfare(soundEnabled);
          fireConfetti();
          onCompleteQuiz(3);
        }
      }, 2500);
    },
    [
      buddy,
      candlesLit,
      currentCake.finishedVoice,
      handleAddTopping,
      handlePaintLayer,
      layerColors,
      onCompleteQuiz,
      round,
      scheduleGameTimeout,
      soundEnabled,
      toppings.length,
    ]
  );

  const coloredLayersCount = layerColors.filter(Boolean).length;
  const stepDone = Math.min(5, coloredLayersCount + Math.min(2, toppings.length));

  return (
    <div
      ref={stageRef}
      className="cake-deco-stage relative flex flex-col justify-between w-full h-[var(--game-play-height,calc(100dvh-84px))] min-h-[var(--game-play-height,calc(100dvh-84px))] rounded-3xl overflow-hidden select-none bg-gradient-to-b from-[#FDF2F8] via-[#FCE7F3] to-[#FEF3C7] border-3 border-[#F472B6] p-3 sm:p-5"
    >
      <style>{`
        @keyframes candleFlameDance {
          0%, 100% { transform: scaleY(1) rotate(-3deg); }
          50% { transform: scaleY(1.18) rotate(3deg); }
        }
        .cake-candle-flame {
          transform-origin: center bottom;
          animation: candleFlameDance 0.65s ease-in-out infinite;
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
          title="케이크 & 도넛 살롱"
          guide={currentCake.guideText}
          soundEnabled={soundEnabled}
          happy={candlesBlown}
        />

        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border-2 border-[#EC4899]">
          <span className="text-lg" aria-hidden="true">{currentCake.emoji}</span>
          <span className="font-black text-[#BE185D] text-xs sm:text-sm whitespace-nowrap">
            {currentCake.badge} · {stepDone}/5
          </span>
        </div>

        <PlayProgress total={totalRounds} done={round} label={`${round + 1}/${totalRounds}`} />
      </div>

      {/* Patissier Buddy Row */}
      <div className="relative z-20 flex items-center justify-center gap-3 my-0.5">
        <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-3xl border-2 border-[#F9A8D4] shadow-md">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
            <CharacterAvatar
              id={buddy}
              size="sm"
              mood={candlesBlown ? 'excited' : candlesLit ? 'dancing' : 'happy'}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-[#DB2777]">
              {round + 1}단계 · {currentCake.title}
            </span>
            <span className="text-xs sm:text-sm font-black text-[#831843]">{buddyBubble}</span>
          </div>
        </div>
      </div>

      {/* Center Interactive Cake / Donut SVG Stage */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center min-h-0">
        <motion.div
          animate={candlesBlown ? { scale: [1, 1.08, 1], y: [0, -10, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="relative w-64 h-56 sm:w-76 sm:h-64 flex items-center justify-center"
        >
          <svg viewBox="0 0 320 260" className="w-full h-full overflow-visible drop-shadow-xl">
            {/* Fancy Cake Stand Plate */}
            <ellipse cx="160" cy="226" rx="124" ry="20" fill="#FBCFE8" stroke="#DB2777" strokeWidth="4" />
            <ellipse cx="160" cy="222" rx="106" ry="13" fill="#FFFFFF" />

            {currentCake.id === 'donut' ? (
              /* Round 2: Giant Fluffy Donut with 3 Glaze Ring Zones */
              <g>
                {/* Outer Dough Base (Layer 0) */}
                <circle
                  cx="160"
                  cy="148"
                  r="76"
                  fill={layerColors[0] || '#FDE68A'}
                  stroke="#B45309"
                  strokeWidth="5"
                  className="cursor-pointer"
                  onClick={(e) => handlePaintLayer(0, e)}
                />
                {/* Scalloped Middle Icing Glaze (Layer 1) */}
                <path
                  d="M96,132 C96,92 224,92 224,132 C230,158 212,198 160,198 C108,198 90,158 96,132 Z"
                  fill={layerColors[1] || '#FFFBEB'}
                  stroke="#DB2777"
                  strokeWidth="4.5"
                  className="cursor-pointer"
                  onClick={(e) => handlePaintLayer(1, e)}
                />
                {/* Top Cream Swirl Ring (Layer 2) */}
                <circle
                  cx="160"
                  cy="148"
                  r="48"
                  fill="none"
                  stroke={layerColors[2] || '#FFFFFF'}
                  strokeWidth="16"
                  strokeDasharray="18 10"
                  className="cursor-pointer"
                  onClick={(e) => handlePaintLayer(2, e)}
                />
                {/* Donut Hole */}
                <circle cx="160" cy="148" r="24" fill="#FCE7F3" stroke="#B45309" strokeWidth="4" />
              </g>
            ) : (
              /* Round 1 & 3: 2-Tier Birthday Cake with 3 Tap-to-Color Zones */
              <g>
                {/* Bottom Cake Tier (Layer 0) */}
                <rect
                  x="64"
                  y="150"
                  width="192"
                  height="68"
                  rx="20"
                  fill={layerColors[0] || '#FFFBEB'}
                  stroke="#D97706"
                  strokeWidth="4.5"
                  className="cursor-pointer"
                  onClick={(e) => handlePaintLayer(0, e)}
                />
                {/* Bottom Tier Cream Drip */}
                <path
                  d="M68,162 Q88,182 108,162 Q128,182 148,162 Q168,182 188,162 Q208,182 228,162 Q242,178 252,162"
                  fill="none"
                  stroke={layerColors[1] || '#F9A8D4'}
                  strokeWidth="8"
                  strokeLinecap="round"
                />

                {/* Upper Cake Tier (Layer 1) */}
                <rect
                  x="92"
                  y="96"
                  width="136"
                  height="60"
                  rx="18"
                  fill={layerColors[1] || '#FFFFFF'}
                  stroke="#DB2777"
                  strokeWidth="4.5"
                  className="cursor-pointer"
                  onClick={(e) => handlePaintLayer(1, e)}
                />

                {/* Top Whipped Cream Frosting Crown (Layer 2) */}
                <path
                  d="M94,104 C94,76 128,76 134,98 C142,74 178,74 186,98 C192,76 226,76 226,104 Z"
                  fill={layerColors[2] || '#FFF1F2'}
                  stroke="#BE185D"
                  strokeWidth="4"
                  className="cursor-pointer"
                  onClick={(e) => handlePaintLayer(2, e)}
                />
              </g>
            )}

            {/* Birthday Candles on Top */}
            {(candlesLit || candlesBlown) && (
              <g className="cursor-pointer" onClick={(e) => handleBlowCandles(e as unknown as React.MouseEvent<HTMLElement>)}>
                {[126, 160, 194].map((cx, i) => (
                  <g key={i}>
                    <rect
                      x={cx - 6}
                      y={44}
                      width="12"
                      height="42"
                      rx="4"
                      fill={i === 1 ? '#60A5FA' : '#F472B6'}
                      stroke="#1E293B"
                      strokeWidth="2.5"
                    />
                    {!candlesBlown ? (
                      <path
                        d={`M${cx},18 C${cx + 10},28 ${cx + 8},40 ${cx},42 C${cx - 8},40 ${cx - 10},28 ${cx},18 Z`}
                        fill="#FACC15"
                        stroke="#EA580C"
                        strokeWidth="2"
                        className="cake-candle-flame"
                      />
                    ) : (
                      <text x={cx} y={32} textAnchor="middle" fontSize="16">
                        💨
                      </text>
                    )}
                  </g>
                ))}
              </g>
            )}

            {/* Placed Fruit / Candy / Crown Toppings */}
            {toppings.map((t) => (
              <text
                key={t.id}
                x={t.x}
                y={t.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="30"
                className="pointer-events-none select-none"
              >
                {t.emoji}
              </text>
            ))}
          </svg>
        </motion.div>

        {/* Cream Color Swatches + Topping Stamp Shelf */}
        <div className="relative z-30 flex flex-col items-center gap-2 w-full max-w-[420px]">
          <div className="flex items-center justify-center gap-2 bg-white/90 px-3 py-1.5 rounded-full shadow-md border-2 border-[#F9A8D4]">
            {CREAM_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  playJellyTap(soundEnabled);
                  setSelectedColor(c);
                  const emptyIdx = layerColors.findIndex((l) => l === null);
                  if (emptyIdx !== -1) {
                    handlePaintLayer(emptyIdx as 0 | 1 | 2);
                  }
                }}
                aria-label={`${c.label} 색칠하기`}
                style={{ backgroundColor: c.hex }}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-3 transition-transform ${
                  selectedColor.id === c.id ? 'scale-115 border-[#1E293B] shadow-md' : 'border-white'
                }`}
              />
            ))}
            <span className="w-0.5 h-6 bg-pink-200 mx-0.5" aria-hidden="true" />
            {TOPPING_ITEMS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={(e) => handleAddTopping(emoji, e)}
                aria-label={`${emoji} 토핑 올리기`}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FFF1F2] border-2 border-[#F472B6] flex items-center justify-center text-lg sm:text-xl shadow-sm active:scale-90 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={handleBlowCandles}
            className="flex items-center gap-2 px-5 py-2 rounded-full font-black text-sm sm:text-base text-white shadow-lg border-3 border-[#831843] bg-gradient-to-r from-[#EC4899] via-[#F43F5E] to-[#F59E0B]"
          >
            <Flame className="w-5 h-5 fill-yellow-200 text-yellow-100" />
            <span>
              {candlesBlown
                ? '와아! 달콤한 케이크 파티 최고야! 🎉'
                : candlesLit
                ? '후~! 촛불 불어 끄고 냠냠 먹기! 🕯️💨'
                : '쓱쓱 크림 바르고 토핑 올리기! 🎂'}
            </span>
            <Sparkles className="w-5 h-5 text-yellow-100" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
