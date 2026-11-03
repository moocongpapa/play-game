import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Paintbrush } from 'lucide-react';
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

interface BeautySalonGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup?: AgeGroup;
  childName?: string;
}

interface SalonRound {
  id: 'nails' | 'facepaint' | 'butterfly';
  title: string;
  badge: string;
  emoji: string;
  guideText: string;
  completedVoice: string;
}

const SALON_ROUNDS: SalonRound[] = [
  {
    id: 'nails',
    title: '반짝반짝 무지개 네일아트',
    badge: '💅 보석 네일아트 색칠',
    emoji: '💅',
    guideText: '예쁜 매니큐어 색깔을 골라 손톱 5개를 톡톡 칠하고 반짝이 보석을 붙여 볼까?',
    completedVoice: '우와! 손톱이 반짝반짝 보석처럼 빛나요! 정말 예쁘다!',
  },
  {
    id: 'facepaint',
    title: '야옹이 수염 & 하트 페이스페인팅',
    badge: '🐱 귀여운 페이스페인팅',
    emoji: '🐱',
    guideText: '이번엔 친구 얼굴에 고양이 수염과 하트 볼터치를 톡톡 그려 볼까?',
    completedVoice: '야옹~! 귀여운 고양이 수염이랑 하트 볼터치가 생겼어! 까르르!',
  },
  {
    id: 'butterfly',
    title: '무지개 나비 요정 메이크업',
    badge: '🦋 나비 요정 메이크업',
    emoji: '🦋',
    guideText: '마지막은 알록달록 나비 요정 분장이야! 얼굴에 반짝이 날개와 왕관을 칠해 봐!',
    completedVoice: '짜잔! 화려한 무지개 나비 요정으로 변신 완료! 최고의 뷰티 디자이너야!',
  },
];

const POLISH_COLORS = [
  { id: 'pink', label: '핑크', hex: '#EC4899', num: 0xEC4899, gem: '💖' },
  { id: 'purple', label: '보라', hex: '#A855F7', num: 0xA855F7, gem: '💎' },
  { id: 'sky', label: '하늘', hex: '#38BDF8', num: 0x38BDF8, gem: '⭐' },
  { id: 'gold', label: '노랑', hex: '#FACC15', num: 0xFACC15, gem: '👑' },
  { id: 'mint', label: '민트', hex: '#4ADE80', num: 0x4ADE80, gem: '🌸' },
];

const NAIL_POSITIONS = [
  { id: 0, x: 58, y: 122, rot: -18, label: '엄지 손톱' },
  { id: 1, x: 102, y: 66, rot: -7, label: '검지 손톱' },
  { id: 2, x: 155, y: 52, rot: 0, label: '중지 손톱' },
  { id: 3, x: 208, y: 68, rot: 8, label: '약지 손톱' },
  { id: 4, x: 250, y: 108, rot: 18, label: '새끼 손톱' },
];

const FACE_ZONES = [
  { id: 0, x: 110, y: 42, label: '이마 별 왕관' },
  { id: 1, x: 58, y: 118, label: '왼쪽 볼 하트와 수염' },
  { id: 2, x: 162, y: 118, label: '오른쪽 볼 하트와 수염' },
  { id: 3, x: 110, y: 104, label: '코 끝 반짝이' },
  { id: 4, x: 110, y: 164, label: '턱 리본 보석' },
];

