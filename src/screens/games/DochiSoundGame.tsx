import { GameCue } from '../../components/GameCue';
import { useRoundTimer } from '../../hooks/useRoundTimer';
import { useIdleScaffolding } from '../../hooks/useIdleScaffolding';
import { ScaffoldingHint } from '../../components/ScaffoldingHint';
import { RoundContinuation } from '../../components/RoundContinuation';
import { useSoundClue } from '../../hooks/useSoundClue';
import { pickNextRound } from '../../utils/roundDeck';
import type { CharacterId } from '../../types';

import { ToyArtwork } from '../../components/ToyArtwork';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SOUND_ITEMS_BY_AGE } from '../../data/gameData';

import { JellyButton } from '../../components/JellyButton';
import { speakText, playWrongBoing, playDingDongDang, stopAllSpeech } from '../../utils/soundEngine';
import { fireStarExplosion } from '../../utils/confetti';
import { emitJuice, JUICE_SPRING } from '../../utils/juice';
import { getDifficultyConfig, pickDistractors } from '../../utils/ageEngine';
import { AgeGroup } from '../../types';
import { RefreshCw, Timer, Volume2 } from 'lucide-react';

interface SoundItem {
  id: string;
  name: string;
  soundText: string;
  emoji: string;
  hint: string;
}

interface DochiSoundGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
}

