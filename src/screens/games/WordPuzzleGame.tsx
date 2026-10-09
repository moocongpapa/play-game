import { GameCue } from '../../components/GameCue';
import { useRoundTimer } from '../../hooks/useRoundTimer';
import { DragMatch, DragPiece, DropSlot, DragHint } from '../../components/DragMatch';
import { placeMatchingValue } from '../../utils/dropTarget';
import { RoundContinuation } from '../../components/RoundContinuation';
import { pickNextRound } from '../../utils/roundDeck';
import type { CharacterId } from '../../types';

import { ToyArtwork } from '../../components/ToyArtwork';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import React, { useState, useEffect } from 'react';

import { JellyButton } from '../../components/JellyButton';
import { speakText, playBubblePop, playCorrectFanfare, playWrongBoing } from '../../utils/soundEngine';
import { getDifficultyConfig } from '../../utils/ageEngine';
import { WORD_PUZZLE_ITEMS_BY_AGE } from '../../data/gameData';
import { AgeGroup, WordPuzzleItem } from '../../types';
import { RefreshCw, Timer } from 'lucide-react';

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
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();

  const diffConfig = getDifficultyConfig(ageGroup);
  // bloom/star 외의 그룹 방어코드
  const currentPool = WORD_PUZZLE_ITEMS_BY_AGE[ageGroup]?.length > 0
    ? WORD_PUZZLE_ITEMS_BY_AGE[ageGroup]
    : WORD_PUZZLE_ITEMS_BY_AGE.bloom;

  const [targetItem, setTargetItem] = useState<WordPuzzleItem>(currentPool[0]);
  const [lettersPool, setLettersPool] = useState<{ id: string; letter: string }[]>([]);
  const [placedLetters, setPlacedLetters] = useState<(string | null)[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // 타이머 상태
  const { timeLeft, timeOut, startRoundTimer, stopRoundTimer } = useRoundTimer(diffConfig.timeLimit, () => {
    speakText(`시간 초과! 다음 글자 퍼즐을 맞춰볼까요?`, soundEnabled, { characterId: buddy });
  });

  const generateRound = () => {
    clearGameTimeouts();
    stopRoundTimer();

    setPlacedLetters([]);
    setIsCompleted(false);

    const target = pickNextRound(currentPool, `WordPuzzleGame:${ageGroup}`);
    setTargetItem(target);

    // 낱말 글자들 뒤섞어 배치
    const shuffled = [...target.letters].sort(() => Math.random() - 0.5);
    setLettersPool(shuffled.map((letter, index) => ({ id: String(index), letter })));

    if (soundEnabled) {
      speakText(`글자를 잡아 똑같은 글자 칸에 쏙 넣어 '${target.word}' 단어를 만들어볼까요?`, soundEnabled, { characterId: buddy });
    }

    startRoundTimer();
  };

  useEffect(() => {
    generateRound();
    return () => {
      stopRoundTimer();
    };
  }, [ageGroup]);

  const handleDropLetter = (pieceId: string, slotId: string) => {
    if (isCompleted || timeOut) return false;
    const piece = lettersPool.find(letter => letter.id === pieceId);
    if (!piece) return false;
    const next = placeMatchingValue(targetItem.letters, placedLetters, piece.letter, Number(slotId));
    if (!next) {
      playWrongBoing(soundEnabled);
      speakText('똑같은 글자가 있는 칸으로 옮겨 볼까?', soundEnabled, { characterId: buddy });
      return false;
    }
    playBubblePop(soundEnabled);
    setPlacedLetters(next);
    setLettersPool(pool => pool.filter(letter => letter.id !== pieceId));
    if (next.every(letter => letter !== null)) {
      stopRoundTimer();
      setIsCompleted(true);
      playCorrectFanfare(soundEnabled);
      speakText(`와아! 단어가 완성되었어요! ${targetItem.word}!`, soundEnabled, { characterId: buddy });
      onCompleteQuiz(diffConfig.starsPerCorrect);
    } else {
      speakText(piece.letter, soundEnabled, { characterId: buddy, playIntroSFX: false });
    }
    return true;
  };

  const hintSlot = targetItem.letters.findIndex((_, i) => !placedLetters[i]);
  const hintPiece = lettersPool.find(piece => piece.letter === targetItem.letters[hintSlot]);
  return (
    <DragMatch canDrop={(id, slot) => !placedLetters[Number(slot)] && lettersPool.find(piece => piece.id === id)?.letter === targetItem.letters[Number(slot)]} hint={hintPiece ? { pieceId: hintPiece.id, targetId: String(hintSlot) } : undefined} resetKey={targetItem.word} disabled={isCompleted || timeOut} onDrop={handleDropLetter}>
    <div className="game-board flex flex-col items-center justify-between w-full max-w-2xl mx-auto">
      {/* Top Banner */}
      <GameCue buddy={buddy} disabled={!soundEnabled} onReplay={() => speakText(`힌트! ${targetItem.hint}`, soundEnabled, { characterId: buddy })} />

      {/* Timer display */}
      {diffConfig.timeLimit > 0 && !isCompleted && (
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
          ⏰ 째깍째깍! 시간이 아쉽게 끝났어요. 다음 단어 놀이로 넘어가요!
        </div>
      )}

      {/* Emoji Clue Center Display */}
      <div className="visual-prompt">
        <span className="text-6xl sm:text-7xl mb-1.5"><ToyArtwork emoji={targetItem.emoji} /></span>
        <span className="sr-only">
          힌트: {targetItem.hint}
        </span>
      </div>

      <div data-play-area className="word-drop-row">
        {targetItem.letters.map((letter, index) => <DropSlot key={index} id={String(index)} label={`${index + 1}번째 ${letter}`} filled={!!placedLetters[index]} className="word-slot">
          {placedLetters[index] || letter}
        </DropSlot>)}
      </div>
      <DragHint>같은 글자 위에 쏙!</DragHint>
      <div data-play-area className="word-drop-row min-h-[100px] mb-4">
        {lettersPool.map(piece => <DragPiece key={piece.id} id={piece.id} label={piece.letter} className="word-piece">
          {piece.letter}
        </DragPiece>)}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 w-full">
        {isCompleted || timeOut ? (
          <RoundContinuation onNext={generateRound} />
        ) : (
          <JellyButton soundEnabled={soundEnabled} variant="white" size="md" onClick={generateRound} className="!px-4">
            <RefreshCw className="w-6 h-6" aria-hidden="true" /><span className="sr-only">다른 단어</span>
          </JellyButton>
        )}
      </div>
    </div>
    </DragMatch>
  );
};
