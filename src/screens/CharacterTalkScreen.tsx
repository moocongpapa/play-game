import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CHARACTER_LIST } from '../data/characters';
import { CharacterId } from '../types';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { JellyButton } from '../components/JellyButton';
import { speakText } from '../utils/soundEngine';
import { Sparkles } from 'lucide-react';

interface CharacterTalkScreenProps {
  selectedCharacter: CharacterId;
  onSelectCharacter: (id: CharacterId) => void;
  onGoHome: () => void;
  onOpenCharmVideo: (characterId?: CharacterId) => void;
  soundEnabled: boolean;
  childName: string;
}

export const CharacterTalkScreen: React.FC<CharacterTalkScreenProps> = ({
  selectedCharacter,
  onSelectCharacter,
  onGoHome,
  onOpenCharmVideo,
  soundEnabled,
  childName,
}) => {
  const [activeMood, setActiveMood] = useState<'happy' | 'dancing' | 'waving' | 'excited'>('happy');

  const activeChar = CHARACTER_LIST.find((c) => c.id === selectedCharacter) || CHARACTER_LIST[0];

  const handleTouchCharacter = (charId: CharacterId) => {
    onSelectCharacter(charId);
    setActiveMood('dancing');
    const target = CHARACTER_LIST.find((c) => c.id === charId);
    if (target) {
      const greeting = target.greetingTemplate.replace('{name}', childName);
      speakText(greeting, soundEnabled, { characterId: charId });
    }
    setTimeout(() => setActiveMood('happy'), 1500);
  };

  const currentGreeting = activeChar.greetingTemplate.replace('{name}', childName);

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-3xl mx-auto p-2.5 sm:p-4 min-h-[85vh] overflow-hidden">
      {/* Top Banner */}
      <div className="w-full text-center bg-white/80 p-3 sm:p-4 rounded-3xl border-2 sm:border-3 border-[#FFD15C] shadow-sm mb-3 break-keep">
        <h1 className="text-xl sm:text-3xl font-black text-[#4A3E3D] flex items-center justify-center gap-2">
          <span>💖</span> {childName}와 동물 친구들의 대화방!
        </h1>
        <p className="text-xs sm:text-base font-bold text-[#8C7B79] mt-0.5">
          {childName}가 터치하면 친구들이 반갑게 &ldquo;{childName}야 안녕!&rdquo; 인사하고 춤을 춰요!
        </p>
      </div>

      {/* Featured Big Active Buddy */}
      <div className="relative w-full bg-gradient-to-b from-[#FFF59D]/40 to-[#FFE082]/60 p-4 sm:p-6 rounded-[28px] sm:rounded-[40px] border-3 sm:border-4 border-[#FFA000] shadow-md flex flex-col items-center text-center my-1">
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border-2 border-[#FFA000] font-black text-[10px] sm:text-xs text-[#E65100] shadow-xs">
          함께하는 친구
        </div>

        <CharacterAvatar
          id={activeChar.id}
          size="xl"
          mood={activeMood}
          onClick={() => handleTouchCharacter(activeChar.id)}
          className="my-1 cursor-pointer hover:scale-105 transition-transform !w-32 !h-32 sm:!w-52 sm:!h-52 shrink-0"
        />

        <h2 className="text-2xl sm:text-3xl font-black text-[#4A3E3D] mt-1 flex items-center justify-center gap-1.5 break-keep">
          <span>{activeChar.badge}</span> {activeChar.name}
          <span className="text-xs sm:text-base font-bold text-[#8C7B79]">({activeChar.title})</span>
        </h2>

        <div className="mt-2.5 bg-white/90 p-3 sm:p-4 rounded-2xl border-2 border-[#FFD15C] w-full max-w-lg shadow-xs break-keep">
          <p className="text-base sm:text-lg font-black text-[#4A3E3D] leading-relaxed">
            &ldquo;{currentGreeting}&rdquo;
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
          <JellyButton
            size="sm"
            variant="pink"
            onClick={() => {
              setActiveMood('dancing');
              speakText(`우와! ${activeChar.name}가 신나게 춤을 춰요!`, soundEnabled, { characterId: activeChar.id });
              setTimeout(() => setActiveMood('happy'), 1500);
            }}
          >
            💃 춤추기
          </JellyButton>
          <JellyButton
            size="sm"
            variant="secondary"
            onClick={() => {
              setActiveMood('excited');
              const praiseText = activeChar.praise[0].replace('{name}', childName);
              speakText(praiseText, soundEnabled, { characterId: activeChar.id });
              setTimeout(() => setActiveMood('happy'), 1500);
            }}
          >
            🌟 인사하기
          </JellyButton>
          <JellyButton
            size="sm"
            variant="primary"
            onClick={() => onOpenCharmVideo(activeChar.id)}
          >
            🎬 10초 매력 영상 보기
          </JellyButton>
        </div>
      </div>

      {/* All 7 Characters Selector Grid */}
      <div className="w-full my-3">
        <h3 className="text-lg sm:text-xl font-black text-[#4A3E3D] mb-2 flex items-center gap-1 break-keep">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF9E4A] shrink-0" /> 친구 고르기 (7마리 친구들)
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-3 w-full">
          {CHARACTER_LIST.map((char) => {
            const isSelected = char.id === selectedCharacter;

            return (
              <motion.button
                key={char.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleTouchCharacter(char.id)}
                className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-2xl border-2 sm:border-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-[#FF9E4A] ring-2 sm:ring-4 ring-[#FF9E4A]/40 shadow-md'
                    : 'bg-white/70 hover:bg-white border-[#FFE082]'
                }`}
              >
                <CharacterAvatar id={char.id} size="sm" mood={isSelected ? 'happy' : 'waving'} className="!w-9 !h-9 sm:!w-12 sm:!h-12" />
                <span className="text-xs sm:text-sm font-black text-[#4A3E3D] mt-0.5">{char.name}</span>
                <span className="text-[9px] sm:text-[10px] font-bold text-[#8C7B79]">{char.badge}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <JellyButton variant="primary" size="lg" onClick={onGoHome} className="w-full sm:w-auto mt-2">
        놀이하러 가기 🚀
      </JellyButton>
    </div>
  );
};
