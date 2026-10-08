import type { CharacterId } from '../../types';
import { CHARACTERS } from '../../data/characters';
import { ToyArtwork } from '../../components/ToyArtwork';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KOREAN_LETTER_ITEMS_BY_AGE } from '../../data/gameData';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JellyButton } from '../../components/JellyButton';
import { speakText, playBubblePop, playCorrectFanfare, playWrongBoing } from '../../utils/soundEngine';
import { getDifficultyConfig, getAgeGroupLabel, pickDistractors, pickRandom } from '../../utils/ageEngine';
import { AgeGroup } from '../../types';
import { Volume2, Sparkles, RefreshCw, Timer, Flame } from 'lucide-react';

interface KoreanLetterItem {
  id: string;
  letter: string;
  word: string;
  emoji: string;
  example: string;
}

interface JellyKoreanGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
}

export const JellyKoreanGame: React.FC<JellyKoreanGameProps> = ({
  onCompleteQuiz,
  buddy,
  soundEnabled,
  ageGroup,
  childName,
}) => {
  const friend = CHARACTERS[buddy];
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();

  const diffConfig = getDifficultyConfig(ageGroup);
  const itemPool = KOREAN_LETTER_ITEMS_BY_AGE[ageGroup] || KOREAN_LETTER_ITEMS_BY_AGE.sprout;

  const [targetItem, setTargetItem] = useState<KoreanLetterItem>(itemPool[0]);
  const [bubbles, setBubbles] = useState<KoreanLetterItem[]>([]);
  const [poppedIds, setPoppedIds] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const [streak, setStreak] = useState(0);
  const [showComboBanner, setShowComboBanner] = useState(false);
  const [questionPrompt, setQuestionPrompt] = useState('');

  // 힌트 상태
  const [showHint, setShowHint] = useState(false);
  const hintTimerRef = useRef<number | null>(null);

  // 타이머 상태 (꽃잎반/별님반)
  const [timeLeft, setTimeLeft] = useState<number>(diffConfig.timeLimit);
  const [timeOut, setTimeOut] = useState(false);
  const gameTimerRef = useRef<number | null>(null);

  const startNewRound = () => {
    clearGameTimeouts();
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);

    setPoppedIds([]);
    setIsCompleted(false);
    setShowHint(false);
    setTimeOut(false);
    setTimeLeft(diffConfig.timeLimit);

    const target = pickRandom<KoreanLetterItem>(itemPool, 1)[0] || itemPool[0];
    if (!target) return;
    setTargetItem(target);

    // 선택지 개수는 비누방울 개수 (baby: 2, sprout: 3, bloom: 4, star: 4-5)
    const optionCount = diffConfig.optionCount;
    const distractors = pickDistractors<KoreanLetterItem>(itemPool, target.id, optionCount - 1);
    const roundBubbles = [target, ...distractors].sort(() => Math.random() - 0.5);
    setBubbles(roundBubbles);

    let prompt = '';
    if (ageGroup !== 'baby' && target.word && Math.random() > 0.4) {
      prompt = `'${target.word}' ${target.emoji} 할 때 첫 글자는 무엇일까요? '${target.letter}' 방울을 터트려주세요!`;
    } else {
      prompt = `${friend.name}와 함께 '${target.letter}' 글자 비누방울을 팡팡 터트려주세요!`;
    }
    setQuestionPrompt(prompt);

    if (soundEnabled) {
      speakText(prompt, soundEnabled, { characterId: buddy });
    }

    // 힌트 타이머 구동
    if (diffConfig.hintEnabled) {
      hintTimerRef.current = scheduleGameTimeout(() => {
        setShowHint(true);
        speakText(`여기 흔들리는 글자를 톡 눌러봐!`, soundEnabled, { characterId: buddy, playIntroSFX: false });
      }, diffConfig.hintDelaySec * 1000);
    }

    // 시간제한 타이머 구동
    if (diffConfig.timeLimit > 0) {
      gameTimerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (gameTimerRef.current) clearInterval(gameTimerRef.current);
            setTimeOut(true);
            setStreak(0);
            speakText(`시간이 완료되었어요. 다른 방울을 터트려보자!`, soundEnabled, { characterId: buddy });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  useEffect(() => {
    startNewRound();
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [ageGroup]);

  const handlePopBubble = (bubble: KoreanLetterItem) => {
    if (isCompleted || timeOut) return;

    if (bubble.id === targetItem.id) {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);

      setPoppedIds((prev) => [...prev, bubble.id]);
      setIsCompleted(true);
      playBubblePop(soundEnabled);
      playCorrectFanfare(soundEnabled);

      const nextStreak = streak + 1;
      setStreak(nextStreak);

      if (nextStreak >= 2) {
        setShowComboBanner(true);
        scheduleGameTimeout(() => setShowComboBanner(false), 1500);
        speakText(`와우! ${nextStreak}연속 정답! ${friend.name}가 너무 신나요!`, soundEnabled, { characterId: buddy });
      } else {
        speakText(`정답이에요! '${bubble.letter}' 방울을 팡팡 터트렸어요!`, soundEnabled, { characterId: buddy });
      }

      onCompleteQuiz(diffConfig.starsPerCorrect);
    } else {
      setStreak(0);
      playWrongBoing(soundEnabled);
      setPoppedIds((prev) => [...prev, bubble.id]);
      speakText(`다른 글자 방울을 골라보아요!`, soundEnabled, { characterId: buddy });
    }
  };

  if (!targetItem) return null;

  return (
    <div className="game-board flex flex-col items-center justify-between w-full max-w-2xl mx-auto">
      {/* Top Banner */}
      <div className="game-prompt w-full bg-gradient-to-r from-[#E1BEE7] to-[#F3E5F5] p-3.5 sm:p-4 rounded-3xl border-3 border-[#AB47BC] shadow-sm flex items-center gap-3 sm:gap-4 relative">
        <CharacterAvatar id={buddy} size="md" mood={isCompleted ? 'dancing' : 'happy'} className="!w-16 !h-16 sm:!w-24 sm:!h-24 shrink-0" />
        <div className="flex-1 min-w-0 break-keep">
          <div className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-black text-[#8E24AA] mb-1">
            <span>{friend.badge} {getAgeGroupLabel(ageGroup)} &bull; 한글 비누방울</span>
          </div>
          <h2 className="text-base sm:text-2xl font-black text-[#4A3E3D] leading-snug break-keep">
            {questionPrompt ? (
              <span>{questionPrompt}</span>
            ) : (
              <>&ldquo;<span className="text-[#8E24AA] underline font-black text-2xl sm:text-3xl">{targetItem.letter}</span>&rdquo; ({targetItem.word})</>
            )}
          </h2>
        </div>
        <button
          aria-label="놀이 안내 다시 듣기"
          onClick={() => speakText(`'${targetItem.letter}' 글자 비누방울을 터트려보아요!`, soundEnabled, { characterId: buddy })}
          className="p-2.5 sm:p-3 bg-white rounded-full border-2 border-[#AB47BC] shadow-xs text-[#8E24AA] cursor-pointer shrink-0"
        >
          <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Combo Streak Banner */}
        <AnimatePresence>
          {showComboBanner && (
            <motion.div
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1.1, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-3 right-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-3 py-1 rounded-full font-black text-xs sm:text-sm shadow-lg flex items-center gap-1 border-2 border-white"
            >
              <Flame className="w-4 h-4 text-yellow-200 fill-yellow-200 animate-bounce" />
              <span>{streak}연속 정답! 콤보 보너스!</span>
            </motion.div>
          )}
        </AnimatePresence>
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
          ⏰ 아쉬워라! 시간이 다 되었어요! 다음 비누방울 놀이로 넘어가요!
        </div>
      )}

      <div className="visual-prompt" aria-label="같은 글자 방울을 찾아요"><span className="text-4xl font-black">{targetItem.letter}</span><span aria-hidden="true">→</span><ToyArtwork emoji={targetItem.emoji} /></div>

      {/* Bubbles Playground */}
      <div className={`relative w-full h-[280px] sm:h-[320px] my-3 sm:my-4 bg-gradient-to-b from-[#F3E5F5]/60 to-[#E1BEE7]/40 rounded-3xl border-3 sm:border-4 border-dashed border-[#CE93D8] overflow-hidden p-3 sm:p-4 gap-2 place-items-center ${
        bubbles.length === 2 ? 'grid grid-cols-2' : 'grid grid-cols-2 sm:flex sm:items-center sm:justify-around'
      }`}>
        <AnimatePresence>
          {bubbles.map((item, idx) => {
            const isPopped = poppedIds.includes(item.id);
            const isTarget = item.id === targetItem.id;
            const shouldPulse = showHint && isTarget && !isCompleted;

            if (isPopped) {
              return (
                <motion.div
                  key={item.id}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1.2, 0], opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center"
                >
                  <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-[#AB47BC] animate-ping" />
                </motion.div>
              );
            }

            return (
              <motion.button
                key={item.id}
                animate={
                  shouldPulse
                    ? { scale: [1, 1.15, 1], y: [0, -12, 0] }
                    : {
                        y: [0, -12, 0],
                        x: [0, idx % 2 === 0 ? 6 : -6, 0],
                      }
                }
                transition={{
                  duration: shouldPulse ? 1.0 : 2.5 + idx * 0.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                onClick={() => handlePopBubble(item)}
                className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center cursor-pointer select-none border-3 sm:border-4 shadow-lg touch-manipulation backdrop-blur-xs transition-transform hover:scale-105 active:scale-90 ${
                  isTarget
                    ? 'bg-gradient-to-tr from-[#E1BEE7] to-[#FFFFFF] border-[#AB47BC] text-[#7B1FA2]'
                    : 'bg-gradient-to-tr from-[#FFF3E0] to-[#FFFFFF] border-[#FFB7D5] text-[#E65100]'
                } ${shouldPulse ? 'ring-4 ring-amber-400 ring-offset-2' : ''}`}
              >
                <span className="text-2xl sm:text-3xl font-black mb-0.5">{item.letter}</span>
                <span className="text-xl sm:text-2xl"><ToyArtwork emoji={item.emoji} /></span>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-center gap-3 w-full">
        {isCompleted || timeOut ? (
          <JellyButton soundEnabled={soundEnabled} variant="purple" size="lg" onClick={startNewRound} className="w-full sm:w-auto">
            다음 한글 비누방울 {friend.badge} <span className="next-play-icon" aria-hidden="true">➜</span>
          </JellyButton>
        ) : (
          <JellyButton soundEnabled={soundEnabled} variant="white" size="md" onClick={startNewRound} className="!px-4">
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" /> 다른 글자
          </JellyButton>
        )}
      </div>
    </div>
  );
};
