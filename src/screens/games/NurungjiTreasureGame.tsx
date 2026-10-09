import { GameCue } from '../../components/GameCue';
import { useRoundTimer } from '../../hooks/useRoundTimer';
import { RoundContinuation } from '../../components/RoundContinuation';
import { pickNextRound } from '../../utils/roundDeck';
import type { CharacterId } from '../../types';
import { CHARACTERS } from '../../data/characters';
import { ToyArtwork } from '../../components/ToyArtwork';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

import { JellyButton } from '../../components/JellyButton';
import { speakText, playCorrectFanfare, playWrongBoing } from '../../utils/soundEngine';
import { getDifficultyConfig, pickDistractors } from '../../utils/ageEngine';
import { TREASURE_ITEMS_BY_AGE, TreasureItem } from '../../data/gameData';
import { AgeGroup } from '../../types';
import { RefreshCw, Sparkles, Timer } from 'lucide-react';

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
  const { timeLeft, timeOut, startRoundTimer, stopRoundTimer } = useRoundTimer(diffConfig.timeLimit, () => {
    speakText(`시간 초과! 보물 상자가 닫혔어요! 다른 보물을 찾아보자!`, soundEnabled, { characterId: buddy });
  });

  const generateRound = () => {
    clearGameTimeouts();
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    stopRoundTimer();

    setSelectedCorrectId(null);
    setShakingCardId(null);
    setShowHint(false);

    const target = pickNextRound(itemPool, `NurungjiTreasureGame:${ageGroup}`);
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

    startRoundTimer();
  };

  useEffect(() => {
    generateRound();
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      stopRoundTimer();
    };
  }, [ageGroup]);

  const handleSelectTreasure = (item: TreasureItem) => {
    if (selectedCorrectId || timeOut) return;

    if (item.id === targetItem.id) {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      stopRoundTimer();

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
      <GameCue buddy={buddy} disabled={!soundEnabled} onReplay={() => speakText(`숨겨진 ${targetItem.name} 보물을 찾아서 터치해보아요!`, soundEnabled, { characterId: buddy })} />

      {/* Timer display */}
      {diffConfig.timeLimit > 0 && !selectedCorrectId && (
        <div className="w-full mt-3 px-2">
          <div className="sr-only">
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
        <div className="sr-only" role="status">
          ⏰ 아쉬워라! 시간 제한 초과! 다음 보물찾기로 이동해요!
        </div>
      )}

      <div className="visual-prompt" aria-label="이 그림을 찾아요"><ToyArtwork emoji={targetItem.emoji} label="찾을 그림" /><span aria-hidden="true">→</span><span className="text-3xl">?</span></div>

      {/* Interactive Treasure Room Scene */}
      <div className={`choice-options relative w-full min-h-[240px] sm:min-h-[280px] my-3 sm:my-4 bg-gradient-to-b from-[#FFF8E1] to-[#FFE082]/40 rounded-3xl border-3 sm:border-4 border-dashed border-[#FFA000] p-3 sm:p-6 gap-2 sm:gap-4 ${
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
              <span className="sr-only">{item.name}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 w-full">
        {selectedCorrectId || timeOut ? (
          <RoundContinuation onNext={generateRound} />
        ) : (
          <JellyButton soundEnabled={soundEnabled} variant="white" size="md" onClick={generateRound} className="!px-4">
            <RefreshCw className="w-6 h-6" /><span className="sr-only">다른 문제</span>
          </JellyButton>
        )}
      </div>
    </div>
  );
};
