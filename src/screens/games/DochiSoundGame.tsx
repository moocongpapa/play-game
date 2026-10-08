import { useIdleScaffolding } from '../../hooks/useIdleScaffolding';
import { ScaffoldingHint } from '../../components/ScaffoldingHint';
import { RoundContinuation } from '../../components/RoundContinuation';
import { useSoundClue } from '../../hooks/useSoundClue';
import { pickNextRound } from '../../utils/roundDeck';
import type { CharacterId } from '../../types';
import { CHARACTERS } from '../../data/characters';
import { ToyArtwork } from '../../components/ToyArtwork';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { SOUND_ITEMS_BY_AGE } from '../../data/gameData';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JellyButton } from '../../components/JellyButton';
import { speakText, playWrongBoing, playDingDongDang } from '../../utils/soundEngine';
import { fireConfetti } from '../../utils/confetti';
import { getDifficultyConfig, getAgeGroupLabel, pickDistractors } from '../../utils/ageEngine';
import { AgeGroup } from '../../types';
import { Volume2, RefreshCw, Timer } from 'lucide-react';

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
  childName,
}) => {
  const friend = CHARACTERS[buddy];
  const { playClue, status: clueStatus } = useSoundClue(soundEnabled, buddy);
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();

  const diffConfig = getDifficultyConfig(ageGroup);
  const itemPool = SOUND_ITEMS_BY_AGE[ageGroup] || SOUND_ITEMS_BY_AGE.sprout;

  const [targetItem, setTargetItem] = useState<SoundItem>(itemPool[0]);
  const [options, setOptions] = useState<SoundItem[]>([]);
  const [shakingCardId, setShakingCardId] = useState<string | null>(null);
  const [selectedCorrectId, setSelectedCorrectId] = useState<string | null>(null);

  // 타이머 상태 (꽃잎반/별님반)
  const [timeLeft, setTimeLeft] = useState<number>(diffConfig.timeLimit);
  const [timeOut, setTimeOut] = useState(false);
  const gameTimerRef = useRef<number | null>(null);

  const { isIdle: showHint, reset: resetHint } = useIdleScaffolding({
    resetKey: targetItem.id, disabled: !!selectedCorrectId || timeOut || !options.length,
    voice: { text: '여기 반짝이는 친구를 눌러보자!', buddy, soundEnabled },
  });

  const generateRound = () => {
    resetHint();
    clearGameTimeouts();
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);

    setSelectedCorrectId(null);
    setShakingCardId(null);
    setTimeOut(false);
    setTimeLeft(diffConfig.timeLimit);

    const target = pickNextRound(itemPool, `DochiSoundGame:${ageGroup}`);
    if (!target) return;
    setTargetItem(target);

    const distractors = pickDistractors<SoundItem>(itemPool, target.id, diffConfig.optionCount - 1);
    const roundOptions = [target, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(roundOptions);

    playClue(target.id, target.soundText);

    // 시간제한 타이머 구동
    if (diffConfig.timeLimit > 0) {
      gameTimerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (gameTimerRef.current) clearInterval(gameTimerRef.current);
            setTimeOut(true);
            speakText(`시간이 완료되었어요. 다른 소리를 들려줄게요!`, soundEnabled, { characterId: buddy });
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
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [ageGroup]);

  const handlePlaySoundClue = () => playClue(targetItem.id, targetItem.soundText);

  const handleSelectCard = (item: typeof itemPool[0]) => {
    if (selectedCorrectId || timeOut) return;

    if (item.id === targetItem.id) {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);

      setSelectedCorrectId(item.id);
      playDingDongDang(soundEnabled);
      fireConfetti();
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
      <div className="game-prompt w-full bg-gradient-to-r from-[#FFE0B2] to-[#FFF3E0] p-3.5 sm:p-4 rounded-3xl border-3 border-[#FFA726] shadow-sm flex items-center gap-3 sm:gap-4">
        <CharacterAvatar id={buddy} size="md" mood={selectedCorrectId ? 'excited' : 'waving'} className="!w-16 !h-16 sm:!w-24 sm:!h-24 shrink-0" />
        <div className="flex-1 min-w-0 break-keep">
          <div className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-black text-[#E65100] mb-1">
            <span>{friend.badge} {getAgeGroupLabel(ageGroup)} &bull; 소리 퀴즈</span>
          </div>
          <h2 className="text-base sm:text-2xl font-black text-[#4A3E3D] leading-snug break-keep">
            &ldquo;<span className="text-[#FB8C00] underline">{targetItem.soundText}</span>&rdquo;
          </h2>
        </div>
        <button
          aria-label="동물이나 탈것 소리 다시 듣기"
          onClick={handlePlaySoundClue}
          className="p-3 bg-gradient-to-b from-[#FFA726] to-[#FB8C00] text-white rounded-full shadow-md active:scale-90 transition-transform cursor-pointer shrink-0"
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
          ⏰ 아쉬워요! 시간이 다 되었어요! 다음 소리를 들어보아요!
        </div>
      )}

      {/* Sound Speaker Animation Box */}
      <div className="my-3 sm:my-4 p-4 sm:p-5 bg-white rounded-3xl border-3 sm:border-4 border-[#FFE0B2] shadow-sm flex flex-col items-center justify-center text-center">
        <motion.button
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          aria-label="동물이나 탈것 소리 다시 듣기"
          onClick={handlePlaySoundClue}
          className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-[#FFE0B2] to-[#FFF8EE] rounded-full flex items-center justify-center text-3xl sm:text-4xl shadow-md cursor-pointer border-2 border-[#FFA726]"
        >
          <Volume2 className="w-9 h-9" />
        </motion.button>
        <p className="text-xs sm:text-sm font-bold text-[#8C7B79] mt-2 break-keep">
          {clueStatus === 'playing' ? '귀를 쫑긋! 소리를 듣고 있어요' : '톡! 누르면 다시 들려줘요'}
        </p>
      </div>

      {(!soundEnabled || clueStatus === 'fallback') && <div className="visual-prompt"><ToyArtwork emoji={targetItem.emoji} label="찾을 동물이나 탈것" /><span aria-hidden="true">→ ?</span></div>}

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
              animate={
                isShaking
                  ? { x: [-10, 10, -8, 8, 0] }
                  : isSolved
                  ? { scale: 1.05 }
                  : { scale: 1 }
              }
              transition={{ duration: 0.5 }}
              onClick={() => handleSelectCard(item)}
              className={`game-choice flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl border-3 sm:border-4 cursor-pointer select-none transition-all shadow-md touch-manipulation min-h-[130px] sm:min-h-[160px] ${
                isSolved
                  ? 'bg-[#E8F5E9] border-[#66BB6A]'
                  : shouldPulse
                  ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-300/50'
                  : 'bg-white hover:bg-[#FFF8EE] border-[#FFE0B2]'
              }`}
            >
              <span className="text-5xl sm:text-6xl mb-1 sm:mb-2"><ToyArtwork emoji={item.emoji} /></span>
              <span className="text-lg sm:text-xl font-black text-[#4A3E3D]">{item.name}</span>
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
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" /> 다른 문제
          </JellyButton>
        )}
      </div>
    </div>
  );
};
