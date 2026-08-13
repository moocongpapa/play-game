import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JellyButton } from '../../components/JellyButton';
import { speakText, playBubblePop, playCorrectFanfare, playWrongBoing, playCharacterVoiceSFX } from '../../utils/soundEngine';
import { Volume2, RefreshCw } from 'lucide-react';

interface CloudItem {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

const CLOUD_SHAPES: CloudItem[] = [
  { id: 'star_cloud', name: '별 구름', emoji: '⭐', color: '#FFF59D' },
  { id: 'heart_cloud', name: '하트 구름', emoji: '💖', color: '#FF80AB' },
  { id: 'sun_cloud', name: '해님 구름', emoji: '☀️', color: '#FFE082' },
  { id: 'moon_cloud', name: '달님 구름', emoji: '🌙', color: '#CE93D8' },
  { id: 'flower_cloud', name: '꽃 구름', emoji: '🌸', color: '#A5D6A7' },
];

interface EummeCloudShapeGameProps {
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
}

export const EummeCloudShapeGame: React.FC<EummeCloudShapeGameProps> = ({
  onCompleteQuiz,
  soundEnabled,
}) => {
  const [targetCloud, setTargetCloud] = useState<CloudItem>(CLOUD_SHAPES[0]);
  const [clouds, setClouds] = useState<CloudItem[]>([]);
  const [selectedCorrectId, setSelectedCorrectId] = useState<string | null>(null);
  const [shakingCloudId, setShakingCloudId] = useState<string | null>(null);

  const generateRound = () => {
    setSelectedCorrectId(null);
    setShakingCloudId(null);

    const target = CLOUD_SHAPES[Math.floor(Math.random() * CLOUD_SHAPES.length)];
    setTargetCloud(target);

    const distractors = CLOUD_SHAPES.filter((c) => c.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    const roundClouds = [target, ...distractors].sort(() => Math.random() - 0.5);
    setClouds(roundClouds);

    if (soundEnabled) {
      speakText(`음메와 함께 폭신폭신 ${target.name}을 모아볼까요?`, soundEnabled, { characterId: 'eumme' });
    }
  };

  useEffect(() => {
    generateRound();
  }, []);

  const handleSelectCloud = (cloud: CloudItem) => {
    if (selectedCorrectId) return;

    if (cloud.id === targetCloud.id) {
      setSelectedCorrectId(cloud.id);
      playBubblePop(soundEnabled);
      playCorrectFanfare(soundEnabled);
      speakText(`음메! 정답이에요! 예쁜 ${cloud.name}!`, soundEnabled, { characterId: 'eumme' });
      onCompleteQuiz(2);
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
            <span>🐑 음메의 폭신폭신 구름 모으기</span>
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

      {/* Fluffy Sky Playground */}
      <div className="relative w-full h-[280px] sm:h-[320px] my-3 sm:my-4 bg-gradient-to-b from-[#E3F2FD] to-[#E1F5FE] rounded-3xl border-3 sm:border-4 border-dashed border-[#90CAF9] overflow-hidden grid grid-cols-3 sm:flex sm:items-center sm:justify-around p-2.5 sm:p-4 gap-2">
        {clouds.map((cloud, idx) => {
          const isShaking = shakingCloudId === cloud.id;
          const isSolved = selectedCorrectId === cloud.id;

          return (
            <motion.div
              key={cloud.id}
              animate={
                isShaking
                  ? { x: [-10, 10, -8, 8, 0] }
                  : isSolved
                  ? { scale: [1, 1.15, 1], rotate: [0, 6, -6, 0] }
                  : { y: [0, -12, 0] }
              }
              transition={{
                duration: isShaking ? 0.5 : 2 + idx * 0.3,
                repeat: isShaking ? 0 : Infinity,
                ease: 'easeInOut',
              }}
              onClick={() => handleSelectCloud(cloud)}
              className={`relative px-2 sm:px-6 py-4 sm:py-8 rounded-2xl sm:rounded-[40px] flex flex-col items-center justify-center cursor-pointer select-none shadow-md border-3 sm:border-4 touch-manipulation transition-all min-h-[140px] sm:min-h-[180px] ${
                isSolved
                  ? 'bg-white border-[#81C784]'
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
        {selectedCorrectId ? (
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
