import { pickNextRound } from '../../utils/roundDeck';
import type { CharacterId } from '../../types';
import { CHARACTERS } from '../../data/characters';
import { ToyArtwork } from '../../components/ToyArtwork';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JellyButton } from '../../components/JellyButton';
import { speakText, playCorrectFanfare, playWrongBoing, playBubblePop, playSparkleChime, playDingDongDang } from '../../utils/soundEngine';
import { fireConfetti } from '../../utils/confetti';
import { getDifficultyConfig, getAgeGroupLabel, pickDistractors } from '../../utils/ageEngine';
import { OBJECT_ITEMS_BY_AGE } from '../../data/gameData';
import { AgeGroup, QuizItem } from '../../types';
import { Volume2, RefreshCw, Sparkles, Flame, Eye } from 'lucide-react';

interface ShadowQuizGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
}

export const ShadowQuizGame: React.FC<ShadowQuizGameProps> = ({
  onCompleteQuiz,
  buddy,
  soundEnabled,
  ageGroup,
  childName,
}) => {
  const friend = CHARACTERS[buddy];
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();

  const diffConfig = getDifficultyConfig(ageGroup);
  const itemPool = (OBJECT_ITEMS_BY_AGE[ageGroup] || OBJECT_ITEMS_BY_AGE.sprout) as QuizItem[];

  const [targetItem, setTargetItem] = useState<QuizItem>(itemPool[0]);
  const [options, setOptions] = useState<QuizItem[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const [shakingCardId, setShakingCardId] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [showComboBanner, setShowComboBanner] = useState(false);

  const generateRound = () => {
    clearGameTimeouts();
    setIsRevealed(false);
    setShakingCardId(null);

    const target = pickNextRound(itemPool, `ShadowQuizGame:${ageGroup}`);
    if (!target) return;
    setTargetItem(target);

    const distractors = pickDistractors<QuizItem>(itemPool, target.id, diffConfig.optionCount - 1);
    const roundOptions = [target, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(roundOptions);

    if (soundEnabled) {
      speakText(`깜깜한 그림자가 나타났어요! 이 그림자의 주인공은 누구일까요?`, soundEnabled, { characterId: buddy });
    }
  };

  useEffect(() => {
    generateRound();
  }, [ageGroup]);

  const handleSelectOption = (item: QuizItem) => {
    if (isRevealed) return;

    if (item.id === targetItem.id) {
      // Correct!
      setIsRevealed(true);
      playSparkleChime(soundEnabled);
      playDingDongDang(soundEnabled);
      fireConfetti();

      const nextStreak = streak + 1;
      setStreak(nextStreak);

      if (nextStreak >= 2) {
        setShowComboBanner(true);
        scheduleGameTimeout(() => setShowComboBanner(false), 1500);
        speakText(`와우! ${nextStreak}연속 정답! 정답은 바로 귀여운 ${targetItem.koreanName}였어요!`, soundEnabled, { characterId: buddy });
      } else {
        speakText(`정답이에요! 그림자의 주인공은 ${targetItem.koreanName}였어요!`, soundEnabled, { characterId: buddy });
      }

      onCompleteQuiz(diffConfig.starsPerCorrect);
    } else {
      // Wrong
      setShakingCardId(item.id);
      setStreak(0);
      playWrongBoing(soundEnabled);
      speakText(`그림자의 모양을 다시 한번 잘 살펴보아요!`, soundEnabled, { characterId: buddy });
      scheduleGameTimeout(() => setShakingCardId(null), 600);
    }
  };

  if (!targetItem) return null;

  return (
    <div className="game-board flex flex-col items-center justify-between w-full max-w-2xl mx-auto">
      {/* Top Banner */}
      <div className="game-prompt w-full bg-gradient-to-r from-[#F3E5F5] to-[#EDE7F6] p-3.5 sm:p-4 rounded-3xl border-3 border-[#BA68C8] shadow-sm flex items-center gap-3 sm:gap-4 relative">
        <CharacterAvatar id={buddy} size="md" mood={isRevealed ? 'happy' : 'talking'} className="!w-16 !h-16 sm:!w-24 sm:!h-24 shrink-0" />
        <div className="flex-1 min-w-0 break-keep">
          <div className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-black text-[#8E24AA] mb-1">
            <span>👥 {getAgeGroupLabel(ageGroup)} &bull; 그림자 실루엣 퀴즈</span>
          </div>
          <h2 className="text-base sm:text-2xl font-black text-[#4A3E3D] leading-snug break-keep">
            이 그림자의 주인공은 누구일까요?
          </h2>
        </div>
        <button
          aria-label="놀이 안내 다시 듣기"
          onClick={() => speakText(`그림자의 윤곽선을 보고 알맞은 친구를 골라보세요!`, soundEnabled, { characterId: buddy })}
          className="p-2.5 sm:p-3 bg-white rounded-full border-2 border-[#BA68C8] shadow-xs text-[#8E24AA] cursor-pointer shrink-0"
        >
          <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Combo Banner */}
        <AnimatePresence>
          {showComboBanner && (
            <motion.div
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1.1, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-3 right-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-3 py-1 rounded-full font-black text-xs sm:text-sm shadow-lg flex items-center gap-1 border-2 border-white"
            >
              <Flame className="w-4 h-4 text-yellow-200 fill-yellow-200 animate-bounce" />
              <span>{streak}연속 정답 콤보!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Shadow Reveal Stage */}
      <div className="my-6 p-6 sm:p-8 w-full bg-gradient-to-b from-slate-900 to-indigo-950 rounded-3xl border-3 border-purple-400 shadow-xl flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
        <div className="absolute top-3 left-4 text-xs font-black text-purple-300 flex items-center gap-1">
          <Eye className="w-4 h-4" /> 실루엣 탐정
        </div>

        <motion.div
          key={targetItem.id}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="flex flex-col items-center justify-center"
        >
          <span
            className={`text-8xl sm:text-9xl transition-all duration-700 select-none ${
              isRevealed
                ? 'filter-none scale-110 drop-shadow-2xl'
                : 'brightness-0 invert opacity-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]'
            }`}
          >
            <ToyArtwork emoji={targetItem.emoji} />
          </span>
          {isRevealed && (
            <motion.span
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-lg sm:text-2xl font-black text-yellow-300 mt-2 bg-purple-900/80 px-4 py-1 rounded-full border border-yellow-300/40"
            >
              {targetItem.koreanName} 🎉
            </motion.span>
          )}
        </motion.div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full mb-4">
        {options.map((item) => {
          const isShaking = shakingCardId === item.id;
          const isTargetAndRevealed = isRevealed && item.id === targetItem.id;

          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={isShaking ? { x: [-8, 8, -6, 6, 0] } : isTargetAndRevealed ? { scale: [1, 1.15, 1] } : {}}
              onClick={() => handleSelectOption(item)}
              className={`game-choice p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-3 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm ${
                isTargetAndRevealed
                  ? 'bg-emerald-50 border-emerald-400 ring-4 ring-emerald-300'
                  : 'bg-white border-purple-200 hover:border-purple-400 hover:bg-purple-50/50'
              }`}
            >
              <span className="text-4xl sm:text-5xl mb-1"><ToyArtwork emoji={item.emoji} /></span>
              <span className="text-xs sm:text-base font-black text-[#4A3E3D]">{item.koreanName}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 w-full">
        {isRevealed ? (
          <JellyButton soundEnabled={soundEnabled} variant="primary" size="lg" onClick={generateRound} className="w-full sm:w-auto">
            <Sparkles className="w-5 h-5 mr-1" /> 다음 그림자 찾기 👥 <span className="next-play-icon" aria-hidden="true">➜</span>
          </JellyButton>
        ) : (
          <JellyButton soundEnabled={soundEnabled} variant="white" size="md" onClick={generateRound} className="!px-4">
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" /> 다른 그림자
          </JellyButton>
        )}
      </div>
    </div>
  );
};
