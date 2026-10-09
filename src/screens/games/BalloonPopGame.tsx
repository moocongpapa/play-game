import { PLAY_THEMES } from '../../data/playThemes';
import { pickNextRound } from '../../utils/roundDeck';
import type { CharacterId } from '../../types';
import { CHARACTERS } from '../../data/characters';
import { ToyArtwork } from '../../components/ToyArtwork';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JellyButton } from '../../components/JellyButton';
import { speakText, playBalloonPop, playDingDongDang, playSparkleChime } from '../../utils/soundEngine';
import { fireBalloonPopParticle, fireConfetti } from '../../utils/confetti';
import { AgeGroup } from '../../types';
import { Sparkles, RefreshCw } from 'lucide-react';

interface BalloonItem {
  id: string;
  x: number; // percentage (10 ~ 85)
  color: string;
  bgGradient: string;
  emoji: string;
  speed: number; // seconds to reach top
  size: number; // px diameter
}

interface BalloonPopGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
  targetCount?: number;
  onStageClear?: () => void;
  isStageMode?: boolean;
}

const BALLOON_PALETTES = [
  { color: '#FF6B8B', bg: 'radial-gradient(circle at 35% 35%, #FFA4B8 0%, #FF5376 70%, #D81B60 100%)', emoji: '🍓' },
  { color: '#FFD15C', bg: 'radial-gradient(circle at 35% 35%, #FFF08A 0%, #FFCA28 70%, #FFA000 100%)', emoji: '⭐' },
  { color: '#4ADE80', bg: 'radial-gradient(circle at 35% 35%, #86EFAC 0%, #4ADE80 70%, #22C55E 100%)', emoji: '🍏' },
  { color: '#60A5FA', bg: 'radial-gradient(circle at 35% 35%, #93C5FD 0%, #3B82F6 70%, #1D4ED8 100%)', emoji: '🐬' },
  { color: '#C084FC', bg: 'radial-gradient(circle at 35% 35%, #E9D5FF 0%, #A855F7 70%, #7E22CE 100%)', emoji: '🍇' },
  { color: '#FB923C', bg: 'radial-gradient(circle at 35% 35%, #FDBA74 0%, #FB923C 70%, #EA580C 100%)', emoji: '🍊' },
];

const KOREAN_NUMBERS = ['하나!', '둘!', '셋!', '넷!', '다섯!', '여섯!', '일곱!', '여덟!', '아홉!', '열!'];

