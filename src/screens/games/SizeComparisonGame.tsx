import { GameCue } from '../../components/GameCue';
import { useRoundTimer } from '../../hooks/useRoundTimer';
import { useIdleScaffolding } from '../../hooks/useIdleScaffolding';
import { ScaffoldingHint } from '../../components/ScaffoldingHint';
import { DragMatch, DragPiece, DropSlot, DragHint } from '../../components/DragMatch';
import { placeMatchingValue } from '../../utils/dropTarget';
import { RoundContinuation } from '../../components/RoundContinuation';
import { pickNextRound, shuffle } from '../../utils/roundDeck';
import type { CharacterId } from '../../types';
import { CHARACTERS } from '../../data/characters';
import { ToyArtwork } from '../../components/ToyArtwork';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

import { JellyButton } from '../../components/JellyButton';
import { speakText, playCorrectFanfare, playWrongBoing, playBubblePop } from '../../utils/soundEngine';
import { getDifficultyConfig } from '../../utils/ageEngine';
import { SIZE_ITEMS_BY_AGE } from '../../data/gameData';
import { AgeGroup, SizeItem } from '../../types';
import { Maximize2, Minimize2, ArrowRight, RefreshCw, Timer } from 'lucide-react';

interface SizeComparisonGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
}

export const SizeComparisonGame: React.FC<SizeComparisonGameProps> = ({
  onCompleteQuiz,
  buddy,
  soundEnabled,
  ageGroup,
  childName,
}) => {
  const friend = CHARACTERS[buddy];
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();

  const diffConfig = getDifficultyConfig(ageGroup);
  const itemPool = SIZE_ITEMS_BY_AGE[ageGroup] || SIZE_ITEMS_BY_AGE.sprout;

  const [targetItems, setTargetItems] = useState<SizeItem[]>([]);
  const [questionType, setQuestionType] = useState<'find_largest' | 'find_smallest' | 'sort_ascending'>('find_largest');
  const [selectedIndices, setSelectedIndices] = useState<(number | null)[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [shakingIdx, setShakingIdx] = useState<number | null>(null);

  // 타이머 상태
  const { timeLeft, timeOut, startRoundTimer, stopRoundTimer } = useRoundTimer(diffConfig.timeLimit, () => {
    speakText(`시간이 완료되었어요. 다른 크기 놀이를 시작할게요!`, soundEnabled, { characterId: buddy });
  });

  const { isIdle: showHint, reset: resetHint } = useIdleScaffolding({
    resetKey: targetItems.map(item => item.id).join(), disabled: isCompleted || timeOut || questionType === 'sort_ascending' || !targetItems.length,
    voice: { text: '여기 반짝이는 친구를 골라봐!', buddy, soundEnabled },
  });

  const generateRound = () => {
    resetHint();
    clearGameTimeouts();
    stopRoundTimer();

    setIsCompleted(false);
    setSelectedIndices([]);
    setShakingIdx(null);

    // 연령 등급에 따라 질문 유형 정의
    let type: 'find_largest' | 'find_smallest' | 'sort_ascending' = 'find_largest';
    if (ageGroup === 'baby') {
      type = Math.random() > 0.5 ? 'find_largest' : 'find_smallest';
    } else if (ageGroup === 'sprout') {
      type = 'find_largest';
    } else {
      type = 'sort_ascending'; // 꽃잎/별님반은 정렬 놀이
    }
    setQuestionType(type);

    // Each round compares the same toy at distinct sizes, keeping one clear answer.
    const themes = itemPool.filter((item, index) => itemPool.findIndex(other => other.emoji === item.emoji) === index);
    const theme = pickNextRound(themes, `sizes:${ageGroup}`);
    const shuffledItems = shuffle(itemPool.filter(item => item.emoji === theme.emoji));
    setTargetItems(shuffledItems);

    let audioMsg = '';
    if (type === 'find_largest') {
      audioMsg = `${friend.name}와 크기 놀이! 어떤 것이 가장 클까요? 큰 친구를 골라주세요!`;
    } else if (type === 'find_smallest') {
      audioMsg = `${friend.name}와 크기 놀이! 어떤 것이 가장 작을까요? 작은 친구를 찾아보세요!`;
    } else {
      audioMsg = `작은 친구는 작은 자리에, 큰 친구는 큰 자리에 옮겨 놓아 주세요!`;
    }

    if (soundEnabled) {
      speakText(audioMsg, soundEnabled, { characterId: buddy });
    }

    startRoundTimer();
  };

  useEffect(() => {
    generateRound();
    return () => {
      stopRoundTimer();
    };
  }, [ageGroup]);

  // 가장 큰 것의 인덱스 조회
  const getLargestIdx = () => {
    let bestVal = -1;
    let bestIdx = 0;
    targetItems.forEach((item, idx) => {
      if (item.displayScale > bestVal) {
        bestVal = item.displayScale;
        bestIdx = idx;
      }
    });
    return bestIdx;
  };

  // 가장 작은 것의 인덱스 조회
  const getSmallestIdx = () => {
    let bestVal = 999;
    let bestIdx = 0;
    targetItems.forEach((item, idx) => {
      if (item.displayScale < bestVal) {
        bestVal = item.displayScale;
        bestIdx = idx;
      }
    });
    return bestIdx;
  };

  // 정답 탭 인터랙션
  const handleSelectCard = (index: number) => {
    if (isCompleted || timeOut) return;

    if (questionType === 'find_largest') {
      const correctIdx = getLargestIdx();
      if (index === correctIdx) {
        setIsCompleted(true);
        playCorrectFanfare(soundEnabled);
        speakText(`정답이에요! 정말 커다란 친구를 잘 찾았어요!`, soundEnabled, { characterId: buddy });
        onCompleteQuiz(diffConfig.starsPerCorrect);
      } else {
        setShakingIdx(index);
        playWrongBoing(soundEnabled);
        speakText(`더 커다란 친구가 있는 것 같아요!`, soundEnabled, { characterId: buddy });
        scheduleGameTimeout(() => setShakingIdx(null), 600);
      }
    } else if (questionType === 'find_smallest') {
      const correctIdx = getSmallestIdx();
      if (index === correctIdx) {
        setIsCompleted(true);
        playCorrectFanfare(soundEnabled);
        speakText(`정답이에요! 정말 작고 귀여운 친구를 찾았어요!`, soundEnabled, { characterId: buddy });
        onCompleteQuiz(diffConfig.starsPerCorrect);
      } else {
        setShakingIdx(index);
        playWrongBoing(soundEnabled);
        speakText(`더 자그마한 친구를 골라보아요!`, soundEnabled, { characterId: buddy });
        scheduleGameTimeout(() => setShakingIdx(null), 600);
      }
    }
  };

  const handleSortDrop = (pieceId: string, slotId: string) => {
    if (isCompleted || timeOut || questionType !== 'sort_ascending') return false;
    const index = Number(pieceId);
    if (!targetItems[index] || selectedIndices.includes(index)) return false;
    const order = targetItems.map((_, i) => i).sort((a, b) => targetItems[a].displayScale - targetItems[b].displayScale);
    const next = placeMatchingValue(order, selectedIndices, index, Number(slotId));
    if (!next) {
      playWrongBoing(soundEnabled);
      speakText('크기를 보고 알맞은 자리에 옮겨 볼까?', soundEnabled, { characterId: buddy });
      return false;
    }
    setSelectedIndices(next);
    playBubblePop(soundEnabled);
    if (next.every(item => item !== null)) {
      stopRoundTimer();
      setIsCompleted(true);
      playCorrectFanfare(soundEnabled);
      speakText('우와! 작은 것부터 차례대로 모두 놓았어요!', soundEnabled, { characterId: buddy });
      onCompleteQuiz(diffConfig.starsPerCorrect);
    }
    return true;
  };

  const isIndexHinted = (idx: number) => {
    if (!showHint || isCompleted) return false;
    if (questionType === 'find_largest') return idx === getLargestIdx();
    if (questionType === 'find_smallest') return idx === getSmallestIdx();
    // sort_ascending인 경우 다음에 클릭해야 할 가장 작은 인덱스 리턴
    let minVal = 999;
    let minIdx = -1;
    targetItems.forEach((item, index) => {
      if (!selectedIndices.includes(index) && item.displayScale < minVal) {
        minVal = item.displayScale;
        minIdx = index;
      }
    });
    return idx === minIdx;
  };

  if (targetItems.length === 0) return null;

  const hintOrder = targetItems.map((_, i) => i).sort((a, b) => targetItems[a].displayScale - targetItems[b].displayScale);
  const hintSlot = hintOrder.findIndex((_, i) => selectedIndices[i] == null);
  return (
    <DragMatch canDrop={(id, slot) => hintOrder[Number(slot)] === Number(id) && selectedIndices[Number(slot)] == null} hint={questionType === 'sort_ascending' && hintSlot >= 0 ? { pieceId: String(hintOrder[hintSlot]), targetId: String(hintSlot) } : undefined} resetKey={targetItems.map(item => item.id).join()} disabled={isCompleted || timeOut} onDrop={handleSortDrop}>
    <div className={`game-board flex flex-col items-center justify-between w-full max-w-2xl mx-auto ${questionType === 'sort_ascending' ? 'size-sort-board' : ''}`}>
      {/* Top Banner */}
      <GameCue buddy={buddy} disabled={!soundEnabled} onReplay={() => {
            const msg = questionType === 'find_largest'
              ? '어떤 것이 가장 큰가요?'
              : questionType === 'find_smallest'
              ? '어떤 것이 가장 작은가요?'
              : '크기에 맞는 자리로 옮겨 놓아 주세요!';
            speakText(msg, soundEnabled, { characterId: buddy });
          }} />

      {/* Timer display */}
      {diffConfig.timeLimit > 0 && !isCompleted && (
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
          ⏰ 시간이 모두 지나갔어요! 다음 크기 놀이를 해보아요!
        </div>
      )}

      <div className="visual-prompt" aria-hidden="true">{questionType === 'find_smallest' ? <Minimize2 size={36} /> : questionType === 'find_largest' ? <Maximize2 size={36} /> : <ArrowRight size={36} />}<ToyArtwork emoji={targetItems[0].emoji} /></div>

      {questionType === 'sort_ascending' && <>
        <div className="size-sort-slots">
          {[...targetItems].sort((a, b) => a.displayScale - b.displayScale).map((item, index) => <DropSlot key={index} id={String(index)} label={`${index + 1}번째 크기`} filled={selectedIndices[index] != null} className="size-sort-slot">
            <span className="size-toy" style={{ width: `${item.displayScale * 58}%` }}><ToyArtwork emoji={item.emoji} /></span>
          </DropSlot>)}
        </div>
        <DragHint>크기에 맞춰 쏙!</DragHint>
      </>}

      {/* Playground items comparison area */}
      <div className="size-playground my-6 p-3 sm:p-8 w-full bg-white rounded-3xl border-3 border-[#FFCCBC] shadow-inner grid grid-cols-3 gap-2 min-h-[220px] relative">
        {targetItems.map((item, idx) => {
          const isShaking = shakingIdx === idx;
          const isSelectedInSort = selectedIndices.includes(idx);
          const isCorrectAnswer = isCompleted && ((questionType === 'find_largest' && idx === getLargestIdx()) || (questionType === 'find_smallest' && idx === getSmallestIdx()));
          const hasHint = isIndexHinted(idx);

          if (questionType === 'sort_ascending') return <DragPiece key={idx} id={String(idx)} label={item.name} disabled={isSelectedInSort}
            className={`matching-tile w-full min-h-[100px] sm:min-h-[160px] ${isSelectedInSort ? 'piece-placed' : ''}`}>
            <span className="size-toy" style={{ width: `${item.displayScale * 58}%` }}><ToyArtwork emoji={item.emoji} /></span>
          </DragPiece>;

          return (
            <motion.button
              key={idx}
              animate={
                isShaking
                  ? { x: [-8, 8, -6, 6, 0] }
                  : isCorrectAnswer || isSelectedInSort
                  ? { scale: [1, 1.03, 1] }
                  : hasHint
                  ? { scale: [1, 1.03, 1] }
                  : { scale: 1 }
              }
              transition={{
                duration: isShaking ? 0.5 : 1.2,
                repeat: hasHint ? Infinity : 0,
              }}
              aria-label={item.name}
              onClick={() => handleSelectCard(idx)}
              className={`game-choice p-3 sm:p-5 rounded-2xl border-3 flex flex-col items-center justify-center cursor-pointer select-none transition-all shadow-xs w-full min-h-[150px] sm:min-h-[190px] ${
                isSelectedInSort || isCorrectAnswer
                  ? 'bg-emerald-50 border-emerald-400 opacity-60'
                  : hasHint
                  ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-300'
                  : 'bg-slate-55 border-amber-100 hover:bg-[#FFF8EE]'
              }`}
            >
              <span className="size-toy" style={{ width: `${item.displayScale * 58}%` }}><ToyArtwork emoji={item.emoji} /></span>
              {/* 순서 표시 */}
              {isSelectedInSort && (
                <span className="absolute top-2 left-2 bg-[#81C784] text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-sm shadow-xs">
                  {selectedIndices.indexOf(idx) + 1}
                </span>
              )}
              {hasHint && <ScaffoldingHint />}
            </motion.button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 w-full">
        {isCompleted || timeOut ? (
          <RoundContinuation onNext={generateRound} />
        ) : (
          <JellyButton soundEnabled={soundEnabled} variant="white" size="md" onClick={generateRound} className="!px-4">
            <RefreshCw className="w-6 h-6" /><span className="sr-only">다른 문제</span>
          </JellyButton>
        )}
      </div>
    </div>
    </DragMatch>
  );
};
