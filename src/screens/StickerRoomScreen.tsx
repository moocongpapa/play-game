import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { STICKER_LIST } from '../data/gameData';
import { playStarGain, speakText, playBubblePop } from '../utils/soundEngine';
import { Trash2, Sparkles, Home, Move } from 'lucide-react';

interface StickerRoomScreenProps {
  childName: string;
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
  childName,
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
    speakText(`${sticker.name} 스티커를 방에 붙였어요! 자유롭게 끌어서 옮겨보세요!`, soundEnabled);

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
    speakText('방을 깨끗하게 정리했어요!', soundEnabled);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 pb-8">
      {/* Top Banner */}
      <div className="w-full break-keep">
        <h1 className="text-[28px] font-extrabold tracking-tight text-[#292c33] sm:text-4xl">
          {childName}의 스티커북
        </h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-[#777980] sm:text-base">
          <Move className="size-4" /> 스티커를 골라 붙이고 손가락으로 옮겨 보세요.
        </p>
      </div>

      {/* Main Sticker Canvas */}
      <div
        ref={canvasRef}
        className="relative h-[340px] w-full touch-none overflow-hidden rounded-[28px] border border-[#e9e7e2] bg-[#f7f5ef] sm:h-[450px]"
      >
        {/* Room Decorations */}
        <div className="absolute top-3 left-4 text-3xl sm:text-4xl opacity-30 select-none pointer-events-none">🎈</div>
        <div className="absolute top-4 right-5 text-3xl sm:text-4xl opacity-30 select-none pointer-events-none">🧸</div>
        <div className="absolute bottom-4 left-8 text-3xl sm:text-4xl opacity-30 select-none pointer-events-none">🎨</div>
        <div className="absolute bottom-6 right-8 text-3xl sm:text-4xl opacity-30 select-none pointer-events-none">🌈</div>

        {placedStickers.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 text-[#8C7B79] break-keep pointer-events-none">
            <Sparkles className="mb-3 size-10 text-[#9a806b]" />
            <p className="text-lg font-extrabold text-[#30343c]">첫 스티커를 붙여 볼까?</p>
            <p className="mt-1 text-sm">아래에서 마음에 드는 스티커를 골라 주세요.</p>
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
      <div className="w-full rounded-[24px] border border-[#e9e7e2] bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="flex items-center gap-1 break-keep text-base font-extrabold text-[#30343c] sm:text-lg">
            스티커 고르기 <span className="ml-1 text-sm font-semibold text-[#777980]">{unlockedStickers.length}개</span>
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
                    ? 'bg-[#f7f7f5] border-[#e9e7e2] hover:border-[#9bb09a] hover:bg-[#f0f5ed]'
                    : 'bg-[#f7f7f5] border-[#e9e7e2] opacity-40 cursor-not-allowed'
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

      <button onClick={onGoHome} className="inline-flex min-h-12 items-center justify-center gap-2 self-center rounded-xl px-5 font-bold text-[#4d5562] hover:bg-[#ecece9]">
        <Home className="size-5" /> 다른 놀이 보기
      </button>
    </div>
  );
};