export const BalloonPopGame: React.FC<BalloonPopGameProps> = ({
  onCompleteQuiz,
  buddy,
  soundEnabled,
  childName,
  targetCount = 5,
  onStageClear,
  isStageMode = false,
}) => {
  const friend = CHARACTERS[buddy];
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();

  const reducedMotion = useReducedMotion();
  const poppedIds = useRef(new Set<string>());
  const popCount = useRef(0);
  const [poppedCount, setPoppedCount] = useState(0);
  const [balloons, setBalloons] = useState<BalloonItem[]>([]);
  const [popPopups, setPopPopups] = useState<Array<{ id: string; x: number; y: number; text: string; color: string }>>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const nextIdRef = useRef(1);
  const themeRef = useRef(PLAY_THEMES[0]);
  const [theme, setTheme] = useState(PLAY_THEMES[0]);

  // Generate balloon
  const spawnBalloon = () => {
    const palette = BALLOON_PALETTES[Math.floor(Math.random() * BALLOON_PALETTES.length)];
    const newBalloon: BalloonItem = {
      id: `b-${nextIdRef.current++}`,
      x: 20 + Math.random() * 60,
      color: palette.color,
      bgGradient: palette.bg,
      emoji: pickNextRound(themeRef.current.items, `balloons:${themeRef.current.id}`).emoji,
      speed: 7 + Math.random() * 4,
      size: 88 + Math.floor(Math.random() * 20),
    };

    setBalloons((prev) => [...prev.slice(-8), newBalloon]);
  };

  useEffect(() => {
    if (soundEnabled) {
      speakText(`하늘로 떠오르는 알록달록 풍선을 팡팡 터뜨려보자!`, soundEnabled, { characterId: buddy });
    }

    themeRef.current = pickNextRound(PLAY_THEMES, 'balloons:themes');
    setTheme(themeRef.current);
    // Initial 4 balloons
    setBalloons([]);
    for (let i = 0; i < 4; i++) {
      scheduleGameTimeout(() => spawnBalloon(), i * 400);
    }

    const interval = setInterval(() => {
      spawnBalloon();
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const handlePop = (balloon: BalloonItem, event: React.MouseEvent | React.TouchEvent) => {
    if (isCompleted || (isStageMode && popCount.current >= targetCount) || poppedIds.current.has(balloon.id)) return;
    poppedIds.current.add(balloon.id);

    // SFX
    playBalloonPop(soundEnabled);

    // Particle
    let clientX = window.innerWidth * (balloon.x / 100);
    let clientY = window.innerHeight * 0.5;

    if ('clientX' in event && event.clientX) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else if ('touches' in event && event.touches[0]) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }

    fireBalloonPopParticle(clientX, clientY, balloon.color);

    // Remove balloon
    setBalloons((prev) => prev.filter((b) => b.id !== balloon.id));

    // Next count
    const nextCount = ++popCount.current;
    setPoppedCount(nextCount);

    // Number popup
    const popupId = `p-${Date.now()}-${Math.random()}`;
    const numberText = KOREAN_NUMBERS[nextCount - 1] || `${nextCount}!`;
    setPopPopups((prev) => [...prev, { id: popupId, x: clientX, y: clientY, text: `${nextCount}`, color: balloon.color }]);
    scheduleGameTimeout(() => {
      setPopPopups((prev) => prev.filter((p) => p.id !== popupId));
    }, 900);

    // Voice count out loud
    speakText(numberText, soundEnabled, { characterId: buddy, playIntroSFX: false });

    // Sound / Voice praise occasionally (every 5 pops)
    if (nextCount % 5 === 0) {
      if (!isStageMode) onCompleteQuiz(1);
      playDingDongDang(soundEnabled);
      playSparkleChime(soundEnabled);
      speakText(`와아! 풍선을 정말 잘 터뜨려요! 팡팡!`, soundEnabled, {
        characterId: buddy,
        playIntroSFX: false,
      });
    }

    // In stage mode (multi-stage adventure), keep targetCount clearance logic if passed
    if (isStageMode && targetCount && nextCount >= targetCount) {
      setIsCompleted(true);
      scheduleGameTimeout(() => {
        playDingDongDang(soundEnabled);
        playSparkleChime(soundEnabled);
        fireConfetti();
        speakText(`우와! ${childName}야, 풍선을 모두 팡팡 터뜨렸어요! 최고야!`, soundEnabled, {
          characterId: buddy,
        });
        onCompleteQuiz(1);
        if (onStageClear) {
          scheduleGameTimeout(onStageClear, 1800);
        }
      }, 500);
    }
  };

  const resetGame = () => {
    clearGameTimeouts();
    poppedIds.current.clear();
    themeRef.current = pickNextRound(PLAY_THEMES, 'balloons:themes');
    setTheme(themeRef.current);
    popCount.current = 0;
    setPoppedCount(0);
    setIsCompleted(false);
    setBalloons([]);
    for (let i = 0; i < 4; i++) {
      scheduleGameTimeout(() => spawnBalloon(), i * 400);
    }
    speakText(`다시 신나게 터뜨려보자!`, soundEnabled, { characterId: buddy });
  };

  return (
    <div style={{ background: `linear-gradient(${theme.sky}, #FFF9E9)` }} className="balloon-board relative w-full max-w-2xl mx-auto h-[68svh] min-h-[460px] bg-gradient-to-b from-[#E0F2FE] via-[#F0F9FF] to-[#FEF3C7] rounded-[36px] border-4 border-amber-300 shadow-xl overflow-hidden select-none flex flex-col justify-between p-4">
      {/* Top Status Banner - 개수 카운트 없이 즐거운 타이틀만 표시 */}
      <div className="balloon-status z-20 w-full bg-white/90 backdrop-blur-xs p-3.5 rounded-3xl border-3 border-sky-300 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CharacterAvatar id={buddy} size="sm" mood="happy" className="!w-12 !h-12 shadow-xs" />
          <div>
            <span className="text-xs font-black text-sky-600 block">{friend.name}와 풍선 팡팡! 🎈</span>
            <span className="text-sm sm:text-base font-black text-[#4A3E3D]">
              {theme.name} · 무제한 팡팡 놀이!
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-sky-50 px-3.5 py-1.5 rounded-full border-2 border-sky-200 shadow-2xs">
          <span className="text-xs font-black text-sky-700">마음껏 팡팡!</span>
          <span className="text-base animate-pulse">🎈</span>
        </div>
      </div>

      {/* Floating Balloons Field */}
      <div className="absolute inset-x-0 top-24 bottom-0 z-10 overflow-hidden">
        {balloons.map((b) => (
          <motion.button
            key={b.id}
            aria-label="풍선 터뜨리기"
            initial={reducedMotion ? false : { y: 480, opacity: 0.9 }}
            animate={reducedMotion ? { y: 45 + (Number(b.id.slice(2)) % 3) * 95, opacity: 1 } : { y: -170, opacity: 1 }}
            transition={reducedMotion ? { duration: 0 } : { y: { duration: b.speed, ease: 'linear' } }}
            onAnimationComplete={() => {
              if (!reducedMotion) setBalloons((prev) => prev.filter((item) => item.id !== b.id));
            }}
            onClick={(e) => handlePop(b, e)}
            style={{
              left: `calc(${b.x}% - ${b.size / 2}px)`,
              width: b.size,
              height: b.size * 1.2,
              background: b.bgGradient,
            }}
            whileHover={{ scale: 1.08 }}
            className="absolute rounded-full cursor-pointer shadow-lg flex items-center justify-center border-2 border-white/50 active:scale-90 touch-manipulation"
          >
            {/* Balloon Highlight Shine */}
            <div className="absolute top-2 left-4 w-4 h-7 bg-white/60 rounded-full blur-[1px] rotate-[-25deg]" />

            {/* Center Cute Emoji */}
            <span className="text-3xl select-none filter drop-shadow-sm"><ToyArtwork emoji={b.emoji} /></span>

            {/* Balloon String */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-amber-800/40 rounded-full" />
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gray-400/60" />
          </motion.button>
        ))}

        {/* Number Popups on Pop */}
        <AnimatePresence>
          {popPopups.map((popup) => (
            <motion.div
              key={popup.id}
              initial={{ opacity: 1, scale: 0.5, y: 0 }}
              animate={{ opacity: 0, scale: 2.2, y: -80 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.75, ease: 'easeOut' }}
              style={{ color: popup.color, left: popup.x - 20, top: popup.y - 20 }}
              className="fixed pointer-events-none text-4xl sm:text-5xl font-black drop-shadow-lg z-50 select-none"
            >
              {popup.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Stage mode only clearance overlay */}
      {isCompleted && isStageMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-30 m-auto bg-white/95 p-6 sm:p-8 rounded-[36px] border-4 border-amber-400 shadow-2xl flex flex-col items-center text-center max-w-sm"
        >
          <div className="text-6xl mb-2 animate-bounce">🎉</div>
          <h3 className="text-2xl font-black text-[#4A3E3D] mb-1">참 잘했어요!</h3>
          <p className="text-sm font-bold text-[#8C7B79] mb-4">
            풍선을 모두 신나게 터뜨렸어요!
          </p>
        </motion.div>
      )}

      {/* Bottom Hint */}
      <div className="relative z-20 w-full text-center py-1">
        <p className="text-xs font-bold text-sky-700/80 bg-white/60 py-1.5 px-4 rounded-full inline-flex items-center gap-1 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 화면에 떠다니는 풍선을 손가락으로 계속 콕콕 찔러보세요!
        </p>
      </div>
    </div>
  );
};

