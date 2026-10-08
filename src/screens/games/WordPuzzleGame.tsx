import { pickNextRound } from '../../utils/roundDeck';
import type { CharacterId } from '../../types';
import { CHARACTERS } from '../../data/characters';
import { ToyArtwork } from '../../components/ToyArtwork';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JellyButton } from '../../components/JellyButton';
import { speakText, playBubblePop, playCorrectFanfare, playWrongBoing } from '../../utils/soundEngine';
import { getDifficultyConfig, getAgeGroupLabel } from '../../utils/ageEngine';
import { WORD_PUZZLE_ITEMS_BY_AGE } from '../../data/gameData';
import { AgeGroup, WordPuzzleItem } from '../../types';
import { Volume2, RefreshCw, Sparkles, Timer } from 'lucide-react';

interface WordPuzzleGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
}

export const WordPuzzleGame: React.FC<WordPuzzleGameProps> = ({
  onCompleteQuiz,
  buddy,
  soundEnabled,
  ageGroup,
  childName,
}) => {
  const friend = CHARACTERS[buddy];
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();

  const diffConfig = getDifficultyConfig(ageGroup);
  // bloom/star 외의 그룹 방어코드
  const currentPool = WORD_PUZZLE_ITEMS_BY_AGE[ageGroup]?.length > 0
    ? WORD_PUZZLE_ITEMS_BY_AGE[ageGroup]
    : WORD_PUZZLE_ITEMS_BY_AGE.bloom;

  const [targetItem, setTargetItem] = useState<WordPuzzleItem>(currentPool[0]);
  const [lettersPool, setLettersPool] = useState<string[]>([]);
  const [placedLetters, setPlacedLetters] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [shakingLetterIdx, setShakingLetterIdx] = useState<number | null>(null);

  // 힌트 상태
  const [showHint, setShowHint] = useState(false);
  const hintTimerRef = useRef<number | null>(null);

  // 타이머 상태
  const [timeLeft, setTimeLeft] = useState<number>(diffConfig.timeLimit);
  const [timeOut, setTimeOut] = useState(false);
  const gameTimerRef = useRef<number | null>(null);

  const generateRound = () => {
    clearGameTimeouts();
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);

    setPlacedLetters([]);
    setIsCompleted(false);
    setShakingLetterIdx(null);
    setShowHint(false);
    setTimeOut(false);
    setTimeLeft(diffConfig.timeLimit);

    const target = pickNextRound(currentPool, `WordPuzzleGame:${ageGroup}`);
    setTargetItem(target);

    // 낱말 글자들 뒤섞어 배치
    const shuffled = [...target.letters].sort(() => Math.random() - 0.5);
    setLettersPool(shuffled);

    if (soundEnabled) {
      speakText(`글자를 알맞은 순서대로 쏙쏙 모아서 '${target.word}' 단어를 만들어볼까요?`, soundEnabled, { characterId: buddy });
    }

    // 힌트 타이머 구동
    if (diffConfig.hintEnabled) {
      hintTimerRef.current = scheduleGameTimeout(() => {
        setShowHint(true);
      }, diffConfig.hintDelaySec * 1000);
    }

    // 시간제한 타이머 구동
    if (diffConfig.timeLimit > 0) {
      gameTimerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (gameTimerRef.current) clearInterval(gameTimerRef.current);
            setTimeOut(true);
            speakText(`시간 초과! 다음 글자 퍼즐을 맞춰볼까요?`, soundEnabled, { characterId: buddy });
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

  const handleTapLetter = (letter: string, index: number) => {
    if (isCompleted || timeOut) return;

    const nextIndexToPlace = placedLetters.length;
    const expectedLetter = targetItem.letters[nextIndexToPlace];

    if (letter === expectedLetter) {
      playBubblePop(soundEnabled);
      const newPlaced = [...placedLetters, letter];
      setPlacedLetters(newPlaced);
      
      // 글자 수 읽기
      speakText(letter, soundEnabled, { characterId: buddy, playIntroSFX: false });

      // 글자 모음에서 탭한 글자 하나 지우기
      const newPool = [...lettersPool];
      newPool.splice(index, 1);
      setLettersPool(newPool);

      // 단어 완성 체크
      if (newPlaced.length === targetItem.letters.length) {
        if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
        if (gameTimerRef.current) clearInterval(gameTimerRef.current);

        setIsCompleted(true);
        playCorrectFanfare(soundEnabled);
        speakText(`와아! 단어가 완성되었어요! ${targetItem.word}!`, soundEnabled, { characterId: buddy });
        onCompleteQuiz(diffConfig.starsPerCorrect);
      }
    } else {
      setShakingLetterIdx(index);
      playWrongBoing(soundEnabled);
      speakText(`에구구, 올바른 순서의 글자를 눌러주세요!`, soundEnabled, { characterId: buddy });
      scheduleGameTimeout(() => setShakingLetterIdx(null), 600);
    }
  };

  return (
    <div className="game-board flex flex-col items-center justify-between w-full max-w-2xl mx-auto">
      {/* Top Banner */}
      <div className="game-prompt w-full bg-gradient-to-r from-[#E1BEE7] to-[#F3E5F5] p-3.5 sm:p-4 rounded-3xl border-3 border-[#AB47BC] shadow-sm flex items-center gap-3 sm:gap-4">
        <CharacterAvatar id={buddy} size="md" mood={isCompleted ? 'dancing' : 'happy'} className="!w-16 !h-16 sm:!w-24 sm:!h-24 shrink-0" />
        <div className="flex-1 min-w-0 break-keep">
          <div className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-black text-[#8E24AA] mb-1">
            <span>{friend.badge} {getAgeGroupLabel(ageGroup)} &bull; 단어 조합</span>
          </div>
          <h2 className="text-base sm:text-2xl font-black text-[#4A3E3D] leading-snug break-keep">
            단어 퍼즐: &ldquo;<span className="text-[#8E24AA] underline">{targetItem.word}</span>&rdquo;
          </h2>
        </div>
        <button
          aria-label="놀이 안내 다시 듣기"
          onClick={() => speakText(`힌트! ${targetItem.hint}`, soundEnabled, { characterId: buddy })}
          className="p-2.5 sm:p-3 bg-white rounded-full border-2 border-[#AB47BC] shadow-xs text-[#8E24AA] cursor-pointer shrink-0"
          title="단어 힌트 말하기"
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
          ⏰ 째깍째깍! 시간이 아쉽게 끝났어요. 다음 단어 놀이로 넘어가요!
        </div>
      )}

      {/* Emoji Clue Center Display */}
      <div className="my-3 flex flex-col items-center justify-center p-4 bg-white rounded-3xl border-3 border-dashed border-[#AB47BC] shadow-2xs">
        <span className="text-6xl sm:text-7xl mb-1.5"><ToyArtwork emoji={targetItem.emoji} /></span>
        <span className="text-xs font-bold text-[#8C7B79] bg-purple-50 text-[#8E24AA] px-2.5 py-0.5 rounded-full">
          힌트: {targetItem.hint}
        </span>
      </div>

      {/* Word Building Slot Area */}
      <div className="w-full bg-slate-50 border-3 border-[#E1BEE7] p-3 sm:p-5 rounded-3xl min-h-[64px] flex items-center justify-center gap-2.5 sm:gap-4 shadow-inner mb-4">
        {targetItem.letters.map((_, idx) => {
          const letter = placedLetters[idx];
          return (
            <motion.div
              key={idx}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex items-center justify-center text-2xl sm:text-4xl font-black shadow-sm ${
                letter ? 'bg-[#AB47BC] text-white border-[#7B1FA2]' : 'bg-white border-dashed border-[#E1BEE7] text-transparent'
              }`}
            >
              {letter || ''}
            </motion.div>
          );
        })}
      </div>

      {/* Scattered Letter Taps Area */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 my-2 sm:my-3 min-h-[80px]">
        <AnimatePresence>
          {lettersPool.map((letter, index) => {
            const isShaking = shakingLetterIdx === index;
            const expectedNextLetter = targetItem.letters[placedLetters.length];
            const isNextExpected = letter === expectedNextLetter;

            return (
              <motion.button
                key={`${letter}-${index}`}
                initial={{ scale: 0 }}
                animate={isShaking ? { x: [-8, 8, -6, 6, 0] } : { scale: 1 }}
                exit={{ scale: 0 }}
                onClick={() => handleTapLetter(letter, index)}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl text-xl sm:text-3xl font-black flex items-center justify-center shadow-md border-b-4 transition-all cursor-pointer ${
                  isNextExpected && showHint
                    ? 'bg-amber-400 border-amber-600 text-white animate-pulse'
                    : 'bg-white text-[#8E24AA] border-[#E1BEE7] hover:bg-[#F9F2FA]'
                }`}
              >
                {letter}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 w-full">
        {isCompleted || timeOut ? (
          <JellyButton soundEnabled={soundEnabled} variant="purple" size="lg" onClick={generateRound} className="w-full sm:w-auto">
            다음 단어 만들기 {friend.badge} <span className="next-play-icon" aria-hidden="true">➜</span>
          </JellyButton>
        ) : (
          <JellyButton soundEnabled={soundEnabled} variant="white" size="md" onClick={generateRound} className="!px-4">
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" /> 다른 단어
          </JellyButton>
        )}
      </div>
    </div>
  );
};
