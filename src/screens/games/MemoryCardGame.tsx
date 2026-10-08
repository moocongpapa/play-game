import { ToyArtwork } from '../../components/ToyArtwork';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JellyButton } from '../../components/JellyButton';
import { speakText, playCorrectFanfare, playWrongBoing, playBubblePop, playStarGain } from '../../utils/soundEngine';
import { getDifficultyConfig, getAgeGroupLabel } from '../../utils/ageEngine';
import { AgeGroup } from '../../types';
import { Volume2, RefreshCw, Sparkles, Flame } from 'lucide-react';

interface MemoryCardGameProps {
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
}

interface CardItem {
  id: string; // unique card id
  pairId: string; // matching key
  emoji: string;
  name: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const CARD_POOL = [
  { pairId: 'bear', emoji: '🧸', name: '곰인형' },
  { pairId: 'cat', emoji: '🐱', name: '야옹이' },
  { pairId: 'dog', emoji: '🐶', name: '강아지' },
  { pairId: 'car', emoji: '🚗', name: '자동차' },
  { pairId: 'apple', emoji: '🍎', name: '사과' },
  { pairId: 'star', emoji: '⭐', name: '반짝별' },
  { pairId: 'banana', emoji: '🍌', name: '바나나' },
  { pairId: 'dino', emoji: '🦖', name: '공룡' },
];

export const MemoryCardGame: React.FC<MemoryCardGameProps> = ({
  onCompleteQuiz,
  soundEnabled,
  ageGroup,
  childName,
}) => {
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();

  const diffConfig = getDifficultyConfig(ageGroup);
  
  // Pair count based on age: baby: 2 pairs (4 cards), sprout: 3 pairs (6 cards), bloom/star: 4 pairs (8 cards)
  const pairCount = ageGroup === 'baby' ? 2 : ageGroup === 'sprout' ? 3 : 4;

  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showComboBanner, setShowComboBanner] = useState(false);

  const startNewGame = () => {
    clearGameTimeouts();
    setIsCompleted(false);
    setFlippedIndices([]);
    setIsChecking(true); // lock during initial reveal
    setStreak(0);
    setShowComboBanner(false);

    // Pick pairs
    const pickedPairs = [...CARD_POOL].sort(() => Math.random() - 0.5).slice(0, pairCount);
    
    // Create card array with 2 copies of each pair
    const cardArray: CardItem[] = [];
    pickedPairs.forEach((item) => {
      cardArray.push({
        id: `${item.pairId}_1`,
        pairId: item.pairId,
        emoji: item.emoji,
        name: item.name,
        isFlipped: true, // initial peek
        isMatched: false,
      });
      cardArray.push({
        id: `${item.pairId}_2`,
        pairId: item.pairId,
        emoji: item.emoji,
        name: item.name,
        isFlipped: true, // initial peek
        isMatched: false,
      });
    });

    // Shuffle cards
    const shuffled = cardArray.sort(() => Math.random() - 0.5);
    setCards(shuffled);

    if (soundEnabled) {
      speakText(`누룽지와 기억력 카드 놀이! 카드 위치를 잘 기억해두세요!`, soundEnabled, { characterId: 'nurungji' });
    }

    // Hide cards after 2.5 seconds
    scheduleGameTimeout(() => {
      setCards((prev) => prev.map((c) => ({ ...c, isFlipped: false })));
      setIsChecking(false);
      if (soundEnabled) {
        speakText(`얍! 같은 그림 짝을 찾아보세요!`, soundEnabled, { characterId: 'nurungji' });
      }
    }, 2500);
  };

  useEffect(() => {
    startNewGame();
  }, [ageGroup]);

  const handleCardClick = (index: number) => {
    if (isChecking || isCompleted) return;
    const card = cards[index];
    if (card.isFlipped || card.isMatched) return;

    playBubblePop(soundEnabled);

    // Flip this card
    const updatedCards = [...cards];
    updatedCards[index].isFlipped = true;
    setCards(updatedCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsChecking(true);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = updatedCards[firstIdx];
      const secondCard = updatedCards[secondIdx];

      if (firstCard.pairId === secondCard.pairId) {
        // MATCH!
        scheduleGameTimeout(() => {
          firstCard.isMatched = true;
          secondCard.isMatched = true;
          setCards([...updatedCards]);
          setFlippedIndices([]);
          setIsChecking(false);

          playStarGain(soundEnabled);
          const newStreak = streak + 1;
          setStreak(newStreak);

          if (newStreak >= 2) {
            setShowComboBanner(true);
            scheduleGameTimeout(() => setShowComboBanner(false), 1500);
            speakText(`우와! 연속 짝 맞추기 대성공! ${firstCard.name} 짝을 찾았어요!`, soundEnabled, { characterId: 'nurungji' });
          } else {
            speakText(`정답이에요! 똑같은 ${firstCard.name} 친구예요!`, soundEnabled, { characterId: 'nurungji' });
          }

          // Check if all matched
          const allMatched = updatedCards.every((c) => c.isMatched);
          if (allMatched) {
            setIsCompleted(true);
            playCorrectFanfare(soundEnabled);
            speakText(`대단해요 ${childName}야! 모든 카드의 짝을 완벽하게 다 찾았어요! 최고예요!`, soundEnabled, { characterId: 'nurungji' });
            onCompleteQuiz(diffConfig.starsPerCorrect + 1); // bonus star
          }
        }, 500);
      } else {
        // NO MATCH
        scheduleGameTimeout(() => {
          firstCard.isFlipped = false;
          secondCard.isFlipped = false;
          setCards([...updatedCards]);
          setFlippedIndices([]);
          setIsChecking(false);
          setStreak(0); // reset streak
          playWrongBoing(soundEnabled);
          speakText(`카드를 다시 뒤집어둘게요!`, soundEnabled, { characterId: 'nurungji' });
        }, 900);
      }
    }
  };

