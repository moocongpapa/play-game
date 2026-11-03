import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Droplets } from 'lucide-react';
import type { CharacterId, AgeGroup } from '../../types';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { PlayGuide, PlayProgress } from '../../components/ToddlerPlay';
import { PixiStageOverlay, type PixiStageHandle } from '../../components/PixiStageOverlay';
import {
  speakText,
  stopAllSpeech,
  playCorrectFanfare,
  playCelebrationFanfare,
  playBalloonPop,
  playBouncyBoing,
  playStarGain,
  playRisingStepChime,
} from '../../utils/soundEngine';
import { fireConfetti, fireStarExplosion } from '../../utils/confetti';
import { emitJuice } from '../../utils/juice';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';

interface SplashColorGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup?: AgeGroup;
  childName?: string;
}

interface SplashRound {
  id: 'car' | 'rocket' | 'train';
  title: string;
  badge: string;
  emoji: string;
  guideText: string;
  completedVoice: string;
}

const SPLASH_ROUNDS: SplashRound[] = [
  {
    id: 'car',
    title: '부릉부릉 무지개 자동차',
    badge: '🚗 자동차 물풍선 색칠',
    emoji: '🚗',
    guideText: '하얀 자동차 칸이나 물풍선을 톡 눌러 물감을 팡팡 터뜨려 색칠해 봐!',
    completedVoice: '부릉부릉~! 알록달록 멋진 무지개 자동차가 출발해요!',
  },
  {
    id: 'rocket',
    title: '슈웅 반짝 우주 로켓',
    badge: '🚀 우주 로켓 물풍선 색칠',
    emoji: '🚀',
    guideText: '이번엔 우주 로켓이야! 칸을 톡톡 눌러 물풍선 물감으로 멋지게 색칠해 줄래?',
    completedVoice: '쓰리 투 원 발사! 무지개 우주 로켓이 하늘 높이 날아가요!',
  },
  {
    id: 'train',
    title: '칙칙폭폭 무지개 기차',
    badge: '🚂 무지개 기차 색칠',
    emoji: '🚂',
    guideText: '마지막은 칙칙폭폭 기차야! 물풍선을 팡팡 터뜨려 기차를 알록달록 꾸며 봐!',
    completedVoice: '칙칙폭폭 뿌우~! 무지개 기차가 신나게 달립니다! 최고야!',
  },
];

const BALLOON_PALETTE = [
  { id: 0, name: '빨강 물풍선', hex: '#F43F5E', num: 0xF43F5E },
  { id: 1, name: '노랑 물풍선', hex: '#FACC15', num: 0xFACC15 },
  { id: 2, name: '하늘 물풍선', hex: '#38BDF8', num: 0x38BDF8 },
  { id: 3, name: '초록 물풍선', hex: '#4ADE80', num: 0x4ADE80 },
  { id: 4, name: '보라 물풍선', hex: '#A855F7', num: 0xA855F7 },
];

