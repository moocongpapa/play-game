import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CharacterId } from '../types';
import { CHARACTER_LIST } from '../data/characters';
import { CHARACTER_VIDEOS } from '../data/characterVideoData';
import { CharacterAvatar } from './CharacterAvatar';
import { playBubblePop, stopAllSpeech, playJellyTap } from '../utils/soundEngine';
import { ArrowLeft, RotateCcw, X } from 'lucide-react';

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
  const [selectedCharId, setSelectedCharId] = useState<CharacterId>(initialCharacterId);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const videoData = CHARACTER_VIDEOS[selectedCharId] || CHARACTER_VIDEOS.ggomi;
  const videoUrl = videoData.videoUrl || `/videos/${selectedCharId}.mp4`;
  const currentChar = CHARACTER_LIST.find((c) => c.id === selectedCharId);

  useEffect(() => {
    if (!isOpen) {
      stopAllSpeech();
      return;
    }
    setSelectedCharId(initialCharacterId);
  }, [isOpen, initialCharacterId]);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [selectedCharId, isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    stopAllSpeech();
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onClose();
  };

  const handleSelectCharacter = (charId: CharacterId) => {
    playJellyTap(soundEnabled);
    stopAllSpeech();
    setSelectedCharId(charId);
  };

  const handleReplay = () => {
    playJellyTap(soundEnabled);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleCheerTap = (e: React.MouseEvent) => {
    playBubblePop(soundEnabled);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 80 + 10;
    setFloatingHearts((prev) => [...prev.slice(-8), { id: Date.now(), x }]);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-2 sm:p-4 select-none touch-none"
      role="dialog"
      aria-modal="true"
      aria-label={`${currentChar?.name} 영상 전체화면`}
    >
      {/* Top Bar: 큰 뒤로가기 버튼 + 캐릭터 이름 + 다시보기 */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between gap-2 z-20 py-1">
        <button
          onClick={handleClose}
          type="button"
          className="py-2 px-3.5 sm:px-4 bg-white/20 hover:bg-white/30 text-white font-black text-sm sm:text-base rounded-full backdrop-blur-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform shrink-0 border border-white/20 shadow-md"
          title="뒤로 가기"
        >
          <ArrowLeft className="w-5 h-5 stroke-[3]" />
          <span>나가기</span>
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/15 backdrop-blur-md rounded-full border border-white/20 text-white font-black text-base sm:text-lg shadow-md">
          <span>{currentChar?.badge}</span>
          <span>{currentChar?.name} 영상</span>
          <span>🎬</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleReplay}
            type="button"
            className="p-2 sm:px-3 sm:py-2 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm rounded-full flex items-center gap-1 cursor-pointer active:scale-95 transition-transform shadow-md"
            title="다시 보기"
          >
            <RotateCcw className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">다시 보기</span>
          </button>
          <button
            onClick={handleClose}
            type="button"
            className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Center Video Stage (가득 찬 비디오 뷰) */}
      <main
        className="relative flex-1 w-full max-w-4xl mx-auto flex items-center justify-center my-1 sm:my-2 overflow-hidden rounded-2xl sm:rounded-3xl bg-black shadow-2xl border-2 border-white/10"
        onClick={handleCheerTap}
      >
        <video
          key={selectedCharId}
          ref={videoRef}
          src={videoUrl}
          controls
          autoPlay
          loop
          playsInline
          className="w-full h-full object-contain max-h-[75vh]"
        />

        {/* Floating Hearts Reaction when toddler taps screen */}
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

      {/* Bottom Bar: 다른 캐릭터 영상 바로보기 리본 */}
      <footer className="w-full max-w-4xl mx-auto z-20 py-1">
        <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1 px-2">
          {CHARACTER_LIST.map((char) => {
            const isSelected = char.id === selectedCharId;
            return (
              <button
                key={char.id}
                type="button"
                onClick={() => handleSelectCharacter(char.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-amber-400 text-amber-950 shadow-md scale-105 border-2 border-amber-300 ring-2 ring-amber-400/50'
                    : 'bg-white/20 text-white hover:bg-white/30 border border-white/20'
                }`}
              >
                <CharacterAvatar id={char.id} size="sm" mood="happy" className="!w-6 !h-6" />
                <span>{char.name}</span>
              </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
};