export const BeautySalonGame: React.FC<BeautySalonGameProps> = ({
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
  const currentSalon = SALON_ROUNDS[round] || SALON_ROUNDS[0];

  const [selectedBrush, setSelectedBrush] = useState(POLISH_COLORS[0]);
  const [zoneColors, setZoneColors] = useState<Array<{ hex: string; gem: string } | null>>([
    null,
    null,
    null,
    null,
    null,
  ]);
  const [isDone, setIsDone] = useState(false);
  const [buddyBubble, setBuddyBubble] = useState('반짝이는 부분이나 아래 붓 버튼을 톡톡 눌러 칠해줘!');

  const setupRound = useCallback((roundIdx: number) => {
    roundDoneRef.current = false;
    setZoneColors([null, null, null, null, null]);
    setIsDone(false);
    setSelectedBrush(POLISH_COLORS[roundIdx % POLISH_COLORS.length]);
    const salon = SALON_ROUNDS[roundIdx] || SALON_ROUNDS[0];
    setBuddyBubble(`${salon.title}! 톡톡 눌러서 알록달록 칠해줘!`);
  }, []);

  useEffect(() => {
    setupRound(round);
  }, [round, setupRound]);

  useEffect(() => {
    const salon = SALON_ROUNDS[round] || SALON_ROUNDS[0];
    speakText(salon.guideText, soundEnabled, { characterId: buddy });
  }, [round, soundEnabled, buddy]);

  useEffect(() => {
    return () => {
      clearGameTimeouts();
      stopAllSpeech();
    };
  }, [clearGameTimeouts]);

  const finishRound = useCallback(
    (salon: SalonRound, currentRound: number) => {
      if (roundDoneRef.current) return;
      roundDoneRef.current = true;
      setIsDone(true);

      playCorrectFanfare(soundEnabled);
      playCareSound('giggle', soundEnabled);
      setBuddyBubble('우와! 거울을 봐! 너무 예쁘고 웃겨! 까르르!');
      speakText(salon.completedVoice, soundEnabled, { characterId: buddy });

      fireStarExplosion();
      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        pixiRef.current?.emitBurst({
          x: rect.width / 2,
          y: rect.height / 2,
          color: 0xEC4899,
          count: 32,
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

  const handlePaintZone = useCallback(
    (idx: number, brushOverride = selectedBrush, e?: React.MouseEvent<HTMLElement | SVGElement>) => {
      if (e) e.stopPropagation();
      if (roundDoneRef.current) return;

      playJellyTap(soundEnabled);
      playBouncyBoing(soundEnabled);
      if (e) {
        emitJuice({ kind: 'pop', x: e.clientX, y: e.clientY });
        if (stageRef.current) {
          const rect = stageRef.current.getBoundingClientRect();
          pixiRef.current?.emitBurst({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            color: brushOverride.num,
            count: 14,
            kind: 'star',
          });
        }
      }

      setZoneColors((prev) => {
        const next = [...prev];
        next[idx] = { hex: brushOverride.hex, gem: brushOverride.gem };
        const paintedCount = next.filter(Boolean).length;
        playRisingStepChime(paintedCount, 5, soundEnabled);

        if (paintedCount >= 5) {
          finishRound(currentSalon, round);
        } else {
          setBuddyBubble(`우와 반짝반짝! ${5 - paintedCount}곳 더 칠해볼까?`);
        }
        return next;
      });
    },
    [currentSalon, finishRound, round, selectedBrush, soundEnabled]
  );

  const handleQuickPaintNext = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (roundDoneRef.current) return;
      const nextEmpty = zoneColors.findIndex((z) => z === null);
      const targetIdx = nextEmpty !== -1 ? nextEmpty : Math.floor(Math.random() * 5);
      const randomColor = POLISH_COLORS[(targetIdx + round) % POLISH_COLORS.length];
      setSelectedBrush(randomColor);
      handlePaintZone(targetIdx, randomColor, e);
    },
    [handlePaintZone, round, zoneColors]
  );

  const paintedCount = zoneColors.filter(Boolean).length;

  return (
    <div
      ref={stageRef}
      className="beauty-salon-stage relative flex flex-col justify-between w-full h-[var(--game-play-height,calc(100dvh-84px))] min-h-[var(--game-play-height,calc(100dvh-84px))] rounded-3xl overflow-hidden select-none bg-gradient-to-b from-[#FAF5FF] via-[#FDF2F8] to-[#FCE7F3] border-3 border-[#D946EF] p-3 sm:p-5"
    >
      <style>{`
        @keyframes zoneGuidePulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        .salon-zone-pulse {
          animation: zoneGuidePulse 1.1s ease-in-out infinite;
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
          title="네일 & 페이스페인팅샵"
          guide={currentSalon.guideText}
          soundEnabled={soundEnabled}
          happy={isDone}
        />

        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border-2 border-[#D946EF]">
          <span className="text-lg" aria-hidden="true">{currentSalon.emoji}</span>
          <span className="font-black text-[#A21CAF] text-xs sm:text-sm whitespace-nowrap">
            {currentSalon.badge} · {paintedCount}/5
          </span>
        </div>

        <PlayProgress total={totalRounds} done={round} label={`${round + 1}/${totalRounds}`} />
      </div>

      {/* Stylist Buddy Banner */}
      <div className="relative z-20 flex items-center justify-center gap-3 my-0.5">
        <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-3xl border-2 border-[#F0ABFC] shadow-md">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
            <CharacterAvatar
              id={buddy}
              size="sm"
              mood={isDone ? 'excited' : paintedCount > 0 ? 'happy' : 'still'}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-[#C026D3]">
              {round + 1}단계 · {currentSalon.title}
            </span>
            <span className="text-xs sm:text-sm font-black text-[#701A75]">{buddyBubble}</span>
          </div>
        </div>
      </div>

      {/* Center Salon Mirror / Nail Cushion Stage */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center min-h-0">
        {currentSalon.id === 'nails' ? (
          /* Round 1: Big Cute Hand & 5 Paintable Fingernails */
          <div className="relative w-72 h-56 sm:w-80 sm:h-64 flex items-center justify-center">
            <svg viewBox="0 0 310 240" className="w-full h-full overflow-visible drop-shadow-xl">
              {/* Velvet Heart Cushion */}
              <ellipse cx="155" cy="185" rx="135" ry="44" fill="#FBCFE8" stroke="#EC4899" strokeWidth="4" />
              {/* Cute Chubby Hand Fingers & Palm */}
              {NAIL_POSITIONS.map((nail) => {
                const painted = zoneColors[nail.id];
                return (
                  <g
                    key={nail.id}
                    transform={`translate(${nail.x}, ${nail.y}) rotate(${nail.rot})`}
                    className="cursor-pointer"
                    onClick={(e) => handlePaintZone(nail.id, selectedBrush, e)}
                  >
                    {/* Finger */}
                    <rect
                      x="-22"
                      y="0"
                      width="44"
                      height="95"
                      rx="22"
                      fill="#FDE68A"
                      stroke="#D97706"
                      strokeWidth="3.5"
                    />
                    {/* Paintable Fingernail Plate */}
                    <rect
                      x="-18"
                      y="-18"
                      width="36"
                      height="44"
                      rx="18"
                      fill={painted ? painted.hex : '#FFF1F2'}
                      stroke={painted ? '#FFFFFF' : '#EC4899'}
                      strokeWidth="3.5"
                      strokeDasharray={painted ? undefined : '5 4'}
                      className={!painted ? 'salon-zone-pulse' : ''}
                    />
                    {/* Gloss Shine on Nail */}
                    <ellipse cx="-6" cy="-4" rx="4" ry="9" fill="#FFFFFF" opacity="0.65" />
                    {/* Gem Sticker on Painted Nail */}
                    {painted && (
                      <text x="0" y="6" textAnchor="middle" dominantBaseline="central" fontSize="18">
                        {painted.gem}
                      </text>
                    )}
                  </g>
                );
              })}
              {/* Palm Base */}
              <ellipse cx="155" cy="192" rx="92" ry="40" fill="#FDE68A" stroke="#D97706" strokeWidth="3.5" />
            </svg>
          </div>
        ) : (
          /* Round 2 & 3: Lighted Vanity Mirror with Buddy Face-Painting Zones */
          <div className="relative w-60 h-56 sm:w-68 sm:h-64 flex items-center justify-center rounded-full bg-gradient-to-b from-[#FFF1F2] to-[#FCE7F3] border-[8px] border-[#FACC15] shadow-[0_12px_32px_rgba(217,70,239,0.28)]">
            {/* Large Buddy Avatar inside Mirror */}
            <div className="w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center pointer-events-none">
              <CharacterAvatar
                id={buddy}
                size="xl"
                mood={isDone ? 'dancing' : paintedCount > 0 ? 'excited' : 'happy'}
                interactive={false}
              />
            </div>

            {/* Interactive SVG Face-Paint & Butterfly Mask Overlay */}
            <svg viewBox="0 0 220 220" className="absolute inset-0 w-full h-full overflow-visible">
              {/* Zone 0: Forehead Crown / Butterfly Crest */}
              <g
                className="cursor-pointer"
                onClick={(e) => handlePaintZone(0, selectedBrush, e)}
              >
                {zoneColors[0] ? (
                  <g>
                    <polygon
                      points="82,48 94,22 110,38 126,22 138,48"
                      fill={zoneColors[0].hex}
                      stroke="#FFFFFF"
                      strokeWidth="3"
                    />
                    <text x="110" y="38" textAnchor="middle" fontSize="20">
                      {zoneColors[0].gem}
                    </text>
                  </g>
                ) : (
                  <circle
                    cx={FACE_ZONES[0].x}
                    cy={FACE_ZONES[0].y}
                    r="18"
                    fill="rgba(255,255,255,0.65)"
                    stroke="#EC4899"
                    strokeWidth="3"
                    strokeDasharray="5 4"
                    className="salon-zone-pulse"
                  />
                )}
              </g>

              {/* Zone 1: Left Cheek Whiskers / Butterfly Wing */}
              <g
                className="cursor-pointer"
                onClick={(e) => handlePaintZone(1, selectedBrush, e)}
              >
                {zoneColors[1] ? (
                  currentSalon.id === 'butterfly' ? (
                    <path
                      d="M90,96 C42,60 22,102 52,130 C30,148 56,172 90,136 Z"
                      fill={zoneColors[1].hex}
                      fillOpacity="0.78"
                      stroke="#FFFFFF"
                      strokeWidth="3"
                    />
                  ) : (
                    <g>
                      <circle cx="62" cy="118" r="14" fill={zoneColors[1].hex} opacity="0.75" />
                      <path
                        d="M26,108 L54,114 M22,120 L52,120 M26,132 L54,126"
                        stroke={zoneColors[1].hex}
                        strokeWidth="4.5"
                        strokeLinecap="round"
                      />
                    </g>
                  )
                ) : (
                  <circle
                    cx={FACE_ZONES[1].x}
                    cy={FACE_ZONES[1].y}
                    r="18"
                    fill="rgba(255,255,255,0.65)"
                    stroke="#EC4899"
                    strokeWidth="3"
                    strokeDasharray="5 4"
                    className="salon-zone-pulse"
                  />
                )}
              </g>

              {/* Zone 2: Right Cheek Whiskers / Butterfly Wing */}
              <g
                className="cursor-pointer"
                onClick={(e) => handlePaintZone(2, selectedBrush, e)}
              >
                {zoneColors[2] ? (
                  currentSalon.id === 'butterfly' ? (
                    <path
                      d="M130,96 C178,60 198,102 168,130 C190,148 164,172 130,136 Z"
                      fill={zoneColors[2].hex}
                      fillOpacity="0.78"
                      stroke="#FFFFFF"
                      strokeWidth="3"
                    />
                  ) : (
                    <g>
                      <circle cx="158" cy="118" r="14" fill={zoneColors[2].hex} opacity="0.75" />
                      <path
                        d="M194,108 L166,114 M198,120 L168,120 M194,132 L166,126"
                        stroke={zoneColors[2].hex}
                        strokeWidth="4.5"
                        strokeLinecap="round"
                      />
                    </g>
                  )
                ) : (
                  <circle
                    cx={FACE_ZONES[2].x}
                    cy={FACE_ZONES[2].y}
                    r="18"
                    fill="rgba(255,255,255,0.65)"
                    stroke="#EC4899"
                    strokeWidth="3"
                    strokeDasharray="5 4"
                    className="salon-zone-pulse"
                  />
                )}
              </g>

              {/* Zone 3: Cute Painted Nose */}
              <g
                className="cursor-pointer"
                onClick={(e) => handlePaintZone(3, selectedBrush, e)}
              >
                {zoneColors[3] ? (
                  <g>
                    <circle cx="110" cy="104" r="11" fill={zoneColors[3].hex} stroke="#FFFFFF" strokeWidth="2.5" />
                    <circle cx="107" cy="101" r="3.5" fill="#FFFFFF" />
                  </g>
                ) : (
                  <circle
                    cx={FACE_ZONES[3].x}
                    cy={FACE_ZONES[3].y}
                    r="15"
                    fill="rgba(255,255,255,0.65)"
                    stroke="#EC4899"
                    strokeWidth="3"
                    strokeDasharray="5 4"
                    className="salon-zone-pulse"
                  />
                )}
              </g>

              {/* Zone 4: Chin Bow / Gem Stamp */}
              <g
                className="cursor-pointer"
                onClick={(e) => handlePaintZone(4, selectedBrush, e)}
              >
                {zoneColors[4] ? (
                  <text x="110" y="170" textAnchor="middle" dominantBaseline="central" fontSize="28">
                    {zoneColors[4].gem}
                  </text>
                ) : (
                  <circle
                    cx={FACE_ZONES[4].x}
                    cy={FACE_ZONES[4].y}
                    r="16"
                    fill="rgba(255,255,255,0.65)"
                    stroke="#EC4899"
                    strokeWidth="3"
                    strokeDasharray="5 4"
                    className="salon-zone-pulse"
                  />
                )}
              </g>
            </svg>
          </div>
        )}

        {/* Polish & Face-Paint Palette + Quick Brush Button */}
        <div className="relative z-30 mt-2 flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-2.5 bg-white/95 px-4 py-1.5 rounded-full shadow-md border-2 border-[#F0ABFC]">
            {POLISH_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={(e) => {
                  setSelectedBrush(c);
                  const emptyIdx = zoneColors.findIndex((z) => z === null);
                  if (emptyIdx !== -1) {
                    handlePaintZone(emptyIdx, c, e);
                  } else {
                    playJellyTap(soundEnabled);
                  }
                }}
                aria-label={`${c.label} 브러시 선택 및 색칠`}
                style={{ backgroundColor: c.hex }}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border-3 flex items-center justify-center text-base transition-transform ${
                  selectedBrush.id === c.id ? 'scale-115 border-[#1E293B] shadow-md' : 'border-white'
                }`}
              >
                <span aria-hidden="true">{c.gem}</span>
              </button>
            ))}
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={handleQuickPaintNext}
            className="flex items-center gap-2 px-5 py-2 rounded-full font-black text-sm sm:text-base text-white shadow-lg border-3 border-[#701A75] bg-gradient-to-r from-[#D946EF] via-[#EC4899] to-[#8B5CF6]"
          >
            <Paintbrush className="w-5 h-5 text-pink-100" />
            <span>
              {isDone ? '블링블링 메이크업 완성! ✨' : '톡톡! 반짝이 브러시로 색칠하기 💅'}
            </span>
            <Sparkles className="w-5 h-5 text-yellow-200" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
