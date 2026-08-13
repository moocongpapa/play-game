import React from 'react';
import { motion } from 'motion/react';
import { CHARACTER_LIST, CHARACTERS } from '../data/characters';
import { CharacterId, GameId, ChildProfile } from '../types';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { CHARACTER_THEMES } from '../theme/colors';
import { speakText } from '../utils/soundEngine';
import { getAgeGroupEmoji, getAgeGroupLabel } from '../utils/ageEngine';
import { Play, Palette, MessageCircleHeart, Film, Volume2, Sparkles, Lock } from 'lucide-react';

interface HomeScreenProps {
  selectedCharacter: CharacterId;
  onSelectCharacter: (id: CharacterId) => void;
  onStartGame: (gameId: GameId, characterId: CharacterId) => void;
  onOpenStickerRoom: () => void;
  onOpenCharacterTalk: () => void;
  onOpenCharmVideo: (characterId?: CharacterId) => void;
  soundEnabled: boolean;
  childProfile: ChildProfile | null;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  selectedCharacter,
  onSelectCharacter,
  onStartGame,
  onOpenStickerRoom,
  onOpenCharacterTalk,
  onOpenCharmVideo,
  soundEnabled,
  childProfile,
}) => {
  const currentBuddy = CHARACTERS[selectedCharacter] || CHARACTERS.ggomi;
  const childName = childProfile?.name || '유하';
  const ageGroup = childProfile?.ageGroup || 'sprout';

  const AGE_RANK: Record<string, number> = { baby: 0, sprout: 1, bloom: 2, star: 3 };
  const currentRank = AGE_RANK[ageGroup];

  const handleBuddyGreeting = () => {
    const greeting = currentBuddy.greetingTemplate.replace('{name}', childName);
    speakText(greeting, soundEnabled, { characterId: selectedCharacter });
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-2 sm:p-3 space-y-2.5 sm:space-y-3 overflow-hidden select-none">
      {/* Top Welcome Title Banner for Child */}
      <div className="w-full text-center bg-white/90 py-3 px-4 rounded-2xl border-2 border-amber-300 shadow-2xs flex flex-col sm:flex-row items-center justify-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xl">{getAgeGroupEmoji(ageGroup)}</span>
          <span className="bg-amber-100 text-amber-800 text-xs font-black px-2 py-0.5 rounded-md">
            {getAgeGroupLabel(ageGroup)}
          </span>
        </div>
        <h1 className="text-base sm:text-lg font-black text-[#4A3E3D] flex items-center gap-1">
          <span>{childName}야, 어떤 동물 친구와 놀아볼까?</span>
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
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

      {/* 7 Characters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
        {CHARACTER_LIST.map((char) => {
          const theme = CHARACTER_THEMES[char.id as keyof typeof CHARACTER_THEMES] || CHARACTER_THEMES.ggomi;
          const isSelected = char.id === selectedCharacter;
          
          // 서브 게임 해금 여부 계산
          const hasSubGame = !!char.subGameId;
          const minRank = AGE_RANK[char.subGameMinAgeGroup || 'baby'];
          const isSubGameUnlocked = currentRank >= minRank;

          return (
            <motion.div
              key={`compact-card-${char.id}`}
              whileHover={{ scale: 1.02 }}
              style={{ backgroundColor: theme.light, borderColor: isSelected ? theme.main : theme.border }}
              className={`relative p-3 rounded-[32px] border-3 shadow-xs flex flex-col justify-between cursor-pointer transition-all ${
                isSelected ? 'ring-3 ring-amber-400' : ''
              }`}
              onClick={() => {
                onSelectCharacter(char.id);
                const greeting = char.greetingTemplate.replace('{name}', childName);
                speakText(greeting, soundEnabled, { characterId: char.id });
              }}
            >
              {/* Character Header Info */}
              <div className="flex items-center gap-3 w-full">
                <CharacterAvatar id={char.id} size="md" mood="happy" className="!w-16 !h-16 shrink-0 shadow-xs rounded-full bg-white/50" />
                <div className="text-left min-w-0">
                  <span className="text-xs font-bold text-[#8C7B79] block leading-none mb-0.5">{char.badge} {char.name}</span>
                  <span className="text-sm font-black text-[#4A3E3D] block truncate">{char.gameTitle}</span>
                </div>
              </div>

              {/* Main Game Description */}
              <p className="text-xs text-[#8C7B79] text-left mt-2 leading-relaxed bg-white/60 p-2 rounded-xl border border-amber-100">
                {char.gameDesc}
              </p>

              {/* Action Buttons: Main Game / Video / Sub Game */}
              <div className="flex flex-col gap-1.5 mt-3 pt-2 border-t border-amber-200/60">
                <div className="flex gap-1 w-full">
                  {/* Watch Video Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCharmVideo(char.id);
                    }}
                    className="flex-1 py-2 bg-white hover:bg-rose-50 text-rose-600 font-black text-xs rounded-xl border border-rose-200 shadow-2xs flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform"
                    title="10초 매력 쇼츠 영상"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>🎬 영상</span>
                  </button>

                  {/* Play Main Game Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCharacter(char.id);
                      onStartGame(char.gameId, char.id);
                    }}
                    style={{ backgroundColor: theme.main }}
                    className="flex-1 py-2 text-white font-black text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform hover:brightness-105"
                    title="기본 놀이 시작"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>🎮 기본놀이</span>
                  </button>
                </div>

                {/* Sub Game Button (연령에 따라 잠금 여부 분기) */}
                {hasSubGame && (
                  <button
                    disabled={!isSubGameUnlocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (char.subGameId) {
                        onSelectCharacter(char.id);
                        onStartGame(char.subGameId, char.id);
                      }
                    }}
                    className={`w-full py-2 font-black text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                      isSubGameUnlocked
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-purple-600 hover:brightness-110 active:scale-98'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    {isSubGameUnlocked ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
                        <span>🧩 맞춤놀이: {char.subGameTitle}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                        <span>🔒 {getAgeGroupLabel(char.subGameMinAgeGroup || 'baby')} 이상 가능</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
