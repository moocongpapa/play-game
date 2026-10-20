import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Sparkles } from 'lucide-react';
import type { CharacterId, AgeGroup } from '../../types';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import {
  speakText,
  stopAllSpeech,
  playBouncyBoing,
  playSparkleChime,
  playCorrectFanfare,
} from '../../utils/soundEngine';
import { fireStarExplosion, fireConfetti } from '../../utils/confetti';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import './TrampolineJumpGame.css';

interface TrampolineJumpGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup?: AgeGroup;
  childName?: string;
}

interface SkyCollectible {
  id: number;
  emoji: string;
  x: number; // percentage (15 ~ 85)
  y: number; // px from top
  collected: boolean;
}

const COLLECTIBLE_EMOJIS = ['⭐', '🍭', '🍓', '🎈', '✨', '🌈', '🍎'];

export const TrampolineJumpGame: React.FC<TrampolineJumpGameProps> = ({
  buddy,
  onCompleteQuiz,
  soundEnabled,
  ageGroup = 'sprout',
}) => {
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [isSpringing, setIsSpringing] = useState(false);
  const [jumpHeight, setJumpHeight] = useState(0); // 0 (rest), 1, 2, 3
  const [jumperMood, setJumperMood] = useState<'still' | 'happy' | 'waving'>('happy');
  const [collectibles, setCollectibles] = useState<SkyCollectible[]>([]);
  const isJumpingRef = useRef(false);

  // Milestone goal based on age
  const targetStars = ageGroup === 'baby' ? 5 : ageGroup === 'sprout' ? 8 : 10;

  // Spawn initial collectibles in the sky
  const spawnCollectibles = useCallback(() => {
    const items: SkyCollectible[] = [];
    for (let i = 0; i < 4; i++) {
      items.push({
        id: Date.now() + i,
        emoji: COLLECTIBLE_EMOJIS[Math.floor(Math.random() * COLLECTIBLE_EMOJIS.length)],
        x: 18 + Math.random() * 64,
        y: 60 + i * 45,
        collected: false,
      });
    }
    setCollectibles(items);
  }, []);

  useEffect(() => {
    spawnCollectibles();
    stopAllSpeech();
    speakText('화면을 톡톡! 트램펄린에서 신나게 뛰어볼까?', soundEnabled, { characterId: buddy });

    return () => {
      clearGameTimeouts();
      stopAllSpeech();
    };
  }, [buddy, soundEnabled, spawnCollectibles, clearGameTimeouts]);

  // Handle tap to jump
  const handleJump = useCallback(() => {
    if (isJumpingRef.current) return;
    isJumpingRef.current = true;

    // 1. Squash trampoline down
    setIsSpringing(true);
    playBouncyBoing(soundEnabled);

    scheduleGameTimeout(() => {
      setIsSpringing(false);
      const nextCombo = Math.min(3, combo + 1);
      setCombo(nextCombo);
      setJumpHeight(nextCombo);
      setJumperMood(nextCombo === 3 ? 'waving' : 'happy');

      // Check collision with collectibles in the current jump trajectory
      scheduleGameTimeout(() => {
        // Collectible check at peak
        setCollectibles((prev) =>
          prev.map((item) => {
            if (!item.collected && Math.random() > 0.3) {
              playSparkleChime(soundEnabled);
              setScore((s) => {
                const nextScore = s + 1;
                if (nextScore % targetStars === 0) {
                  playCorrectFanfare(soundEnabled);
                  fireStarExplosion();
                  fireConfetti();
                  onCompleteQuiz(10);
                  stopAllSpeech();
                  speakText('별을 가득 모았어요! 최고야!', soundEnabled, { characterId: buddy });
                }
                return nextScore;
              });
              return { ...item, collected: true };
            }
            return item;
          })
        );
      }, 350);

      // Return down to trampoline
      scheduleGameTimeout(() => {
        setJumpHeight(0);
        setJumperMood('still');
        isJumpingRef.current = false;

        // Respawn new sky collectibles if many collected
        setCollectibles((prev) => {
          const remaining = prev.filter((it) => !it.collected);
          if (remaining.length <= 1) {
            const fresh: SkyCollectible[] = [];
            for (let i = 0; i < 4; i++) {
              fresh.push({
                id: Date.now() + i,
                emoji: COLLECTIBLE_EMOJIS[Math.floor(Math.random() * COLLECTIBLE_EMOJIS.length)],
                x: 18 + Math.random() * 64,
                y: 60 + i * 45,
                collected: false,
              });
            }
            return fresh;
          }
          return prev;
        });
      }, 700);
    }, 150);
  }, [combo, soundEnabled, scheduleGameTimeout, targetStars, onCompleteQuiz, buddy]);

  return (
    <div
      className="trampoline-stage"
      onClick={handleJump}
      role="button"
      tabIndex={0}
      aria-label="화면을 터치해서 트램펄린 점프하기"
    >
      {/* Header */}
      <header className="trampoline-header">
        <div className="trampoline-score-badge">
          <Star className="text-amber-500 fill-amber-400" size={24} />
          <span>모은 별:</span>
          <b>{score}</b>
        </div>
        <div className="trampoline-combo-pill">
          <span>점프 높이:</span>
          <b>{combo === 1 ? '통통!' : combo === 2 ? '슝슝!' : '우주 점프!'}</b>
        </div>
      </header>

      {/* Main Arena */}
      <main className="trampoline-arena">
        {/* Sky Collectibles */}
        <div className="absolute inset-0 pointer-events-none">
          <AnimatePresence>
            {collectibles.map((item) =>
              item.collected ? null : (
                <motion.div
                  key={item.id}
                  className="sky-item"
                  style={{ left: `${item.x}%`, top: `${item.y}px` }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  exit={{ scale: [1, 1.4, 0], opacity: 0 }}
                >
                  <span>{item.emoji}</span>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>

        {/* Character Jumper */}
        <motion.div
          className="trampoline-jumper"
          animate={{
            y:
              jumpHeight === 1
                ? -90
                : jumpHeight === 2
                ? -160
                : jumpHeight === 3
                ? -230
                : 0,
            rotate: jumpHeight === 3 ? [0, 180, 360] : 0,
            scale: isSpringing ? 0.85 : jumpHeight > 0 ? 1.15 : 1,
          }}
          transition={{ duration: jumpHeight > 0 ? 0.45 : 0.25, ease: 'easeOut' }}
        >
          <CharacterAvatar id={buddy} size="lg" mood={jumperMood} />
        </motion.div>

        {/* Trampoline Base */}
        <div className="trampoline-base" aria-hidden="true">
          <div className={`trampoline-mat ${isSpringing ? 'spring-down' : ''}`} />
          <div className="trampoline-legs">
            <span className="trampoline-leg" />
            <span className="trampoline-leg" />
            <span className="trampoline-leg" />
          </div>
        </div>
      </main>

      {/* Tap Hint */}
      <footer className="trampoline-tap-hint">
        <Sparkles size={20} className="text-sky-500 animate-spin" />
        <span>화면을 톡톡 터치하면 더 높이 점프해요!</span>
      </footer>
    </div>
  );
};
