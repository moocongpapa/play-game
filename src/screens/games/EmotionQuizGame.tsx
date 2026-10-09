import { useRoundTimer } from '../../hooks/useRoundTimer';
import { RoundContinuation } from '../../components/RoundContinuation';
import { EMOTION_SCENES } from '../../data/playThemes';
import { pickNextRound } from '../../utils/roundDeck';
import type { CharacterId } from '../../types';
import { CHARACTERS } from '../../data/characters';
import { ToyArtwork } from '../../components/ToyArtwork';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JellyButton } from '../../components/JellyButton';
import { speakText, playCorrectFanfare, playWrongBoing } from '../../utils/soundEngine';
import { getDifficultyConfig, getAgeGroupLabel, pickDistractors } from '../../utils/ageEngine';
import { EMOTION_ITEMS_BY_AGE } from '../../data/gameData';
import { AgeGroup, EmotionItem } from '../../types';
import { Volume2, RefreshCw, Timer } from 'lucide-react';

interface EmotionQuizGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
}

export const EmotionQuizGame: React.FC<EmotionQuizGameProps> = ({
  onCompleteQuiz,
  buddy,
  soundEnabled,
  ageGroup,
  childName,
}) => {
  const friend = CHARACTERS[buddy];
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();

  const diffConfig = getDifficultyConfig(ageGroup);
  const itemPool = EMOTION_ITEMS_BY_AGE[ageGroup] || EMOTION_ITEMS_BY_AGE.sprout;

  const [scene, setScene] = useState(EMOTION_SCENES.happy[0]);
  const [targetItem, setTargetItem] = useState<EmotionItem>(itemPool[0]);
  const [options, setOptions] = useState<EmotionItem[]>([]);
  const [selectedCorrectId, setSelectedCorrectId] = useState<string | null>(null);
  const [shakingCardId, setShakingCardId] = useState<string | null>(null);

  // 힌트 상태
  const [showHint, setShowHint] = useState(false);
  const hintTimerRef = useRef<number | null>(null);

  // 타이머 상태 (꽃잎반/별님반)
  const { timeLeft, timeOut, startRoundTimer, stopRoundTimer } = useRoundTimer(diffConfig.timeLimit, () => {
    speakText(`시간 초과! 다른 표정을 알아볼까요?`, soundEnabled, { characterId: buddy });
  });

  const generateRound = () => {
    clearGameTimeouts();
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    stopRoundTimer();

    setSelectedCorrectId(null);
    setShakingCardId(null);
    setShowHint(false);

    const target = pickNextRound(itemPool, `EmotionQuizGame:${ageGroup}`);
    if (!target) return;
    setTargetItem(target);
    const nextScene = pickNextRound(EMOTION_SCENES[target.id], `emotions:${target.id}`);
    setScene(nextScene);

    const distractors = pickDistractors<EmotionItem>(itemPool, target.id, diffConfig.optionCount - 1);
    const roundOptions = [target, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(roundOptions);

    if (soundEnabled) {
      speakText(`${nextScene.text} '${target.name}' 표정을 찾아볼까요?`, soundEnabled, { characterId: buddy });
    }

    // 힌트 타이머 구동
    if (diffConfig.hintEnabled) {
      hintTimerRef.current = scheduleGameTimeout(() => {
        setShowHint(true);
        speakText(`여기 반짝이는 걸 눌러봐!`, soundEnabled, { characterId: buddy, playIntroSFX: false });
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

  const handleSelectCard = (item: EmotionItem) => {
    if (selectedCorrectId || timeOut) return;

    if (item.id === targetItem.id) {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      stopRoundTimer();

      setSelectedCorrectId(item.id);
      playCorrectFanfare(soundEnabled);
      speakText(`딩동댕! 정답이에요! ${item.name}은 ${item.expression}이에요!`, soundEnabled, { characterId: buddy });
      onCompleteQuiz(diffConfig.starsPerCorrect);
    } else {
      setShakingCardId(item.id);
      playWrongBoing(soundEnabled);
      speakText(`다시 표정을 관찰해 볼까요?`, soundEnabled, { characterId: buddy });
      scheduleGameTimeout(() => setShakingCardId(null), 600);
    }
  };

  if (!targetItem) return null;

  return (
    <div className="game-board flex flex-col items-center justify-between w-full max-w-2xl mx-auto">
      {/* Top Banner */}
      <div className="game-prompt w-full bg-gradient-to-r from-[#FFB7D5] to-[#FFE4EC] p-3.5 sm:p-4 rounded-3xl border-3 border-[#FF80AB] shadow-sm flex items-center gap-3 sm:gap-4">
        <CharacterAvatar id={buddy} size="md" mood={selectedCorrectId ? 'dancing' : 'talking'} className="!w-16 !h-16 sm:!w-24 sm:!h-24 shrink-0" />
        <div className="flex-1 min-w-0 break-keep">
          <div className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-black text-[#FF4081] mb-1">
            <span>{friend.badge} {getAgeGroupLabel(ageGroup)} &bull; 감정 퀴즈</span>
          </div>
          <h2 className="text-base sm:text-2xl font-black text-[#4A3E3D] leading-snug break-keep">
            어떤 표정이 &ldquo;<span className="text-[#FF4081] underline">{targetItem.name}</span>&rdquo; 인가요?
          </h2>
        </div>
        <button
          aria-label="놀이 안내 다시 듣기"
          onClick={() => speakText(`${scene.text} ${targetItem.name} 표정을 골라보세요!`, soundEnabled, { characterId: buddy })}
          className="p-2.5 sm:p-3 bg-white rounded-full border-2 border-[#FF80AB] shadow-xs text-[#FF4081] cursor-pointer shrink-0"
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

      {/* Target emoji preview (큰 표정 보기) */}
      <div className="my-3 sm:my-4 p-4 sm:p-6 bg-white rounded-3xl border-3 border-dashed border-[#FFB7D5] shadow-inner flex flex-col items-center justify-center">
        <motion.span
          animate={selectedCorrectId ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 1.0, repeat: selectedCorrectId ? Infinity : 0 }}
          className="text-6xl sm:text-8xl drop-shadow-md"
        >
          <span className="flex items-center gap-4"><ToyArtwork emoji={scene.emoji} /><ToyArtwork emoji={targetItem.emoji} /></span>
        </motion.span>
        <span className="text-xs font-bold text-[#8C7B79] mt-2 block">{scene.text}</span>
      </div>

      {/* Options Grid */}
      <div className="game-choice-grid w-full my-3">
        {options.map((item) => {
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
                  ? { scale: 1.05 }
                  : shouldPulse
                  ? { scale: [1, 1.08, 1], filter: ['brightness(1)', 'brightness(1.15)', 'brightness(1)'] }
                  : { scale: 1 }
              }
              transition={{ duration: isShaking ? 0.5 : shouldPulse ? 1.0 : 0.5 }}
              onClick={() => handleSelectCard(item)}
              className={`game-choice flex flex-col items-center justify-center p-3 sm:p-5 rounded-3xl border-3 sm:border-4 cursor-pointer select-none transition-all shadow-md touch-manipulation min-h-[130px] sm:min-h-[160px] ${
                isSolved
                  ? 'bg-[#E8F5E9] border-[#81C784]'
                  : shouldPulse
                  ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-300'
                  : 'bg-white hover:bg-[#FFF5F8] border-[#FFB7D5]'
              }`}
            >
              <span className="text-5xl sm:text-6xl mb-1 sm:mb-2"><ToyArtwork emoji={item.emoji} /></span>
              <span className="text-lg sm:text-xl font-black text-[#4A3E3D]">{item.name}</span>
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
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" /> 다른 문제
          </JellyButton>
        )}
      </div>
    </div>
  );
};
