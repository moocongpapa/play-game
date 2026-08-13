import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SHAPE_COLOR_ITEMS } from '../../data/gameData';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JellyButton } from '../../components/JellyButton';
import { speakText, playCorrectFanfare, playWrongBoing, playCharacterVoiceSFX } from '../../utils/soundEngine';
import { Volume2, RefreshCw } from 'lucide-react';

interface RanoShapeColorGameProps {
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
}

export const RanoShapeColorGame: React.FC<RanoShapeColorGameProps> = ({
  onCompleteQuiz,
  soundEnabled,
}) => {
  const [targetItem, setTargetItem] = useState(SHAPE_COLOR_ITEMS[0]);
  const [options, setOptions] = useState<typeof SHAPE_COLOR_ITEMS>([]);
  const [shakingCardId, setShakingCardId] = useState<string | null>(null);
  const [selectedCorrectId, setSelectedCorrectId] = useState<string | null>(null);

  const generateRound = () => {
    setSelectedCorrectId(null);
    setShakingCardId(null);
    const target = SHAPE_COLOR_ITEMS[Math.floor(Math.random() * SHAPE_COLOR_ITEMS.length)];
    setTargetItem(target);

    const distractors = SHAPE_COLOR_ITEMS.filter((item) => item.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    const roundOptions = [...distractors, target].sort(() => Math.random() - 0.5);
    setOptions(roundOptions);

    if (soundEnabled) {
      speakText(`라노와 함께 알록달록 ${target.colorName} ${target.shape} 모양을 찾아주세요!`, soundEnabled, { characterId: 'rano' });
    }
  };

  useEffect(() => {
    generateRound();
  }, []);

  const handleSelectCard = (item: typeof SHAPE_COLOR_ITEMS[0]) => {
    if (selectedCorrectId) return;

    if (item.id === targetItem.id) {
      setSelectedCorrectId(item.id);
      playCorrectFanfare(soundEnabled);
      speakText(`크앙! 정답이에요! ${item.colorName} ${item.shape}!`, soundEnabled, { characterId: 'rano' });
      onCompleteQuiz(2);
    } else {
      setShakingCardId(item.id);
      playWrongBoing(soundEnabled);
      speakText(`다시 골라볼까요?`, soundEnabled, { characterId: 'rano' });
      setTimeout(() => setShakingCardId(null), 600);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-2xl mx-auto p-2.5 sm:p-4 min-h-[80vh] overflow-hidden">
      {/* Top Banner */}
      <div className="w-full bg-gradient-to-r from-[#DCEDC8] to-[#E8F5E9] p-3.5 sm:p-4 rounded-3xl border-3 border-[#66BB6A] shadow-sm flex items-center gap-3 sm:gap-4">
        <CharacterAvatar id="rano" size="md" mood={selectedCorrectId ? 'excited' : 'waving'} className="!w-16 !h-16 sm:!w-24 sm:!h-24 shrink-0" />
        <div className="flex-1 min-w-0 break-keep">
          <div className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-black text-[#2E7D32] mb-1">
            <span>🦖 라노의 모양 색상 퍼즐</span>
          </div>
          <h2 className="text-base sm:text-2xl font-black text-[#4A3E3D] leading-snug break-keep">
            &ldquo;<span className="text-[#2E7D32] underline">{targetItem.colorName} {targetItem.shape}</span>&rdquo;
          </h2>
        </div>
        <button
          onClick={() => speakText(`${targetItem.colorName} ${targetItem.shape}를 찾아보아요!`, soundEnabled, { characterId: 'rano' })}
          className="p-2.5 sm:p-3 bg-white rounded-full border-2 border-[#66BB6A] shadow-xs text-[#2E7D32] cursor-pointer shrink-0"
        >
          <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Dinosaur Footprint Target Slot */}
      <div className="my-3 sm:my-4 p-4 sm:p-6 bg-white rounded-3xl sm:rounded-full border-3 sm:border-4 border-dashed border-[#81C784] shadow-inner flex flex-col items-center justify-center">
        <span className="text-xs font-bold text-[#8C7B79] mb-1">라노 발자국 틀</span>
        <div
          className="w-18 h-18 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl flex items-center justify-center text-4xl sm:text-5xl shadow-sm transition-transform"
          style={{ backgroundColor: targetItem.color }}
        >
          {targetItem.emoji}
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full my-3 sm:my-4">
        {options.map((item) => {
          const isShaking = shakingCardId === item.id;
          const isSolved = selectedCorrectId === item.id;

          return (
            <motion.div
              key={item.id}
              animate={isShaking ? { x: [-10, 10, -8, 8, 0] } : isSolved ? { scale: 1.05 } : { scale: 1 }}
              transition={{ duration: 0.5 }}
              onClick={() => handleSelectCard(item)}
              className={`flex flex-col items-center justify-center p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl border-3 sm:border-4 cursor-pointer select-none transition-all shadow-md touch-manipulation min-h-[130px] sm:min-h-[160px] ${
                isSolved
                  ? 'bg-[#E8F5E9] border-[#66BB6A]'
                  : 'bg-white hover:bg-[#F1F8E9] border-[#C8E6C9]'
              }`}
            >
              <span className="text-3xl sm:text-5xl mb-1">{item.emoji}</span>
              <span className="text-xs sm:text-base font-black text-[#4A3E3D]">{item.colorName}</span>
              <span className="text-sm sm:text-lg font-black text-[#2E7D32]">{item.shape}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 w-full">
        {selectedCorrectId ? (
          <JellyButton variant="green" size="lg" onClick={generateRound} className="w-full sm:w-auto">
            다음 퍼즐 풀기 🦖
          </JellyButton>
        ) : (
          <JellyButton variant="white" size="md" onClick={generateRound} className="!px-4">
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" /> 다른 문제
          </JellyButton>
        )}
      </div>
    </div>
  );
};
