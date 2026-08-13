import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JellyButton } from '../../components/JellyButton';
import { speakText, playCorrectFanfare, playWrongBoing, playBubblePop } from '../../utils/soundEngine';
import { getDifficultyConfig, getAgeGroupLabel, pickRandom } from '../../utils/ageEngine';
import { SIZE_ITEMS_BY_AGE } from '../../data/gameData';
import { AgeGroup, SizeItem } from '../../types';
import { Volume2, RefreshCw, Timer } from 'lucide-react';

interface SizeComparisonGameProps {
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
}

export const SizeComparisonGame: React.FC<SizeComparisonGameProps> = ({
  onCompleteQuiz,
  soundEnabled,
  ageGroup,
  childName,
}) => {
  const diffConfig = getDifficultyConfig(ageGroup);
  const itemPool = SIZE_ITEMS_BY_AGE[ageGroup] || SIZE_ITEMS_BY_AGE.sprout;

  const [targetItems, setTargetItems] = useState<SizeItem[]>([]);
  const [questionType, setQuestionType] = useState<'find_largest' | 'find_smallest' | 'sort_ascending'>('find_largest');
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [shakingIdx, setShakingIdx] = useState<number | null>(null);

  // 힌트 상태
  const [showHint, setShowHint] = useState(false);
  const hintTimerRef = useRef<number | null>(null);

  // 타이머 상태
  const [timeLeft, setTimeLeft] = useState<number>(diffConfig.timeLimit);
  const [timeOut, setTimeOut] = useState(false);
  const gameTimerRef = useRef<number | null>(null);

  const generateRound = () => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);

    setIsCompleted(false);
    setSelectedIndices([]);
    setShakingIdx(null);
    setShowHint(false);
    setTimeOut(false);
    setTimeLeft(diffConfig.timeLimit);

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

    // 아이템 풀 믹스배치
    const shuffledItems = [...itemPool].sort(() => Math.random() - 0.5);
    setTargetItems(shuffledItems);

    let audioMsg = '';
    if (type === 'find_largest') {
      audioMsg = `꿀꿀이와 크기 놀이! 어떤 것이 가장 클까요? 큰 친구를 골라주세요!`;
    } else if (type === 'find_smallest') {
      audioMsg = `꿀꿀이와 크기 놀이! 어떤 것이 가장 작을까요? 작은 친구를 찾아보세요!`;
    } else {
      audioMsg = `작은 것부터 순서대로 하나씩 톡톡 터치해서 차례대로 나열해볼까요?`;
    }

    if (soundEnabled) {
      speakText(audioMsg, soundEnabled, { characterId: 'ggulgguli' });
    }

    // 힌트 타이머 구동
    if (diffConfig.hintEnabled) {
      hintTimerRef.current = window.setTimeout(() => {
        setShowHint(true);
        speakText(`여기 반짝이는 친구를 골라봐!`, soundEnabled, { characterId: 'ggulgguli', playIntroSFX: false });
      }, diffConfig.hintDelaySec * 1000);
    }

    // 시간제한 타이머 구동
    if (diffConfig.timeLimit > 0) {
      gameTimerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (gameTimerRef.current) clearInterval(gameTimerRef.current);
            setTimeOut(true);
            speakText(`시간이 완료되었어요. 다른 크기 놀이를 시작할게요!`, soundEnabled, { characterId: 'ggulgguli' });
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
        speakText(`정답이에요! 정말 커다란 친구를 잘 찾았어요!`, soundEnabled, { characterId: 'ggulgguli' });
        onCompleteQuiz(diffConfig.starsPerCorrect);
      } else {
        setShakingIdx(index);
        playWrongBoing(soundEnabled);
        speakText(`더 커다란 친구가 있는 것 같아요!`, soundEnabled, { characterId: 'ggulgguli' });
        setTimeout(() => setShakingIdx(null), 600);
      }
    } else if (questionType === 'find_smallest') {
      const correctIdx = getSmallestIdx();
      if (index === correctIdx) {
        setIsCompleted(true);
        playCorrectFanfare(soundEnabled);
        speakText(`정답이에요! 정말 작고 귀여운 친구를 찾았어요!`, soundEnabled, { characterId: 'ggulgguli' });
        onCompleteQuiz(diffConfig.starsPerCorrect);
      } else {
        setShakingIdx(index);
        playWrongBoing(soundEnabled);
        speakText(`더 자그마한 친구를 골라보아요!`, soundEnabled, { characterId: 'ggulgguli' });
        setTimeout(() => setShakingIdx(null), 600);
      }
    } else {
      // sort_ascending (작은 것부터 순서대로 탭하는 모드)
      // 선택하지 않은 것들 중 가장 작은 값이 탭한 인덱스와 맞는지 체크
      const remainingItems = targetItems.filter((_, idx) => !selectedIndices.includes(idx));
      let minVal = 999;
      let minIdx = -1;
      targetItems.forEach((item, idx) => {
        if (!selectedIndices.includes(idx) && item.displayScale < minVal) {
          minVal = item.displayScale;
          minIdx = idx;
        }
      });

      if (index === minIdx) {
        playBubblePop(soundEnabled);
        const newSelected = [...selectedIndices, index];
        setSelectedIndices(newSelected);

        // 모두 정렬되었는지 체크
        if (newSelected.length === targetItems.length) {
          setIsCompleted(true);
          playCorrectFanfare(soundEnabled);
          speakText(`우와! 작은 것부터 차례대로 완벽하게 정렬했어요! 최고예요!`, soundEnabled, { characterId: 'ggulgguli' });
          onCompleteQuiz(diffConfig.starsPerCorrect);
        }
      } else {
        setShakingIdx(index);
        playWrongBoing(soundEnabled);
        speakText(`더 작은 친구를 먼저 골라보아요!`, soundEnabled, { characterId: 'ggulgguli' });
        setTimeout(() => setShakingIdx(null), 600);
      }
    }
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

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-2xl mx-auto p-2.5 sm:p-4 min-h-[80vh] overflow-hidden">
      {/* Top Banner */}
      <div className="w-full bg-gradient-to-r from-[#FFCCBC] to-[#FBE9E7] p-3.5 sm:p-4 rounded-3xl border-3 border-[#FF7043] shadow-sm flex items-center gap-3 sm:gap-4">
        <CharacterAvatar id="ggulgguli" size="md" mood={isCompleted ? 'happy' : 'talking'} className="!w-16 !h-16 sm:!w-24 sm:!h-24 shrink-0" />
        <div className="flex-1 min-w-0 break-keep">
          <div className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-black text-[#F4511E] mb-1">
            <span>🐷 {getAgeGroupLabel(ageGroup)} &bull; 크기 비교</span>
          </div>
          <h2 className="text-base sm:text-2xl font-black text-[#4A3E3D] leading-snug break-keep">
            {questionType === 'find_largest' && '어떤 것이 가장 클까요?'}
            {questionType === 'find_smallest' && '어떤 것이 가장 작을까요?'}
            {questionType === 'sort_ascending' && '작은 것부터 순서대로 눌러주세요!'}
          </h2>
        </div>
        <button
          onClick={() => {
            const msg = questionType === 'find_largest'
              ? '어떤 것이 가장 큰가요?'
              : questionType === 'find_smallest'
              ? '어떤 것이 가장 작은가요?'
              : '작은 것부터 순서대로 눌러보아요!';
            speakText(msg, soundEnabled, { characterId: 'ggulgguli' });
          }}
          className="p-2.5 sm:p-3 bg-white rounded-full border-2 border-[#FF7043] shadow-xs text-[#F4511E] cursor-pointer shrink-0"
        >
          <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Timer display */}
      {diffConfig.timeLimit > 0 && !isCompleted && (
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
          ⏰ 시간이 모두 지나갔어요! 다음 크기 놀이를 해보아요!
        </div>
      )}

      {/* Playground items comparison area */}
      <div className="my-6 p-4 sm:p-8 w-full bg-white rounded-3xl border-3 border-[#FFCCBC] shadow-inner flex items-center justify-around gap-2 min-h-[220px] relative overflow-hidden flex-wrap">
        {targetItems.map((item, idx) => {
          const isShaking = shakingIdx === idx;
          const isSelectedInSort = selectedIndices.includes(idx);
          const isCorrectAnswer = isCompleted && ((questionType === 'find_largest' && idx === getLargestIdx()) || (questionType === 'find_smallest' && idx === getSmallestIdx()));
          const hasHint = isIndexHinted(idx);

          return (
            <motion.div
              key={idx}
              animate={
                isShaking
                  ? { x: [-8, 8, -6, 6, 0] }
                  : isCorrectAnswer || isSelectedInSort
                  ? { scale: [item.displayScale, item.displayScale * 1.1, item.displayScale] }
                  : hasHint
                  ? { scale: [item.displayScale, item.displayScale * 1.08, item.displayScale] }
                  : { scale: item.displayScale }
              }
              transition={{
                duration: isShaking ? 0.5 : 1.2,
                repeat: hasHint ? Infinity : 0,
              }}
              onClick={() => handleSelectCard(idx)}
              className={`p-3 sm:p-5 rounded-2xl border-3 flex flex-col items-center justify-center cursor-pointer select-none transition-all shadow-xs w-28 sm:w-36 min-h-[120px] sm:min-h-[150px] ${
                isSelectedInSort || isCorrectAnswer
                  ? 'bg-emerald-50 border-emerald-400 opacity-60'
                  : hasHint
                  ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-300'
                  : 'bg-slate-55 border-amber-100 hover:bg-[#FFF8EE]'
              }`}
            >
              <span className="text-5xl sm:text-7xl mb-1 drop-shadow-xs">{item.emoji}</span>
              {/* 순서 표시 */}
              {isSelectedInSort && (
                <span className="absolute top-2 left-2 bg-[#81C784] text-white w-6 h-6 rounded-full flex items-center justify-center font-black text-sm shadow-xs">
                  {selectedIndices.indexOf(idx) + 1}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 w-full">
        {isCompleted || timeOut ? (
          <JellyButton variant="primary" size="lg" onClick={generateRound} className="w-full sm:w-auto">
            다음 크기 놀이 🐷
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
