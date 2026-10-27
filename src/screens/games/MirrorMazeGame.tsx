import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart } from 'lucide-react';
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

interface MirrorMazeGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup?: AgeGroup;
  childName?: string;
}

type DinoKind = 'trex' | 'brachio' | 'tricera';

interface DinoRound {
  id: DinoKind;
  name: string;
  badge: string;
  emoji: string;
  guideText: string;
  peekVoice: string;
  hatchedVoice: string;
  eggBaseColor: string;
  eggSpotColor: string;
  eggStrokeColor: string;
  dinoBodyColor: string;
  dinoBellyColor: string;
  dinoAccentColor: string;
  particleColor: number;
}

const DINO_ROUNDS: DinoRound[] = [
  {
    id: 'trex',
    name: '아기 티라노 꾸러기',
    badge: '🦖 초록 알 · 아기 티라노',
    emoji: '🦖',
    guideText: '커다란 공룡 알을 톡톡 두드려 귀여운 아기 공룡을 깨워 볼까?',
    peekVoice: '까꿍! 알 속에서 귀여운 눈이 반짝여요! 조금만 더 톡톡!',
    hatchedVoice: '크앙~! 아기 티라노가 태어났어요! 안녕 친구야!',
    eggBaseColor: '#FEF9C3',
    eggSpotColor: '#4ADE80',
    eggStrokeColor: '#16A34A',
    dinoBodyColor: '#4ADE80',
    dinoBellyColor: '#FEF08A',
    dinoAccentColor: '#15803D',
    particleColor: 0x4ADE80,
  },
  {
    id: 'brachio',
    name: '아기 브라키오 목기린이',
    badge: '🦕 하늘 알 · 아기 브라키오',
    emoji: '🦕',
    guideText: '이번엔 파란 물방울 공룡 알이야! 톡톡 두드려 누가 숨어 있는지 볼까?',
    peekVoice: '우와! 알 밑으로 귀여운 공룡 발이 쏙 나왔어!',
    hatchedVoice: '와아~! 목이 길쭉한 아기 브라키오가 태어났어요!',
    eggBaseColor: '#E0F2FE',
    eggSpotColor: '#60A5FA',
    eggStrokeColor: '#2563EB',
    dinoBodyColor: '#38BDF8',
    dinoBellyColor: '#BAE6FD',
    dinoAccentColor: '#0369A1',
    particleColor: 0x38BDF8,
  },
  {
    id: 'tricera',
    name: '무지개 아기 트리케라',
    badge: '🌈 무지개 알 · 아기 트리케라',
    emoji: '🥚',
    guideText: '마지막은 반짝반짝 무지개 공룡 알이야! 신나게 톡톡 두드려 깨워 봐!',
    peekVoice: '영차영차! 귀여운 뿔이 뽕 솟아났어! 한 번만 더 톡톡!',
    hatchedVoice: '대단해! 알록달록 무지개 아기 트리케라가 태어났어요!',
    eggBaseColor: '#FCE7F3',
    eggSpotColor: '#F472B6',
    eggStrokeColor: '#DB2777',
    dinoBodyColor: '#F472B6',
    dinoBellyColor: '#FDE68A',
    dinoAccentColor: '#A855F7',
    particleColor: 0xF472B6,
  },
];

const KNOCK_WORDS = ['톡톡!', '콩콩!', '바스락!', '흔들흔들!', '까꿍~?', '영차!', '빠직!'];

