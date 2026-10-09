import { useGameTimeouts } from '../hooks/useGameTimeouts';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { JellyButton } from '../components/JellyButton';
import type { CharacterId } from '../types';
import {
  speakText,
  playBouncyBoing,
  playDingDongDang,
  playSparkleChime,
  playJellyTap,
  playCelebrationFanfare,
} from '../utils/soundEngine';
import { fireConfetti, fireStarExplosion, fireCelebrationFireworks } from '../utils/confetti';
import { Sparkles, ImagePlus, ArrowLeft, Music, Footprints } from 'lucide-react';

interface LivingCharacterStageProps {
  buddy: CharacterId;
  spriteUrl: string;
  characterTitle: string;
  childName: string;
  soundEnabled: boolean;
  onBack: () => void;
  onSave: () => void;
}

type MotionMode = 'idle' | 'jump' | 'dance' | 'magic' | 'walk';

const CUTE_REACTIONS = [
  '간지러워요 헤헤~',
  '유하야, 나를 예쁘게 색칠해줘서 고마워!',
  '신난다! 유하랑 같이 놀자!',
  '내가 살아서 움직여요! 얏호!',
  '반짝반짝 너무 마음에 들어요!',
];

export const LivingCharacterStage: React.FC<LivingCharacterStageProps> = ({
  buddy,
  spriteUrl,
  characterTitle,
  childName,
  soundEnabled,
  onBack,
  onSave,
}) => {
  const { scheduleGameTimeout, cancelGameTimeout } = useGameTimeouts();
  const actionTimer = useRef<number | null>(null);
  const [motionMode, setMotionMode] = useState<MotionMode>('idle');
  const [speechBubble, setSpeechBubble] = useState<string>('');
  const [tapHearts, setTapHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    // Initial entrance celebration
    playCelebrationFanfare(soundEnabled);
    fireCelebrationFireworks(2500);

    const entranceVoice = `우와! ${childName}야! 네가 색칠한 ${characterTitle} 친구가 살아 움직여요!`;
    speakText(entranceVoice, soundEnabled, { characterId: buddy });
    setSpeechBubble(entranceVoice);

    const timer = scheduleGameTimeout(() => {
      setSpeechBubble(`${childName}야 안녕! 나랑 같이 춤추자!`);
    }, 4500);

    return () => cancelGameTimeout(timer);
  }, []);

  const handleAction = (mode: MotionMode) => {
    cancelGameTimeout(actionTimer.current);
    actionTimer.current = null;
    setMotionMode(mode);

    if (mode === 'jump') {
      playBouncyBoing(soundEnabled);
      fireStarExplosion();
      const msg = '높이높이 점프! 얏호!';
      setSpeechBubble(msg);
      speakText(msg, soundEnabled, { characterId: buddy });
      actionTimer.current = scheduleGameTimeout(() => setMotionMode('idle'), 2500);
    } else if (mode === 'dance') {
      playDingDongDang(soundEnabled);
      fireConfetti();
      const msg = '신나게 덩실덩실 춤을 춰요!';
      setSpeechBubble(msg);
      speakText(msg, soundEnabled, { characterId: buddy });
      actionTimer.current = scheduleGameTimeout(() => setMotionMode('idle'), 4000);
    } else if (mode === 'magic') {
      playSparkleChime(soundEnabled);
      fireStarExplosion();
      const msg = '반짝반짝 무지개 마법 얍!';
      setSpeechBubble(msg);
      speakText(msg, soundEnabled, { characterId: buddy });
      actionTimer.current = scheduleGameTimeout(() => setMotionMode('idle'), 3000);
    } else if (mode === 'walk') {
      playJellyTap(soundEnabled);
      const msg = '아장아장 산책을 가요~';
      setSpeechBubble(msg);
      speakText(msg, soundEnabled, { characterId: buddy });
      actionTimer.current = scheduleGameTimeout(() => setMotionMode('idle'), 4500);
    }
  };

  const handleTapCharacter = (e: React.MouseEvent) => {
    playBouncyBoing(soundEnabled);

    let cx = window.innerWidth * 0.5;
    let cy = window.innerHeight * 0.5;
    if ('clientX' in e && e.clientX) {
      cx = e.clientX;
      cy = e.clientY;
    }

    // Add heart popup
    const newHeart = { id: Date.now(), x: cx, y: cy };
    setTapHearts((prev) => [...prev, newHeart]);
    scheduleGameTimeout(() => {
      setTapHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1000);

    const randomMsg = CUTE_REACTIONS[Math.floor(Math.random() * CUTE_REACTIONS.length)];
    setSpeechBubble(randomMsg);
    speakText(randomMsg, soundEnabled, { characterId: buddy });
  };

  // Determine character motion variants
  const getMotionAnimation = () => {
    switch (motionMode) {
      case 'jump':
        return {
          y: [0, -120, -140, 0, -30, 0],
          scaleY: [0.85, 1.25, 1.1, 0.85, 1.05, 1],
          scaleX: [1.15, 0.85, 0.95, 1.15, 0.95, 1],
          rotate: [0, -6, 6, 0, -2, 0],
          transition: { duration: 1.2, ease: 'easeInOut' as const, repeat: 1 },
        };
      case 'dance':
        return {
          y: [0, -25, 0, -25, 0],
          rotate: [-12, 12, -12, 12, 0],
          scale: [1, 1.08, 0.96, 1.08, 1],
          transition: { duration: 1.6, ease: 'easeInOut' as const, repeat: 2 },
        };
      case 'magic':
        return {
          rotate: [0, 360],
          scale: [1, 1.18, 1.05, 1.22, 1],
          transition: { duration: 2.0, ease: 'easeInOut' as const },
        };
      case 'walk':
        return {
          x: [-60, 60, -60],
          y: [0, -18, 0, -18, 0],
          rotate: [-6, 6, -6, 6, 0],
          transition: { duration: 3.5, ease: 'easeInOut' as const },
        };
      case 'idle':
      default:
        return {
          y: [0, -10, 0],
          scaleY: [1, 1.05, 0.97, 1],
          scaleX: [1, 0.97, 1.04, 1],
          rotate: [-1.5, 1.5, -1.5],
          transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' as const },
        };
    }
  };

  return (
    <div className="sketch-living-stage relative w-full bg-gradient-to-b from-[#BAE6FD] via-[#E0F2FE] to-[#86EFAC] rounded-[36px] border-4 border-amber-300 shadow-2xl overflow-hidden select-none flex flex-col justify-between p-4 sm:p-6">
      {/* Sun & Floating Clouds Background Decoration */}
      <div className="absolute top-4 left-6 pointer-events-none flex items-center gap-2 animate-pulse">
        <span className="text-5xl filter drop-shadow-md">☀️</span>
      </div>
      <motion.div
        animate={{ x: [-20, 40, -20] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-8 right-12 text-5xl pointer-events-none opacity-80"
      >
        ☁️
      </motion.div>
      <motion.div
        animate={{ x: [30, -30, 30] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-20 left-24 text-4xl pointer-events-none opacity-70"
      >
        ☁️
      </motion.div>

      {/* Top Header Bar */}
      <div className="sketch-living-header z-30 w-full flex items-center justify-between bg-white/90 backdrop-blur-xs p-3 rounded-3xl border-2 border-sky-300 shadow-md">
        <button
          onClick={onBack}
          className="min-h-16 min-w-16 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-2xl font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform border border-amber-300"
        >
          <ArrowLeft className="size-7" /> 다시 그리기
        </button>

        <div className="sketch-living-title text-center">
          <span className="text-xs font-black text-sky-600 block">
            🪄 {childName}의 살아 움직이는 캐릭터
          </span>
          <h2 className="text-base sm:text-xl font-black text-[#4A3E3D]">
            {characterTitle} 친구가 살아났어요! 🎉
          </h2>
        </div>

        <button
          onClick={onSave}
          aria-label="전시회에 저장하기"
          className="min-h-16 min-w-16 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform shadow-xs"
        >
          <ImagePlus className="size-7" /> 저장하기
        </button>
      </div>

      {/* Speech Bubble from the character */}
      <div className="sketch-living-speech z-30 w-full max-w-md mx-auto my-1 flex justify-center">
        <AnimatePresence mode="wait">
          {speechBubble && (
            <motion.div
              key={speechBubble}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white/95 px-5 py-2.5 rounded-full border-3 border-amber-400 shadow-lg text-sm sm:text-base font-black text-[#4A3E3D] text-center flex items-center gap-2"
            >
              <span>💬 {speechBubble}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Living Character Play Stage */}
      <div className="sketch-living-character relative z-20 flex-1 flex items-center justify-center pointer-events-auto">
        <motion.button type="button" aria-label={`${characterTitle} 친구와 놀기`}
          animate={getMotionAnimation()}
          onClick={handleTapCharacter}
          whileHover={{ scale: 1.04 }}
          className="cursor-pointer filter drop-shadow-2xl max-w-[85vw] max-h-[48vh] sm:max-h-[55vh] flex items-center justify-center"
        >
          <img
            src={spriteUrl}
            alt={characterTitle}
            className="w-auto h-auto max-w-full max-h-[48vh] sm:max-h-[55vh] object-contain select-none pointer-events-none"
          />
        </motion.button>

        {/* Floating Heart Popups on Tap */}
        {tapHearts.map((h) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 1, scale: 0.4, y: 0 }}
            animate={{ opacity: 0, scale: 2.2, y: -90 }}
            className="fixed pointer-events-none text-4xl text-rose-500 z-50 filter drop-shadow-md select-none"
            style={{ left: h.x - 16, top: h.y - 16 }}
          >
            💖
          </motion.div>
        ))}
      </div>

      {/* Bottom Interactive Action Toolbar for Yuha */}
      <div className="sketch-living-actions z-30 w-full flex flex-col items-center gap-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full max-w-xl">
          <JellyButton
            onClick={() => handleAction('jump')}
            variant="yellow"
            size="md"
            className="w-full flex items-center justify-center gap-1.5"
          >
            <span className="text-xl">🦘</span>
            <span>통통 점프!</span>
          </JellyButton>

          <JellyButton
            onClick={() => handleAction('dance')}
            variant="pink"
            size="md"
            className="w-full flex items-center justify-center gap-1.5"
          >
            <Music className="w-5 h-5 text-rose-600" />
            <span>신나는 댄스!</span>
          </JellyButton>

          <JellyButton
            onClick={() => handleAction('magic')}
            variant="purple"
            size="md"
            className="w-full flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-5 h-5 text-purple-200" />
            <span>반짝 마법!</span>
          </JellyButton>

          <JellyButton
            onClick={() => handleAction('walk')}
            variant="green"
            size="md"
            className="w-full flex items-center justify-center gap-1.5"
          >
            <Footprints className="w-5 h-5 text-emerald-800" />
            <span>아장 산책!</span>
          </JellyButton>
        </div>

        <p className="text-xs font-bold text-emerald-900 bg-white/70 py-1.5 px-4 rounded-full shadow-2xs mt-1">
          💡 캐릭터를 콕콕 터치하면 간지러워하며 높이 뛰어요!
        </p>
      </div>
    </div>
  );
};
