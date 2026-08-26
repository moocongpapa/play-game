import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { STICKER_LIST } from '../data/gameData';
import { JellyButton } from '../components/JellyButton';
import { playStarGain, speakText, playBubblePop } from '../utils/soundEngine';
import { Trash2, Sparkles, Home, Move } from 'lucide-react';

interface StickerRoomScreenProps {
  unlockedStickers: string[];
  placedStickers: Array<{
    id: string;
    stickerId: string;
    x: number; // percentage (0 ~ 85)
    y: number; // percentage (0 ~ 80)
    scale: number;
  }>;
  onUpdatePlacedStickers: (stickers: Array<{
    id: string;
    stickerId: string;
    x: number;
    y: number;
    scale: number;
  }>) => void;
  onGoHome: () => void;
  soundEnabled: boolean;
}

export const StickerRoomScreen: React.FC<StickerRoomScreenProps> = ({
  unlockedStickers,
  placedStickers,
  onUpdatePlacedStickers,
  onGoHome,
  soundEnabled,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);

  const handleAddSticker = (stickerId: string) => {
    const sticker = STICKER_LIST.find((s) => s.id === stickerId);
    if (!sticker) return;

    playStarGain(soundEnabled);
    speakText(`${sticker.name} 스티커를 방에 붙였어요! 자유롭게 끌어서 옮겨보세요!`);

    // Add with random comfortable offset within canvas
    const newPlaced = {
      id: `${stickerId}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      stickerId,
      x: 15 + Math.random() * 60,
      y: 15 + Math.random() * 55,
      scale: 1,
    };

    onUpdatePlacedStickers([...placedStickers, newPlaced]);
  };

  const handleDragEnd = (id: string, info: { point: { x: number; y: number }; offset: { x: number; y: number } }) => {
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();

    // Calculate updated position as percentage within canvas
    const current = placedStickers.find((s) => s.id === id);
    if (!current) return;

    // Convert pixel offset to percentage
    const deltaXPercent = (info.offset.x / canvasRect.width) * 100;
    const deltaYPercent = (info.offset.y / canvasRect.height) * 100;

    const nextX = Math.max(2, Math.min(88, current.x + deltaXPercent));
    const nextY = Math.max(2, Math.min(82, current.y + deltaYPercent));

    playBubblePop(soundEnabled);

    const updated = placedStickers.map((s) => (s.id === id ? { ...s, x: nextX, y: nextY } : s));
    onUpdatePlacedStickers(updated);
  };

  const handleRemoveSingleSticker = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = placedStickers.filter((s) => s.id !== id);
    onUpdatePlacedStickers(updated);
    playBubblePop(soundEnabled);
  };

  const handleClearRoom = () => {
    onUpdatePlacedStickers([]);
    speakText('방을 깨끗하게 정리했어요!');
  };

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-4xl mx-auto p-2.5 sm:p-4 min-h-[85vh] overflow-hidden">
      {/* Top Banner */}
      <div className="w-full text-center bg-white/80 p-3 sm:p-4 rounded-3xl border-2 sm:border-3 border-[#FFB7D5] shadow-sm mb-2 break-keep">
        <h1 className="text-xl sm:text-3xl font-black text-[#4A3E3D] flex items-center justify-center gap-2">
          <span>🎨</span> 유하의 스티커북 & 놀이방 꾸미기
        </h1>
        <p className="text-xs sm:text-base font-bold text-[#8C7B79] mt-0.5 flex items-center justify-center gap-1">
          <Move className="w-4 h-4 text-purple-500 inline" /> 스티커를 손가락으로 잡고 마음껏 끌어서 방을 꾸며보세요!
        </p>
      </div>

      {/* Main Sticker Canvas */}
      <div
        ref={canvasRef}
        className="relative w-full h-[320px] sm:h-[450px] bg-gradient-to-b from-[#FFF9E6] to-[#FFE082]/30 rounded-[28px] sm:rounded-[36px] border-3 sm:border-4 border-[#FFA000] shadow-lg overflow-hidden my-2 touch-none"
      >
        {/* Room Decorations */}
        <div className="absolute top-3 left-4 text-3xl sm:text-4xl opacity-30 select-none pointer-events-none">🎈</div>
        <div className="absolute top-4 right-5 text-3xl sm:text-4xl opacity-30 select-none pointer-events-none">🧸</div>
        <div className="absolute bottom-4 left-8 text-3xl sm:text-4xl opacity-30 select-none pointer-events-none">🎨</div>
        <div className="absolute bottom-6 right-8 text-3xl sm:text-4xl opacity-30 select-none pointer-events-none">🌈</div>

        {placedStickers.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 text-[#8C7B79] break-keep pointer-events-none">
            <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-[#FFD15C] mb-2 animate-bounce" />
            <p className="text-lg sm:text-xl font-black text-[#4A3E3D]">아직 유하의 방에 붙인 스티커가 없어요!</p>
            <p className="text-xs sm:text-sm font-bold">아래 스티커 목록에서 원하는 스티커를 톡 터치해보세요!</p>
          </div>
        )}

        {placedStickers.map((item) => {
          const stk = STICKER_LIST.find((s) => s.id === item.stickerId);
          if (!stk) return null;

          return (
            <motion.div
              key={item.id}
              drag
              dragConstraints={canvasRef}
              dragElastic={0.05}
              dragMomentum={false}
              onDragStart={() => setActiveStickerId(item.id)}
              onDragEnd={(_, info) => {
                setActiveStickerId(null);
                handleDragEnd(item.id, info);
              }}
              whileHover={{ scale: 1.12 }}
              whileDrag={{ scale: 1.25, zIndex: 50, filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.25))' }}
              initial={{ scale: 0 }}
              animate={{ scale: item.scale }}
              className="absolute cursor-grab active:cursor-grabbing text-4xl sm:text-6xl p-2 select-none touch-none group"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                zIndex: activeStickerId === item.id ? 50 : 10,
              }}
            >
              <span className="drop-shadow-md inline-block">{stk.emoji}</span>
              {/* Delete button when touching sticker */}
              <button
                onClick={(e) => handleRemoveSingleSticker(item.id, e)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="스티커 떼기"
              >
                ✕
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Unlocked Sticker Tray */}
      <div className="w-full bg-white/90 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-[#FFD15C] my-2 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base sm:text-lg font-black text-[#4A3E3D] flex items-center gap-1 break-keep">
            <span>✨</span> 스티커 목록 ({unlockedStickers.length}개 보유)
          </h3>
          {placedStickers.length > 0 && (
            <button
              onClick={handleClearRoom}
              className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> 방 모두 비우기
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none">
          {STICKER_LIST.map((stk) => {
            const isUnlocked = unlockedStickers.includes(stk.id);

            return (
              <motion.button
                key={stk.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => isUnlocked && handleAddSticker(stk.id)}
                disabled={!isUnlocked}
                className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl border-2 min-w-[75px] sm:min-w-[90px] shrink-0 cursor-pointer transition-all ${
                  isUnlocked
                    ? 'bg-[#FFF9E6] border-[#FFA000] hover:scale-105 shadow-sm'
                    : 'bg-gray-100 border-gray-300 opacity-40 cursor-not-allowed'
                }`}
              >
                <span className="text-3xl sm:text-4xl mb-0.5 sm:mb-1">{isUnlocked ? stk.emoji : '🔒'}</span>
                <span className="text-[11px] sm:text-xs font-bold text-[#4A3E3D] text-center whitespace-nowrap">
                  {stk.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <JellyButton variant="primary" size="lg" onClick={onGoHome} className="w-full sm:w-auto mt-1">
        <Home className="w-5 h-5 sm:w-6 sm:h-6 mr-1.5" /> 메인으로 돌아가기
      </JellyButton>
    </div>
  );
};