export const DochiSoundGame: React.FC<DochiSoundGameProps> = ({
  onCompleteQuiz,
  buddy,
  soundEnabled,
  ageGroup,
}) => {
  const { playClue, status: clueStatus } = useSoundClue(soundEnabled, buddy);
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();

  const diffConfig = getDifficultyConfig(ageGroup);
  const itemPool = SOUND_ITEMS_BY_AGE[ageGroup] || SOUND_ITEMS_BY_AGE.sprout;

  const [targetItem, setTargetItem] = useState<SoundItem>(itemPool[0]);
  const [options, setOptions] = useState<SoundItem[]>([]);
  const [shakingCardId, setShakingCardId] = useState<string | null>(null);
  const [selectedCorrectId, setSelectedCorrectId] = useState<string | null>(null);
  const [wavePulse, setWavePulse] = useState(0);

  // 타이머 상태 (꽃잎반/별님반)
  const { timeLeft, timeOut, startRoundTimer, stopRoundTimer } = useRoundTimer(diffConfig.timeLimit, () => {
    speakText(`시간이 완료되었어요. 다른 소리를 들려줄게요!`, soundEnabled, { characterId: buddy });
  });

  const { isIdle: showHint, reset: resetHint } = useIdleScaffolding({
    resetKey: targetItem.id, disabled: !!selectedCorrectId || timeOut || !options.length,
    voice: { text: '여기 반짝이는 친구를 눌러보자!', buddy, soundEnabled },
  });

  const generateRound = () => {
    resetHint();
    clearGameTimeouts();
    stopRoundTimer();

    setSelectedCorrectId(null);
    setShakingCardId(null);

    const target = pickNextRound(itemPool, `DochiSoundGame:${ageGroup}`);
    if (!target) return;
    setTargetItem(target);

    const distractors = pickDistractors<SoundItem>(itemPool, target.id, diffConfig.optionCount - 1);
    const roundOptions = [target, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(roundOptions);

    setWavePulse((n) => n + 1);
    playClue(target.id, target.soundText);

    startRoundTimer();
  };

  useEffect(() => {
    generateRound();
    return () => {
      clearGameTimeouts();
      stopRoundTimer();
      stopAllSpeech();
    };
  }, [ageGroup]);

  const handlePlaySoundClue = () => {
    setWavePulse((n) => n + 1);
    playClue(targetItem.id, targetItem.soundText);
  };

  const handleSelectCard = (item: typeof itemPool[0], event: React.MouseEvent<HTMLButtonElement>) => {
    if (selectedCorrectId || timeOut) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    if (item.id === targetItem.id) {
      stopRoundTimer();

      emitJuice({ kind: 'success', x: cx, y: cy });
      fireStarExplosion({ x: cx / window.innerWidth, y: cy / window.innerHeight });

      setSelectedCorrectId(item.id);
      playDingDongDang(soundEnabled);
      speakText(`딩동댕! 정답이에요! 귀여운 ${item.name}!`, soundEnabled, { characterId: buddy });
      onCompleteQuiz(diffConfig.starsPerCorrect);
    } else {
      setShakingCardId(item.id);
      playWrongBoing(soundEnabled);
      speakText(`다시 소리를 들어보아요!`, soundEnabled, { characterId: buddy });
      scheduleGameTimeout(() => setShakingCardId(null), 600);
    }
  };

  if (!targetItem) return null;

  return (
    <div className="game-board flex flex-col items-center justify-between w-full max-w-2xl mx-auto">
      {/* Top Banner */}
      <GameCue buddy={buddy} disabled={!soundEnabled} onReplay={handlePlaySoundClue} />

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
          ⏰ 아쉬워요! 시간이 다 되었어요! 다음 소리를 들어보아요!
        </div>
      )}

      {/* Interactive Soundwave Stage */}
      <div className="visual-prompt">
        <motion.button
          key={wavePulse}
          type="button"
          whileTap={{ scale: 0.9 }}
          animate={{ scale: [1, 1.12, 1] }}
          transition={JUICE_SPRING}
          onClick={handlePlaySoundClue}
          aria-label="소리 다시 듣기"
          className="relative flex items-center justify-center gap-3 px-5 py-2 rounded-full bg-gradient-to-r from-[#FFF8E1] to-[#FFECB3] border-3 border-[#FFB300] shadow-[inset_0_2px_0_#ffffff,0_4px_0_#FFA000] cursor-pointer"
        >
          <Volume2 className="w-8 h-8 text-[#F57C00] animate-bounce" aria-hidden="true" />
          <span className="flex items-end gap-1 h-6" aria-hidden="true">
            {[0.5, 1, 0.7, 0.95, 0.6].map((h, idx) => (
              <motion.i
                key={idx}
                animate={{ scaleY: [0.4, h, 0.45] }}
                transition={{ duration: 0.65, repeat: Infinity, delay: idx * 0.1 }}
                className="w-1.5 h-5 rounded-full bg-[#FB8C00] block origin-bottom"
              />
            ))}
          </span>
          {(!soundEnabled || clueStatus === 'fallback') && (
            <span className="w-10 h-10 flex items-center justify-center">
              <ToyArtwork emoji={targetItem.emoji} label="찾을 동물이나 탈것" />
            </span>
          )}
        </motion.button>
      </div>

      {/* Options */}
      <div className="game-choice-grid w-full my-3">
        {options.map((item) => {
          const isShaking = shakingCardId === item.id;
          const isSolved = selectedCorrectId === item.id;
          const isTarget = item.id === targetItem.id;
          const shouldPulse = showHint && isTarget && !selectedCorrectId;

          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.93 }}
              animate={
                isShaking
                  ? { x: [-10, 10, -8, 8, 0] }
                  : isSolved
                  ? { scale: 1.08, y: -4 }
                  : { scale: 1 }
              }
              transition={{ duration: 0.5 }}
              onClick={(e) => handleSelectCard(item, e)}
              className={`game-choice flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl border-3 sm:border-4 cursor-pointer select-none transition-all shadow-md touch-manipulation min-h-[130px] sm:min-h-[160px] ${
                isSolved
                  ? 'bg-[#E8F5E9] border-[#66BB6A]'
                  : shouldPulse
                  ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-300/50'
                  : 'bg-white hover:bg-[#FFF8EE] border-[#FFE0B2]'
              }`}
            >
              <span className="text-5xl sm:text-6xl mb-1 sm:mb-2"><ToyArtwork emoji={item.emoji} /></span>
              <span className="sr-only">{item.name}</span>
              {shouldPulse && <ScaffoldingHint />}
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
            <RefreshCw className="w-6 h-6" aria-hidden="true" /><span className="sr-only">다른 문제</span>
          </JellyButton>
        )}
      </div>
    </div>
  );
};
