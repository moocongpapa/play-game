import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, MessageCircle, Palette, Play, Sparkles, Volume2 } from 'lucide-react';
import { CHARACTER_LIST, CHARACTERS } from '../data/characters';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { getAgeGroupLabel } from '../utils/ageEngine';
import { speakText } from '../utils/soundEngine';
import type { ChildProfile, CharacterId, GameId } from '../types';

interface HomeScreenProps {
  selectedCharacter: CharacterId;
  onSelectCharacter: (id: CharacterId) => void;
  onStartGame: (gameId: GameId, characterId: CharacterId) => void;
  onOpenDrawing: () => void;
  onOpenStickerRoom: () => void;
  onOpenCharacterTalk: () => void;
  soundEnabled: boolean;
  childProfile: ChildProfile | null;
}

const AGE_RANK = { baby: 0, sprout: 1, bloom: 2, star: 3 };

const GAME_LABELS: Record<GameId, string> = {
  object_recognition: '이름 찾기',
  shape_color: '모양과 색 찾기',
  korean_letters: '한글 비누방울',
  sound_quiz: '소리 듣고 찾기',
  counting_food: '맛있는 수 세기',
  cloud_shapes: '구름 모양 찾기',
  treasure_hunt: '숨은 보물 찾기',
  emotion_quiz: '표정 맞히기',
  pattern_sequence: '무늬 이어 보기',
  word_puzzle: '단어 만들기',
  rhythm_game: '리듬 따라 하기',
  size_comparison: '큰 것, 작은 것',
  memory_card: '같은 그림 찾기',
  shadow_quiz: '그림자 찾기',
  stage_adventure: '무지개 모험',
  balloon_pop: '풍선 팡팡',
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  selectedCharacter,
  onSelectCharacter,
  onStartGame,
  onOpenDrawing,
  onOpenStickerRoom,
  onOpenCharacterTalk,
  soundEnabled,
  childProfile,
}) => {
  const gamesRef = useRef<HTMLElement>(null);
  const [speechMessage, setSpeechMessage] = useState('');
  const buddy = CHARACTERS[selectedCharacter] || CHARACTERS.ggomi;
  const childName = childProfile?.name || '유하';
  const ageGroup = childProfile?.ageGroup || 'sprout';
  const currentRank = AGE_RANK[ageGroup];

  useEffect(() => {
    if (!soundEnabled) setSpeechMessage('');
  }, [soundEnabled]);

  const games: Array<{ id: GameId; description: string }> = [
    { id: buddy.gameId, description: buddy.gameDesc },
  ];

  if (buddy.subGameId && currentRank >= AGE_RANK[buddy.subGameMinAgeGroup || 'baby']) {
    games.push({ id: buddy.subGameId, description: buddy.subGameDesc || '' });
  }
  if (selectedCharacter === 'ggulgguli') {
    games.push({ id: 'balloon_pop', description: '떠오르는 풍선을 손가락으로 터뜨려요.' });
  }
  if (selectedCharacter === 'ggomi' && currentRank >= AGE_RANK.sprout) {
    games.push({ id: 'stage_adventure', description: '친구들과 네 가지 놀이를 차례로 해봐요.' });
  }

  const sayHello = () => {
    if (!soundEnabled) return;
    setSpeechMessage('목소리를 준비하고 있어요.');
    speakText(
      buddy.greetingTemplate.replace('{name}', childName),
      soundEnabled,
      {
        characterId: selectedCharacter,
        onStart: () => setSpeechMessage('친구가 말하고 있어요.'),
        onEnd: () => setSpeechMessage(''),
        onError: () => setSpeechMessage('브라우저 음성과 기기 소리 설정을 확인해 주세요.'),
      },
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-8 sm:gap-10">
      <section className="rounded-[28px] bg-[#f3f0e9] px-5 py-7 sm:px-9 sm:py-9">
        <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-bold text-[#77705f]">
          {getAgeGroupLabel(ageGroup)} · {childName}의 놀이터
        </span>
        <h1 className="mt-4 text-[28px] font-extrabold leading-tight tracking-tight text-[#292c33] sm:text-4xl">
          {childName}야, 오늘은 뭐 하고 놀까?
        </h1>
        <p className="mt-2 text-base text-[#6e7077] sm:text-lg">좋아하는 친구를 고르고, 놀이를 시작해 봐.</p>
      </section>

      <section aria-labelledby="quick-play-title">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.12em] text-[#9a806b]">{childName}를 위한 놀이</p>
            <h2 id="quick-play-title" className="mt-1 text-xl font-extrabold text-[#292c33] sm:text-2xl">바로 놀기</h2>
          </div>
          <span className="text-sm text-[#777980]">손으로 톡, 쉽게 시작해요</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            onClick={() => onStartGame('balloon_pop', 'ggulgguli')}
            className="group flex min-h-28 items-center gap-4 rounded-[24px] bg-[#fceee7] p-5 text-left transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <span aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white text-4xl">🎈</span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#99634f]">꿀꿀이와</span><span className="mt-1 block text-xl font-extrabold text-[#292c33]">풍선 팡팡</span></span>
            <ArrowRight className="size-5 shrink-0 text-[#99634f]" />
          </button>
          <button
            onClick={() => onStartGame(ageGroup === 'baby' ? 'object_recognition' : 'stage_adventure', 'ggomi')}
            className="group flex min-h-28 items-center gap-4 rounded-[24px] bg-[#edf2eb] p-5 text-left transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <span aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white text-4xl">{ageGroup === 'baby' ? '🍎' : '🌈'}</span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#5c8068]">꼬미와</span><span className="mt-1 block text-xl font-extrabold text-[#292c33]">{ageGroup === 'baby' ? '이름 찾기' : '무지개 모험'}</span></span>
            <ArrowRight className="size-5 shrink-0 text-[#5c8068]" />
          </button>
          <button
            onClick={onOpenDrawing}
            className="group flex min-h-28 items-center gap-4 rounded-[24px] bg-[#eeeefa] p-5 text-left transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <span aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white"><Palette className="size-8 text-[#7770ae]" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#7770ae]">마음대로</span><span className="mt-1 block text-xl font-extrabold text-[#292c33]">색칠하기</span></span>
            <ArrowRight className="size-5 shrink-0 text-[#7770ae]" />
          </button>
        </div>
      </section>

      <section aria-labelledby="friends-title">
        <div className="mb-4">
          <h2 id="friends-title" className="text-xl font-extrabold text-[#292c33] sm:text-2xl">친구를 골라요</h2>
          <p className="mt-1 text-sm text-[#777980]">친구마다 다른 놀이가 있어요.</p>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-3">
          {CHARACTER_LIST.map((char) => {
            const selected = char.id === selectedCharacter;
            return (
              <button
                key={char.id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  onSelectCharacter(char.id);
                  if (window.innerWidth < 640) {
                    requestAnimationFrame(() => gamesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
                  }
                }}
                className={`flex min-h-26 flex-col items-center justify-center gap-1.5 rounded-[20px] border-2 px-1 py-3 transition-all active:scale-95 ${selected ? 'border-[#343943] bg-white shadow-md' : 'border-transparent bg-[#f4f4f2] hover:bg-white'}`}
              >
                <CharacterAvatar id={char.id} size="sm" mood="happy" className="!size-14 sm:!size-16" />
                <span className="text-sm font-bold text-[#343943]">{char.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section ref={gamesRef} aria-live="polite" className="grid scroll-mt-20 overflow-hidden rounded-[28px] border border-[#e9e7e2] bg-white lg:grid-cols-[280px_1fr]">
        <div className="flex items-center gap-5 bg-[#f8f6f2] p-6 lg:flex-col lg:justify-center lg:p-8">
          <CharacterAvatar id={buddy.id} size="xl" mood="happy" className="!size-24 shrink-0 sm:!size-32" />
          <div className="min-w-0 lg:text-center">
            <p className="text-sm font-semibold text-[#777980]">오늘의 친구</p>
            <h2 className="mt-1 text-2xl font-extrabold text-[#292c33]">{buddy.name}</h2>
            <button onClick={sayHello} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[#4d5562] shadow-sm hover:bg-[#eceff2]">
              <Volume2 className="size-4" /> 인사 듣기
            </button>
            <p role="status" className="mt-2 min-h-5 text-sm text-[#777980]">{soundEnabled ? speechMessage : '오른쪽 위에서 소리와 음성을 켜 주세요.'}</p>
          </div>
        </div>
        <div className="p-5 sm:p-7">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="size-5 text-[#6b7567]" />
            <h3 className="text-lg font-extrabold text-[#292c33]">{buddy.name}와 하는 놀이</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {games.map((game, index) => (
              <button
                key={game.id}
                onClick={() => onStartGame(game.id, buddy.id)}
                className="group flex min-h-23 items-center gap-4 rounded-[18px] border border-[#e8e7e3] bg-white px-4 py-3 text-left transition-colors hover:border-[#b5baa9] hover:bg-[#fbfcf8] active:bg-[#f3f5ef]"
              >
                <span className={`grid size-12 shrink-0 place-items-center rounded-xl text-sm font-extrabold ${index === 0 ? 'bg-[#e8efe6] text-[#57765a]' : 'bg-[#f4eee8] text-[#936b50]'}`}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-extrabold text-[#292c33]">{GAME_LABELS[game.id]}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-[#777980]">{game.description}</span>
                </span>
                <Play className="size-4 shrink-0 fill-current text-[#737c71]" />
              </button>
            ))}
          </div>
          {buddy.subGameId && currentRank < AGE_RANK[buddy.subGameMinAgeGroup || 'baby'] && (
            <p className="mt-4 text-sm text-[#8b8d92]">{GAME_LABELS[buddy.subGameId]}는 {getAgeGroupLabel(buddy.subGameMinAgeGroup || 'baby')}부터 만날 수 있어요.</p>
          )}
        </div>
      </section>

      <nav aria-label="다른 놀이" className="grid gap-3 sm:grid-cols-2">
        <button onClick={onOpenStickerRoom} className="flex min-h-16 items-center gap-3 rounded-[20px] bg-white px-5 text-left font-bold text-[#3d424b] shadow-sm hover:bg-[#f8f6f2]">
          <Sparkles className="size-5 text-[#9a806b]" /> 내 스티커북 <ArrowRight className="ml-auto size-4 text-[#9a806b]" />
        </button>
        <button onClick={onOpenCharacterTalk} className="flex min-h-16 items-center gap-3 rounded-[20px] bg-white px-5 text-left font-bold text-[#3d424b] shadow-sm hover:bg-[#f8f6f2]">
          <MessageCircle className="size-5 text-[#738871]" /> 친구와 인사하기 <ArrowRight className="ml-auto size-4 text-[#738871]" />
        </button>
      </nav>
    </div>
  );
};
