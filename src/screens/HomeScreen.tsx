import React from 'react';
import { motion } from 'motion/react';
import { CHARACTER_LIST, CHARACTERS } from '../data/characters';
import { CharacterId, GameId } from '../types';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { CHARACTER_THEMES } from '../theme/colors';
import { speakText } from '../utils/soundEngine';
import { Play, Palette, MessageCircleHeart, Film, Volume2 } from 'lucide-react';

interface HomeScreenProps {
  selectedCharacter: CharacterId;
  onSelectCharacter: (id: CharacterId) => void;
  onStartGame: (gameId: GameId, characterId: CharacterId) => void;
  onOpenStickerRoom: () => void;
  onOpenCharacterTalk: () => void;
  onOpenCharmVideo: (characterId?: CharacterId) => void;
  soundEnabled: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  selectedCharacter,
  onSelectCharacter,
  onStartGame,
  onOpenStickerRoom,
  onOpenCharacterTalk,
  onOpenCharmVideo,
  soundEnabled,
}) => {
  const currentBuddy = CHARACTERS[selectedCharacter] || CHARACTERS.ggomi;

  const handleBuddyGreeting = () => {
    speakText(currentBuddy.greeting, soundEnabled, { characterId: selectedCharacter });
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-2 sm:p-3 space-y-2.5 sm:space-y-3 overflow-hidden select-none">
      {/* Top Welcome Title Banner for Yuha */}
      <div className="w-full text-center bg-white/90 py-2 px-3 rounded-2xl border-2 border-amber-300 shadow-2xs">
        <h1 className="text-base sm:text-lg font-black text-[#4A3E3D] flex items-center justify-center gap-1.5">
          <span>✨</span>
          <span>유하야, 어떤 동물 친구와 놀아볼까?</span>
          <span>🎈</span>
        </h1>
      </div>

      {/* Compact Top Action Bar */}
      <div className="w-full bg-gradient-to-r from-amber-200 via-orange-200 to-amber-300 p-2 sm:p-3 rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-amber-400 shadow-sm flex items-center justify-between gap-2">
        {/* Active Buddy Avatar & Sound Touch */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBuddyGreeting}
          className="flex items-center gap-2 cursor-pointer bg-white/80 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-amber-300 shadow-2xs"
        >
          <CharacterAvatar id={selectedCharacter} size="sm" mood="happy" className="!w-9 !h-9 sm:!w-11 sm:!h-11" />
          <span className="text-base sm:text-xl font-black text-[#4A3E3D] flex items-center gap-1">
            {currentBuddy.badge} {currentBuddy.name}
            <Volume2 className="w-4 h-4 text-amber-600 animate-pulse" />
          </span>
        </motion.div>

        {/* Action Icon Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Active Buddy Video Button */}
          <button
            onClick={() => onOpenCharmVideo(selectedCharacter)}
            className="p-2 sm:px-3 sm:py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-black text-xs sm:text-sm shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
            title="영상 보기"
          >
            <Film className="w-4 h-4 text-pink-200" />
            <span className="hidden sm:inline">🎬 영상</span>
          </button>

          {/* Sticker Book Button */}
          <button
            onClick={onOpenStickerRoom}
            className="p-2 sm:px-3 sm:py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full font-black text-xs sm:text-sm shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
            title="스티커북"
          >
            <Palette className="w-4 h-4 text-purple-200" />
            <span className="hidden sm:inline">🎨 스티커</span>
          </button>

          {/* Character Talk Button */}
          <button
            onClick={onOpenCharacterTalk}
            className="p-2 sm:px-3 sm:py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-black text-xs sm:text-sm shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
            title="친구 대화"
          >
            <MessageCircleHeart className="w-4 h-4 text-emerald-200" />
            <span className="hidden sm:inline">💬 대화</span>
          </button>
        </div>
      </div>

      {/* 7 Characters Compact Grid - All fit cleanly on one page! */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-2.5 w-full">
        {CHARACTER_LIST.map((char) => {
          const theme = CHARACTER_THEMES[char.id as keyof typeof CHARACTER_THEMES] || CHARACTER_THEMES.ggomi;
          const isSelected = char.id === selectedCharacter;

          return (
            <motion.div
              key={`compact-card-${char.id}`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              style={{ backgroundColor: theme.light, borderColor: isSelected ? theme.main : theme.border }}
              className={`relative p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl border-2 sm:border-3 shadow-xs flex flex-col items-center justify-between cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-amber-400 scale-[1.02]' : ''
              }`}
            >
              {/* Character Avatar & Emoji */}
              <div
                className="flex flex-col items-center w-full cursor-pointer"
                onClick={() => {
                  onSelectCharacter(char.id);
                  speakText(char.greeting, soundEnabled, { characterId: char.id });
                }}
              >
                <CharacterAvatar id={char.id} size="md" mood="happy" className="!w-14 !h-14 sm:!w-16 sm:!h-16" />
                <span className="text-xs sm:text-sm font-black text-[#4A3E3D] mt-1 flex items-center gap-0.5 truncate">
                  <span>{char.badge}</span>
                  <span>{char.name}</span>
                </span>
              </div>

              {/* Action Buttons: Play Game (🎮) & Watch Video (🎬) */}
              <div className="flex items-center justify-center gap-1 w-full mt-2 pt-1.5 border-t border-amber-200/60">
                {/* Watch Video Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCharmVideo(char.id);
                  }}
                  className="flex-1 py-1.5 bg-white hover:bg-rose-50 text-rose-600 font-black text-xs rounded-xl border border-rose-200 shadow-2xs flex items-center justify-center gap-0.5 cursor-pointer active:scale-95 transition-transform"
                  title="영상"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span className="text-[11px]">🎬</span>
                </button>

                {/* Play Game Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCharacter(char.id);
                    onStartGame(char.gameId, char.id);
                  }}
                  style={{ backgroundColor: theme.main }}
                  className="flex-1 py-1.5 text-white font-black text-xs rounded-xl shadow-2xs flex items-center justify-center gap-0.5 cursor-pointer active:scale-95 transition-transform hover:brightness-105"
                  title="놀이 시작"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span className="text-[11px]">🎮</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
