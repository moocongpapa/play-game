import { PLAY_THEMES } from '../../data/playThemes';
import { pickNextRound } from '../../utils/roundDeck';
import type { CharacterId } from '../../types';
import { ToyArtwork } from '../../components/ToyArtwork';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { speakText, playBalloonPop, playDingDongDang, playSparkleChime } from '../../utils/soundEngine';
import { fireBalloonPopParticle, fireConfetti } from '../../utils/confetti';
import { AgeGroup } from '../../types';
import { Star } from 'lucide-react';
import './BalloonPopGame.css';

interface BalloonItem {
  id: string;
  x: number; // percentage (10 ~ 85)
  color: string;
  bgGradient: string;
  emoji: string;
  speed: number; // seconds to reach top
  size: number; // px diameter
  startY: number;
  restingY: number;
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
  const { scheduleGameTimeout } = useGameTimeouts();

  const reducedMotion = useReducedMotion();
  const fieldRef = useRef<HTMLDivElement>(null);
  const poppedIds = useRef(new Set<string>());
  const popCount = useRef(0);
  const [balloons, setBalloons] = useState<BalloonItem[]>([]);
  const [popPopups, setPopPopups] = useState<Array<{ id: string; x: number; y: number; text: string; color: string }>>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const nextIdRef = useRef(1);
  const themeRef = useRef(PLAY_THEMES[0]);
  const [theme, setTheme] = useState(PLAY_THEMES[0]);

  // Generate balloon
  const spawnBalloon = (initialSlot?: number) => {
    const fieldHeight = fieldRef.current?.clientHeight || 480;
    const palette = BALLOON_PALETTES[Math.floor(Math.random() * BALLOON_PALETTES.length)];
    const size = 88 + Math.floor(Math.random() * 20);
    const visibleY = fieldHeight * (initialSlot === undefined ? 0.08 + Math.random() * 0.6 : [0.52, 0.3, 0.64][initialSlot]);
    const restingY = Math.max(0, Math.min(visibleY, fieldHeight - size * 1.45));
    const newBalloon: BalloonItem = {
      id: `b-${nextIdRef.current++}`,
      x: initialSlot === undefined ? 18 + Math.random() * 64 : 22 + initialSlot * 28,
      color: palette.color,
      bgGradient: palette.bg,
      emoji: pickNextRound(themeRef.current.items, `balloons:${themeRef.current.id}`).emoji,
      speed: 7 + Math.random() * 4,
      size,
      // The opening group is already within reach. New balloons rise gently from below.
      startY: initialSlot === undefined ? fieldHeight : restingY,
      restingY,
    };

    setBalloons((prev) => prev.length >= 9 ? prev : [...prev, newBalloon]);
  };

  useEffect(() => {
    if (soundEnabled) {
      speakText(`하늘로 떠오르는 알록달록 풍선을 팡팡 터뜨려보자!`, soundEnabled, { characterId: buddy });
    }

    themeRef.current = pickNextRound(PLAY_THEMES, 'balloons:themes');
    setTheme(themeRef.current);
    // No empty field or offscreen travel to wait through on entry.
    setBalloons([]);
    for (let i = 0; i < 3; i++) {
      spawnBalloon(i);
    }

    const interval = setInterval(() => {
      if (!document.hidden && !(isStageMode && popCount.current >= targetCount)) spawnBalloon();
    }, 700);

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

    // Number popup
    const popupId = `p-${Date.now()}-${Math.random()}`;
    const numberText = KOREAN_NUMBERS[nextCount - 1] || `${nextCount}!`;
    setPopPopups((prev) => [...prev, { id: popupId, x: clientX, y: clientY, text: `${nextCount}`, color: balloon.color }]);
    scheduleGameTimeout(() => {
      setPopPopups((prev) => prev.filter((p) => p.id !== popupId));
      poppedIds.current.delete(balloon.id);
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
          scheduleGameTimeout(onStageClear, 850);
        }
      }, 150);
    }
  };

  return (
    <div style={{ background: `linear-gradient(${theme.sky}, #FFF9E9)` }} className="balloon-board" aria-label="풍선 팡팡 놀이">
      <div className="balloon-cloud balloon-cloud-left" aria-hidden="true" />
      <div className="balloon-cloud balloon-cloud-right" aria-hidden="true" />
      <div className="balloon-companion" aria-hidden="true">
        <CharacterAvatar id={buddy} size="md" mood={isCompleted ? 'excited' : 'happy'} />
      </div>

      {/* Floating Balloons Field */}
      <div ref={fieldRef} className="balloon-field">
        {balloons.map((b) => (
          <motion.button
            key={b.id}
            aria-label="풍선 터뜨리기"
            initial={reducedMotion ? false : { y: b.startY, opacity: 1 }}
            animate={reducedMotion ? { y: b.restingY, opacity: 1 } : { y: -170, opacity: 1 }}
            transition={reducedMotion ? { duration: 0 } : { y: { duration: b.speed, ease: 'linear' } }}
            onAnimationComplete={() => {
              if (!reducedMotion) setBalloons((prev) => prev.filter((item) => item.id !== b.id));
            }}
            onClick={(e) => handlePop(b, e)}
            style={{
              left: `clamp(6px, calc(${b.x}% - ${b.size / 2}px), calc(100% - ${b.size + 6}px))`,
              width: b.size,
              height: b.size * 1.2,
              background: b.bgGradient,
            }}
            whileHover={reducedMotion ? undefined : { scale: 1.08 }}
            className="balloon-toy absolute top-0 rounded-full cursor-pointer shadow-lg flex items-center justify-center border-2 border-white/50 active:scale-90 touch-manipulation"
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
              initial={{ opacity: 1, scale: reducedMotion ? 1 : 0.5, y: 0 }}
              animate={{ opacity: 0, scale: reducedMotion ? 1 : 2.2, y: reducedMotion ? 0 : -80 }}
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
          initial={reducedMotion ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="balloon-celebration"
          role="status"
          aria-label="풍선을 모두 터뜨렸어요!"
        >
          <CharacterAvatar id={buddy} size="xl" mood="excited" />
          <Star className="balloon-prize-star" aria-hidden="true" />
        </motion.div>
      )}
    </div>
  );
};