export const MirrorMazeGame: React.FC<MirrorMazeGameProps> = ({
  buddy,
  onCompleteQuiz,
  soundEnabled,
  ageGroup = 'sprout',
}) => {
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const pixiRef = useRef<PixiStageHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const roundAdvancingRef = useRef(false);

  const [round, setRound] = useState(0);
  const totalRounds = 3;
  const currentDino = DINO_ROUNDS[round] || DINO_ROUNDS[0];

  const requiredTaps = ageGroup === 'baby' ? 4 : ageGroup === 'sprout' ? 5 : 6;

  const [tapCount, setTapCount] = useState(0);
  const [isHatched, setIsHatched] = useState(false);
  const [wobbleKey, setWobbleKey] = useState(0);
  const [dinoBounceKey, setDinoBounceKey] = useState(0);
  const [buddyBubble, setBuddyBubble] = useState<string>('공룡 알을 톡톡 두드려 봐!');
  const [floatingWords, setFloatingWords] = useState<Array<{ id: number; x: number; y: number; text: string }>>([]);

  const setupRound = useCallback((roundIdx: number) => {
    roundAdvancingRef.current = false;
    setTapCount(0);
    setIsHatched(false);
    setWobbleKey(0);
    setDinoBounceKey(0);
    const dino = DINO_ROUNDS[roundIdx] || DINO_ROUNDS[0];
    setBuddyBubble(`누가 들어 있을까? ${dino.badge.split('·')[0].trim()}을 톡톡 눌러봐!`);
  }, []);

  useEffect(() => {
    setupRound(round);
  }, [round, setupRound]);

  useEffect(() => {
    const dino = DINO_ROUNDS[round] || DINO_ROUNDS[0];
    speakText(dino.guideText, soundEnabled, { characterId: buddy });
  }, [round, soundEnabled, buddy]);

  useEffect(() => {
    return () => {
      clearGameTimeouts();
      stopAllSpeech();
    };
  }, [clearGameTimeouts]);

  const spawnFloatingWord = useCallback((text: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const offsetX = Math.floor(Math.random() * 48) - 24;
    const offsetY = Math.floor(Math.random() * 24) - 18;
    setFloatingWords((prev) => [...prev.slice(-4), { id, x: offsetX, y: offsetY, text }]);
  }, []);

  const triggerHatchCelebration = useCallback(
    (dino: DinoRound, currentRound: number) => {
      if (roundAdvancingRef.current) return;
      roundAdvancingRef.current = true;
      setIsHatched(true);

      playBalloonPop(soundEnabled);
      playCorrectFanfare(soundEnabled);
      playCareSound('giggle', soundEnabled);
      setBuddyBubble(`우와! 귀여운 ${dino.name}가 태어났어! 안녕~! 🎉`);
      speakText(dino.hatchedVoice, soundEnabled, { characterId: buddy });

      fireStarExplosion();
      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        pixiRef.current?.emitBurst({
          x: rect.width / 2,
          y: rect.height / 2,
          color: dino.particleColor,
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
      }, 2700);
    },
    [buddy, onCompleteQuiz, scheduleGameTimeout, soundEnabled]
  );

  const handleTapEgg = useCallback(
    (e?: React.MouseEvent<HTMLElement>) => {
      if (e) e.stopPropagation();

      const clientX = e?.clientX ?? window.innerWidth / 2;
      const clientY = e?.clientY ?? window.innerHeight / 2;

      // If already hatched, tapping pets/tickles the baby dinosaur!
      if (isHatched) {
        setDinoBounceKey((k) => k + 1);
        playBouncyBoing(soundEnabled);
        playSparkleChime(soundEnabled);
        emitJuice({ kind: 'pop', x: clientX, y: clientY });
        spawnFloatingWord('크앙~ 까르르! 💕');
        return;
      }

      if (roundAdvancingRef.current) return;

      setWobbleKey((k) => k + 1);
      emitJuice({ kind: 'pop', x: clientX, y: clientY });

      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        pixiRef.current?.emitBurst({
          x: clientX - rect.left,
          y: clientY - rect.top,
          color: currentDino.particleColor,
          count: 14,
          kind: 'star',
        });
      }

      const nextTap = tapCount + 1;
      setTapCount(nextTap);

      if (nextTap >= requiredTaps) {
        spawnFloatingWord('빠직! 짠~! 🦖');
        triggerHatchCelebration(currentDino, round);
      } else {
        playJellyTap(soundEnabled);
        playRisingStepChime(nextTap, requiredTaps, soundEnabled);

        const halfPoint = Math.ceil(requiredTaps / 2);
        if (nextTap === halfPoint) {
          playBouncyBoing(soundEnabled);
          spawnFloatingWord('까꿍?! 👀');
          setBuddyBubble('어라?! 알 틈으로 아기 공룡이 빼꼼 보여!');
          speakText(currentDino.peekVoice, soundEnabled, { characterId: buddy });
        } else {
          const word = KNOCK_WORDS[nextTap % KNOCK_WORDS.length];
          spawnFloatingWord(word);
          const left = requiredTaps - nextTap;
          setBuddyBubble(`금이 가고 있어! ${left}번만 더 톡톡 두드려 줄래?`);
        }
      }
    },
    [
      buddy,
      currentDino,
      isHatched,
      requiredTaps,
      round,
      soundEnabled,
      spawnFloatingWord,
      tapCount,
      triggerHatchCelebration,
    ]
  );

  // Crack level: 0 = intact, 1 = small crack, 2 = peeking eyes & feet, 3 = big cracks ready to burst
  const crackProgress = tapCount / requiredTaps;
  const crackStage = isHatched
    ? 4
    : crackProgress >= 0.72
    ? 3
    : crackProgress >= 0.45
    ? 2
    : crackProgress > 0
    ? 1
    : 0;

  return (
    <div
      ref={stageRef}
      className="mirror-maze-stage dino-egg-stage relative flex flex-col justify-between w-full h-[var(--game-play-height,calc(100dvh-84px))] min-h-[var(--game-play-height,calc(100dvh-84px))] rounded-3xl overflow-hidden select-none bg-gradient-to-b from-[#ECFDF5] via-[#FEF9C3] to-[#FDE68A] border-3 border-[#22C55E] p-3 sm:p-5"
    >
      <style>{`
        @keyframes eggIdleWiggle {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(-2.5deg); }
          50% { transform: translate3d(0, -5px, 0) rotate(2.5deg); }
        }
        @keyframes leafSway {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }
        .dino-egg-idle {
          animation: eggIdleWiggle 1.2s ease-in-out infinite;
          @media (prefers-reduced-motion: reduce) {
            animation: none;
          }
        }
        .dino-leaf-sway {
          animation: leafSway 2.2s ease-in-out infinite;
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
          title="공룡 알 톡톡 깨기"
          guide={currentDino.guideText}
          soundEnabled={soundEnabled}
          happy={isHatched}
        />

        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border-2 border-[#16A34A]">
          <span className="text-lg" aria-hidden="true">{currentDino.emoji}</span>
          <span className="font-black text-[#15803D] text-xs sm:text-sm whitespace-nowrap">
            {currentDino.badge} · {Math.min(tapCount, requiredTaps)}/{requiredTaps}
          </span>
        </div>

        <PlayProgress total={totalRounds} done={round} label={`${round + 1}/${totalRounds}`} />
      </div>

      {/* Explorer Buddy & Speech Banner */}
      <div className="relative z-20 flex items-center justify-center gap-3 my-1">
        <motion.div
          animate={
            isHatched
              ? { y: [0, -10, 0], scale: [1, 1.06, 1] }
              : tapCount > 0
              ? { y: [0, -4, 0] }
              : {}
          }
          transition={{ duration: 0.45 }}
          className="relative flex items-center gap-2.5 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-3xl border-2 border-[#86EFAC] shadow-md"
        >
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
            <CharacterAvatar
              id={buddy}
              size="md"
              mood={isHatched ? 'excited' : tapCount > 0 ? 'happy' : 'still'}
            />
            <span
              className="absolute -top-1.5 -right-1 text-xl drop-shadow-sm pointer-events-none"
              aria-hidden="true"
            >
              🔍
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-[#16A34A]">
              {round + 1}단계 · {currentDino.name}
            </span>
            <span className="text-sm sm:text-base font-black text-[#14532D]">
              {buddyBubble}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Center Prehistoric Nest & Giant Interactive Dinosaur Egg Stage */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center min-h-0 my-1">
        {/* Warm Jungle Sunburst Halo */}
        <div
          className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(254,240,138,0.85) 0%, rgba(187,247,208,0.4) 60%, rgba(254,249,195,0) 78%)',
          }}
          aria-hidden="true"
        />

        {/* Interactive Egg / Hatched Baby Dinosaur Container */}
        <motion.button
          key={`${round}-${isHatched ? `hatched-${dinoBounceKey}` : `egg-${wobbleKey}`}`}
          type="button"
          onClick={handleTapEgg}
          initial={{ scale: 1, rotate: 0 }}
          animate={
            isHatched
              ? {
                  scale: [0.85, 1.12, 1],
                  y: [10, -16, 0],
                }
              : wobbleKey > 0
              ? {
                  rotate: [0, -11, 11, -7, 7, 0],
                  scale: [1, 1.07, 0.96, 1.03, 1],
                  y: [0, -10, 0],
                }
              : {}
          }
          whileTap={{ scale: 0.92 }}
          transition={{ duration: 0.36 }}
          aria-label={isHatched ? `${currentDino.name} 쓰다듬기` : '공룡 알 톡톡 두드리기'}
          className={`relative w-64 h-68 sm:w-76 sm:h-80 flex items-center justify-center cursor-pointer focus:outline-none ${
            !isHatched ? 'dino-egg-idle' : ''
          }`}
        >
          {!isHatched ? (
            /* Giant Spotted Dinosaur Egg with Progressive Cracks & Peeking Parts */
            <svg viewBox="0 0 240 250" className="w-full h-full overflow-visible drop-shadow-xl">
              {/* Tropical Fern Leaves behind Nest */}
              <g className="dino-leaf-sway">
                <path d="M42,190 Q12,155 24,132 Q48,142 58,182 Z" fill="#4ADE80" stroke="#15803D" strokeWidth="3" />
                <path d="M198,190 Q228,155 216,132 Q192,142 182,182 Z" fill="#4ADE80" stroke="#15803D" strokeWidth="3" />
              </g>

              {/* Cozy Straw Nest at Bottom */}
              <ellipse cx="120" cy="208" rx="88" ry="26" fill="#D97706" stroke="#92400E" strokeWidth="4" />
              <ellipse cx="120" cy="202" rx="76" ry="18" fill="#FBBF24" />
              <path
                d="M48,204 Q82,218 120,206 Q158,218 192,204"
                fill="none"
                stroke="#B45309"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Peeking Cute Dino Feet when crackStage >= 2 */}
              {crackStage >= 2 && (
                <g>
                  <ellipse cx="86" cy="202" rx="16" ry="11" fill={currentDino.dinoBodyColor} stroke={currentDino.dinoAccentColor} strokeWidth="3" />
                  <circle cx="76" cy="198" r="3.5" fill="#FFFBEB" />
                  <circle cx="85" cy="195" r="3.5" fill="#FFFBEB" />
                  <circle cx="94" cy="198" r="3.5" fill="#FFFBEB" />

                  <ellipse cx="154" cy="202" rx="16" ry="11" fill={currentDino.dinoBodyColor} stroke={currentDino.dinoAccentColor} strokeWidth="3" />
                  <circle cx="146" cy="198" r="3.5" fill="#FFFBEB" />
                  <circle cx="155" cy="195" r="3.5" fill="#FFFBEB" />
                  <circle cx="164" cy="198" r="3.5" fill="#FFFBEB" />
                </g>
              )}

              {/* Main Dinosaur Egg Shell */}
              <path
                d="M120,22 C172,22 196,88 192,150 C189,188 160,206 120,206 C80,206 51,188 48,150 C44,88 68,22 120,22 Z"
                fill={currentDino.eggBaseColor}
                stroke={currentDino.eggStrokeColor}
                strokeWidth="5"
              />

              {/* Egg Decorative Polka Spots */}
              <circle cx="88" cy="74" r="14" fill={currentDino.eggSpotColor} opacity="0.85" />
              <circle cx="154" cy="86" r="18" fill={currentDino.eggSpotColor} opacity="0.85" />
              <circle cx="74" cy="144" r="16" fill={currentDino.eggSpotColor} opacity="0.85" />
              <circle cx="156" cy="156" r="13" fill={currentDino.eggSpotColor} opacity="0.85" />
              <circle cx="118" cy="50" r="10" fill={currentDino.eggSpotColor} opacity="0.85" />

              {/* Glossy Egg Highlight */}
              <ellipse
                cx="86"
                cy="62"
                rx="9"
                ry="22"
                transform="rotate(-22 86 62)"
                fill="#FFFFFF"
                opacity="0.7"
              />

              {/* Stage 1+ Crack Lines */}
              {crackStage >= 1 && (
                <path
                  d="M118,86 L104,104 L124,116 L108,136"
                  fill="none"
                  stroke="#451A03"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Stage 2+ Peeking Window with Cute Blinking Dino Eyes! */}
              {crackStage >= 2 && (
                <g>
                  <polygon
                    points="84,108 106,94 128,104 154,94 162,118 142,134 96,134"
                    fill="#1E293B"
                    stroke="#451A03"
                    strokeWidth="4"
                    strokeLinejoin="round"
                  />
                  {/* Cute glowing baby dino eyes peeking from inside */}
                  <circle cx="108" cy="116" r="7.5" fill="#FFFFFF" />
                  <circle cx="136" cy="116" r="7.5" fill="#FFFFFF" />
                  <circle cx="109" cy="116" r="4.2" fill="#0F172A" />
                  <circle cx="137" cy="116" r="4.2" fill="#0F172A" />
                  <circle cx="107" cy="114" r="2" fill="#FFFFFF" />
                  <circle cx="135" cy="114" r="2" fill="#FFFFFF" />
                  <ellipse cx="97" cy="123" rx="5" ry="2.8" fill="#FB7185" opacity="0.8" />
                  <ellipse cx="147" cy="123" rx="5" ry="2.8" fill="#FB7185" opacity="0.8" />
                </g>
              )}

              {/* Stage 3 Extra Wide Cracks Across Egg */}
              {crackStage >= 3 && (
                <>
                  <path
                    d="M54,126 L84,112 M160,114 L188,128 M120,134 L114,166 L134,182"
                    fill="none"
                    stroke="#451A03"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}
            </svg>
          ) : (
            /* Hatched Cute Baby Dinosaur Sitting in Broken Eggshell Nest + Eggshell Hat! */
            <svg viewBox="0 0 240 250" className="w-full h-full overflow-visible drop-shadow-xl">
              {/* Straw Nest */}
              <ellipse cx="120" cy="212" rx="88" ry="24" fill="#D97706" stroke="#92400E" strokeWidth="4" />
              <ellipse cx="120" cy="206" rx="76" ry="16" fill="#FBBF24" />

              {/* Cute Tail Wiggling on Side */}
              <path
                d="M162,166 Q204,154 206,130 Q190,134 170,148 Z"
                fill={currentDino.dinoBodyColor}
                stroke={currentDino.dinoAccentColor}
                strokeWidth="4"
                strokeLinejoin="round"
              />

              {/* Dino Back Crests / Spikes */}
              <circle cx="164" cy="96" r="9" fill={currentDino.dinoAccentColor} />
              <circle cx="170" cy="118" r="9" fill={currentDino.dinoAccentColor} />
              <circle cx="168" cy="140" r="8" fill={currentDino.dinoAccentColor} />

              {/* Baby Dinosaur Chubby Body & Head */}
              <ellipse
                cx="120"
                cy="148"
                rx="48"
                ry="46"
                fill={currentDino.dinoBodyColor}
                stroke={currentDino.dinoAccentColor}
                strokeWidth="4.5"
              />
              {/* Belly Patch */}
              <ellipse cx="120" cy="156" rx="31" ry="30" fill={currentDino.dinoBellyColor} />

              {/* Cute Baby Dino Head */}
              <ellipse
                cx="120"
                cy="92"
                rx="46"
                ry="38"
                fill={currentDino.dinoBodyColor}
                stroke={currentDino.dinoAccentColor}
                strokeWidth="4.5"
              />

              {/* Triceratops Horns / Brachio Crown */}
              {currentDino.id === 'tricera' && (
                <>
                  <path d="M88,66 L76,44 L98,58 Z" fill="#FDE047" stroke="#CA8A04" strokeWidth="3" />
                  <path d="M152,66 L164,44 L142,58 Z" fill="#FDE047" stroke="#CA8A04" strokeWidth="3" />
                </>
              )}

              {/* Funny Cracked Eggshell Hat tilted on Baby Dino's Head! */}
              <g transform="rotate(-10 120 52)">
                <path
                  d="M78,62 C82,26 158,26 162,62 L146,52 L132,64 L118,50 L102,64 L90,52 Z"
                  fill={currentDino.eggBaseColor}
                  stroke={currentDino.eggStrokeColor}
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
                <circle cx="108" cy="42" r="7" fill={currentDino.eggSpotColor} />
                <circle cx="138" cy="46" r="6" fill={currentDino.eggSpotColor} />
              </g>

              {/* Big Sparkly Baby Dino Eyes, Rosy Cheeks, and Open Happy Smile */}
              <circle cx="101" cy="90" r="7.5" fill="#1E293B" />
              <circle cx="139" cy="90" r="7.5" fill="#1E293B" />
              <circle cx="99" cy="87.5" r="2.6" fill="#FFFFFF" />
              <circle cx="137" cy="87.5" r="2.6" fill="#FFFFFF" />
              <ellipse cx="86" cy="99" rx="7" ry="4" fill="#FB7185" opacity="0.75" />
              <ellipse cx="154" cy="99" rx="7" ry="4" fill="#FB7185" opacity="0.75" />
              <path
                d="M106,101 Q120,116 134,101 Z"
                fill="#FB7185"
                stroke="#1E293B"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              {/* Tiny Cute Dino Tooth */}
              <polygon points="113,102 117,108 121,102" fill="#FFFFFF" />

              {/* Waving Little Dino Arms */}
              <ellipse
                cx="72"
                cy="138"
                rx="13"
                ry="8"
                transform="rotate(-28 72 138)"
                fill={currentDino.dinoBodyColor}
                stroke={currentDino.dinoAccentColor}
                strokeWidth="3.5"
              />
              <ellipse
                cx="168"
                cy="138"
                rx="13"
                ry="8"
                transform="rotate(28 168 138)"
                fill={currentDino.dinoBodyColor}
                stroke={currentDino.dinoAccentColor}
                strokeWidth="3.5"
              />

              {/* Bottom Broken Eggshell Cradle */}
              <path
                d="M54,158 L74,174 L92,156 L112,176 L130,156 L148,174 L168,158 L186,162 C182,196 156,210 120,210 C84,210 58,196 54,158 Z"
                fill={currentDino.eggBaseColor}
                stroke={currentDino.eggStrokeColor}
                strokeWidth="4.5"
                strokeLinejoin="round"
              />
              <circle cx="88" cy="186" r="10" fill={currentDino.eggSpotColor} opacity="0.85" />
              <circle cx="150" cy="184" r="11" fill={currentDino.eggSpotColor} opacity="0.85" />
            </svg>
          )}

          {/* Floating Comic Sound Words ("톡톡!", "까꿍?!", "빠직!") */}
          <AnimatePresence>
            {floatingWords.map((fw) => (
              <motion.div
                key={fw.id}
                style={{
                  left: `${50 + fw.x}%`,
                  top: `${36 + fw.y}%`,
                }}
                initial={{ opacity: 1, scale: 0.7, y: 0 }}
                animate={{ opacity: 0, scale: 1.25, y: -44 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.65 }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-30 px-3 py-1 rounded-full bg-[#FEF08A] border-2 border-[#16A34A] text-[#14532D] font-black text-xs sm:text-sm shadow-md whitespace-nowrap"
              >
                {fw.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.button>

        {/* Bottom Big Tactile Knock / Pet Button */}
        <div className="relative z-30 mt-2 flex items-center justify-center">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={handleTapEgg}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-sm sm:text-base text-white shadow-lg border-3 border-[#14532D] bg-gradient-to-r from-[#16A34A] via-[#22C55E] to-[#15803D]"
          >
            {isHatched ? (
              <>
                <Heart className="w-5 h-5 fill-pink-200 text-pink-100" />
                <span>귀여운 {currentDino.name} 쓰다듬기 💕</span>
                <Sparkles className="w-5 h-5 text-yellow-200" />
              </>
            ) : (
              <>
                <span className="text-lg" aria-hidden="true">🥚</span>
                <span>톡톡! 공룡 알 두드리기 ({tapCount}/{requiredTaps})</span>
                <Sparkles className="w-5 h-5 text-yellow-200" />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};
