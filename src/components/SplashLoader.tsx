import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CHARACTER_LIST } from '../data/characters';
import { CharacterAvatar } from './CharacterAvatar';
import { playWelcomeFanfare, startBGM, speakText } from '../utils/soundEngine';
import { Sparkles, Heart, Star, Play } from 'lucide-react';

interface SplashLoaderProps {
  onFinish: () => void;
  soundEnabled: boolean;
  bgmEnabled: boolean;
  childName: string;
}

export const SplashLoader: React.FC<SplashLoaderProps> = ({
  onFinish,
  soundEnabled,
  bgmEnabled,
  childName,
}) => {
  const [progress, setProgress] = useState(0);
  const [hasStartedAudio, setHasStartedAudio] = useState(false);

  // Trigger audio welcome
  const triggerAudio = () => {
    if (hasStartedAudio) return;
    setHasStartedAudio(true);
    playWelcomeFanfare(soundEnabled);
    if (bgmEnabled) {
      startBGM(0.18);
    }
    speakText(`${childName}야 어서와! 친구들과 함께 신나게 놀자!`, soundEnabled);
  };

  useEffect(() => {
    // Attempt auto-audio start
    triggerAudio();

    // 5-second smooth timer for 100%
    const durationMs = 5000;
    const intervalMs = 50;
    const increment = (intervalMs / durationMs) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onFinish();
          }, 300);
          return 100;
        }
        return prev + increment;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        onClick={triggerAudio}
        className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-8 bg-gradient-to-b from-[#FFF59D] via-[#FFE082] to-[#FFB74D] select-none overflow-hidden"
      >
        {/* Floating Sparkles & Stars Background Decor */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ y: [0, -15, 0], rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="absolute top-10 left-8 text-4xl sm:text-6xl"
          >
            🎈
          </motion.div>
          <motion.div
            animate={{ y: [0, 15, 0], rotate: [0, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
            className="absolute top-16 right-10 text-4xl sm:text-6xl"
          >
            🌈
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-20 left-12 text-3xl sm:text-5xl"
          >
            ⭐
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2.4 }}
            className="absolute bottom-24 right-14 text-3xl sm:text-5xl"
          >
            💖
          </motion.div>
        </div>

        {/* Top Header Title */}
        <div className="flex flex-col items-center text-center mt-4 sm:mt-8 z-10">
          <motion.div
            initial={{ scale: 0.5, y: -20 }}
            animate={{ scale: [1, 1.08, 1], y: 0 }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md px-5 py-2 rounded-full border-3 border-[#FFA000] shadow-md mb-3"
          >
            <Sparkles className="w-6 h-6 text-amber-500 animate-spin" />
            <span className="text-xl sm:text-2xl font-black text-[#E65100]">
              {childName}의 캐릭터 놀이터
            </span>
            <Star className="w-6 h-6 text-amber-500 fill-amber-400" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#4A3E3D] drop-shadow-sm flex items-center gap-2 justify-center flex-wrap"
          >
            <span>✨ {childName}야, 어서와! ✨</span>
          </motion.h1>

          <p className="text-base sm:text-xl font-bold text-[#8C7B79] mt-2 flex items-center gap-1.5">
            <span>🎉 귀여운 동물 친구들이 {childName}를 기다려! 💖</span>
          </p>
        </div>

        {/* Center: Waving Character Avatars Lineup */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 my-auto z-10 w-full max-w-3xl flex-wrap">
          {CHARACTER_LIST.map((char, index) => (
            <motion.div
              key={char.id}
              initial={{ scale: 0, y: 30 }}
              animate={{
                scale: 1,
                y: [0, -12, 0],
              }}
              transition={{
                scale: { duration: 0.4, delay: index * 0.1 },
                y: {
                  repeat: Infinity,
                  duration: 1.5 + (index % 3) * 0.2,
                  ease: 'easeInOut',
                  delay: index * 0.15,
                },
              }}
              className="flex flex-col items-center cursor-pointer group"
              onClick={() => {
                triggerAudio();
                speakText(`${childName}야 안녕! 나는 ${char.name}야!`, soundEnabled, { characterId: char.id });
              }}
            >
              <div className="relative">
                <CharacterAvatar
                  id={char.id}
                  size="md"
                  mood="happy"
                  className="!w-16 !h-16 sm:!w-24 sm:!h-24 shadow-lg ring-4 ring-white"
                />
                <span className="absolute -top-1 -right-1 text-base sm:text-xl bg-white rounded-full p-1 shadow-xs border border-amber-300">
                  {char.badge}
                </span>
              </div>
              <span className="text-xs sm:text-sm font-black text-[#4A3E3D] mt-1 bg-white/90 px-2 py-0.5 rounded-full shadow-2xs">
                {char.name}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Bottom Progress Bar & Play Button */}
        <div className="w-full max-w-md flex flex-col items-center gap-3 z-10 mb-4 sm:mb-8">
          {/* Progress Bar Container */}
          <div className="w-full bg-white/80 p-2 rounded-full border-3 border-[#FFA000] shadow-md relative overflow-hidden">
            <div
              className="h-4 sm:h-5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 rounded-full transition-all duration-100 relative"
              style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            </div>
          </div>

          <div className="flex items-center justify-between w-full text-xs sm:text-sm font-black text-[#6D4C41] px-2">
            <span>🚀 {childName}와 출발 준비 중...</span>
            <span>{Math.round(progress)}%</span>
          </div>

          {/* Quick Start Button for immediate jump */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerAudio();
              onFinish();
            }}
            className="mt-1 py-2.5 px-6 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white font-black text-sm sm:text-base rounded-full shadow-lg flex items-center gap-2 cursor-pointer border-2 border-white"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>✨ {childName}야, 바로 시작하기! ✨</span>
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
