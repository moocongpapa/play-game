import { DragMatch, DragPiece, DropSlot, DragHint } from '../../components/DragMatch';
import { RoundContinuation } from '../../components/RoundContinuation';
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
import { getDifficultyConfig, getAgeGroupLabel } from '../../utils/ageEngine';
import { PATTERN_ITEMS_BY_AGE } from '../../data/gameData';
import { AgeGroup, PatternItem } from '../../types';
import { Volume2, RefreshCw, Timer } from 'lucide-react';

interface PatternSequenceGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
}

export const PatternSequenceGame: React.FC<PatternSequenceGameProps> = ({
  onCompleteQuiz,
  buddy,
  soundEnabled,
  ageGroup,
  childName,
}) => {
  const friend = CHARACTERS[buddy];
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();

  const diffConfig = getDifficultyConfig(ageGroup);
  const itemPool = PATTERN_ITEMS_BY_AGE[ageGroup] || PATTERN_ITEMS_BY_AGE.sprout;

  const [targetItem, setTargetItem] = useState<PatternItem>(itemPool[0]);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedCorrectId, setSelectedCorrectId] = useState<string | null>(null);
  const [shakingCardId, setShakingCardId] = useState<string | null>(null);

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

    setSelectedCorrectId(null);
    setShakingCardId(null);
    setShowHint(false);
    setTimeOut(false);
    setTimeLeft(diffConfig.timeLimit);

    const target = pickNextRound(itemPool, `PatternSequenceGame:${ageGroup}`);
    if (!target) return;
    setTargetItem(target);

    // 정답 + 오답 구성 (선택지 2~4개)
    const distractors = (target.distractors || ['🍎', '⭐']).slice(0, diffConfig.optionCount - 1);
    const roundOptions = [target.answer, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(roundOptions);

    if (soundEnabled) {
      speakText(`${friend.name}랑 신나는 패턴 놀이! 알맞은 그림을 물음표 상자로 옮겨 주세요!`, soundEnabled, { characterId: buddy });
    }

    // 힌트 타이머 구동
    if (diffConfig.hintEnabled) {
      hintTimerRef.current = scheduleGameTimeout(() => {
        setShowHint(true);
        speakText(`반짝이는 그림을 빈칸으로 옮겨 봐!`, soundEnabled, { characterId: buddy, playIntroSFX: false });
      }, diffConfig.hintDelaySec * 1000);
    }

    // 시간제한 타이머 구동
    if (diffConfig.timeLimit > 0) {
      gameTimerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (gameTimerRef.current) clearInterval(gameTimerRef.current);
            setTimeOut(true);
            speakText(`시간 초과! 다음 패턴 규칙을 찾아볼까요?`, soundEnabled, { characterId: buddy });
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

  const handleSelectCard = (ans: string) => {
    if (selectedCorrectId || timeOut) return;

    if (ans === targetItem.answer) {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);

      setSelectedCorrectId(ans);
      playCorrectFanfare(soundEnabled);
      speakText(`우와! 정답이에요! 패턴을 예쁘게 완성했어요!`, soundEnabled, { characterId: buddy });
      onCompleteQuiz(diffConfig.starsPerCorrect);
    } else {
      setShakingCardId(ans);
      playWrongBoing(soundEnabled);
      speakText(`다시 순서를 곰곰이 살펴볼까요?`, soundEnabled, { characterId: buddy });
      scheduleGameTimeout(() => setShakingCardId(null), 600);
    }
  };

  if (!targetItem) return null;

  return (
    <DragMatch resetKey={targetItem.id} disabled={!!selectedCorrectId || timeOut} onDrop={id => {
      if (selectedCorrectId || timeOut || !options.includes(id)) return false;
      handleSelectCard(id);
      return id === targetItem.answer;
    }}>
    <div className="game-board flex flex-col items-center justify-between w-full max-w-2xl mx-auto">
      {/* Top Banner */}
      <div className="game-prompt w-full bg-gradient-to-r from-[#DCEDC8] to-[#E8F5E9] p-3.5 sm:p-4 rounded-3xl border-3 border-[#66BB6A] shadow-sm flex items-center gap-3 sm:gap-4">
        <CharacterAvatar id={buddy} size="md" mood={selectedCorrectId ? 'excited' : 'waving'} className="!w-16 !h-16 sm:!w-24 sm:!h-24 shrink-0" />
        <div className="flex-1 min-w-0 break-keep">
          <div className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-black text-[#2E7D32] mb-1">
            <span>{friend.badge} {getAgeGroupLabel(ageGroup)} &bull; 패턴 완성</span>
          </div>
          <h2 className="text-base sm:text-2xl font-black text-[#4A3E3D] leading-snug break-keep">
            물음표 <span className="text-[#2E7D32] underline">❓</span> 칸에 올 친구는?
          </h2>
        </div>
        <button
          aria-label="놀이 안내 다시 듣기"
          onClick={() => speakText(`규칙을 보고 알맞은 그림을 빈칸으로 옮겨 주세요!`, soundEnabled, { characterId: buddy })}
          className="p-2.5 sm:p-3 bg-white rounded-full border-2 border-[#66BB6A] shadow-xs text-[#2E7D32] cursor-pointer shrink-0"
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
          ⏰ 아쉽네요! 시간 초과! 다음 패턴 방으로 이동해요!
        </div>
      )}

      {/* Pattern Sequence Display Box */}
      <div className="my-4 sm:my-6 p-4 sm:p-6 w-full bg-white rounded-3xl border-3 sm:border-4 border-[#C8E6C9] shadow-inner flex flex-col items-center justify-center">
        <span className="text-xs font-black text-[#8C7B79] mb-3 leading-none">패턴 레일</span>
        <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap max-w-full">
          {targetItem.sequence.map((emoji, idx) => (
            <motion.div
              key={idx}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-2xl sm:text-4xl shadow-xs"
            >
              <ToyArtwork emoji={emoji} />
            </motion.div>
          ))}
          <DropSlot id="pattern" label="빈칸" filled={!!selectedCorrectId} className="pattern-drop-slot rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-inner border-3 border-dashed border-amber-400 bg-amber-50">
            {selectedCorrectId ? <ToyArtwork emoji={targetItem.answer} /> : '?'}
          </DropSlot>
        </div>
      </div>

      <DragHint>빈칸으로 쏙 옮겨요!</DragHint>
      {/* Options Buttons */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 my-2 sm:my-4 w-full">
        {options.map((ans) => {
          const isShaking = shakingCardId === ans;
          const isSolved = selectedCorrectId === ans;
          const isTarget = ans === targetItem.answer;
          const shouldPulse = showHint && isTarget && !selectedCorrectId;

          return (
            <DragPiece
              key={ans}
              animate={
                isShaking
                  ? { x: [-8, 8, -6, 6, 0] }
                  : isSolved
                  ? { scale: 1.15 }
                  : shouldPulse
                  ? { scale: [1, 1.12, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: isShaking ? 0.5 : shouldPulse ? 1.0 : 0.2 }}
              id={ans} label={`${ans} 그림`}
              className={`game-choice w-16 h-16 sm:w-24 sm:h-24 rounded-3xl text-4xl sm:text-6xl flex items-center justify-center shadow-md border-4 transition-all cursor-pointer ${
                isSolved
                  ? 'bg-[#E8F5E9] border-[#66BB6A]'
                  : shouldPulse
                  ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-300'
                  : 'bg-white border-[#C8E6C9] hover:bg-[#F1F8E9]'
              }`}
            >
              <ToyArtwork emoji={ans} />
            </DragPiece>
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
    </DragMatch>
  );
};