  if (cards.length === 0) return null;

  return (
    <div className="game-board flex flex-col items-center justify-between w-full max-w-2xl mx-auto">
      {/* Top Banner */}
      <div className="game-prompt w-full bg-gradient-to-r from-[#FFE0B2] to-[#FFF3E0] p-3.5 sm:p-4 rounded-3xl border-3 border-[#FFA726] shadow-sm flex items-center gap-3 sm:gap-4 relative">
        <CharacterAvatar id="nurungji" size="md" mood={isCompleted ? 'happy' : 'talking'} className="!w-16 !h-16 sm:!w-24 sm:!h-24 shrink-0" />
        <div className="flex-1 min-w-0 break-keep">
          <div className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-black text-[#E65100] mb-1">
            <span>🐶 {getAgeGroupLabel(ageGroup)} &bull; 기억력 카드 뒤집기</span>
          </div>
          <h2 className="text-base sm:text-2xl font-black text-[#4A3E3D] leading-snug break-keep">
            똑같은 그림 짝을 찾아주세요! 🎴
          </h2>
        </div>
        <button
          aria-label="놀이 안내 다시 듣기"
          onClick={() => speakText(`똑같은 그림 카드를 두 개 골라 짝을 맞춰보세요!`, soundEnabled, { characterId: 'nurungji' })}
          className="p-2.5 sm:p-3 bg-white rounded-full border-2 border-[#FFA726] shadow-xs text-[#FB8C00] cursor-pointer shrink-0"
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
              className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-rose-500 text-white px-3 py-1 rounded-full font-black text-xs sm:text-sm shadow-lg flex items-center gap-1 border-2 border-white"
            >
              <Flame className="w-4 h-4 text-yellow-200 fill-yellow-200 animate-bounce" />
              <span>{streak}연속 정답! 콤보 보너스!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card Grid Area */}
      <div className="my-6 p-4 sm:p-6 w-full bg-white rounded-3xl border-3 border-amber-200 shadow-inner flex items-center justify-center min-h-[300px]">
        <div className={`grid gap-3 sm:gap-4 w-full max-w-md ${pairCount === 2 ? 'grid-cols-2' : pairCount === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {cards.map((card, idx) => {
            const isOpen = card.isFlipped || card.isMatched;

            return (
              <motion.button
                key={card.id}
                aria-label={isOpen ? card.name : `${idx + 1}번 카드 뒤집기`}
                disabled={isChecking || card.isMatched || card.isFlipped}
                whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCardClick(idx)}
                className={`game-choice aspect-square rounded-2xl sm:rounded-3xl border-3 flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-300 shadow-sm relative ${
                  card.isMatched
                    ? 'bg-emerald-50 border-emerald-400 opacity-60'
                    : isOpen
                    ? 'bg-amber-50 border-amber-400'
                    : 'bg-gradient-to-br from-amber-400 to-amber-500 border-amber-600 hover:brightness-105'
                }`}
              >
                {isOpen ? (
                  <motion.div
                    initial={{ rotateY: 90 }}
                    animate={{ rotateY: 0 }}
                    className="flex flex-col items-center justify-center text-center"
                  >
                    <span className="text-4xl sm:text-5xl mb-0.5"><ToyArtwork emoji={card.emoji} /></span>
                    <span className="text-[10px] sm:text-xs font-black text-[#4A3E3D]">{card.name}</span>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ rotateY: 90 }}
                    animate={{ rotateY: 0 }}
                    className="flex flex-col items-center justify-center"
                  >
                    <span className="text-3xl sm:text-4xl text-white drop-shadow-sm">❓</span>
                  </motion.div>
                )}

                {card.isMatched && (
                  <span className="absolute top-1 right-1 text-emerald-500 text-xs sm:text-sm font-black">✓</span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 w-full">
        {isCompleted ? (
          <JellyButton soundEnabled={soundEnabled} variant="primary" size="lg" onClick={startNewGame} className="w-full sm:w-auto">
            <Sparkles className="w-5 h-5 mr-1" /> 다음 카드 놀이하기 🐶 <span className="next-play-icon" aria-hidden="true">➜</span>
          </JellyButton>
        ) : (
          <JellyButton soundEnabled={soundEnabled} variant="white" size="md" onClick={startNewGame} className="!px-4">
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" /> 카드 다시 섞기
          </JellyButton>
        )}
      </div>
    </div>
  );
};
