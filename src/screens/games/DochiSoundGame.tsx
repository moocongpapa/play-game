import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { SOUND_ITEMS_BY_AGE } from '../../data/gameData';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JellyButton } from '../../components/JellyButton';
import { speakText, playCorrectFanfare, playWrongBoing, playAnimalSound, playDingDongDang } from '../../utils/soundEngine';
import { fireConfetti } from '../../utils/confetti';
import { getDifficultyConfig, getAgeGroupLabel, pickDistractors, pickRandom } from '../../utils/ageEngine';
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
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
}

export const DochiSoundGame: React.FC<DochiSoundGameProps> = ({
  onCompleteQuiz,
  soundEnabled,
  ageGroup,
  childName,
}) => {
  const diffConfig = getDifficultyConfig(ageGroup);
  const itemPool = SOUND_ITEMS_BY_AGE[ageGroup] || SOUND_ITEMS_BY_AGE.sprout;

  const [targetItem, setTargetItem] = useState<SoundItem>(itemPool[0]);
  const [options, setOptions] = useState<SoundItem[]>([]);
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
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);

    setSelectedCorrectId(null);
    setShakingCardId(null);
    setShowHint(false);
    setTimeOut(false);
    setTimeLeft(diffConfig.timeLimit);

    const target = pickRandom<SoundItem>(itemPool, 1)[0] || itemPool[0];
    if (!target) return;
    setTargetItem(target);

    const distractors = pickDistractors<SoundItem>(itemPool, target.id, diffConfig.optionCount - 1);
    const roundOptions = [target, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(roundOptions);

    if (soundEnabled) {
      playAnimalSound(target.name, soundEnabled);
      setTimeout(() => {
        speakText(`도치가 소리를 들려줄게요! "${target.soundText}" 이 소리의 주인은 누구일까요?`, soundEnabled, { characterId: 'dochi' });
      }, 350);
    }

    // 힌트 타이머 구동
    if (diffConfig.hintEnabled) {
      hintTimerRef.current = window.setTimeout(() => {
        setShowHint(true);
        speakText(`여기 반짝이는 친구를 눌러보자!`, soundEnabled, { characterId: 'dochi', playIntroSFX: false });
      }, diffConfig.hintDelaySec * 1000);
    }

    // 시간제한 타이머 구동
    if (diffConfig.timeLimit > 0) {
      gameTimerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (gameTimerRef.current) clearInterval(gameTimerRef.current);
            setTimeOut(true);
            speakText(`시간이 완료되었어요. 다른 소리를 들려줄게요!`, soundEnabled, { characterId: 'dochi' });
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

  const handlePlaySoundClue = () => {
    playAnimalSound(targetItem.name, soundEnabled);
    setTimeout(() => {
      speakText(`"${targetItem.soundText}" 소리를 가진 친구는 누구일까요?`, soundEnabled, { characterId: 'dochi' });
    }, 300);
  };

  const handleSelectCard = (item: typeof itemPool[0]) => {
    if (selectedCorrectId || timeOut) return;

    if (item.id === targetItem.id) {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);

      setSelectedCorrectId(item.id);
      playAnimalSound(item.name, soundEnabled);
      playDingDongDang(soundEnabled);
      fireConfetti();
      speakText(`딩동댕! 정답이에요! 귀여운 ${item.name}!`, soundEnabled, { characterId: 'dochi' });
      onCompleteQuiz(diffConfig.starsPerCorrect);
    } else {
      setShakingCardId(item.id);
      playWrongBoing(soundEnabled);
      speakText(`다시 소리를 들어보아요!`, soundEnabled, { characterId: 'dochi' });
      setTimeout(() => setShakingCardId(null), 600);
    }
  };

  if (!targetItem) return null;

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-2xl mx-auto p-2.5 sm:p-4 min-h-[80vh] overflow-hidden">
      {/* Top Banner */}
      <div className="w-full bg-gradient-to-r from-[#FFE0B2] to-[#FFF3E0] p-3.5 sm:p-4 rounded-3xl border-3 border-[#FFA726] shadow-sm flex items-center gap-3 sm:gap-4">
        <CharacterAvatar id="dochi" size="md" mood={selectedCorrectId ? 'excited' : 'waving'} className="!w-16 !h-16 sm:!w-24 sm:!h-24 shrink-0" />
        <div className="flex-1 min-w-0 break-keep">
          <div className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-black text-[#E65100] mb-1">
            <span>🦔 {getAgeGroupLabel(ageGroup)} &bull; 소리 퀴즈</span>
          </div>
          <h2 className="text-base sm:text-2xl font-black text-[#4A3E3D] leading-snug break-keep">
            &ldquo;<span className="text-[#FB8C00] underline">{targetItem.soundText}</span>&rdquo;
          </h2>
        </div>
        <button
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
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          onClick={handlePlaySoundClue}
          className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-[#FFE0B2] to-[#FFF8EE] rounded-full flex items-center justify-center text-3xl sm:text-4xl shadow-md cursor-pointer border-2 border-[#FFA726]"
        >
          🔊
        </motion.div>
        <p className="text-xs sm:text-sm font-bold text-[#8C7B79] mt-2 break-keep">
          위 스피커를 누르면 소리를 다시 들을 수 있어요!
        </p>
      </div>

      {/* Options */}
      <div className={`grid gap-3 sm:gap-4 w-full my-3 sm:my-4 ${
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
                  ? { x: [-10, 10, -8, 8, 0] }
                  : isSolved
                  ? { scale: 1.05 }
                  : shouldPulse
                  ? { scale: [1, 1.06, 1], filter: ['brightness(1)', 'brightness(1.15)', 'brightness(1)'] }
                  : { scale: 1 }
              }
              transition={{ duration: isShaking ? 0.5 : shouldPulse ? 1.2 : 0.5 }}
              onClick={() => handleSelectCard(item)}
              className={`flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl border-3 sm:border-4 cursor-pointer select-none transition-all shadow-md touch-manipulation min-h-[130px] sm:min-h-[160px] ${
                isSolved
                  ? 'bg-[#E8F5E9] border-[#66BB6A]'
                  : shouldPulse
                  ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-300/50'
                  : 'bg-white hover:bg-[#FFF8EE] border-[#FFE0B2]'
              }`}
            >
              <span className="text-5xl sm:text-6xl mb-1 sm:mb-2">{item.emoji}</span>
              <span className="text-lg sm:text-xl font-black text-[#4A3E3D]">{item.name}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 w-full">
        {selectedCorrectId || timeOut ? (
          <JellyButton variant="yellow" size="lg" onClick={generateRound} className="w-full sm:w-auto">
            다음 소리 듣기 🦔
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
