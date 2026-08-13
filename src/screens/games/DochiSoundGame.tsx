import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SOUND_ITEMS } from '../../data/gameData';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JellyButton } from '../../components/JellyButton';
import { speakText, playCorrectFanfare, playWrongBoing, playCharacterVoiceSFX } from '../../utils/soundEngine';
import { Volume2, RefreshCw } from 'lucide-react';

interface DochiSoundGameProps {
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
}

export const DochiSoundGame: React.FC<DochiSoundGameProps> = ({
  onCompleteQuiz,
  soundEnabled,
}) => {
  const [targetItem, setTargetItem] = useState(SOUND_ITEMS[0]);
  const [options, setOptions] = useState<typeof SOUND_ITEMS>([]);
  const [shakingCardId, setShakingCardId] = useState<string | null>(null);
  const [selectedCorrectId, setSelectedCorrectId] = useState<string | null>(null);

  const generateRound = () => {
    setSelectedCorrectId(null);
    setShakingCardId(null);
    const target = SOUND_ITEMS[Math.floor(Math.random() * SOUND_ITEMS.length)];
    setTargetItem(target);

    const distractors = SOUND_ITEMS.filter((item) => item.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    const roundOptions = [target, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(roundOptions);

    if (soundEnabled) {
      speakText(`도치가 소리를 들려줄게요! "${target.soundText}" 이 소리의 주인은 누구일까요?`, soundEnabled, { characterId: 'dochi' });
    }
  };

  useEffect(() => {
    generateRound();
  }, []);

  const handlePlaySoundClue = () => {
    speakText(`"${targetItem.soundText}" 소리를 가진 친구는 누구일까요?`, soundEnabled, { characterId: 'dochi' });
  };

  const handleSelectCard = (item: typeof SOUND_ITEMS[0]) => {
    if (selectedCorrectId) return;

    if (item.id === targetItem.id) {
      setSelectedCorrectId(item.id);
      playCorrectFanfare(soundEnabled);
      speakText(`딩동댕! 정답이에요! ${item.name}!`, soundEnabled, { characterId: 'dochi' });
      onCompleteQuiz(2);
    } else {
      setShakingCardId(item.id);
      playWrongBoing(soundEnabled);
      speakText(`다시 소리를 들어보아요!`, soundEnabled, { characterId: 'dochi' });
      setTimeout(() => setShakingCardId(null), 600);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-2xl mx-auto p-2.5 sm:p-4 min-h-[80vh] overflow-hidden">
      {/* Top Banner */}
      <div className="w-full bg-gradient-to-r from-[#FFE0B2] to-[#FFF3E0] p-3.5 sm:p-4 rounded-3xl border-3 border-[#FFA726] shadow-sm flex items-center gap-3 sm:gap-4">
        <CharacterAvatar id="dochi" size="md" mood={selectedCorrectId ? 'excited' : 'waving'} className="!w-16 !h-16 sm:!w-24 sm:!h-24 shrink-0" />
        <div className="flex-1 min-w-0 break-keep">
          <div className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-black text-[#E65100] mb-1">
            <span>🦔 도치의 소리 귀쫑긋 퀴즈</span>
          </div>
          <h2 className="text-base sm:text-2xl font-black text-[#4A3E3D] leading-snug break-keep">
            &ldquo;<span className="text-[#FB8C00] underline">{targetItem.soundText}</span>&rdquo;
          </h2>
        </div>
        <button
          onClick={handlePlaySoundClue}
          className="p-3 bg-gradient-to-b from-[#FFA726] to-[#FB8C00] text-white rounded-full shadow-md active:scale-90 transition-transform cursor-pointer shrink-0"
        >
          <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Sound Speaker Animation Box */}
      <div className="my-3 sm:my-4 p-4 sm:p-5 bg-white rounded-3xl border-3 sm:border-4 border-[#FFE0B2] shadow-sm flex flex-col items-center justify-center text-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          onClick={handlePlaySoundClue}
          className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-[#FFE0B2] to-[#FFF8EE] rounded-full flex items-center justify-center text-3xl sm:text-4xl shadow-md cursor-pointer border-2 border-[#FFA726]"
        >
          🔊
        </motion.div>
        <p className="text-xs sm:text-sm font-bold text-[#8C7B79] mt-2 break-keep">
          위 스피커를 누르면 소리를 다시 들을 수 있어요!
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full my-3 sm:my-4">
        {options.map((item) => {
          const isShaking = shakingCardId === item.id;
          const isSolved = selectedCorrectId === item.id;

          return (
            <motion.div
              key={item.id}
              animate={isShaking ? { x: [-10, 10, -8, 8, 0] } : isSolved ? { scale: 1.05 } : { scale: 1 }}
              transition={{ duration: 0.5 }}
              onClick={() => handleSelectCard(item)}
              className={`flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl border-3 sm:border-4 cursor-pointer select-none transition-all shadow-md touch-manipulation min-h-[130px] sm:min-h-[160px] ${
                isSolved
                  ? 'bg-[#E8F5E9] border-[#66BB6A]'
                  : 'bg-white hover:bg-[#FFF8EE] border-[#FFE0B2]'
              }`}
            >
              <span className="text-5xl sm:text-6xl mb-1 sm:mb-2">{item.emoji}</span>
              <span className="text-lg sm:text-xl font-black text-[#4A3E3D]">{item.name}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 w-full">
        {selectedCorrectId ? (
          <JellyButton variant="yellow" size="lg" onClick={generateRound} className="w-full sm:w-auto">
            다음 소리 듣기 🦔
          </JellyButton>
        ) : (
          <JellyButton variant="white" size="md" onClick={generateRound} className="!px-4">
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" /> 다른 문제
          </JellyButton>
        )}
      </div>
    </div>
  );
};
