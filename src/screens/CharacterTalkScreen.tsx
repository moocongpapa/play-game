import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MessageCircle, Sparkles, Volume2 } from 'lucide-react';
import { CHARACTER_LIST } from '../data/characters';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { speakText } from '../utils/soundEngine';
import type { CharacterId } from '../types';

interface CharacterTalkScreenProps {
  selectedCharacter: CharacterId;
  onSelectCharacter: (id: CharacterId) => void;
  onGoHome: () => void;
  soundEnabled: boolean;
  childName: string;
}

export const CharacterTalkScreen: React.FC<CharacterTalkScreenProps> = ({
  selectedCharacter,
  onSelectCharacter,
  onGoHome,
  soundEnabled,
  childName,
}) => {
  const [activeMood, setActiveMood] = useState<'happy' | 'dancing' | 'waving' | 'excited'>('happy');
  const moodTimer = useRef<number | null>(null);
  const activeChar = CHARACTER_LIST.find((char) => char.id === selectedCharacter) || CHARACTER_LIST[0];
  const greeting = activeChar.greetingTemplate.replace('{name}', childName);

  useEffect(() => () => {
    if (moodTimer.current !== null) window.clearTimeout(moodTimer.current);
  }, []);

  const animateMood = (mood: 'dancing' | 'waving' | 'excited') => {
    if (moodTimer.current !== null) window.clearTimeout(moodTimer.current);
    setActiveMood(mood);
    moodTimer.current = window.setTimeout(() => setActiveMood('happy'), 1500);
  };

  const selectFriend = (id: CharacterId) => {
    onSelectCharacter(id);
    animateMood('waving');
    const friend = CHARACTER_LIST.find((char) => char.id === id);
    if (friend) speakText(friend.greetingTemplate.replace('{name}', childName), soundEnabled, { characterId: id });
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-7 pb-8">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf0e7] px-3 py-1 text-sm font-bold text-[#536f57]"><MessageCircle className="size-4" /> 친구와 인사하기</span>
        <h1 className="mt-3 text-[28px] font-extrabold tracking-tight text-[#292c33] sm:text-4xl">{childName}야, 누구와 이야기할까?</h1>
        <p className="mt-2 text-base text-[#777980]">친구를 고르면 반갑게 인사해 줄 거야.</p>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-3" aria-label="인사할 친구 고르기">
        {CHARACTER_LIST.map((char) => (
          <button
            key={char.id}
            aria-pressed={char.id === selectedCharacter}
            onClick={() => selectFriend(char.id)}
            className={`flex min-h-26 flex-col items-center justify-center gap-1.5 rounded-[20px] border-2 px-1 py-3 active:scale-95 ${char.id === selectedCharacter ? 'border-[#343943] bg-white shadow-md' : 'border-transparent bg-[#f4f4f2] hover:bg-white'}`}
          >
            <CharacterAvatar id={char.id} size="sm" mood="happy" className="!size-14 sm:!size-16" />
            <span className="text-sm font-bold text-[#343943]">{char.name}</span>
          </button>
        ))}
      </div>

      <section className="flex flex-col items-center rounded-[28px] border border-[#e9e7e2] bg-white px-5 py-8 text-center sm:px-8">
        <span className="text-sm font-bold text-[#777980]">지금 만난 친구</span>
        <button onClick={() => selectFriend(activeChar.id)} aria-label={`${activeChar.name} 인사 듣기`} className="mt-4 rounded-full bg-[#f7f7f5] p-4 hover:bg-[#eaf0e7]">
          <CharacterAvatar id={activeChar.id} size="xl" mood={activeMood} className="!size-36 sm:!size-48" />
        </button>
        <h2 className="mt-4 text-2xl font-extrabold text-[#292c33]">{activeChar.name}</h2>
        <p className="mt-3 max-w-xl rounded-[20px] bg-[#f7f7f5] px-5 py-4 text-base font-semibold leading-relaxed text-[#4d5562] sm:text-lg">“{greeting}”</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button onClick={() => selectFriend(activeChar.id)} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#eaf0e7] px-5 font-bold text-[#48634d] hover:bg-[#dfe9db]"><Volume2 className="size-5" /> 인사 듣기</button>
          <button onClick={() => {
            animateMood('dancing');
            speakText(`${activeChar.name}가 신나게 춤을 춰요!`, soundEnabled, { characterId: activeChar.id });
          }} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#f5efe6] px-5 font-bold text-[#876c4b] hover:bg-[#eee3d3]"><Sparkles className="size-5" /> 춤추기</button>
        </div>
      </section>

      <button onClick={onGoHome} className="inline-flex min-h-12 items-center justify-center gap-2 self-center rounded-xl px-5 font-bold text-[#4d5562] hover:bg-[#ecece9]"><ArrowLeft className="size-5" /> 다른 놀이 보기</button>
    </div>
  );
};
