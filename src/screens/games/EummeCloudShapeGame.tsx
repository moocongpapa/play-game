import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JellyButton } from '../../components/JellyButton';
import { speakText, playBubblePop, playCorrectFanfare, playWrongBoing } from '../../utils/soundEngine';
import { getDifficultyConfig, getAgeGroupLabel, pickDistractors, pickRandom } from '../../utils/ageEngine';
import { CLOUD_SHAPES_BY_AGE, CloudItem } from '../../data/gameData';
import { AgeGroup } from '../../types';
import { Volume2, RefreshCw, Timer } from 'lucide-react';

interface EummeCloudShapeGameProps {
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
}

export const EummeCloudShapeGame: React.FC<EummeCloudShapeGameProps> = ({
  onCompleteQuiz,
  soundEnabled,
  ageGroup,
  childName,
}) => {
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
  const [timeLeft, setTimeLeft] = useState<number>(diffConfig.timeLimit);
  const [timeOut, setTimeOut] = useState(false);
  const gameTimerRef = useRef<number | null>(null);

  const generateRound = () => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);

    setSelectedCorrectId(null);
    setShakingCloudId(null);
    setShowHint(false);
    setTimeOut(false);
    setTimeLeft(diffConfig.timeLimit);

    const target = pickRandom<CloudItem>(itemPool, 1)[0];
    setTargetCloud(target);

    const distractors = pickDistractors<CloudItem>(itemPool, target.id, diffConfig.optionCount - 1);
    const roundClouds = [target, ...distractors].sort(() => Math.random() - 0.5);
    setClouds(roundClouds);

    if (soundEnabled) {
      speakText(`음메와 함께 폭신폭신 ${target.name}을 모아볼까요?`, soundEnabled, { characterId: 'eumme' });
    }

    // 힌트 타이머 구동
    if (diffConfig.hintEnabled) {
      hintTimerRef.current = window.setTimeout(() => {
        setShowHint(true);
        speakText(`여기 흔들리는 구름을 눌러봐!`, soundEnabled, { characterId: 'eumme', playIntroSFX: false });
      }, diffConfig.hintDelaySec * 1000);
    }

    // 시간제한 타이머 구동
    if (diffConfig.timeLimit > 0) {
      gameTimerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (gameTimerRef.current) clearInterval(gameTimerRef.current);
            setTimeOut(true);
            speakText(`시간 초과! 다른 구름을 모아보아요!`, soundEnabled, { characterId: 'eumme' });
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

  const handleSelectCloud = (cloud: CloudItem) => {
    if (selectedCorrectId || timeOut) return;

    if (cloud.id === targetCloud.id) {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);

      setSelectedCorrectId(cloud.id);
      playBubblePop(soundEnabled);
      playCorrectFanfare(soundEnabled);
      speakText(`음메! 정답이에요! 예쁜 ${cloud.name}!`, soundEnabled, { characterId: 'eumme' });
      onCompleteQuiz(diffConfig.starsPerCorrect);
    } else {
      setShakingCloudId(cloud.id);
      playWrongBoing(soundEnabled);
      speakText(`다시 폭신폭신 구름을 모아보아요!`, soundEnabled, { characterId: 'eumme' });
      setTimeout(() => setShakingCloudId(null), 600);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-2xl mx-auto p-2.5 sm:p-4 min-h-[80vh] overflow-hidden">
      {/* Top Banner */}
      <div className="w-full bg-gradient-to-r from-[#BBDEFB] to-[#E3F2FD] p-3.5 sm:p-4 rounded-3xl border-3 border-[#42A5F5] shadow-sm flex items-center gap-3 sm:gap-4">
        <CharacterAvatar id="eumme" size="md" mood={selectedCorrectId ? 'dancing' : 'happy'} className="!w-16 !h-16 sm:!w-24 sm:!h-24 shrink-0" />
        <div className="flex-1 min-w-0 break-keep">
          <div className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-black text-[#1E88E5] mb-1">
            <span>🐑 {getAgeGroupLabel(ageGroup)} &bull; 구름 모으기</span>
          </div>
          <h2 className="text-base sm:text-2xl font-black text-[#4A3E3D] leading-snug break-keep">
            &ldquo;<span className="text-[#1E88E5] underline">{targetCloud.name}</span>&rdquo;을 모아주세요!
          </h2>
        </div>
        <button
          onClick={() => speakText(`${targetCloud.name}을 구름 속에서 찾아주세요!`, soundEnabled, { characterId: 'eumme' })}
          className="p-2.5 sm:p-3 bg-white rounded-full border-2 border-[#42A5F5] shadow-xs text-[#1E88E5] cursor-pointer shrink-0"
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
          ⏰ 앗! 시간이 없어요! 다음 구름방으로 넘어가요!
        </div>
      )}

      {/* Fluffy Sky Playground */}
      <div className={`relative w-full h-[280px] sm:h-[320px] my-3 sm:my-4 bg-gradient-to-b from-[#E3F2FD] to-[#E1F5FE] rounded-3xl border-3 sm:border-4 border-dashed border-[#90CAF9] overflow-hidden p-2.5 sm:p-4 gap-2 ${
        clouds.length === 2 ? 'grid grid-cols-2 place-items-center' : 'grid grid-cols-2 place-items-center sm:flex sm:items-center sm:justify-around'
      }`}>
        {clouds.map((cloud, idx) => {
          const isShaking = shakingCloudId === cloud.id;
          const isSolved = selectedCorrectId === cloud.id;
          const isTarget = cloud.id === targetCloud.id;
          const shouldPulse = showHint && isTarget && !selectedCorrectId;

          return (
            <motion.div
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
              className={`relative px-2 sm:px-6 py-4 sm:py-8 rounded-2xl sm:rounded-[40px] flex flex-col items-center justify-center cursor-pointer select-none shadow-md border-3 sm:border-4 touch-manipulation transition-all min-h-[120px] sm:min-h-[160px] min-w-[100px] sm:min-w-[140px] ${
                isSolved
                  ? 'bg-white border-[#81C784]'
                  : shouldPulse
                  ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-300'
                  : 'bg-white/90 hover:bg-white border-[#90CAF9]'
              }`}
            >
              <span className="text-4xl sm:text-6xl mb-1">{cloud.emoji}</span>
              <span className="text-xs sm:text-xl font-black text-[#4A3E3D] text-center whitespace-nowrap">{cloud.name}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 w-full">
        {selectedCorrectId || timeOut ? (
          <JellyButton variant="blue" size="lg" onClick={generateRound} className="w-full sm:w-auto">
            다음 구름 모으기 🐑
          </JellyButton>
        ) : (
          <JellyButton variant="white" size="md" onClick={generateRound} className="!px-4">
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" /> 다른 구름
          </JellyButton>
        )}
      </div>
    </div>
  );
};
