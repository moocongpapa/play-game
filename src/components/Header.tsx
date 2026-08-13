import React from 'react';
import { Volume2, VolumeX, Music, Shield, Sparkles, Home } from 'lucide-react';
import { JellyButton } from './JellyButton';
import { CharacterAvatar } from './CharacterAvatar';
import { CharacterId, AgeGroup } from '../types';
import { CHARACTERS } from '../data/characters';
import { getAgeGroupEmoji, getAgeGroupLabel } from '../utils/ageEngine';

interface HeaderProps {
  stars: number;
  selectedCharacter: CharacterId;
  bgmEnabled: boolean;
  soundEnabled: boolean;
  onToggleBGM: () => void;
  onToggleSound: () => void;
  onOpenParentGate: () => void;
  onOpenStickerRoom: () => void;
  onOpenCharacterSelect: () => void;
  onGoHome: () => void;
  currentScreen: 'home' | 'game' | 'stickers' | 'talk' | 'parent';
  childName: string;
  ageGroup: AgeGroup;
}

export const Header: React.FC<HeaderProps> = ({
  stars,
  selectedCharacter,
  bgmEnabled,
  soundEnabled,
  onToggleBGM,
  onToggleSound,
  onOpenParentGate,
  onOpenStickerRoom,
  onOpenCharacterSelect,
  onGoHome,
  currentScreen,
  childName,
  ageGroup,
}) => {
  const currentBuddy = CHARACTERS[selectedCharacter];

  return (
    <header className="sticky top-0 z-30 w-full bg-[#FFF9E6]/95 backdrop-blur-md px-2.5 sm:px-4 py-2 border-b-2 border-[#FFE082]/60 shadow-xs flex items-center justify-between gap-1.5 max-w-full overflow-hidden">
      {/* Left: Home button & Buddy Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {currentScreen !== 'home' && (
          <JellyButton
            size="sm"
            variant="white"
            onClick={onGoHome}
            className="!px-2.5 !py-1.5 sm:!px-3 sm:!py-2 bg-amber-100 hover:bg-amber-200 border-amber-300"
          >
            <Home className="w-5 h-5 sm:w-6 sm:h-6 text-[#4A3E3D]" />
          </JellyButton>
        )}

        <button
          onClick={onOpenCharacterSelect}
          className="flex items-center gap-1.5 sm:gap-2 bg-white/90 hover:bg-white rounded-full px-2 py-1 sm:px-3 sm:py-1 border-2 border-[#FFD15C] shadow-xs cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <CharacterAvatar id={selectedCharacter} size="sm" mood="happy" className="!w-9 !h-9 sm:!w-12 sm:!h-12" />
          <div className="text-left hidden sm:block">
            <span className="text-[10px] text-[#8C7B79] block leading-none">{childName}의 친구</span>
            <span className="text-base font-black text-[#4A3E3D]">{currentBuddy?.name}</span>
          </div>
        </button>
      </div>

      {/* Middle: Stars / Rewards & Age Badge */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        <div
          onClick={onOpenStickerRoom}
          className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-[#FFF59D] to-[#FFD54F] px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full border-2 border-[#FFA000] shadow-sm cursor-pointer hover:scale-105 transition-transform shrink-0"
        >
          <span className="text-lg sm:text-2xl animate-bounce">🌟</span>
          <span className="text-base sm:text-xl font-black text-[#4A3E3D]">{stars}개</span>
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#E65100]" />
        </div>

        {/* Age Group Badge */}
        <div className="hidden xs:flex items-center gap-1 bg-[#FFF9E6] border-2 border-[#FFD15C] rounded-full px-3 py-1 text-xs font-black text-[#6D4C41] shadow-2xs">
          <span>{getAgeGroupEmoji(ageGroup)}</span>
          <span>{getAgeGroupLabel(ageGroup)}</span>
        </div>
      </div>

      {/* Right: Sound, Music, Sticker Room, Parent Gate */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <button
          onClick={onToggleBGM}
          title={bgmEnabled ? "배경음악 끄기" : "배경음악 켜기"}
          className={`p-1.5 sm:p-2.5 rounded-2xl border-2 transition-all cursor-pointer ${
            bgmEnabled
              ? 'bg-[#E3F2FD] border-[#42A5F5] text-[#1E88E5]'
              : 'bg-gray-100 border-gray-300 text-gray-400'
          }`}
        >
          <Music className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          onClick={onToggleSound}
          title={soundEnabled ? "효과음 끄기" : "효과음 켜기"}
          className={`p-1.5 sm:p-2.5 rounded-2xl border-2 transition-all cursor-pointer ${
            soundEnabled
              ? 'bg-[#FFF3E0] border-[#FFA726] text-[#FB8C00]'
              : 'bg-gray-100 border-gray-300 text-gray-400'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        <JellyButton
          size="sm"
          variant="pink"
          onClick={onOpenStickerRoom}
          className="!px-2.5 !py-1.5 sm:!px-3 sm:!py-2 font-bold text-xs sm:text-sm"
        >
          🎨 <span className="hidden xs:inline">스티커북</span>
        </JellyButton>

        <button
          onClick={onOpenParentGate}
          title="부모님 설정"
          className="p-1.5 sm:p-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 text-[#4A3E3D] transition-all cursor-pointer"
        >
          <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </header>
  );
};
