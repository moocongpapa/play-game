import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Sparkles, Play } from 'lucide-react';
import { CharacterAvatar } from './CharacterAvatar';
import {
  playWelcomeFanfare,
  playBubblePop,
  playCelebrationFanfare,
} from '../utils/soundEngine';
import './SplashLoader.css';
import type { CharacterId } from '../types';

interface SplashLoaderProps {
  onFinish: () => void;
  childName: string;
  soundEnabled?: boolean;
}

interface FloatingTap {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

const SPLASH_CHARACTERS: ReadonlyArray<{
  id: CharacterId;
  name: string;
  badge: string;
  color: string;
  bg: string;
  delay: number;
  phrase: string;
}> = [
  { id: 'ggomi', name: '꼬미', badge: '🎀', color: '#FF80AB', bg: '#ffeaf2', delay: 0.5, phrase: '안녕!' },
  { id: 'rano', name: '라노', badge: '🦖', color: '#66BB6A', bg: '#e8f5e9', delay: 0.8, phrase: '크앙!' },
  { id: 'jelly', name: '젤리', badge: '🐰', color: '#AB47BC', bg: '#f3e5f5', delay: 1.1, phrase: '깡총!' },
  { id: 'dochi', name: '도치', badge: '🦔', color: '#FFA726', bg: '#fff3e0', delay: 1.4, phrase: '데굴!' },
  { id: 'ggulgguli', name: '꿀꿀이', badge: '🐷', color: '#FF8A80', bg: '#ffebee', delay: 1.8, phrase: '짝짝!' },
  { id: 'eumme', name: '음메', badge: '🐑', color: '#78909C', bg: '#eceff1', delay: 2.1, phrase: '폴짝!' },
  { id: 'nurungji', name: '누룽지', badge: '🐶', color: '#FFB74D', bg: '#fff8e1', delay: 2.4, phrase: '살랑!' },
  { id: 'pingu', name: '핑구', badge: '🐧', color: '#66B9C8', bg: '#e0f7fa', delay: 2.7, phrase: '씽씽!' },
];

const TAP_EMOJIS = ['⭐', '💖', '✨', '🎈', '🎉', '🌟', '🌈'];
const TOTAL_DURATION_MS = 5000;

export const SplashLoader: React.FC<SplashLoaderProps> = ({ onFinish, childName, soundEnabled = true }) => {
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [taps, setTaps] = useState<FloatingTap[]>([]);
  const hasFinishedRef = useRef(false);
  const reducedMotion = useReducedMotion();

  const handleFinish = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    if (soundEnabled) {
      playWelcomeFanfare(true);
    }

    // Choreographed sound cues for entrances and celebration
    const waveTimers = [
      setTimeout(() => soundEnabled && playBubblePop(true), 600),
      setTimeout(() => soundEnabled && playBubblePop(true), 1200),
      setTimeout(() => soundEnabled && playBubblePop(true), 1900),
      setTimeout(() => soundEnabled && playBubblePop(true), 2500),
      setTimeout(() => soundEnabled && playCelebrationFanfare(true), 3300),
    ];

    const start = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const diff = now - start;
      const p = Math.min(1, diff / TOTAL_DURATION_MS);
      setProgress(p);
      setElapsed(diff);

      if (diff >= TOTAL_DURATION_MS) {
        window.clearInterval(interval);
        handleFinish();
      }
    }, 35);

    return () => {
      window.clearInterval(interval);
      waveTimers.forEach(t => clearTimeout(t));
    };
  }, [soundEnabled, handleFinish]);

  const handleStageTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (soundEnabled) playBubblePop(true);
    const newTap: FloatingTap = {
      id: Date.now() + Math.random(),
      x: e.clientX,
      y: e.clientY,
      emoji: TAP_EMOJIS[Math.floor(Math.random() * TAP_EMOJIS.length)],
    };
    setTaps(prev => [...prev.slice(-5), newTap]);
  };

  useEffect(() => {
    if (!taps.length) return;
    const timer = setTimeout(() => setTaps([]), 900);
    return () => clearTimeout(timer);
  }, [taps]);

  const isCelebrationPhase = elapsed >= 3300;

  return (
    <div
      className="splash-motion-container"
      role="status"
      aria-live="polite"
      onClick={handleStageTap}
    >
      {/* Background Ambience */}
      <div className="splash-bg-decor" aria-hidden="true">
        <div className="splash-sun-glow" />
        <div className="splash-rainbow-arc" />
        <div className="splash-cloud-float splash-cloud-1" />
        <div className="splash-cloud-float splash-cloud-2" />
      </div>

      {/* Top Bar with Badge & Skip Button */}
      <header className="splash-top-bar">
        <motion.div
          className="splash-badge-chip"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Sparkles size={16} className="text-amber-500 animate-spin" />
          <span>{childName}의 작은 놀이숲</span>
        </motion.div>

        <button
          type="button"
          className="splash-skip-button"
          onClick={(e) => {
            e.stopPropagation();
            handleFinish();
          }}
          aria-label="놀이터로 바로 가기"
        >
          <span>바로 시작하기</span>
          <Play size={13} fill="currentColor" />
        </button>
      </header>

      {/* Main Stage with Dynamic Heading & Character Showcase */}
      <main className="splash-stage">
        <motion.div
          className="splash-main-heading"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 20 }}
        >
          <h1 className="splash-welcome-title">
            {childName}야, 어서 와!
          </h1>
          <motion.span
            key={isCelebrationPhase ? 'celebrate' : 'gathering'}
            className="splash-welcome-sub"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {isCelebrationPhase ? '우리 함께 신나게 놀자! 🌈✨' : '동물 친구들이 모두 모이고 있어요! 🎶'}
          </motion.span>
        </motion.div>

        {/* 8 Character Friends Grand Showcase */}
        <div className="splash-friends-roster">
          {SPLASH_CHARACTERS.map((friend, index) => {
            const hasArrived = elapsed >= friend.delay * 1000;
            const style = {
              '--friend-color': friend.color,
              '--friend-bg': friend.bg,
            } as React.CSSProperties;

            return (
              <motion.div
                key={friend.id}
                className="splash-friend-slot"
                style={style}
                initial={{ scale: 0, y: 50, opacity: 0 }}
                animate={
                  hasArrived
                    ? isCelebrationPhase && !reducedMotion
                      ? {
                          scale: [1, 1.12, 1],
                          y: [0, -16, 0],
                          rotate: index % 2 === 0 ? [-3, 3, -3] : [3, -3, 3],
                          opacity: 1,
                        }
                      : { scale: 1, y: 0, opacity: 1 }
                    : { scale: 0, y: 50, opacity: 0 }
                }
                transition={
                  isCelebrationPhase && !reducedMotion
                    ? {
                        duration: 1.1,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: (index % 4) * 0.12,
                      }
                    : {
                        type: 'spring',
                        stiffness: 280,
                        damping: 18,
                        delay: reducedMotion ? 0 : friend.delay,
                      }
                }
              >
                <div className="splash-friend-bubble">
                  <div className="splash-friend-avatar-wrap">
                    <CharacterAvatar
                      id={friend.id}
                      size="lg"
                      mood={isCelebrationPhase ? 'dancing' : 'happy'}
                    />
                  </div>
                  <span className="splash-friend-emoji-tag" aria-hidden="true">
                    {friend.badge}
                  </span>
                </div>
                <span className="splash-friend-name-pill">{friend.name}</span>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Bottom 5-Second Rainbow Progress Bar */}
      <footer className="splash-bottom-bar">
        <div className="splash-progress-container" aria-hidden="true">
          <div
            className="splash-progress-fill"
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
          <div
            className="splash-progress-runner"
            style={{ left: `${Math.min(98, Math.max(2, progress * 100))}%` }}
          >
            ⭐
          </div>
        </div>
        <p className="splash-progress-hint">
          {isCelebrationPhase ? '놀이숲 문이 활짝 열려요! 🎈' : '신나는 친구들을 깨우는 중이에요...'}
        </p>
      </footer>

      {/* Floating Sparkles from User Touch */}
      <AnimatePresence>
        {taps.map((t) => (
          <span
            key={t.id}
            className="splash-floating-tap"
            style={{ left: t.x, top: t.y }}
            aria-hidden="true"
          >
            {t.emoji}
          </span>
        ))}
      </AnimatePresence>
    </div>
  );
};
