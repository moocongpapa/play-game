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
import { FOOD_COUNTING_ITEMS } from '../../data/gameData';

import { JellyButton } from '../../components/JellyButton';
import { speakText, playBubblePop, playCorrectFanfare, playWrongBoing } from '../../utils/soundEngine';
import { getDifficultyConfig, getKoreanCounts } from '../../utils/ageEngine';
import { AgeGroup } from '../../types';
import { RefreshCw, Timer } from 'lucide-react';

interface GgulgguliCountingGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
}

export const GgulgguliCountingGame: React.FC<GgulgguliCountingGameProps> = ({
  onCompleteQuiz,
  buddy,
  soundEnabled,
  ageGroup,
  childName,
}) => {
  const friend = CHARACTERS[buddy];
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();

  const diffConfig = getDifficultyConfig(ageGroup);
  const countsKorean = getKoreanCounts(ageGroup);

  const [targetFood, setTargetFood] = useState(FOOD_COUNTING_ITEMS[0]);
  const [targetCount, setTargetCount] = useState<number>(3);
  const [numberOptions, setNumberOptions] = useState<number[]>([]);
  const [tappedIndices, setTappedIndices] = useState<number[]>([]);
  const [selectedCorrectNumber, setSelectedCorrectNumber] = useState<number | null>(null);
  const [shakingNumber, setShakingNumber] = useState<number | null>(null);

  // 힌트 상태
  const [showHint, setShowHint] = useState(false);
  const hintTimerRef = useRef<number | null>(null);

  // 타이머 상태 (꽃잎반/별님반)
  const { timeLeft, timeOut, startRoundTimer, stopRoundTimer } = useRoundTimer(diffConfig.timeLimit, () => {
    speakText(`시간이 끝났어요. 다음 음식을 세어볼까요?`, soundEnabled, { characterId: buddy });
  });

  const generateRound = () => {
    clearGameTimeouts();
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    stopRoundTimer();

    setSelectedCorrectNumber(null);
    setShakingNumber(null);
    setTappedIndices([]);
    setShowHint(false);

    const food = pickNextRound(FOOD_COUNTING_ITEMS, `GgulgguliCountingGame:${ageGroup}`);
    const [minRange, maxRange] = diffConfig.countingRange;
    // 범위 내에서 랜덤 카운트 선정
    const count = Math.floor(Math.random() * (maxRange - minRange + 1)) + minRange;
    
    setTargetFood(food);
    setTargetCount(count);

    // 숫자 대안 카드 생성 (정답 번호 + 오답 대안들 - 무한 루프 100% 방지)
    const allDistractors: number[] = [];
    for (let i = minRange; i <= maxRange; i++) {
      if (i !== count) {
        allDistractors.push(i);
      }
    }
    // 정답 근처의 숫자를 우선 정렬하여 학습 효과 증진
    allDistractors.sort((a, b) => Math.abs(a - count) - Math.abs(b - count) || Math.random() - 0.5);
    const selectedDistractors = allDistractors.slice(0, Math.max(1, diffConfig.optionCount - 1));
    const finalOptions = [count, ...selectedDistractors].sort((a, b) => a - b);

    setNumberOptions(finalOptions);

    if (soundEnabled) {
      speakText(`${friend.name} 접시에 맛있는 ${food.name}가 몇 개 있는지 세어주세요!`, soundEnabled, { characterId: buddy });
    }

    // 힌트 타이머 구동
    if (diffConfig.hintEnabled) {
      hintTimerRef.current = scheduleGameTimeout(() => {
        setShowHint(true);
        speakText(`여기 숫자를 눌러봐!`, soundEnabled, { characterId: buddy, playIntroSFX: false });
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

  const handleTapFoodItem = (index: number) => {
    if (tappedIndices.includes(index) || timeOut || selectedCorrectNumber) return;

    playBubblePop(soundEnabled);
    const currentTappedCount = tappedIndices.length + 1;
    setTappedIndices((prev) => [...prev, index]);

    if (currentTappedCount < countsKorean.length) {
      speakText(countsKorean[currentTappedCount], soundEnabled, { characterId: buddy, playIntroSFX: false });
    }
  };

  const handleSelectNumber = (num: number) => {
    if (selectedCorrectNumber || timeOut) return;

    if (num === targetCount) {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      stopRoundTimer();

      setSelectedCorrectNumber(num);
      playCorrectFanfare(soundEnabled);
      speakText(`우와! 정답이에요! ${targetFood.name} ${num}개! 냠냠 참 맛있다!`, soundEnabled, { characterId: buddy });
      onCompleteQuiz(diffConfig.starsPerCorrect);
    } else {
      setShakingNumber(num);
      playWrongBoing(soundEnabled);
      speakText(`다시 하나, 둘, 셋 세어보아요!`, soundEnabled, { characterId: buddy });
      scheduleGameTimeout(() => setShakingNumber(null), 600);
    }
  };

  return (
    <div className="game-board flex flex-col items-center justify-between w-full max-w-2xl mx-auto">
      {/* Top Banner */}
      <GameCue buddy={buddy} disabled={!soundEnabled} onReplay={() => speakText(`${targetFood.name}가 몇 개 있는지 세어보아요!`, soundEnabled, { characterId: buddy })} />

      {/* Timer display */}
      {diffConfig.timeLimit > 0 && !selectedCorrectNumber && (
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
          ⏰ 아쉽네요! 시간 초과! 다음 먹방 수 세기로 넘어가요!
        </div>
      )}

      {/* Food Plate Container */}
      <div data-play-area className="my-3 sm:my-5 p-4 sm:p-6 w-full bg-white rounded-3xl sm:rounded-[40px] border-3 sm:border-4 border-[#FFCCBC] shadow-inner flex flex-col items-center justify-center">
        <p className="sr-only">
          👇 음식을 손가락으로 누르면 숫자를 세어줘요!
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 min-h-[100px] sm:min-h-[120px] max-w-full">
          {Array.from({ length: targetCount }).map((_, idx) => {
            const isTapped = tappedIndices.includes(idx);

            return (
              <motion.button
                key={idx}
                aria-label={`${targetFood.name} ${idx + 1}번째 세기`}
                onClick={() => handleTapFoodItem(idx)}
                className={`w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center text-2xl sm:text-4xl cursor-pointer select-none shadow-md border-2 sm:border-3 transition-transform ${
                  isTapped ? 'bg-[#FFE0B2] border-[#FB8C00]' : 'bg-[#FFF8EE] border-[#FFCCBC]'
                }`}
              >
                <ToyArtwork emoji={targetFood.emoji} />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Number Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full my-2 sm:my-3">
        {numberOptions.map((num) => {
          const isShaking = shakingNumber === num;
          const isCorrect = selectedCorrectNumber === num;
          const shouldPulse = showHint && num === targetCount && !selectedCorrectNumber;

          return (
            <motion.button
              key={num}
              animate={
                isShaking
                  ? { x: [-8, 8, -6, 6, 0] }
                  : isCorrect
                  ? { scale: 1.15 }
                  : shouldPulse
                  ? { scale: [1, 1.15, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: isShaking ? 0.5 : shouldPulse ? 1.0 : 0.2 }}
              onClick={() => handleSelectNumber(num)}
              className={`count-answer min-w-16 min-h-20 px-3 py-2 rounded-2xl text-xl sm:text-3xl font-black flex flex-col items-center justify-center shadow-md border-b-4 transition-all cursor-pointer ${
                isCorrect
                  ? 'bg-[#81C784] text-white border-[#388E3C]'
                  : shouldPulse
                  ? 'bg-amber-400 text-white border-amber-600 ring-4 ring-amber-300'
                  : 'bg-[#FF9E4A] text-white border-[#E07A26] hover:bg-[#FFA726]'
              }`}
            >
              <span>{num}</span>
              <span className="count-dots" aria-hidden="true">{Array.from({ length: num }, (_, i) => <i key={i} />)}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 w-full mt-2 sm:mt-4">
        {selectedCorrectNumber || timeOut ? (
          <RoundContinuation onNext={generateRound} />
        ) : (
          <JellyButton soundEnabled={soundEnabled} variant="white" size="md" onClick={generateRound} className="!px-4">
            <RefreshCw className="w-6 h-6" aria-hidden="true" /><span className="sr-only">다른 음식</span>
          </JellyButton>
        )}
      </div>
    </div>
  );
};
