import { ToyArtwork } from '../../components/ToyArtwork';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { FOOD_COUNTING_ITEMS } from '../../data/gameData';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JellyButton } from '../../components/JellyButton';
import { speakText, playBubblePop, playCorrectFanfare, playWrongBoing } from '../../utils/soundEngine';
import { getDifficultyConfig, getAgeGroupLabel, getKoreanCounts, pickRandom } from '../../utils/ageEngine';
import { AgeGroup } from '../../types';
import { Volume2, RefreshCw, Timer } from 'lucide-react';

interface GgulgguliCountingGameProps {
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
}

export const GgulgguliCountingGame: React.FC<GgulgguliCountingGameProps> = ({
  onCompleteQuiz,
  soundEnabled,
  ageGroup,
  childName,
}) => {
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
  const [timeLeft, setTimeLeft] = useState<number>(diffConfig.timeLimit);
  const [timeOut, setTimeOut] = useState(false);
  const gameTimerRef = useRef<number | null>(null);

  const generateRound = () => {
    clearGameTimeouts();
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);

    setSelectedCorrectNumber(null);
    setShakingNumber(null);
    setTappedIndices([]);
    setShowHint(false);
    setTimeOut(false);
    setTimeLeft(diffConfig.timeLimit);

    const food = pickRandom(FOOD_COUNTING_ITEMS, 1)[0];
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
      speakText(`꿀꿀이 접시에 맛있는 ${food.name}가 몇 개 있는지 세어주세요!`, soundEnabled, { characterId: 'ggulgguli' });
    }

    // 힌트 타이머 구동
    if (diffConfig.hintEnabled) {
      hintTimerRef.current = scheduleGameTimeout(() => {
        setShowHint(true);
        speakText(`여기 숫자를 눌러봐!`, soundEnabled, { characterId: 'ggulgguli', playIntroSFX: false });
      }, diffConfig.hintDelaySec * 1000);
    }

    // 시간제한 타이머 구동
    if (diffConfig.timeLimit > 0) {
      gameTimerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (gameTimerRef.current) clearInterval(gameTimerRef.current);
            setTimeOut(true);
            speakText(`시간이 끝났어요. 다음 음식을 세어볼까요?`, soundEnabled, { characterId: 'ggulgguli' });
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

  const handleTapFoodItem = (index: number) => {
    if (tappedIndices.includes(index) || timeOut || selectedCorrectNumber) return;

    playBubblePop(soundEnabled);
    const currentTappedCount = tappedIndices.length + 1;
    setTappedIndices((prev) => [...prev, index]);

    if (currentTappedCount < countsKorean.length) {
      speakText(countsKorean[currentTappedCount], soundEnabled, { characterId: 'ggulgguli', playIntroSFX: false });
    }
  };

  const handleSelectNumber = (num: number) => {
    if (selectedCorrectNumber || timeOut) return;

    if (num === targetCount) {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);

      setSelectedCorrectNumber(num);
      playCorrectFanfare(soundEnabled);
      speakText(`꿀꿀! 정답이에요! ${targetFood.name} ${num}개! 냠냠 참 맛있다!`, soundEnabled, { characterId: 'ggulgguli' });
      onCompleteQuiz(diffConfig.starsPerCorrect);
    } else {
      setShakingNumber(num);
      playWrongBoing(soundEnabled);
      speakText(`다시 하나, 둘, 셋 세어보아요!`, soundEnabled, { characterId: 'ggulgguli' });
      scheduleGameTimeout(() => setShakingNumber(null), 600);
    }
  };

  return (
    <div className="game-board flex flex-col items-center justify-between w-full max-w-2xl mx-auto">
      {/* Top Banner */}
      <div className="game-prompt w-full bg-gradient-to-r from-[#FFCCBC] to-[#FBE9E7] p-3.5 sm:p-4 rounded-3xl border-3 border-[#FF7043] shadow-sm flex items-center gap-3 sm:gap-4">
        <CharacterAvatar id="ggulgguli" size="md" mood={selectedCorrectNumber ? 'happy' : 'talking'} className="!w-16 !h-16 sm:!w-24 sm:!h-24 shrink-0" />
        <div className="flex-1 min-w-0 break-keep">
          <div className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-black text-[#F4511E] mb-1">
            <span>🐷 {getAgeGroupLabel(ageGroup)} &bull; 맛있는 수 세기</span>
          </div>
          <h2 className="text-base sm:text-2xl font-black text-[#4A3E3D] leading-snug break-keep">
            접시 위의 <span className="text-[#F4511E] underline">{targetFood.name}</span>는 몇 개일까요?
          </h2>
        </div>
        <button
          aria-label="놀이 안내 다시 듣기"
          onClick={() => speakText(`${targetFood.name}가 몇 개 있는지 세어보아요!`, soundEnabled, { characterId: 'ggulgguli' })}
          className="p-2.5 sm:p-3 bg-white rounded-full border-2 border-[#FF7043] shadow-xs text-[#F4511E] cursor-pointer shrink-0"
        >
          <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Timer display */}
      {diffConfig.timeLimit > 0 && !selectedCorrectNumber && (
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
          ⏰ 아쉽네요! 시간 초과! 다음 먹방 수 세기로 넘어가요!
        </div>
      )}

      {/* Food Plate Container */}
      <div className="my-3 sm:my-5 p-4 sm:p-6 w-full bg-white rounded-3xl sm:rounded-[40px] border-3 sm:border-4 border-[#FFCCBC] shadow-inner flex flex-col items-center justify-center">
        <p className="text-xs sm:text-sm font-bold text-[#8C7B79] mb-2 sm:mb-3 break-keep text-center">
          👇 음식을 손가락으로 누르면 숫자를 세어줘요!
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 min-h-[100px] sm:min-h-[120px] max-w-full">
          {Array.from({ length: targetCount }).map((_, idx) => {
            const isTapped = tappedIndices.includes(idx);

            return (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.85 }}
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
          <JellyButton soundEnabled={soundEnabled} variant="primary" size="lg" onClick={generateRound} className="w-full sm:w-auto">
            다음 수 세기 🐷 <span className="next-play-icon" aria-hidden="true">➜</span>
          </JellyButton>
        ) : (
          <JellyButton soundEnabled={soundEnabled} variant="white" size="md" onClick={generateRound} className="!px-4">
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" /> 다른 음식
          </JellyButton>
        )}
      </div>
    </div>
  );
};
