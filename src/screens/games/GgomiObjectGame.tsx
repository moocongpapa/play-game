import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { QuizItem, AgeGroup } from '../../types';
import { OBJECT_ITEMS_BY_AGE } from '../../data/gameData';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JellyButton } from '../../components/JellyButton';
import { speakText, playCorrectFanfare, playWrongBoing } from '../../utils/soundEngine';
import { getDifficultyConfig, getAgeGroupLabel, pickDistractors, pickRandom } from '../../utils/ageEngine';
import { Volume2, RefreshCw, Timer } from 'lucide-react';

interface GgomiObjectGameProps {
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
}

export const GgomiObjectGame: React.FC<GgomiObjectGameProps> = ({
  onCompleteQuiz,
  soundEnabled,
  ageGroup,
  childName,
}) => {
  const diffConfig = getDifficultyConfig(ageGroup);
  const itemPool = OBJECT_ITEMS_BY_AGE[ageGroup] || OBJECT_ITEMS_BY_AGE.sprout;

  const [targetItem, setTargetItem] = useState<QuizItem>(itemPool[0]);
  const [options, setOptions] = useState<QuizItem[]>([]);
  const [shakingCardId, setShakingCardId] = useState<string | null>(null);
  const [selectedCorrectId, setSelectedCorrectId] = useState<string | null>(null);
  
  // 힌트 상태
  const [showHint, setShowHint] = useState(false);
  const hintTimerRef = useRef<number | null>(null);

  // 타이머 상태 (꽃잎반/별님반)
  const [timeLeft, setTimeLeft] = useState<number>(diffConfig.timeLimit);
  const [timeOut, setTimeOut] = useState(false);
  const gameTimerRef = useRef<number | null>(null);

  const generateRound = () => {
    // 기존 타이머 클리어
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);

    setSelectedCorrectId(null);
    setShakingCardId(null);
    setShowHint(false);
    setTimeOut(false);
    setTimeLeft(diffConfig.timeLimit);

    const target = pickRandom<QuizItem>(itemPool, 1)[0];
    setTargetItem(target);

    // 연령별 난이도 설정에 따른 선택지 생성
    const distractors = pickDistractors<QuizItem>(itemPool, target.id, diffConfig.optionCount - 1);
    const roundOptions = [target, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(roundOptions);

    if (soundEnabled) {
      speakText(`꼬미가 ${target.koreanName}를 찾고 있어요! ${target.koreanName}는 어디에 있을까요?`, soundEnabled, { characterId: 'ggomi' });
    }

    // 힌트 타이머 구동
    if (diffConfig.hintEnabled) {
      hintTimerRef.current = window.setTimeout(() => {
        setShowHint(true);
        speakText(`여기 반짝이는 걸 눌러봐!`, soundEnabled, { characterId: 'ggomi', playIntroSFX: false });
      }, diffConfig.hintDelaySec * 1000);
    }

    // 시간제한 타이머 구동
    if (diffConfig.timeLimit > 0) {
      gameTimerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (gameTimerRef.current) clearInterval(gameTimerRef.current);
            setTimeOut(true);
            speakText(`아쉬워요! 시간이 다 되었어요. 다른 문제를 풀어볼까요?`, soundEnabled, { characterId: 'ggomi' });
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

  const handleSelectCard = (item: QuizItem) => {
    if (selectedCorrectId || timeOut) return;

    if (item.id === targetItem.id) {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      
      setSelectedCorrectId(item.id);
      playCorrectFanfare(soundEnabled);
      speakText(`정답이에요! 참 잘했어요! ${item.koreanName}!`, soundEnabled, { characterId: 'ggomi' });
      onCompleteQuiz(diffConfig.starsPerCorrect);
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
      {/* Top Banner */}
      <div className="w-full bg-gradient-to-r from-[#FFB7D5] to-[#FFE4EC] p-3.5 sm:p-4 rounded-3xl border-3 border-[#FF80AB] shadow-sm flex items-center gap-3 sm:gap-4">
        <CharacterAvatar id="ggomi" size="md" mood={selectedCorrectId ? 'dancing' : 'talking'} className="!w-16 !h-16 sm:!w-24 sm:!h-24 shrink-0" />
        <div className="flex-1 min-w-0 break-keep">
          <div className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-black text-[#FF4081] mb-1">
            <span>🐻 {getAgeGroupLabel(ageGroup)} &bull; 사물 인지</span>
          </div>
          <h2 className="text-base sm:text-2xl font-black text-[#4A3E3D] leading-snug">
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

      {/* Timer display for older kids */}
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
          ⏰ 째깍째깍! 시간이 지났어요! 아래 버튼을 눌러 다음 문제로 넘어가요!
        </div>
      )}

      {/* Cards Options Grid */}
      <div className={`grid gap-3 sm:gap-4 w-full my-4 sm:my-6 ${
        options.length === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'
      }`}>
        {options.map((item) => {
          const isShaking = shakingCardId === item.id;
          const isSolved = selectedCorrectId === item.id;
          const isTarget = item.id === targetItem.id;
          const shouldPulse = showHint && isTarget && !selectedCorrectId;

          return (
            <motion.div
              key={item.id}
              animate={
                isShaking
                  ? { x: [-10, 10, -8, 8, -4, 4, 0] }
                  : isSolved
                  ? { scale: [1, 1.12, 1], rotate: [0, 5, -5, 0] }
                  : shouldPulse
                  ? { scale: [1, 1.05, 1], filter: ['brightness(1)', 'brightness(1.15)', 'brightness(1)'] }
                  : { y: [0, -4, 0] }
              }
              transition={{
                duration: isShaking ? 0.5 : shouldPulse ? 1.2 : 2,
                repeat: isShaking ? 0 : Infinity,
              }}
              onClick={() => handleSelectCard(item)}
              className={`flex flex-col items-center justify-center p-4 sm:p-6 rounded-3xl border-3 sm:border-4 cursor-pointer select-none transition-all shadow-md touch-manipulation min-h-[140px] sm:min-h-[180px] ${
                isSolved
                  ? 'bg-[#E8F5E9] border-[#81C784] ring-4 ring-[#81C784]/30'
                  : shouldPulse
                  ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-300/50 animate-pulse'
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
        {selectedCorrectId || timeOut ? (
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
