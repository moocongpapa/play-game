import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CharacterId } from '../types';
import { CHARACTERS } from '../data/characters';
import { CHARACTER_VIDEOS } from '../data/characterVideoData';
import { playBubblePop, stopAllSpeech, playJellyTap } from '../utils/soundEngine';
import { ArrowLeft } from 'lucide-react';

interface CharacterCharmVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCharacterId: CharacterId;
  soundEnabled: boolean;
}

export const CharacterCharmVideoModal: React.FC<CharacterCharmVideoModalProps> = ({
  isOpen,
  onClose,
  initialCharacterId,
  soundEnabled,
}) => {
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const buddy = CHARACTERS[initialCharacterId] || CHARACTERS.ggomi;
  const videoData = CHARACTER_VIDEOS[initialCharacterId] || CHARACTER_VIDEOS.ggomi;
  const videoUrl = videoData.videoUrl || `/videos/${initialCharacterId}.mp4`;

  useEffect(() => {
    if (!isOpen) {
      stopAllSpeech();
      return;
    }
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [isOpen, initialCharacterId]);

  if (!isOpen) return null;

  const handleClose = () => {
    playJellyTap(soundEnabled);
    stopAllSpeech();
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onClose();
  };

  const handleCheerTap = (e: React.MouseEvent) => {
    playBubblePop(soundEnabled);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 80 + 10;
    setFloatingHearts((prev) => [...prev.slice(-8), { id: Date.now(), x }]);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-2.5 sm:p-5 select-none touch-none"
      role="dialog"
      aria-modal="true"
      aria-label={`${buddy.name} 영상 전체화면`}
    >
      {/* Top Bar: 유하 눈높이에 맞춘 커다란 나가기/놀러가기 버튼 + 캐릭터 배지 */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between gap-3 z-20 pt-1 pb-2">
        <button
          onClick={handleClose}
          type="button"
          className="py-2.5 sm:py-3 px-5 sm:px-7 bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 hover:brightness-105 text-stone-900 font-black text-base sm:text-xl rounded-full shadow-xl flex items-center gap-2 cursor-pointer active:scale-95 transition-all border-3 border-white/90"
          title={`${buddy.name}랑 놀러가기`}
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3.5]" />
          <span>👈 {buddy.name}랑 놀자!</span>
        </button>

        <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white font-black text-base sm:text-lg shadow-md shrink-0">
          <span>{buddy.badge}</span>
          <span>{buddy.name}</span>
          <span>🎬</span>
        </div>
      </header>

      {/* Center Video Stage (하단 여백 없이 시원하게 펼쳐지는 전체화면 영상) */}
      <main
        className="relative flex-1 w-full max-w-4xl mx-auto flex items-center justify-center my-1 overflow-hidden rounded-2xl sm:rounded-3xl bg-black shadow-2xl border-2 border-white/10"
        onClick={handleCheerTap}
      >
        <video
          key={initialCharacterId}
          ref={videoRef}
          src={videoUrl}
          controls
          autoPlay
          loop
          playsInline
          className="w-full h-full object-contain max-h-[82vh]"
        />

        {/* 화면을 터치할 때 퐁퐁 솟아오르는 사랑스러운 하트 리액션 */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          <AnimatePresence>
            {floatingHearts.map((h) => (
              <motion.div
                key={h.id}
                initial={{ y: 250, opacity: 1, scale: 0.8 }}
                animate={{ y: -60, opacity: 0, scale: 1.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="absolute text-4xl sm:text-5xl"
                style={{ left: `${h.x}%` }}
              >
                💖
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
