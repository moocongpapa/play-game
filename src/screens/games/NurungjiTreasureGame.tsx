import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JellyButton } from '../../components/JellyButton';
import { speakText, playCorrectFanfare, playWrongBoing, playCharacterVoiceSFX } from '../../utils/soundEngine';
import { Volume2, RefreshCw, Sparkles } from 'lucide-react';

interface TreasureItem {
  id: string;
  name: string;
  emoji: string;
  hideSpot: string;
}

const TREASURE_ITEMS: TreasureItem[] = [
  { id: 'teddy_bear', name: '곰인형', emoji: '🧸', hideSpot: '쿠션 뒤' },
  { id: 'toy_car', name: '장난감 자동차', emoji: '🚗', hideSpot: '상자 속' },
  { id: 'apple_tr', name: '달콤 사과', emoji: '🍎', hideSpot: '바구니 안' },
  { id: 'book_tr', name: '그림책', emoji: '📚', hideSpot: '책상 위' },
  { id: 'ball_tr', name: '알록달록 공', emoji: '⚽', hideSpot: '소파 옆' },
  { id: 'flower_tr', name: '예쁜 꽃', emoji: '🌸', hideSpot: '화분 속' },
];

interface NurungjiTreasureGameProps {
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
}

export const NurungjiTreasureGame: React.FC<NurungjiTreasureGameProps> = ({
  onCompleteQuiz,
  soundEnabled,
}) => {
  const [targetItem, setTargetItem] = useState<TreasureItem>(TREASURE_ITEMS[0]);
  const [displayedItems, setDisplayedItems] = useState<TreasureItem[]>([]);
  const [selectedCorrectId, setSelectedCorrectId] = useState<string | null>(null);
  const [shakingCardId, setShakingCardId] = useState<string | null>(null);

  const generateRound = () => {
    setSelectedCorrectId(null);
    setShakingCardId(null);

    const target = TREASURE_ITEMS[Math.floor(Math.random() * TREASURE_ITEMS.length)];
    setTargetItem(target);

    const distractors = TREASURE_ITEMS.filter((item) => item.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    const roundItems = [target, ...distractors].sort(() => Math.random() - 0.5);
    setDisplayedItems(roundItems);

    if (soundEnabled) {
      speakText(`누룽지와 함께 숨겨진 보물 ${target.name}을 찾아볼까요?`, soundEnabled, { characterId: 'nurungji' });
    }
  };

  useEffect(() => {
    generateRound();
  }, []);

  const handleSelectTreasure = (item: TreasureItem) => {
    if (selectedCorrectId) return;

    if (item.id === targetItem.id) {
      setSelectedCorrectId(item.id);
      playCorrectFanfare(soundEnabled);
      speakText(`멍멍! 보물을 찾았어요! ${item.name}!`, soundEnabled, { characterId: 'nurungji' });
      onCompleteQuiz(2);
    } else {
      setShakingCardId(item.id);
      playWrongBoing(soundEnabled);
      speakText(`다른 보물상자를 열어볼까요?`, soundEnabled, { characterId: 'nurungji' });
      setTimeout(() => setShakingCardId(null), 600);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-2xl mx-auto p-2.5 sm:p-4 min-h-[80vh] overflow-hidden">
      {/* Top Banner */}
      <div className="w-full bg-gradient-to-r from-[#FFECB3] to-[#FFF8E1] p-3.5 sm:p-4 rounded-3xl border-3 border-[#FFA000] shadow-sm flex items-center gap-3 sm:gap-4">
        <CharacterAvatar id="nurungji" size="md" mood={selectedCorrectId ? 'excited' : 'waving'} className="!w-16 !h-16 sm:!w-24 sm:!h-24 shrink-0" />
        <div className="flex-1 min-w-0 break-keep">
          <div className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-black text-[#FF8F00] mb-1">
            <span>🐶 누룽지의 숨은 보물 찾기</span>
          </div>
          <h2 className="text-base sm:text-2xl font-black text-[#4A3E3D] leading-snug break-keep">
            숨어있는 &ldquo;<span className="text-[#FF8F00] underline">{targetItem.name}</span>&rdquo;을 찾아주세요!
          </h2>
        </div>
        <button
          onClick={() => speakText(`숨겨진 ${targetItem.name} 보물을 찾아서 터치해보아요!`, soundEnabled, { characterId: 'nurungji' })}
          className="p-2.5 sm:p-3 bg-white rounded-full border-2 border-[#FFA000] shadow-xs text-[#FF8F00] cursor-pointer shrink-0"
        >
          <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Interactive Treasure Room Scene */}
      <div className="relative w-full min-h-[240px] sm:min-h-[280px] my-3 sm:my-4 bg-gradient-to-b from-[#FFF8E1] to-[#FFE082]/40 rounded-3xl border-3 sm:border-4 border-dashed border-[#FFA000] p-3 sm:p-6 grid grid-cols-3 sm:flex sm:items-center sm:justify-around gap-2 sm:gap-4">
        {displayedItems.map((item) => {
          const isShaking = shakingCardId === item.id;
          const isSolved = selectedCorrectId === item.id;

          return (
            <motion.div
              key={item.id}
              animate={isShaking ? { x: [-10, 10, -8, 8, 0] } : isSolved ? { scale: 1.1 } : { scale: 1 }}
              transition={{ duration: 0.5 }}
              onClick={() => handleSelectTreasure(item)}
              className={`flex flex-col items-center justify-center p-3 sm:p-6 rounded-2xl sm:rounded-3xl border-3 sm:border-4 cursor-pointer select-none transition-all shadow-md touch-manipulation min-h-[130px] sm:min-h-[170px] ${
                isSolved
                  ? 'bg-[#E8F5E9] border-[#81C784]'
                  : 'bg-white hover:bg-[#FFF8E1] border-[#FFE082]'
              }`}
            >
              {isSolved && <Sparkles className="w-5 h-5 sm:w-8 sm:h-8 text-[#FFA000] animate-bounce mb-1" />}
              <span className="text-4xl sm:text-6xl mb-1 sm:mb-2">{item.emoji}</span>
              <span className="text-xs sm:text-xl font-black text-[#4A3E3D] text-center">{item.name}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 w-full">
        {selectedCorrectId ? (
          <JellyButton variant="yellow" size="lg" onClick={generateRound} className="w-full sm:w-auto">
            다음 보물 찾기 🐶
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
