import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Hand, MessageCircle, Palette, Play, Volume2 } from 'lucide-react';
import { CHARACTER_LIST, CHARACTERS } from '../data/characters';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { BuddyVideo } from '../components/BuddyVideo';
import { GameArtwork } from '../components/GameArtwork';
import { ToyArtwork } from '../components/ToyArtwork';
import { availableGameIds, GAME_CATALOG } from '../data/gameCatalog';
import { playJellyTap, speakText, stopAllSpeech } from '../utils/soundEngine';
import type { ChildProfile, CharacterId, GameId } from '../types';

export type HomeStep = 'friends' | 'games';
interface HomeScreenProps {
  selectedCharacter: CharacterId;
  onSelectCharacter: (id: CharacterId) => void;
  onStartGame: (gameId: GameId, characterId: CharacterId) => void;
  onOpenDrawing: () => void;
  onOpenStickerRoom: () => void;
  onOpenCharacterTalk: () => void;
  soundEnabled: boolean;
  childProfile: ChildProfile | null;
  step: HomeStep;
  onChangeStep: (step: HomeStep) => void;
  page: number;
  onChangePage: (page: number) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ selectedCharacter, onSelectCharacter, onStartGame, onOpenDrawing, onOpenStickerRoom, onOpenCharacterTalk, soundEnabled, childProfile, step, onChangeStep, page, onChangePage }) => {
  const buddy = CHARACTERS[selectedCharacter] || CHARACTERS.ggomi;
  const childName = childProfile?.name || '유하';
  const age = childProfile?.ageGroup || 'sprout';
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [hasNavigated, setHasNavigated] = useState(false);
  const available = availableGameIds(age);
  const preferred = ([buddy.gameId, buddy.subGameId, 'balloon_pop', 'stage_adventure'] as Array<GameId | undefined>).filter((id): id is GameId => Boolean(id) && available.includes(id!));
  const games = [...new Set([...preferred, ...available])];
  const pageCount = Math.ceil(games.length / 4);
  const safePage = Math.min(page, pageCount - 1);
  const currentGames = games.slice(safePage * 4, safePage * 4 + 4);

  useEffect(() => () => stopAllSpeech(), []);
  useEffect(() => {
    if (hasNavigated) headingRef.current?.focus({ preventScroll: true });
  }, [step, hasNavigated]);

  const chooseFriend = (id: CharacterId) => {
    playJellyTap(soundEnabled);
    onSelectCharacter(id);
    onChangePage(0);
    onChangeStep('games');
    setHasNavigated(true);
    window.scrollTo({ top: 0 });
    speakText(`${childName}야, ${CHARACTERS[id].name}랑 같이 놀자! 어떤 게임 해볼까? 그림을 눌러봐.`, soundEnabled, { characterId: id });
  };
  const changePage = (next: number) => {
    playJellyTap(soundEnabled);
    onChangePage(next);
    speakText('또 다른 놀이가 있어! 하고 싶은 그림을 눌러봐.', soundEnabled, { characterId: selectedCharacter });
  };

  return <div className={`storybook-home home-${step}`}>
    <section className="welcome-scene">
      <div className="welcome-copy">
        <p className="eyebrow"><span /> {childName}의 작은 놀이숲</p>
        <h1 ref={headingRef} tabIndex={-1}>{step === 'friends' ? <>같이 놀 친구를<br />선택해줘~</> : <>어떤 게임<br />해볼까?</>}</h1>
        <p className="welcome-subtitle">{step === 'friends' ? '마음에 드는 친구를 콕!' : `${buddy.name}랑 함께, 하고 싶은 그림을 콕!`}</p>
        <button className="voice-pill" aria-label="선택 방법 다시 듣기" disabled={!soundEnabled} onClick={() => speakText(step === 'friends' ? `${childName}야, 같이 놀 친구를 골라줘!` : '어떤 게임 해볼까? 하고 싶은 그림을 눌러봐!', soundEnabled, { characterId: selectedCharacter })}><Volume2 size={21} /><span>들어봐</span></button>
      </div>
      <div className="welcome-friends" aria-hidden="true">
        {step === 'friends' ? <><CharacterAvatar id="jelly" size="xl" mood="waving" className="hero-bunny" /><CharacterAvatar id="ggomi" size="2xl" mood="waving" className="hero-bear" /><CharacterAvatar id="rano" size="xl" mood="happy" className="hero-dino" /></> : <><div className="selected-buddy-halo"><BuddyVideo key={selectedCharacter} id={selectedCharacter} /><span><Check size={18} /> {buddy.name}</span></div><ToyArtwork emoji="⭐" className="hero-star" /></>}
      </div>
      <span className="welcome-cloud" aria-hidden="true" />
    </section>

    {step === 'friends' ? <section aria-label="같이 놀 친구 선택" className="friend-section">
      <div className="section-heading"><span className="step-badge"><Hand size={22} /></span><h2>누구랑 놀까?</h2><span className="section-note">반가워, {childName}야!</span></div>
      <div className="friend-grid">{CHARACTER_LIST.map((friend, i) => <button key={friend.id} className={`friend-card friend-${friend.id}`} onClick={() => chooseFriend(friend.id)} aria-label={`${friend.name}, ${friend.animal} 친구 선택`} style={{ '--friend-color': friend.color, '--friend-delay': `${i * 90}ms` } as React.CSSProperties}>
        <span className="friend-portrait"><CharacterAvatar id={friend.id} size="lg" mood="happy" /></span>
        <span className="friend-name">{friend.name}<span className="friend-arrow"><ArrowRight size={20} /></span></span>
      </button>)}</div>
    </section> : <section aria-label="게임 선택" className="games-section">
      <div className="section-heading"><button className="change-friend" onClick={() => { stopAllSpeech(); onChangeStep('friends'); setHasNavigated(true); speakText('다른 친구랑도 놀아볼까?', soundEnabled); }}><ArrowLeft size={20} /><CharacterAvatar id={selectedCharacter} size="sm" /><span>친구 바꾸기</span></button><span className="page-indicator" aria-label={`${pageCount}쪽 중 ${safePage + 1}쪽`}>{Array.from({ length: pageCount }, (_, i) => <i key={i} className={i === safePage ? 'active' : ''} />)}</span></div>
      <div className="game-card-grid" key={`${selectedCharacter}-${safePage}`}>{currentGames.map(id => <button key={id} className={`picture-game-card theme-${GAME_CATALOG[id].theme}`} onClick={() => { stopAllSpeech(); playJellyTap(soundEnabled); onStartGame(id, selectedCharacter); }} aria-label={`${GAME_CATALOG[id].title} 시작`}>
        <GameArtwork gameId={id} />
        <span className="game-card-caption"><span>{GAME_CATALOG[id].title}</span><span className="play-medallion"><Play fill="currentColor" size={20} /></span></span>
      </button>)}</div>
      <nav className="game-pagination" aria-label="다른 게임 보기"><button aria-label="이전 게임들" disabled={safePage === 0} onClick={() => changePage(safePage - 1)}><ChevronLeft size={30} /><span>앞으로</span></button><span>{safePage + 1} / {pageCount}</span><button aria-label="다음 게임들" disabled={safePage === pageCount - 1} onClick={() => changePage(safePage + 1)}><span>다른 놀이</span><ChevronRight size={30} /></button></nav>
    </section>}

    <section className="extra-play" aria-label="자유 놀이">
      <button onClick={onOpenDrawing} className="extra-drawing"><span className="extra-icon"><Palette /></span><span>색칠 놀이</span><ArrowRight size={18} /></button>
      <button onClick={onOpenStickerRoom} className="extra-stickers"><span className="extra-icon"><BookOpen /></span><span>스티커북</span><ArrowRight size={18} /></button>
      <button onClick={onOpenCharacterTalk} className="extra-talk"><span className="extra-icon"><MessageCircle /></span><span>친구와 인사</span><ArrowRight size={18} /></button>
    </section>
    <p className="home-footnote">작은 손으로 만나는, 커다란 세상</p>
  </div>;
};
