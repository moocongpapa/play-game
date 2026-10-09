import { GameCue } from '../../components/GameCue';
import { useRoundTimer } from '../../hooks/useRoundTimer';
import { useIdleScaffolding } from '../../hooks/useIdleScaffolding';
import { ScaffoldingHint } from '../../components/ScaffoldingHint';
import { RoundContinuation } from '../../components/RoundContinuation';
import { pickNextRound } from '../../utils/roundDeck';
import type { CharacterId } from '../../types';
import { CHARACTERS } from '../../data/characters';
import { ToyArtwork } from '../../components/ToyArtwork';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { QuizItem, AgeGroup } from '../../types';
import { OBJECT_ITEMS_BY_AGE } from '../../data/gameData';

import { JellyButton } from '../../components/JellyButton';
import { speakText, playCorrectFanfare, playWrongBoing } from '../../utils/soundEngine';
import { getDifficultyConfig, pickDistractors } from '../../utils/ageEngine';
import { RefreshCw, Timer } from 'lucide-react';

interface GgomiObjectGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
}

export const GgomiObjectGame: React.FC<GgomiObjectGameProps> = ({
  onCompleteQuiz,
  buddy,
  soundEnabled,
  ageGroup,
  childName,
}) => {
  const friend = CHARACTERS[buddy];
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();

  const diffConfig = getDifficultyConfig(ageGroup);
  const itemPool = OBJECT_ITEMS_BY_AGE[ageGroup] || OBJECT_ITEMS_BY_AGE.sprout;

  const [targetItem, setTargetItem] = useState<QuizItem>(itemPool[0]);
  const [options, setOptions] = useState<QuizItem[]>([]);
  const [shakingCardId, setShakingCardId] = useState<string | null>(null);
  const [selectedCorrectId, setSelectedCorrectId] = useState<string | null>(null);
  
  // 콤보 스트릭 상태
  const [streak, setStreak] = useState(0);

  // 타이머 상태 (꽃잎반/별님반)
  const { timeLeft, timeOut, startRoundTimer, stopRoundTimer } = useRoundTimer(diffConfig.timeLimit, () => {
    speakText(`아쉬워요! 시간이 다 되었어요. 다른 문제를 풀어볼까요?`, soundEnabled, { characterId: buddy });
  });

  const { isIdle: showHint, reset: resetHint } = useIdleScaffolding({
    resetKey: targetItem.id, disabled: !!selectedCorrectId || timeOut || !options.length,
    voice: { text: '여기 반짝이는 걸 눌러봐!', buddy, soundEnabled },
  });

  const generateRound = () => {
    resetHint();
    clearGameTimeouts();
    // 기존 타이머 클리어
    stopRoundTimer();

    setSelectedCorrectId(null);
    setShakingCardId(null);

    const target = pickNextRound(itemPool, `GgomiObjectGame:${ageGroup}`);
    if (!target) return;
    setTargetItem(target);

    // 연령별 난이도 설정에 따른 선택지 생성
    const distractors = pickDistractors<QuizItem>(itemPool, target.id, diffConfig.optionCount - 1);
    const roundOptions = [target, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(roundOptions);

    // 다채로운 질문 생성 (단순 매칭 vs 속성 질문)
    let promptText = '';
    const categoryLabels: Record<string, string> = {
      fruit: '달콤한 과일',
      animal: '동물 친구',
      vehicle: '씽씽 달리는 탈것',
      food: '맛있는 음식',
    };

    if (ageGroup !== 'baby' && target.category && categoryLabels[target.category] && Math.random() > 0.5) {
      promptText = `${categoryLabels[target.category]}인 '${target.koreanName}'를 찾아주세요!`;
    } else {
      promptText = `${friend.name}가 '${target.koreanName}'를 찾고 있어요! 어디에 있을까요?`;
    }

    if (soundEnabled) {
      speakText(promptText, soundEnabled, { characterId: buddy });
    }

    startRoundTimer();
  };

  useEffect(() => {
    generateRound();
    return () => {
      stopRoundTimer();
    };
  }, [ageGroup]);

  const handleSelectCard = (item: QuizItem) => {
    if (selectedCorrectId || timeOut) return;

    if (item.id === targetItem.id) {
      stopRoundTimer();
      
      setSelectedCorrectId(item.id);
      playCorrectFanfare(soundEnabled);

      const nextStreak = streak + 1;
      setStreak(nextStreak);

      if (nextStreak >= 2) {
        speakText(`와우! ${nextStreak}연속 정답! ${childName}야 정말 똑똑하구나!`, soundEnabled, { characterId: buddy });
      } else {
        speakText(`정답이에요! 참 잘했어요!`, soundEnabled, { characterId: buddy });
      }
      onCompleteQuiz(diffConfig.starsPerCorrect);
    } else {
      setShakingCardId(item.id);
      setStreak(0);
      playWrongBoing(soundEnabled);
      speakText(`다시 한번 생각해보아요!`, soundEnabled, { characterId: buddy });
      scheduleGameTimeout(() => setShakingCardId(null), 600);
    }
  };

  const handleReplayVoice = () => {
    if (!targetItem) return;
    speakText(`${targetItem.koreanName}는 어디에 있을까요?`, soundEnabled, { characterId: buddy });
  };

  if (!targetItem) return null;

  return (
    <div className="game-board flex flex-col items-center justify-between w-full max-w-2xl mx-auto">
      {/* Top Banner */}
      <GameCue buddy={buddy} disabled={!soundEnabled} onReplay={handleReplayVoice} />

      {/* Timer display for older kids */}
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
          ⏰ 째깍째깍! 시간이 지났어요! 잠시 뒤 다음 문제로 넘어가요!
        </div>
      )}

      <div className="visual-prompt" aria-label="이 그림을 찾아요"><ToyArtwork emoji={targetItem.emoji} label="찾을 그림" /><span aria-hidden="true">→</span><span className="text-3xl">?</span></div>

      {/* Cards Options Grid */}
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
                  ? { x: [-10, 10, -8, 8, -4, 4, 0] }
                  : isSolved
                  ? { scale: [1, 1.12, 1], rotate: [0, 5, -5, 0] }
                  : { y: [0, -4, 0] }
              }
              transition={{
                duration: isShaking ? 0.5 : 2,
                repeat: isShaking ? 0 : Infinity,
              }}
              onClick={() => handleSelectCard(item)}
              className={`game-choice flex flex-col items-center justify-center p-4 sm:p-6 rounded-3xl border-3 sm:border-4 cursor-pointer select-none transition-all shadow-md touch-manipulation min-h-[140px] sm:min-h-[180px] ${
                isSolved
                  ? 'bg-[#E8F5E9] border-[#81C784] ring-4 ring-[#81C784]/30'
                  : shouldPulse
                  ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-300/50'
                  : 'bg-white hover:bg-[#FFF5F8] border-[#FFB7D5] hover:border-[#FF80AB]'
              }`}
            >
              <span className="text-5xl sm:text-7xl mb-1 sm:mb-2 drop-shadow-sm"><ToyArtwork emoji={item.emoji} /></span>
              <span className="sr-only">{item.koreanName}</span>
              {shouldPulse && <ScaffoldingHint />}
            </motion.button>
          );
        })}
      </div>

      {/* Action Footer */}
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
