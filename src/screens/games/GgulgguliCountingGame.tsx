import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FOOD_COUNTING_ITEMS } from '../../data/gameData';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JellyButton } from '../../components/JellyButton';
import { speakText, playBubblePop, playCorrectFanfare, playWrongBoing, playCharacterVoiceSFX } from '../../utils/soundEngine';
import { Volume2, RefreshCw } from 'lucide-react';

interface GgulgguliCountingGameProps {
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
}

export const GgulgguliCountingGame: React.FC<GgulgguliCountingGameProps> = ({
  onCompleteQuiz,
  soundEnabled,
}) => {
  const [targetFood, setTargetFood] = useState(FOOD_COUNTING_ITEMS[0]);
  const [targetCount, setTargetCount] = useState<number>(3);
  const [tappedIndices, setTappedIndices] = useState<number[]>([]);
  const [selectedCorrectNumber, setSelectedCorrectNumber] = useState<number | null>(null);
  const [shakingNumber, setShakingNumber] = useState<number | null>(null);

  const KOREAN_COUNTS = ['', '하나', '둘', '셋', '넷', '다섯'];

  const generateRound = () => {
    setSelectedCorrectNumber(null);
    setShakingNumber(null);
    setTappedIndices([]);

    const food = FOOD_COUNTING_ITEMS[Math.floor(Math.random() * FOOD_COUNTING_ITEMS.length)];
    const count = Math.floor(Math.random() * 5) + 1; // 1 to 5 for 43-month toddlers
    setTargetFood(food);
    setTargetCount(count);

    if (soundEnabled) {
      speakText(`꿀꿀이 접시에 맛있는 ${food.name}가 몇 개 있는지 세어주세요!`, soundEnabled, { characterId: 'ggulgguli' });
    }
  };

  useEffect(() => {
    generateRound();
  }, []);

  const handleTapFoodItem = (index: number) => {
    if (tappedIndices.includes(index)) return;

    playBubblePop(soundEnabled);
    const currentTappedCount = tappedIndices.length + 1;
    setTappedIndices((prev) => [...prev, index]);

    if (currentTappedCount <= 5) {
      speakText(KOREAN_COUNTS[currentTappedCount], soundEnabled, { characterId: 'ggulgguli', playIntroSFX: false });
    }
  };

  const handleSelectNumber = (num: number) => {
    if (selectedCorrectNumber) return;

    if (num === targetCount) {
      setSelectedCorrectNumber(num);
      playCorrectFanfare(soundEnabled);
      speakText(`꿀꿀! 정답이에요! ${targetFood.name} ${num}개! 냠냠 참 맛있다!`, soundEnabled, { characterId: 'ggulgguli' });
      onCompleteQuiz(2);
    } else {
      setShakingNumber(num);
      playWrongBoing(soundEnabled);
      speakText(`다시 하나, 둘, 셋 세어보아요!`, soundEnabled, { characterId: 'ggulgguli' });
      setTimeout(() => setShakingNumber(null), 600);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-2xl mx-auto p-2.5 sm:p-4 min-h-[80vh] overflow-hidden">
      {/* Top Banner */}
      <div className="w-full bg-gradient-to-r from-[#FFCCBC] to-[#FBE9E7] p-3.5 sm:p-4 rounded-3xl border-3 border-[#FF7043] shadow-sm flex items-center gap-3 sm:gap-4">
        <CharacterAvatar id="ggulgguli" size="md" mood={selectedCorrectNumber ? 'happy' : 'talking'} className="!w-16 !h-16 sm:!w-24 sm:!h-24 shrink-0" />
        <div className="flex-1 min-w-0 break-keep">
          <div className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-black text-[#F4511E] mb-1">
            <span>🐷 꿀꿀이의 맛있는 수 세기</span>
          </div>
          <h2 className="text-base sm:text-2xl font-black text-[#4A3E3D] leading-snug break-keep">
            접시 위의 <span className="text-[#F4511E] underline">{targetFood.name}</span>는 몇 개일까요?
          </h2>
        </div>
        <button
          onClick={() => speakText(`${targetFood.name}가 몇 개 있는지 세어보아요!`, soundEnabled, { characterId: 'ggulgguli' })}
          className="p-2.5 sm:p-3 bg-white rounded-full border-2 border-[#FF7043] shadow-xs text-[#F4511E] cursor-pointer shrink-0"
        >
          <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Food Plate Container */}
      <div className="my-3 sm:my-5 p-4 sm:p-6 w-full bg-white rounded-3xl sm:rounded-[40px] border-3 sm:border-4 border-[#FFCCBC] shadow-inner flex flex-col items-center justify-center">
        <p className="text-xs sm:text-sm font-bold text-[#8C7B79] mb-2 sm:mb-3 break-keep text-center">
          👇 음식을 손가락으로 누르면 숫자를 세어줘요!
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 min-h-[100px] sm:min-h-[120px]">
          {Array.from({ length: targetCount }).map((_, idx) => {
            const isTapped = tappedIndices.includes(idx);

            return (
              <motion.div
                key={idx}
                whileTap={{ scale: 0.85 }}
                onClick={() => handleTapFoodItem(idx)}
                className={`w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl flex items-center justify-center text-3xl sm:text-5xl cursor-pointer select-none shadow-md border-2 sm:border-3 transition-transform ${
                  isTapped ? 'bg-[#FFE0B2] border-[#FB8C00]' : 'bg-[#FFF8EE] border-[#FFCCBC]'
                }`}
              >
                {targetFood.emoji}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Number Buttons (1, 2, 3, 4, 5) */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 w-full my-2 sm:my-3">
        {[1, 2, 3, 4, 5].map((num) => {
          const isShaking = shakingNumber === num;
          const isCorrect = selectedCorrectNumber === num;

          return (
            <motion.button
              key={num}
              animate={isShaking ? { x: [-8, 8, -6, 6, 0] } : isCorrect ? { scale: 1.15 } : { scale: 1 }}
              onClick={() => handleSelectNumber(num)}
              className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl text-xl sm:text-3xl font-black flex items-center justify-center shadow-md border-b-4 transition-all cursor-pointer ${
                isCorrect
                  ? 'bg-[#81C784] text-white border-[#388E3C]'
                  : 'bg-[#FF9E4A] text-white border-[#E07A26] hover:bg-[#FFA726]'
              }`}
            >
              {num}
            </motion.button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 w-full mt-2 sm:mt-4">
        {selectedCorrectNumber ? (
          <JellyButton variant="primary" size="lg" onClick={generateRound} className="w-full sm:w-auto">
            다음 수 세기 🐷
          </JellyButton>
        ) : (
          <JellyButton variant="white" size="md" onClick={generateRound} className="!px-4">
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" /> 다른 음식
          </JellyButton>
        )}
      </div>
    </div>
  );
};
