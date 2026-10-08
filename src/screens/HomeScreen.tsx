import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, ArrowRight, Bug, Fish, Hand, Heart, MessageCircle, Palette, Play } from 'lucide-react';
import { CHARACTER_LIST, CHARACTERS } from '../data/characters';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { BuddyVideo } from '../components/BuddyVideo';
import { GameArtwork } from '../components/GameArtwork';
import { ToyArtwork } from '../components/ToyArtwork';
import { FRIEND_DAY } from '../data/friendDay';
import { availableGameIds, GAME_CATALOG } from '../data/gameCatalog';
import { playJellyTap, speakText, stopAllSpeech } from '../utils/soundEngine';
import type { ChildProfile, CharacterId, GameId } from '../types';
import './HomeScreen.css';

export type HomeStep = 'friends' | 'games';
interface HomeScreenProps {
  selectedCharacter: CharacterId;
  onSelectCharacter: (id: CharacterId) => void;
  onStartGame: (gameId: GameId, characterId: CharacterId) => void;
  onStartDay: () => void;
  onOpenDrawing: () => void;
  onOpenStickerRoom: () => void;
  onOpenAquarium: () => void;
  onOpenCharacterPark: () => void;
  onOpenCharacterTalk: () => void;
  soundEnabled: boolean;
  childProfile: ChildProfile | null;
  step: HomeStep;
  onChangeStep: (step: HomeStep) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ selectedCharacter, onSelectCharacter, onStartGame, onStartDay, onOpenDrawing, onOpenStickerRoom, onOpenAquarium, onOpenCharacterPark, onOpenCharacterTalk, soundEnabled, childProfile, step, onChangeStep }) => {
  const buddy = CHARACTERS[selectedCharacter] || CHARACTERS.ggomi;
  const childName = childProfile?.name || '유하';
  const age = childProfile?.ageGroup || 'sprout';
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [hasNavigated, setHasNavigated] = useState(false);
  const available = availableGameIds(age);
  const preferred = ([buddy.gameId, buddy.subGameId, 'balloon_pop', 'stage_adventure'] as Array<GameId | undefined>).filter((id): id is GameId => Boolean(id) && available.includes(id!));
  const games = [...new Set([...preferred, ...available])];

  useEffect(() => () => stopAllSpeech(), []);
  useEffect(() => {
    if (hasNavigated) headingRef.current?.focus({ preventScroll: true });
  }, [step, hasNavigated]);

  const chooseFriend = (id: CharacterId) => {
    playJellyTap(soundEnabled);
    onSelectCharacter(id);
    onChangeStep('games');
    setHasNavigated(true);
    speakText(`${childName}야, ${CHARACTERS[id].name}랑 같이 놀자! 어떤 게임 해볼까? 그림을 눌러봐.`, soundEnabled, { characterId: id });
  };

  const changeFriend = () => {
    stopAllSpeech();
    playJellyTap(soundEnabled);
    onChangeStep('friends');
    setHasNavigated(true);
    speakText('다른 친구랑도 놀아볼까?', soundEnabled, { characterId: selectedCharacter });
  };

  const renderCard = (id: GameId) => <button key={id} className={`picture-game-card theme-${GAME_CATALOG[id].theme}`} onClick={() => { stopAllSpeech(); playJellyTap(soundEnabled); onStartGame(id, selectedCharacter); }} aria-label={`${GAME_CATALOG[id].title} 시작`}>
        <GameArtwork gameId={id} buddy={selectedCharacter} />
        <span className="game-card-caption"><span>{GAME_CATALOG[id].title}</span><span className="play-medallion"><Play fill="currentColor" size={20} /></span></span>
        {GAME_CATALOG[id].badge && <span className="picture-game-badge">{GAME_CATALOG[id].badge}</span>}
      </button>;

  const parkCard = <button onClick={() => { stopAllSpeech(); playJellyTap(soundEnabled); onOpenCharacterPark(); }} className="extra-character-park" aria-label="친구 놀이터 열기">
    <span className="park-card-friends" aria-hidden="true"><CharacterAvatar id="jelly" mood="still" /><CharacterAvatar id="pingu" mood="still" /><CharacterAvatar id="dochi" mood="still" /></span>
    <span className="park-card-copy"><strong>친구 놀이터</strong><small>폴짝폴짝 · 데굴데굴 · 다 같이!</small></span><span className="play-medallion"><Play size={20} fill="currentColor" /></span>
  </button>;

  return <div className={`storybook-home home-${step}`}>
    <section className="welcome-scene">
      <button type="button" className="welcome-voice-surface" aria-label="배경을 눌러 선택 안내 듣기" disabled={!soundEnabled}
        onClick={() => speakText(step === 'friends' ? `${childName}야, 같이 놀 친구를 골라줘!` : '어떤 게임 해볼까? 하고 싶은 그림을 눌러봐!', soundEnabled, { characterId: selectedCharacter })} />
      <div className="welcome-copy">
        <p className="eyebrow"><span /> {childName}의 작은 놀이숲</p>
        <h1 ref={headingRef} tabIndex={-1}>{step === 'friends' ? <>같이 놀 친구를<br />선택해줘~</> : <>어떤 게임<br />해볼까?</>}</h1>
        <p className="welcome-subtitle">{step === 'friends' ? '마음에 드는 친구를 콕!' : `${buddy.name}랑 함께, 하고 싶은 그림을 콕!`}</p>
      </div>
      <div className="welcome-friends" aria-hidden={step === 'friends' ? true : undefined}>
        {step === 'friends' ? <><CharacterAvatar id="jelly" size="xl" mood="waving" className="hero-bunny" /><CharacterAvatar id="ggomi" size="2xl" mood="waving" className="hero-bear" /><CharacterAvatar id="rano" size="xl" mood="happy" className="hero-dino" /></> : <><button type="button" className="selected-buddy-halo" onClick={changeFriend} aria-label={`${buddy.name}, 다른 친구 선택`}><BuddyVideo key={selectedCharacter} id={selectedCharacter} /><span aria-hidden="true"><ArrowLeftRight size={18} /> {buddy.name}</span></button><ToyArtwork emoji="⭐" className="hero-star" /></>}
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
      <div className="extra-play park-menu-entry">{parkCard}</div>
      <button className="friend-day-card" onClick={() => { stopAllSpeech(); playJellyTap(soundEnabled); onStartDay(); }} aria-label={`${buddy.name}의 하루 함께 놀기`}>
        <CharacterAvatar id={selectedCharacter} size="md" mood="waving" /><div className="friend-day-copy"><strong>{buddy.name}의 하루</strong><span>우리 같이 하루를 보내볼까?</span><span className="day-mini-pictures" aria-hidden="true">{FRIEND_DAY.map(item => <GameArtwork key={item.gameId} gameId={item.gameId} buddy={selectedCharacter} />)}</span></div><ArrowRight />
      </button>
      {(['hands', 'care'] as const).map(category => <div className="discovery-menu-group" key={category}><div className="section-heading"><span className="step-badge">{category === 'hands' ? <Hand size={23} /> : <Heart size={23} />}</span><h2>{category === 'hands' ? '손끝으로 쏙쏙!' : '마음도 쑥쑥!'}</h2></div><div className="game-card-grid">{games.filter(id => GAME_CATALOG[id].category === category).map(renderCard)}</div></div>)}
      <div className="section-heading"><span className="step-badge"><Play size={23}/></span><h2>다른 놀이도 해볼까?</h2></div>
      <div className="game-card-grid" key={selectedCharacter}>{games.filter(id => !GAME_CATALOG[id].category).map(renderCard)}</div>
    </section>}

    <section className="extra-play" aria-label="자유 놀이">
      {step === 'friends' && parkCard}
      <button onClick={onOpenDrawing} className="extra-drawing"><span className="extra-icon"><Palette /></span><span>색칠 놀이</span><ArrowRight size={18} /></button>
      <button onClick={onOpenStickerRoom} className="extra-stickers"><span className="extra-icon"><Bug /></span><span>곤충 놀이</span><ArrowRight size={18} /></button>
      <button onClick={onOpenAquarium} className="extra-aquarium"><span className="extra-icon"><Fish /></span><span>수족관 놀이</span><ArrowRight size={18} /></button>
      <button onClick={onOpenCharacterTalk} className="extra-talk"><span className="extra-icon"><MessageCircle /></span><span>친구와 인사</span><ArrowRight size={18} /></button>
    </section>

    <p className="home-footnote">작은 손으로 만나는, 커다란 세상</p>
  </div>;
};