export const SplashColorGame: React.FC<SplashColorGameProps> = ({
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
  const currentRoundData = SPLASH_ROUNDS[round] || SPLASH_ROUNDS[0];

  const [selectedBalloon, setSelectedBalloon] = useState(BALLOON_PALETTE[0]);
  const [zones, setZones] = useState<Array<string | null>>([null, null, null, null, null]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [splatBadges, setSplatBadges] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);
  const [buddyBubble, setBuddyBubble] = useState('하얀 칸이나 물풍선을 톡 눌러 팡! 색칠해 봐!');

  const setupRound = useCallback((roundIdx: number) => {
    roundDoneRef.current = false;
    setZones([null, null, null, null, null]);
    setIsCompleted(false);
    setSelectedBalloon(BALLOON_PALETTE[0]);
    const data = SPLASH_ROUNDS[roundIdx] || SPLASH_ROUNDS[0];
    setBuddyBubble(`${data.title}의 하얀 칸을 톡톡 눌러 물풍선을 터뜨려 봐!`);
  }, []);

  useEffect(() => {
    setupRound(round);
  }, [round, setupRound]);

  useEffect(() => {
    const data = SPLASH_ROUNDS[round] || SPLASH_ROUNDS[0];
    speakText(data.guideText, soundEnabled, { characterId: buddy });
  }, [round, soundEnabled, buddy]);

  useEffect(() => {
    return () => {
      clearGameTimeouts();
      stopAllSpeech();
    };
  }, [clearGameTimeouts]);

  const finishVehicleRound = useCallback(
    (data: SplashRound, currentRound: number) => {
      if (roundDoneRef.current) return;
      roundDoneRef.current = true;
      setIsCompleted(true);

      playCorrectFanfare(soundEnabled);
      playBouncyBoing(soundEnabled);
      setBuddyBubble(`우와! ${data.title} 완성! 부릉부릉 출발~!`);
      speakText(data.completedVoice, soundEnabled, { characterId: buddy });

      fireStarExplosion();
      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        pixiRef.current?.emitBurst({
          x: rect.width / 2,
          y: rect.height / 2,
          color: 0x38BDF8,
          count: 34,
          kind: 'star',
        });
      }

      scheduleGameTimeout(() => {
        if (currentRound + 1 < totalRounds) {
          playStarGain(soundEnabled);
          setRound((r) => r + 1);
        } else {
          playCelebrationFanfare(soundEnabled);
          fireConfetti();
          onCompleteQuiz(3);
        }
      }, 2500);
    },
    [buddy, onCompleteQuiz, scheduleGameTimeout, soundEnabled]
  );

  const handleSplatZone = useCallback(
    (zoneIdx: number, balloonOverride = selectedBalloon, e?: React.MouseEvent<SVGElement | HTMLElement>) => {
      if (e) e.stopPropagation();
      if (roundDoneRef.current) return;

      playBalloonPop(soundEnabled);

      if (e) {
        emitJuice({ kind: 'pop', x: e.clientX, y: e.clientY });
        if (stageRef.current) {
          const rect = stageRef.current.getBoundingClientRect();
          pixiRef.current?.emitBurst({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            color: balloonOverride.num,
            count: 20,
            kind: 'water',
          });
        }
      }

      const splatId = Date.now() + Math.floor(Math.random() * 1000);
      setSplatBadges((prev) => [
        ...prev.slice(-4),
        {
          id: splatId,
          x: (zoneIdx * 17) % 50 - 25,
          y: (zoneIdx * 13) % 30 - 15,
          color: balloonOverride.hex,
        },
      ]);

      setZones((prev) => {
        const next = [...prev];
        next[zoneIdx] = balloonOverride.hex;
        const coloredCount = next.filter(Boolean).length;
        playRisingStepChime(coloredCount, 5, soundEnabled);

        // Auto-advance to the next balloon color for effortless rainbow coloring!
        const nextBalloon = BALLOON_PALETTE[(balloonOverride.id + 1) % BALLOON_PALETTE.length];
        setSelectedBalloon(nextBalloon);

        if (coloredCount >= 5) {
          finishVehicleRound(currentRoundData, round);
        } else {
          setBuddyBubble(`팡팡! 시원하게 색칠됐어! ${5 - coloredCount}칸 남았어!`);
        }
        return next;
      });
    },
    [currentRoundData, finishVehicleRound, round, selectedBalloon, soundEnabled]
  );

  const handleThrowNextBalloon = useCallback(
    (balloon = selectedBalloon, e?: React.MouseEvent<HTMLElement>) => {
      if (e) e.stopPropagation();
      if (roundDoneRef.current) return;
      const emptyIdx = zones.findIndex((z) => z === null);
      const targetIdx = emptyIdx !== -1 ? emptyIdx : Math.floor(Math.random() * 5);
      handleSplatZone(targetIdx, balloon, e);
    },
    [handleSplatZone, selectedBalloon, zones]
  );

  const coloredCount = zones.filter(Boolean).length;

  return (
    <div
      ref={stageRef}
      className="splash-color-stage relative flex flex-col justify-between w-full h-[var(--game-play-height,calc(100dvh-84px))] min-h-[var(--game-play-height,calc(100dvh-84px))] rounded-3xl overflow-hidden select-none bg-gradient-to-b from-[#ECFEFF] via-[#E0F2FE] to-[#FEF9C3] border-3 border-[#0EA5E9] p-3 sm:p-5"
    >
      <style>{`
        @keyframes uncoloredPulse {
          0%, 100% { opacity: 0.92; }
          50% { opacity: 1; }
        }
        .splash-zone-uncolored {
          animation: uncoloredPulse 1.2s ease-in-out infinite;
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
          title="물풍선 팡팡 색칠"
          guide={currentRoundData.guideText}
          soundEnabled={soundEnabled}
          happy={isCompleted}
        />

        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border-2 border-[#0284C7]">
          <span className="text-lg" aria-hidden="true">{currentRoundData.emoji}</span>
          <span className="font-black text-[#0369A1] text-xs sm:text-sm whitespace-nowrap">
            {currentRoundData.badge} · {coloredCount}/5
          </span>
        </div>

        <PlayProgress total={totalRounds} done={round} label={`${round + 1}/${totalRounds}`} />
      </div>

      {/* Buddy Banner */}
      <div className="relative z-20 flex items-center justify-center gap-3 my-0.5">
        <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-3xl border-2 border-[#7DD3FC] shadow-md">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
            <CharacterAvatar
              id={buddy}
              size="sm"
              mood={isCompleted ? 'excited' : coloredCount > 0 ? 'happy' : 'still'}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-[#0284C7]">
              {round + 1}단계 · {currentRoundData.title}
            </span>
            <span className="text-xs sm:text-sm font-black text-[#0C4A6E]">{buddyBubble}</span>
          </div>
        </div>
      </div>

      {/* Center Tap-to-Splat Coloring Canvas */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center min-h-0">
        <motion.div
          animate={
            isCompleted
              ? {
                  x: [0, 14, -10, 0],
                  y: [0, -10, 0],
                  scale: [1, 1.07, 1],
                }
              : {}
          }
          transition={{ duration: 0.65 }}
          className="relative w-72 h-56 sm:w-84 sm:h-64 flex items-center justify-center bg-white/90 rounded-3xl border-4 border-[#38BDF8] shadow-xl p-2"
        >
          <svg viewBox="0 0 360 250" className="w-full h-full overflow-visible">
            {currentRoundData.id === 'car' && (
              /* Round 1: Cute Rainbow Car with 5 Tap Zones */
              <g>
                {/* Zone 0: Car Roof & Cabin */}
                <path
                  d="M95,120 L125,62 L235,62 L265,120 Z"
                  fill={zones[0] || '#F8FAFC'}
                  stroke="#1E293B"
                  strokeWidth="5"
                  strokeLinejoin="round"
                  className="cursor-pointer splash-zone-uncolored"
                  onClick={(e) => handleSplatZone(0, selectedBalloon, e)}
                />
                {/* Zone 1: Car Main Body */}
                <rect
                  x="48"
                  y="118"
                  width="264"
                  height="68"
                  rx="28"
                  fill={zones[1] || '#F8FAFC'}
                  stroke="#1E293B"
                  strokeWidth="5"
                  className="cursor-pointer splash-zone-uncolored"
                  onClick={(e) => handleSplatZone(1, selectedBalloon, e)}
                />
                {/* Zone 2: Front Bumper & Headlight */}
                <circle
                  cx="296"
                  cy="146"
                  r="18"
                  fill={zones[2] || '#FEF9C3'}
                  stroke="#1E293B"
                  strokeWidth="4.5"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(2, selectedBalloon, e)}
                />
                {/* Zone 3: Left Wheel */}
                <circle
                  cx="112"
                  cy="188"
                  r="32"
                  fill={zones[3] || '#E2E8F0'}
                  stroke="#1E293B"
                  strokeWidth="6"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(3, selectedBalloon, e)}
                />
                <circle cx="112" cy="188" r="12" fill="#FFFFFF" pointerEvents="none" />
                {/* Zone 4: Right Wheel */}
                <circle
                  cx="248"
                  cy="188"
                  r="32"
                  fill={zones[4] || '#E2E8F0'}
                  stroke="#1E293B"
                  strokeWidth="6"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(4, selectedBalloon, e)}
                />
                <circle cx="248" cy="188" r="12" fill="#FFFFFF" pointerEvents="none" />
              </g>
            )}

            {currentRoundData.id === 'rocket' && (
              /* Round 2: Space Rocket with 5 Tap Zones */
              <g>
                {/* Zone 0: Rocket Nose Cone */}
                <path
                  d="M180,22 L228,84 L132,84 Z"
                  fill={zones[0] || '#F8FAFC'}
                  stroke="#1E293B"
                  strokeWidth="5"
                  strokeLinejoin="round"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(0, selectedBalloon, e)}
                />
                {/* Zone 1: Rocket Main Fuselage */}
                <rect
                  x="132"
                  y="84"
                  width="96"
                  height="96"
                  rx="16"
                  fill={zones[1] || '#F8FAFC'}
                  stroke="#1E293B"
                  strokeWidth="5"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(1, selectedBalloon, e)}
                />
                {/* Zone 2: Porthole Window */}
                <circle
                  cx="180"
                  cy="130"
                  r="26"
                  fill={zones[2] || '#E0F2FE'}
                  stroke="#1E293B"
                  strokeWidth="5"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(2, selectedBalloon, e)}
                />
                {/* Zone 3: Left Wing Fin */}
                <path
                  d="M132,132 L84,186 L132,176 Z"
                  fill={zones[3] || '#F8FAFC'}
                  stroke="#1E293B"
                  strokeWidth="5"
                  strokeLinejoin="round"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(3, selectedBalloon, e)}
                />
                {/* Zone 4: Right Wing Fin & Booster Flame */}
                <path
                  d="M228,132 L276,186 L228,176 Z"
                  fill={zones[4] || '#F8FAFC'}
                  stroke="#1E293B"
                  strokeWidth="5"
                  strokeLinejoin="round"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(4, selectedBalloon, e)}
                />
                <path
                  d="M154,182 L180,228 L206,182 Z"
                  fill={zones[4] || '#FEF08A'}
                  stroke="#EA580C"
                  strokeWidth="4"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(4, selectedBalloon, e)}
                />
              </g>
            )}

            {currentRoundData.id === 'train' && (
              /* Round 3: Choo-Choo Train with 5 Tap Zones */
              <g>
                {/* Zone 0: Smokestack Chimney */}
                <rect
                  x="84"
                  y="48"
                  width="38"
                  height="56"
                  rx="8"
                  fill={zones[0] || '#F8FAFC'}
                  stroke="#1E293B"
                  strokeWidth="5"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(0, selectedBalloon, e)}
                />
                {/* Zone 1: Engine Boiler */}
                <rect
                  x="64"
                  y="102"
                  width="136"
                  height="76"
                  rx="18"
                  fill={zones[1] || '#F8FAFC'}
                  stroke="#1E293B"
                  strokeWidth="5"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(1, selectedBalloon, e)}
                />
                {/* Zone 2: Conductor Cabin */}
                <rect
                  x="196"
                  y="66"
                  width="98"
                  height="112"
                  rx="16"
                  fill={zones[2] || '#F8FAFC'}
                  stroke="#1E293B"
                  strokeWidth="5"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(2, selectedBalloon, e)}
                />
                {/* Zone 3: Front Wheels */}
                <circle
                  cx="116"
                  cy="192"
                  r="28"
                  fill={zones[3] || '#E2E8F0'}
                  stroke="#1E293B"
                  strokeWidth="5.5"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(3, selectedBalloon, e)}
                />
                {/* Zone 4: Rear Big Wheel */}
                <circle
                  cx="244"
                  cy="192"
                  r="32"
                  fill={zones[4] || '#E2E8F0'}
                  stroke="#1E293B"
                  strokeWidth="5.5"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(4, selectedBalloon, e)}
                />
              </g>
            )}
          </svg>

          {/* Floating Water Splat Words ("팡!", "첨벙!") */}
          <AnimatePresence>
            {splatBadges.map((sb) => (
              <motion.div
                key={sb.id}
                style={{
                  left: `${50 + sb.x}%`,
                  top: `${50 + sb.y}%`,
                  backgroundColor: sb.color,
                }}
                initial={{ opacity: 1, scale: 0.6, y: 0 }}
                animate={{ opacity: 0, scale: 1.3, y: -38 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 px-3 py-0.5 rounded-full text-white font-black text-xs sm:text-sm border-2 border-white shadow-md"
              >
                물풍선 팡! 💦
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Bottom Bouncy Water Balloon Rack */}
        <div className="relative z-30 mt-2.5 flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-2.5 bg-white/95 px-4 py-1.5 rounded-full shadow-md border-2 border-[#38BDF8]">
            {BALLOON_PALETTE.map((b) => (
              <motion.button
                key={b.id}
                type="button"
                whileTap={{ scale: 0.85 }}
                onClick={(e) => {
                  setSelectedBalloon(b);
                  handleThrowNextBalloon(b, e);
                }}
                aria-label={`${b.name} 던져서 색칠하기`}
                style={{ backgroundColor: b.hex }}
                className={`w-10 h-11 sm:w-11 sm:h-12 rounded-t-full rounded-b-3xl border-3 flex items-center justify-center text-white font-black shadow-md transition-transform ${
                  selectedBalloon.id === b.id ? 'scale-115 border-[#0F172A]' : 'border-white'
                }`}
              >
                💧
              </motion.button>
            ))}
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={(e) => handleThrowNextBalloon(selectedBalloon, e)}
            className="flex items-center gap-2 px-5 py-2 rounded-full font-black text-sm sm:text-base text-white shadow-lg border-3 border-[#0C4A6E] bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#6366F1]"
          >
            <Droplets className="w-5 h-5 text-cyan-100" />
            <span>
              {isCompleted ? '우와! 알록달록 완성! 출발~! 🎉' : '물풍선 팡팡 던져서 색칠하기! 🎈💦'}
            </span>
            <Sparkles className="w-5 h-5 text-yellow-200" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
