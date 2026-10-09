import { GameCue } from '../../components/GameCue';
import { useRoundTimer } from '../../hooks/useRoundTimer';
import { DragMatch, DragPiece, DropSlot, DragHint } from '../../components/DragMatch';
import { RoundContinuation } from '../../components/RoundContinuation';
import { PlayResultScene } from '../../components/PlayResultScene';
import { pickNextRound } from '../../utils/roundDeck';
import type { CharacterId } from '../../types';
import { CHARACTERS } from '../../data/characters';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import React, { useState, useEffect } from 'react';

import { SHAPE_COLOR_ITEMS_BY_AGE } from '../../data/gameData';

import { JellyButton } from '../../components/JellyButton';
import { speakText, playCorrectFanfare, playWrongBoing } from '../../utils/soundEngine';
import { getDifficultyConfig, pickDistractors } from '../../utils/ageEngine';
import { AgeGroup } from '../../types';
import { RefreshCw, Timer } from 'lucide-react';

interface ShapeColorItem {
  id: string;
  shape: string;
  colorName: string;
  color: string;
  emoji: string;
  path: string;
}

interface RanoShapeColorGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
}

/**
 * High-precision SVG Shape Renderer
 * Ensures Circle, Triangle, Square, Star, Heart, etc. render 100% accurately in the correct color
 */
const ShapeFigure: React.FC<{ shape: string; color: string; className?: string }> = ({
  shape,
  color,
  className = 'w-16 h-16 sm:w-20 sm:h-20',
}) => {
  switch (shape) {
    case '동그라미':
    case 'circle':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="44" fill={color} stroke="#725e4b" strokeOpacity="0.55" strokeWidth="4" />
        </svg>
      );
    case '세모':
    case 'triangle':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <polygon points="50,10 92,88 8,88" fill={color} stroke="#725e4b" strokeOpacity="0.55" strokeWidth="4" strokeLinejoin="round" />
        </svg>
      );
    case '네모':
    case 'square':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <rect x="12" y="12" width="76" height="76" rx="8" fill={color} stroke="#725e4b" strokeOpacity="0.55" strokeWidth="4" />
        </svg>
      );
    case '별':
    case 'star':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <polygon
            points="50,8 62,36 92,36 68,54 77,82 50,65 23,82 32,54 8,36 38,36"
            fill={color}
            stroke="#725e4b" strokeOpacity="0.55"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case '하트':
    case 'heart':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <path
            d="M 50,86 C 25,60 10,40 10,25 C 10,12 20,8 32,8 C 42,8 48,15 50,22 C 52,15 58,8 68,8 C 80,8 90,12 90,25 C 90,40 75,60 50,86 Z"
            fill={color}
            stroke="#725e4b" strokeOpacity="0.55"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case '다이아몬드':
    case 'diamond':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <polygon points="50,10 88,50 50,90 12,50" fill={color} stroke="#725e4b" strokeOpacity="0.55" strokeWidth="4" strokeLinejoin="round" />
        </svg>
      );
    case '오각형':
    case 'pentagon':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <polygon points="50,10 90,40 75,88 25,88 10,40" fill={color} stroke="#725e4b" strokeOpacity="0.55" strokeWidth="4" strokeLinejoin="round" />
        </svg>
      );
    case '타원':
    case 'oval':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <ellipse cx="50" cy="50" rx="44" ry="30" fill={color} stroke="#725e4b" strokeOpacity="0.55" strokeWidth="4" />
        </svg>
      );
    case '육각형':
    case 'hexagon':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <polygon points="50,10 88,30 88,70 50,90 12,70 12,30" fill={color} stroke="#725e4b" strokeOpacity="0.55" strokeWidth="4" strokeLinejoin="round" />
        </svg>
      );
    case '초승달':
    case 'crescent':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <path d="M 50,10 A 40,40 0 1,0 90,50 A 30,30 0 1,1 50,10 Z" fill={color} stroke="#725e4b" strokeOpacity="0.55" strokeWidth="4" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="40" fill={color} stroke="#725e4b" strokeOpacity="0.55" strokeWidth="4" />
        </svg>
      );
  }
};

