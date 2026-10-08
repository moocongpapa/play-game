import type { CharacterId } from '../../types';
import { CHARACTERS } from '../../data/characters';
import { ToyArtwork } from '../../components/ToyArtwork';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JellyButton } from '../../components/JellyButton';
import { speakText, playCorrectFanfare, playWrongBoing } from '../../utils/soundEngine';
import { getDifficultyConfig, getAgeGroupLabel, pickDistractors, pickRandom } from '../../utils/ageEngine';
import { TREASURE_ITEMS_BY_AGE, TreasureItem } from '../../data/gameData';
import { AgeGroup } from '../../types';
import { Volume2, RefreshCw, Sparkles, Timer } from 'lucide-react';

interface NurungjiTreasureGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
}

export const NurungjiTreasureGame: React.FC<NurungjiTreasureGameProps> = ({
  onCompleteQuiz,
  buddy,
  soundEnabled,
  ageGroup,
  childName,
}) => {
  const friend = CHARACTERS[buddy];
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();

  const diffConfig = getDifficultyConfig(ageGroup);
  const itemPool = TREASURE_ITEMS_BY_AGE[ageGroup] || TREASURE_ITEMS_BY_AGE.sprout;

  const [targetItem, setTargetItem] = useState<TreasureItem>(itemPool[0]);
  const [displayedItems, setDisplayedItems] = useState<TreasureItem[]>([]);
  const [selectedCorrectId, setSelectedCorrectId] = useState<string | null>(null);
  const [shakingCardId, setShakingCardId] = useState<string | null>(null);

  // 힌트 상태
  const [showHint, setShowHint] = useState(false);
  const hintTimerRef = useRef<number | null>(null);

  // 타이머 상태 (꽃잎반/별님반)
  const [timeLeft, setTimeLeft] = useState<number>(diffConfig.timeLimit);
  const [timeOut, setTimeOut] = useState(false);
  const gameTimerRef = useRef<number | null>(null);

  const generateRound = () => {
    clearGameTimeouts();
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);

    setSelectedCorrectId(null);
    setShakingCardId(null);
    setShowHint(false);
    setTimeOut(false);
    setTimeLeft(diffConfig.timeLimit);

    const target = pickRandom<TreasureItem>(itemPool, 1)[0] || itemPool[0];
    if (!target) return;
    setTargetItem(target);

    const distractors = pickDistractors<TreasureItem>(itemPool, target.id, diffConfig.optionCount - 1);
    const roundItems = [target, ...distractors].sort(() => Math.random() - 0.5);
    setDisplayedItems(roundItems);

    if (soundEnabled) {
      speakText(`${friend.name}와 함께 숨겨진 보물 ${target.name}을 찾아볼까요?`, soundEnabled, { characterId: buddy });
    }

    // 힌트 타이머 구동
    if (diffConfig.hintEnabled) {
      hintTimerRef.current = scheduleGameTimeout(() => {
        setShowHint(true);
        speakText(`여기 흔들리는 보물상자를 열어봐!`, soundEnabled, { characterId: buddy, playIntroSFX: false });
      }, diffConfig.hintDelaySec * 1000);
    }

    // 시간제한 타이머 구동
    if (diffConfig.timeLimit > 0) {
      gameTimerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (gameTimerRef.current) clearInterval(gameTimerRef.current);
            setTimeOut(true);
            speakText(`시간 초과! 보물 상자가 닫혔어요! 다른 보물을 찾아보자!`, soundEnabled, { characterId: buddy });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  useEffect(() => {
    generateRound();
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [ageGroup]);

  const handleSelectTreasure = (item: TreasureItem) => {
    if (selectedCorrectId || timeOut) return;

    if (item.id === targetItem.id) {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);

      setSelectedCorrectId(item.id);
      playCorrectFanfare(soundEnabled);
      speakText(`우와! 보물을 찾았어요! ${item.name}!`, soundEnabled, { characterId: buddy });
      onCompleteQuiz(diffConfig.starsPerCorrect);
    } else {
      setShakingCardId(item.id);
      playWrongBoing(soundEnabled);
      speakText(`다른 보물상자를 열어볼까요?`, soundEnabled, { characterId: buddy });
      scheduleGameTimeout(() => setShakingCardId(null), 600);
    }
  };

  if (!targetItem) return null;

  return (
    <div className="game-board flex flex-col items-center justify-between w-full max-w-2xl mx-auto">
      {/* Top Banner */}
      <div className="game-prompt w-full bg-gradient-to-r from-[#FFECB3] to-[#FFF8E1] p-3.5 sm:p-4 rounded-3xl border-3 border-[#FFA000] shadow-sm flex items-center gap-3 sm:gap-4">
        <CharacterAvatar id={buddy} size="md" mood={selectedCorrectId ? 'excited' : 'waving'} className="!w-16 !h-16 sm:!w-24 sm:!h-24 shrink-0" />
        <div className="flex-1 min-w-0 break-keep">
          <div className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-black text-[#FF8F00] mb-1">
            <span>{friend.badge} {getAgeGroupLabel(ageGroup)} &bull; 보물 찾기</span>
          </div>
          <h2 className="text-base sm:text-2xl font-black text-[#4A3E3D] leading-snug break-keep">
            숨어있는 &ldquo;<span className="text-[#FF8F00] underline">{targetItem.name}</span>&rdquo;을 찾아주세요!
          </h2>
        </div>
        <button
          aria-label="놀이 안내 다시 듣기"
          onClick={() => speakText(`숨겨진 ${targetItem.name} 보물을 찾아서 터치해보아요!`, soundEnabled, { characterId: buddy })}
          className="p-2.5 sm:p-3 bg-white rounded-full border-2 border-[#FFA000] shadow-xs text-[#FF8F00] cursor-pointer shrink-0"
        >
          <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Timer display */}
      {diffConfig.timeLimit > 0 && !selectedCorrectId && (
        <div className="w-full mt-3 px-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-rose-500 mb-1">
            <Timer className="w-4 h-4 animate-pulse" />
            <span>시간제한: {timeLeft}초</span>
          </div>
          <div className="w-full bg-rose-100 h-3 rounded-full overflow-hidden border border-rose-200">
            <div
              className="bg-rose-500 h-full transition-all duration-1000"
              style={{ width: `${(timeLeft / diffConfig.timeLimit) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Time out warning */}
      {timeOut && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl w-full text-center font-black text-rose-600 animate-pulse my-4">
          ⏰ 아쉬워라! 시간 제한 초과! 다음 보물찾기로 이동해요!
        </div>
      )}

      <div className="visual-prompt" aria-label="이 그림을 찾아요"><ToyArtwork emoji={targetItem.emoji} label="찾을 그림" /><span aria-hidden="true">→</span><span className="text-3xl">?</span></div>

      {/* Interactive Treasure Room Scene */}
      <div className={`relative w-full min-h-[240px] sm:min-h-[280px] my-3 sm:my-4 bg-gradient-to-b from-[#FFF8E1] to-[#FFE082]/40 rounded-3xl border-3 sm:border-4 border-dashed border-[#FFA000] p-3 sm:p-6 gap-2 sm:gap-4 ${
        displayedItems.length === 2 ? 'grid grid-cols-2 place-items-center' : 'grid grid-cols-3 place-items-center sm:flex sm:items-center sm:justify-around'
      }`}>
        {displayedItems.map((item) => {
          const isShaking = shakingCardId === item.id;
          const isSolved = selectedCorrectId === item.id;
          const isTarget = item.id === targetItem.id;
          const shouldPulse = showHint && isTarget && !selectedCorrectId;

          return (
            <motion.button
              key={item.id}
              animate={
                isShaking
                  ? { x: [-10, 10, -8, 8, 0] }
                  : isSolved
                  ? { scale: 1.1 }
                  : shouldPulse
                  ? { scale: [1, 1.1, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: isShaking ? 0.5 : shouldPulse ? 1.0 : 0.5 }}
              onClick={() => handleSelectTreasure(item)}
              className={`game-choice flex flex-col items-center justify-center p-3 sm:p-6 rounded-2xl sm:rounded-3xl border-3 sm:border-4 cursor-pointer select-none transition-all shadow-md touch-manipulation min-h-[120px] sm:min-h-[160px] min-w-[100px] sm:min-w-[140px] ${
                isSolved
                  ? 'bg-[#E8F5E9] border-[#81C784]'
                  : shouldPulse
                  ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-300'
                  : 'bg-white hover:bg-[#FFF8E1] border-[#FFE082]'
              }`}
            >
              {isSolved && <Sparkles className="w-5 h-5 sm:w-8 sm:h-8 text-[#FFA000] animate-bounce mb-1" />}
              <span className="text-4xl sm:text-6xl mb-1 sm:mb-2"><ToyArtwork emoji={item.emoji} /></span>
              <span className="text-xs sm:text-xl font-black text-[#4A3E3D] text-center">{item.name}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 w-full">
        {selectedCorrectId || timeOut ? (
          <JellyButton soundEnabled={soundEnabled} variant="yellow" size="lg" onClick={generateRound} className="w-full sm:w-auto">
            다음 보물 찾기 {friend.badge} <span className="next-play-icon" aria-hidden="true">➜</span>
          </JellyButton>
        ) : (
          <JellyButton soundEnabled={soundEnabled} variant="white" size="md" onClick={generateRound} className="!px-4">
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" /> 다른 문제
          </JellyButton>
        )}
      </div>
    </div>
  );
};
