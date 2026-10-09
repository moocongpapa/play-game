import { GameCue } from '../../components/GameCue';
import { useRoundTimer } from '../../hooks/useRoundTimer';
import { RoundContinuation } from '../../components/RoundContinuation';
import { pickNextRound } from '../../utils/roundDeck';
import type { CharacterId } from '../../types';
import { CHARACTERS } from '../../data/characters';
import { ToyArtwork } from '../../components/ToyArtwork';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

import { JellyButton } from '../../components/JellyButton';
import { speakText, playBubblePop, playCorrectFanfare, playWrongBoing } from '../../utils/soundEngine';
import { getDifficultyConfig, pickDistractors } from '../../utils/ageEngine';
import { CLOUD_SHAPES_BY_AGE, CloudItem } from '../../data/gameData';
import { AgeGroup } from '../../types';
import { RefreshCw, Timer } from 'lucide-react';

interface EummeCloudShapeGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
}

export const EummeCloudShapeGame: React.FC<EummeCloudShapeGameProps> = ({
  onCompleteQuiz,
  buddy,
  soundEnabled,
  ageGroup,
  childName,
}) => {
  const friend = CHARACTERS[buddy];
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();

  const diffConfig = getDifficultyConfig(ageGroup);
  const itemPool = CLOUD_SHAPES_BY_AGE[ageGroup] || CLOUD_SHAPES_BY_AGE.sprout;

  const [targetCloud, setTargetCloud] = useState<CloudItem>(itemPool[0]);
  const [clouds, setClouds] = useState<CloudItem[]>([]);
  const [selectedCorrectId, setSelectedCorrectId] = useState<string | null>(null);
  const [shakingCloudId, setShakingCloudId] = useState<string | null>(null);

  // 힌트 상태
  const [showHint, setShowHint] = useState(false);
  const hintTimerRef = useRef<number | null>(null);

  // 타이머 상태 (꽃잎반/별님반)
  const { timeLeft, timeOut, startRoundTimer, stopRoundTimer } = useRoundTimer(diffConfig.timeLimit, () => {
    speakText(`시간 초과! 다른 구름을 모아보아요!`, soundEnabled, { characterId: buddy });
  });

  const generateRound = () => {
    clearGameTimeouts();
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    stopRoundTimer();

    setSelectedCorrectId(null);
    setShakingCloudId(null);
    setShowHint(false);

    const target = pickNextRound(itemPool, `EummeCloudShapeGame:${ageGroup}`);
    if (!target) return;
    setTargetCloud(target);

    const distractors = pickDistractors<CloudItem>(itemPool, target.id, diffConfig.optionCount - 1);
    const roundClouds = [target, ...distractors].sort(() => Math.random() - 0.5);
    setClouds(roundClouds);

    if (soundEnabled) {
      speakText(`${friend.name}와 함께 폭신폭신 ${target.name}을 모아볼까요?`, soundEnabled, { characterId: buddy });
    }

    // 힌트 타이머 구동
    if (diffConfig.hintEnabled) {
      hintTimerRef.current = scheduleGameTimeout(() => {
        setShowHint(true);
        speakText(`여기 흔들리는 구름을 눌러봐!`, soundEnabled, { characterId: buddy, playIntroSFX: false });
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

  const handleSelectCloud = (cloud: CloudItem) => {
    if (selectedCorrectId || timeOut) return;

    if (cloud.id === targetCloud.id) {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      stopRoundTimer();

      setSelectedCorrectId(cloud.id);
      playBubblePop(soundEnabled);
      playCorrectFanfare(soundEnabled);
      speakText(`우와! 정답이에요! 예쁜 ${cloud.name}!`, soundEnabled, { characterId: buddy });
      onCompleteQuiz(diffConfig.starsPerCorrect);
    } else {
      setShakingCloudId(cloud.id);
      playWrongBoing(soundEnabled);
      speakText(`다시 폭신폭신 구름을 모아보아요!`, soundEnabled, { characterId: buddy });
      scheduleGameTimeout(() => setShakingCloudId(null), 600);
    }
  };

  if (!targetCloud) return null;

  return (
    <div className="game-board flex flex-col items-center justify-between w-full max-w-2xl mx-auto">
      {/* Top Banner */}
      <GameCue buddy={buddy} disabled={!soundEnabled} onReplay={() => speakText(`${targetCloud.name}을 구름 속에서 찾아주세요!`, soundEnabled, { characterId: buddy })} />

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
          ⏰ 앗! 시간이 없어요! 다음 구름방으로 넘어가요!
        </div>
      )}

      <div className="visual-prompt" aria-label="이 그림을 찾아요"><ToyArtwork emoji={targetCloud.emoji} label="찾을 그림" /><span aria-hidden="true">→</span><span className="text-3xl">?</span></div>

      {/* Fluffy Sky Playground */}
      <div className={`choice-options relative w-full h-[280px] sm:h-[320px] my-3 sm:my-4 bg-gradient-to-b from-[#E3F2FD] to-[#E1F5FE] rounded-3xl border-3 sm:border-4 border-dashed border-[#90CAF9] overflow-hidden p-2.5 sm:p-4 gap-2 ${
        clouds.length === 2 ? 'grid grid-cols-2 place-items-center' : 'grid grid-cols-2 place-items-center sm:flex sm:items-center sm:justify-around'
      }`}>
        {clouds.map((cloud, idx) => {
          const isShaking = shakingCloudId === cloud.id;
          const isSolved = selectedCorrectId === cloud.id;
          const isTarget = cloud.id === targetCloud.id;
          const shouldPulse = showHint && isTarget && !selectedCorrectId;

          return (
            <motion.button
              key={cloud.id}
              animate={
                isShaking
                  ? { x: [-10, 10, -8, 8, 0] }
                  : isSolved
                  ? { scale: [1, 1.15, 1], rotate: [0, 6, -6, 0] }
                  : shouldPulse
                  ? { scale: [1, 1.12, 1], y: [0, -12, 0] }
                  : { y: [0, -12, 0] }
              }
              transition={{
                duration: isShaking ? 0.5 : shouldPulse ? 1.0 : 2 + idx * 0.3,
                repeat: isShaking ? 0 : Infinity,
                ease: 'easeInOut',
              }}
              onClick={() => handleSelectCloud(cloud)}
              className={`game-choice relative px-2 sm:px-6 py-4 sm:py-8 rounded-2xl sm:rounded-[40px] flex flex-col items-center justify-center cursor-pointer select-none shadow-md border-3 sm:border-4 touch-manipulation transition-all min-h-[120px] sm:min-h-[160px] min-w-[100px] sm:min-w-[140px] ${
                isSolved
                  ? 'bg-white border-[#81C784]'
                  : shouldPulse
                  ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-300'
                  : 'bg-white/90 hover:bg-white border-[#90CAF9]'
              }`}
            >
              <span className="text-4xl sm:text-6xl mb-1"><ToyArtwork emoji={cloud.emoji} /></span>
              <span className="sr-only">{cloud.name}</span>
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
            <RefreshCw className="w-6 h-6" /><span className="sr-only">다른 구름</span>
          </JellyButton>
        )}
      </div>
    </div>
  );
};