export const RanoShapeColorGame: React.FC<RanoShapeColorGameProps> = ({
  onCompleteQuiz,
  buddy,
  soundEnabled,
  ageGroup,
  childName,
}) => {
  const friend = CHARACTERS[buddy];
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();

  const diffConfig = getDifficultyConfig(ageGroup);
  const itemPool = SHAPE_COLOR_ITEMS_BY_AGE[ageGroup] || SHAPE_COLOR_ITEMS_BY_AGE.sprout;

  const [targetItem, setTargetItem] = useState<ShapeColorItem>(itemPool[0]);
  const [options, setOptions] = useState<ShapeColorItem[]>([]);
  const [shakingCardId, setShakingCardId] = useState<string | null>(null);
  const [selectedCorrectId, setSelectedCorrectId] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  // 타이머 상태 (꽃잎반/별님반)
  const { timeLeft, timeOut, startRoundTimer, stopRoundTimer } = useRoundTimer(diffConfig.timeLimit, () => {
    setStreak(0);
    speakText(`시간이 끝났어요. 다음 문제를 풀어보아요!`, soundEnabled, { characterId: buddy });
  });

  const generateRound = () => {
    clearGameTimeouts();
    stopRoundTimer();

    setSelectedCorrectId(null);
    setShakingCardId(null);

    const target = pickNextRound(itemPool, `RanoShapeColorGame:${ageGroup}`);
    setTargetItem(target);

    const distractors = pickDistractors<ShapeColorItem>(itemPool, target.id, diffConfig.optionCount - 1);
    const roundOptions = [...distractors, target].sort(() => Math.random() - 0.5);
    setOptions(roundOptions);

    if (soundEnabled) {
      speakText(`${friend.name}와 함께 알록달록 ${target.colorName} ${target.shape}를 잡아 같은 모양 위에 올려 주세요!`, soundEnabled, { characterId: buddy });
    }

    startRoundTimer();
  };

  useEffect(() => {
    generateRound();
    return () => {
      stopRoundTimer();
    };
  }, [ageGroup]);

  const handleSelectCard = (item: ShapeColorItem) => {
    if (selectedCorrectId || timeOut) return;

    if (item.id === targetItem.id) {
      stopRoundTimer();

      setSelectedCorrectId(item.id);
      playCorrectFanfare(soundEnabled);

      const nextStreak = streak + 1;
      setStreak(nextStreak);

      if (nextStreak >= 2) {
        speakText(`우와! ${nextStreak}연속 정답! ${item.colorName} ${item.shape}를 완벽하게 맞췄어요!`, soundEnabled, { characterId: buddy });
      } else {
        speakText(`우와! 정답이에요! ${item.colorName} ${item.shape}!`, soundEnabled, { characterId: buddy });
      }

      onCompleteQuiz(diffConfig.starsPerCorrect);
    } else {
      setShakingCardId(item.id);
      setStreak(0);
      playWrongBoing(soundEnabled);
      speakText(`모양과 색깔을 다시 한번 잘 살펴보아요!`, soundEnabled, { characterId: buddy });
      scheduleGameTimeout(() => setShakingCardId(null), 600);
    }
  };

  return (
    <DragMatch canDrop={id => id === targetItem.id} resetKey={targetItem.id} disabled={!!selectedCorrectId || timeOut} hint={{ pieceId: targetItem.id, targetId: 'shape' }} onDrop={(id) => {
      const item = options.find(option => option.id === id);
      if (!item || !!selectedCorrectId || timeOut) return false;
      handleSelectCard(item);
      return item.id === targetItem.id;
    }}>
    <div className="game-board flex flex-col items-center justify-between w-full max-w-2xl mx-auto">
      {/* Top Banner */}
      <GameCue buddy={buddy} disabled={!soundEnabled} onReplay={() => speakText(`${targetItem.colorName} ${targetItem.shape}를 찾아보아요!`, soundEnabled, { characterId: buddy })} />

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
          ⏰ 째깍째깍! 시간이 지났어요! 다음 문제로 풀기를 진행해요!
        </div>
      )}

      {/* Target Slot */}
      {selectedCorrectId ? <PlayResultScene kind="build" buddy={buddy} color={targetItem.color} keepsake={<ShapeFigure shape={targetItem.shape} color={targetItem.color} className="w-full h-full" />} /> : <>
      <DropSlot id="shape" label="같은 모양" filled={!!selectedCorrectId} className="my-3 sm:my-4 p-4 sm:p-5 bg-white rounded-3xl border-3 sm:border-4 border-dashed border-[#81C784] shadow-inner flex flex-col items-center justify-center">
        <span className="sr-only">같은 모양을 여기로 옮겨요</span>
        <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-sm flex flex-col items-center">
          <ShapeFigure shape={targetItem.shape} color={targetItem.color} className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-md" />
          <span className="sr-only">
            {targetItem.colorName} {targetItem.shape}
          </span>
        </div>
      </DropSlot>
      <DragHint>같은 모양 위에 쏙!</DragHint>

      {/* Options */}
      <div className="drag-options-grid w-full my-3">
        {options.map((item) => {
          const isShaking = shakingCardId === item.id;
          const isSolved = selectedCorrectId === item.id;

          return (
            <DragPiece
              key={item.id}
              animate={
                isShaking
                  ? { x: [-10, 10, -8, 8, 0] }
                  : isSolved
                  ? { scale: 1.08 }
                  : { scale: 1 }
              }
              transition={{ duration: 0.5 }}
              id={item.id} label={`${item.colorName} ${item.shape}`}
              className={`game-choice p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-3 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm ${
                isSolved
                  ? 'bg-emerald-50 border-emerald-400 ring-4 ring-emerald-300'
                  : 'bg-white border-green-200 hover:border-green-400 hover:bg-emerald-50/50'
              }`}
            >
              <ShapeFigure shape={item.shape} color={item.color} className="shape-play-piece drop-shadow-sm" />
              <span className="sr-only">
                {item.colorName} {item.shape}
              </span>
            </DragPiece>
          );
        })}
      </div>

      {/* Actions */}
      </>}
      <div className="flex items-center justify-center gap-3 w-full">
        {selectedCorrectId || timeOut ? (
          <RoundContinuation onNext={generateRound} />
        ) : (
          <JellyButton soundEnabled={soundEnabled} variant="white" size="md" onClick={generateRound} className="!px-4">
            <RefreshCw className="w-6 h-6" /><span className="sr-only">다른 모양</span>
          </JellyButton>
        )}
      </div>
    </div>
    </DragMatch>
  );
};
