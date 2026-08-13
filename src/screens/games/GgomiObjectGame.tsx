import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { QuizItem } from '../../types';
import { OBJECT_ITEMS } from '../../data/gameData';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JellyButton } from '../../components/JellyButton';
import { speakText, playCorrectFanfare, playWrongBoing, playCharacterVoiceSFX } from '../../utils/soundEngine';
import { Volume2, RefreshCw } from 'lucide-react';

interface GgomiObjectGameProps {
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
}

export const GgomiObjectGame: React.FC<GgomiObjectGameProps> = ({
  onCompleteQuiz,
  soundEnabled,
}) => {
  const [targetItem, setTargetItem] = useState<QuizItem>(OBJECT_ITEMS[0]);
  const [options, setOptions] = useState<QuizItem[]>([]);
  const [shakingCardId, setShakingCardId] = useState<string | null>(null);
  const [selectedCorrectId, setSelectedCorrectId] = useState<string | null>(null);

  const generateRound = () => {
    setSelectedCorrectId(null);
    setShakingCardId(null);
    const target = OBJECT_ITEMS[Math.floor(Math.random() * OBJECT_ITEMS.length)];
    setTargetItem(target);

    const distractors = OBJECT_ITEMS.filter((item) => item.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    const roundOptions = [target, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(roundOptions);

    if (soundEnabled) {
      speakText(`꼬미가 ${target.koreanName}를 찾고 있어요! ${target.koreanName}는 어디에 있을까요?`, soundEnabled, { characterId: 'ggomi' });
    }
  };

  useEffect(() => {
    generateRound();
  }, []);

  const handleSelectCard = (item: QuizItem) => {
    if (selectedCorrectId) return; // round already solved

    if (item.id === targetItem.id) {
      setSelectedCorrectId(item.id);
      playCorrectFanfare(soundEnabled);
      speakText(`정답이에요! 참 잘했어요! ${item.koreanName}!`, soundEnabled, { characterId: 'ggomi' });
      onCompleteQuiz(2);
    } else {
      setShakingCardId(item.id);
      playWrongBoing(soundEnabled);
      speakText(`다시 한번 찾아보아요!`, soundEnabled, { characterId: 'ggomi' });
      setTimeout(() => setShakingCardId(null), 600);
    }
  };

  const handleReplayVoice = () => {
    speakText(`${targetItem.koreanName}는 어디에 있을까요?`, soundEnabled, { characterId: 'ggomi' });
  };

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-2xl mx-auto p-2.5 sm:p-4 min-h-[80vh] overflow-hidden">
      {/* Top Banner with Character Prompt */}
      <div className="w-full bg-gradient-to-r from-[#FFB7D5] to-[#FFE4EC] p-3.5 sm:p-4 rounded-3xl border-3 border-[#FF80AB] shadow-sm flex items-center gap-3 sm:gap-4">
        <CharacterAvatar id="ggomi" size="md" mood={selectedCorrectId ? 'dancing' : 'talking'} className="!w-16 !h-16 sm:!w-24 sm:!h-24 shrink-0" />
        <div className="flex-1 min-w-0 break-keep">
          <div className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-black text-[#FF4081] mb-1">
            <span>🎀 꼬미의 사물 인지 놀이</span>
          </div>
          <h2 className="text-base sm:text-2xl font-black text-[#4A3E3D] leading-snug break-keep">
            &ldquo;<span className="text-[#FF4081] underline">{targetItem.koreanName}</span>&rdquo;를 찾아주세요!
          </h2>
        </div>
        <button
          onClick={handleReplayVoice}
          className="p-2.5 sm:p-3 bg-white rounded-full border-2 border-[#FF80AB] shadow-xs text-[#FF4081] active:scale-90 transition-transform cursor-pointer shrink-0"
        >
          <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Cards Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full my-4 sm:my-6">
        {options.map((item) => {
          const isShaking = shakingCardId === item.id;
          const isSolved = selectedCorrectId === item.id;

          return (
            <motion.div
              key={item.id}
              animate={
                isShaking
                  ? { x: [-10, 10, -8, 8, -4, 4, 0] }
                  : isSolved
                  ? { scale: [1, 1.12, 1], rotate: [0, 5, -5, 0] }
                  : { y: [0, -4, 0] }
              }
              transition={{ duration: isShaking ? 0.5 : 2, repeat: isShaking ? 0 : Infinity }}
              onClick={() => handleSelectCard(item)}
              className={`flex flex-col items-center justify-center p-4 sm:p-6 rounded-3xl border-3 sm:border-4 cursor-pointer select-none transition-all shadow-md touch-manipulation min-h-[140px] sm:min-h-[180px] ${
                isSolved
                  ? 'bg-[#E8F5E9] border-[#81C784] ring-4 ring-[#81C784]/30'
                  : 'bg-white hover:bg-[#FFF5F8] border-[#FFB7D5] hover:border-[#FF80AB]'
              }`}
            >
              <span className="text-5xl sm:text-7xl mb-1 sm:mb-2 drop-shadow-sm">{item.emoji}</span>
              <span className="text-xl sm:text-2xl font-black text-[#4A3E3D]">{item.koreanName}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-center gap-3 w-full">
        {selectedCorrectId ? (
          <JellyButton variant="pink" size="lg" onClick={generateRound} className="w-full sm:w-auto">
            다음 문제 풀기 ✨
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
