import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, ArrowRight, Hand, Heart, Play } from 'lucide-react';
import { CHARACTER_LIST, CHARACTERS } from '../data/characters';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { CharacterCharmVideoModal } from '../components/CharacterCharmVideoModal';
import { FunnyEchoToy } from '../components/FunnyEchoToy';
import { SillyCostumeModal } from '../components/SillyCostumeModal';
import { PlayNavArtwork, type PlayNavKind } from '../components/PlayNavArtwork';
import { GameArtwork } from '../components/GameArtwork';
import { ToyArtwork } from '../components/ToyArtwork';
import { FRIEND_DAY } from '../data/friendDay';
import { availableGameIds, GAME_CATALOG } from '../data/gameCatalog';
import { getTimeGreeting } from '../data/characterGreetings';
import { playCareSound, playJellyTap, playSparkleChime, speakText, stopAllSpeech } from '../utils/soundEngine';
import { emitJuice } from '../utils/juice';
import type { ChildProfile, CharacterId, GameId } from '../types';
import './HomeScreen.css';

export type HomeStep = 'friends' | 'games';
interface HomeScreenProps {
  selectedCharacter: CharacterId;
  onSelectCharacter: (id: CharacterId) => void;
  onStartGame: (gameId: GameId, characterId: CharacterId) => void;
  onStartDay: () => void;
  onOpenDrawing: () => void;
  onOpenBugGarden?: () => void;
  onOpenStickerRoom?: () => void;
  onOpenAquarium: () => void;
  onOpenCharacterPark: () => void;
  onOpenCharacterTalk: () => void;
  soundEnabled: boolean;
  childProfile: ChildProfile | null;
  disabledGames?: GameId[];
  step: HomeStep;
  onChangeStep: (step: HomeStep) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ selectedCharacter, onSelectCharacter, onStartGame, onStartDay, onOpenDrawing, onOpenBugGarden, onOpenStickerRoom, onOpenAquarium, onOpenCharacterPark, onOpenCharacterTalk, soundEnabled, childProfile, disabledGames = [], step, onChangeStep }) => {
  const buddy = CHARACTERS[selectedCharacter] || CHARACTERS.ggomi;
  const childName = childProfile?.name || '유하';
  const age = childProfile?.ageGroup || 'sprout';
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isEchoModalOpen, setIsEchoModalOpen] = useState(false);
  const [isCostumeModalOpen, setIsCostumeModalOpen] = useState(false);

  // Living interactive background states
  const [sunCool, setSunCool] = useState(false);
  const [candyDrops, setCandyDrops] = useState<{ id: number; x: number; emoji: string }[]>([]);
  const [peekabooBush, setPeekabooBush] = useState<'chick' | 'ladybug' | null>(null);
  const bgTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  // Keep the same picture in the same place when the child changes friends.
  const games = availableGameIds(age, disabledGames);
  const timeGreeting = getTimeGreeting();

  useEffect(() => {
    return () => {
      bgTimersRef.current.forEach((t) => clearTimeout(t));
      bgTimersRef.current = [];
      stopAllSpeech();
    };
  }, []);
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

  const renderCard = (id: GameId) => {
    const game = GAME_CATALOG[id];
    const categoryTag = game.badge ? game.badge.split('·')[0].trim() : '';
    const featureText = game.badge ? (game.badge.split('·')[1]?.trim() || game.badge) : game.prompt;

    return (
      <button
        key={id}
        className={`picture-game-card theme-${game.theme}`}
        onClick={() => {
          stopAllSpeech();
          playJellyTap(soundEnabled);
          onStartGame(id, selectedCharacter);
        }}
        aria-label={`${game.title} 시작`}
      >
        <div className="card-artwork-wrap">
          <GameArtwork gameId={id} buddy={selectedCharacter} />
          {categoryTag && (
            <span className="card-floating-badge">
              {categoryTag}
            </span>
          )}
        </div>
        <div className="game-card-caption">
          <div className="card-title-col">
            <strong className="card-title">{game.title}</strong>
            <span className="card-desc">{featureText}</span>
          </div>
          <span className="play-medallion" aria-hidden="true">
            <Play fill="currentColor" size={16} />
          </span>
        </div>
      </button>
    );
  };

  return <div className={`storybook-home home-${step}`}>
    <section className="welcome-scene">
      <button type="button" className="welcome-voice-surface" aria-label="배경을 눌러 선택 안내 듣기" disabled={!soundEnabled}
        onClick={() => speakText(step === 'friends' ? `${childName}야, 같이 놀 친구를 골라줘!` : timeGreeting.spoken, soundEnabled, { characterId: selectedCharacter })} />

      {/* Living Interactive World: Sun */}
      <button
        type="button"
        className={`living-sun-btn ${sunCool ? 'is-cool' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setSunCool(prev => !prev);
          playSparkleChime(soundEnabled);
          emitJuice({ kind: 'snap', x: e.clientX, y: e.clientY });
          speakText('반짝반짝! 좋은 하루야!', soundEnabled, { characterId: selectedCharacter });
        }}
        aria-label="생글생글 해님 누르기"
      >
        <span className="sun-core">{sunCool ? '😎' : '☀️'}</span>
      </button>

      {/* Living Interactive World: Candy Cloud */}
      <button
        type="button"
        className="living-cloud-btn welcome-cloud"
        onClick={(e) => {
          e.stopPropagation();
          playCareSound('bubble', soundEnabled);
          emitJuice({ kind: 'pop', x: e.clientX, y: e.clientY });
          const emojis = ['🍬', '🍭', '🍿', '⭐', '🌈', '🍓'];
          const newDrops = Array.from({ length: 6 }, (_, i) => ({
            id: Date.now() + i,
            x: 20 + Math.random() * 55,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
          }));
          setCandyDrops(prev => [...prev.slice(-12), ...newDrops]);
          bgTimersRef.current.push(setTimeout(() => {
            setCandyDrops(prev => prev.filter(d => !newDrops.some(nd => nd.id === d.id)));
          }, 1800));
        }}
        aria-label="구름 톡톡! 사탕 비 내리기"
      >
        <span className="sr-only">사탕 구름</span>
      </button>

      {/* Falling candy drops */}
      {candyDrops.map(drop => (
        <span
          key={drop.id}
          className="living-candy-drop"
          style={{ left: `${drop.x}%` }}
          aria-hidden="true"
        >
          {drop.emoji}
        </span>
      ))}

      {/* Living Interactive World: Bushes & Peekaboo Critters */}
      <div className="living-bushes-layer">
        <button
          type="button"
          className={`living-bush bush-left ${peekabooBush === 'chick' ? 'bush-peekaboo' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setPeekabooBush('chick');
            playCareSound('giggle', soundEnabled);
            emitJuice({ kind: 'pop', x: e.clientX, y: e.clientY });
            speakText('까꿍! 찾았다!', soundEnabled, { characterId: selectedCharacter });
            bgTimersRef.current.push(setTimeout(() => setPeekabooBush(null), 1900));
          }}
          aria-label="풀숲 누르기"
        >
          {peekabooBush === 'chick' && <span className="bush-critter" aria-hidden="true">🐥 까꿍!</span>}
          <span className="bush-leaves" aria-hidden="true">🌿</span>
        </button>

        <button
          type="button"
          className={`living-bush bush-right ${peekabooBush === 'ladybug' ? 'bush-peekaboo' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setPeekabooBush('ladybug');
            playCareSound('giggle', soundEnabled);
            emitJuice({ kind: 'pop', x: e.clientX, y: e.clientY });
            speakText('까꿍! 찾았다!', soundEnabled, { characterId: selectedCharacter });
            bgTimersRef.current.push(setTimeout(() => setPeekabooBush(null), 1900));
          }}
          aria-label="꽃덤불 누르기"
        >
          {peekabooBush === 'ladybug' && <span className="bush-critter" aria-hidden="true">🐞 까꿍!</span>}
          <span className="bush-leaves" aria-hidden="true">🌸</span>
        </button>
      </div>

      <div className="welcome-copy">
        <p className="eyebrow"><span /> {childName}의 놀이숲 · {timeGreeting.badge} {timeGreeting.label}</p>
        <h1 ref={headingRef} tabIndex={-1}>{step === 'friends' ? <>같이 놀 친구를<br />선택해줘~</> : <>어떤 게임<br />해볼까?</>}</h1>
        <p className="welcome-subtitle">{step === 'friends' ? '마음에 드는 친구를 콕!' : `${buddy.name}랑 함께, 하고 싶은 그림을 콕!`}</p>
      </div>
      <div className="welcome-friends" aria-hidden={step === 'friends' ? true : undefined}>
        {step === 'friends' ? (
          <>
            <CharacterAvatar id="jelly" size="xl" mood="waving" className="hero-bunny" />
            <CharacterAvatar id="ggomi" size="2xl" mood="waving" className="hero-bear" />
            <CharacterAvatar id="rano" size="xl" mood="happy" className="hero-dino" />
          </>
        ) : (
          <>
            <div className="selected-buddy-stage">
              <div className="selected-buddy-halo">
                <CharacterAvatar id={selectedCharacter} mood="still" className="!w-full !h-full" interactive />
                <button
                  type="button"
                  className="buddy-switch-cue"
                  onClick={changeFriend}
                  aria-label={`${buddy.name}, 다른 친구 선택`}
                >
                  <span className="buddy-switch-friend"><PlayNavArtwork kind="park" buddy={selectedCharacter} /></span>
                  <ArrowLeftRight size={18} />
                </button>
              </div>

              <div className="buddy-action-tools">
                <button
                  type="button"
                  className="buddy-stage-tool buddy-video-badge"
                  onClick={(e) => {
                    e.stopPropagation();
                    stopAllSpeech();
                    playJellyTap(soundEnabled);
                    setIsVideoModalOpen(true);
                  }}
                  aria-label={`${buddy.name} 영상 보기`}
                  title={`${buddy.name} 영상 보기`}
                >
                  <Play className="buddy-video-badge-icon" aria-hidden="true" fill="currentColor" />
                  <span className="sr-only">영상 보기</span>
                </button>

                <button
                  type="button"
                  className="buddy-stage-tool buddy-echo-badge"
                  onClick={(e) => {
                    e.stopPropagation();
                    stopAllSpeech();
                    playJellyTap(soundEnabled);
                    setIsEchoModalOpen(true);
                  }}
                  aria-label={`${buddy.name}와 요술 마이크 놀이`}
                  title="요술 마이크"
                >
                  <span className="stage-tool-emoji">🎙️</span>
                  <span className="sr-only">요술 마이크</span>
                </button>

                <button
                  type="button"
                  className="buddy-stage-tool buddy-costume-badge"
                  onClick={(e) => {
                    e.stopPropagation();
                    stopAllSpeech();
                    playJellyTap(soundEnabled);
                    setIsCostumeModalOpen(true);
                  }}
                  aria-label={`${buddy.name} 코믹 분장하기`}
                  title="코믹 분장실"
                >
                  <span className="stage-tool-emoji">🥸</span>
                  <span className="sr-only">코믹 분장실</span>
                </button>
              </div>
            </div>
            <ToyArtwork emoji="⭐" className="hero-star" />
          </>
        )}
      </div>
    </section>

    {step === 'friends' ? <section aria-label="같이 놀 친구 선택" className="friend-section">
      <div className="section-heading"><span className="step-badge"><Hand size={22} /></span><h2>누구랑 놀까?</h2><span className="section-note">반가워, {childName}야!</span></div>
      <div className="friend-grid">{CHARACTER_LIST.map((friend, i) => <button key={friend.id} className={`friend-card friend-${friend.id}`} onClick={() => chooseFriend(friend.id)} aria-label={`${friend.name}, ${friend.animal} 친구 선택`} style={{ '--friend-color': friend.color, '--friend-delay': `${i * 90}ms` } as React.CSSProperties}>
        <span className="friend-portrait"><CharacterAvatar id={friend.id} size="lg" mood="still" /></span>
        <span className="friend-name">{friend.name}<span className="friend-arrow"><ArrowRight size={20} /></span></span>
      </button>)}</div>
    </section> : <section aria-label="게임 선택" className="games-section">
      <button className="friend-day-card" onClick={() => { stopAllSpeech(); playJellyTap(soundEnabled); onStartDay(); }} aria-label={`${buddy.name}의 하루 함께 놀기`}>
        <CharacterAvatar id={selectedCharacter} size="md" mood="still" /><div className="friend-day-copy"><span className="day-mini-pictures" aria-hidden="true">{FRIEND_DAY.map(item => <GameArtwork key={item.gameId} gameId={item.gameId} buddy={selectedCharacter} />)}</span></div><ArrowRight aria-hidden="true" />
      </button>
      {(['hands', 'care'] as const).map(category => <div className="discovery-menu-group" key={category}><div className="section-heading"><span className="step-badge">{category === 'hands' ? <Hand size={23} /> : <Heart size={23} />}</span><h2>{category === 'hands' ? '손끝으로 쏙쏙!' : '마음도 쑥쑥!'}</h2></div><div className="game-card-grid">{games.filter(id => GAME_CATALOG[id].category === category).map(renderCard)}</div></div>)}
      <div className="section-heading"><span className="step-badge"><Play size={23}/></span><h2>다른 놀이도 해볼까?</h2></div>
      <div className="game-card-grid">{games.filter(id => !GAME_CATALOG[id].category).map(renderCard)}</div>
    </section>}

    <p className="home-footnote">작은 손으로 만나는, 커다란 세상</p>

    <nav className="home-play-nav" aria-label="자유 놀이 바로가기">
      <div className="home-play-nav-items">
        {([
          { label: '색칠 놀이', theme: 'drawing', open: onOpenDrawing },
          { label: '곤충 놀이', theme: 'bugs', open: () => (onOpenBugGarden || onOpenStickerRoom)?.() },
          { label: '수족관 놀이', theme: 'aquarium', open: onOpenAquarium },
          { label: '친구 놀이터', theme: 'park', open: onOpenCharacterPark },
          { label: '친구와 인사', theme: 'greeting', open: onOpenCharacterTalk },
        ] satisfies Array<{ label: string; theme: PlayNavKind; open: () => void }>).map(({ label, theme, open }) => <button
          key={theme}
          type="button"
          className={`home-play-nav-button nav-${theme}`}
          aria-label={label}
          onClick={() => { stopAllSpeech(); playJellyTap(soundEnabled); open(); }}
        ><span className="home-play-nav-icon" aria-hidden="true"><PlayNavArtwork kind={theme} buddy={selectedCharacter} /></span></button>)}
      </div>
    </nav>

    <CharacterCharmVideoModal
      isOpen={isVideoModalOpen}
      onClose={() => {
        stopAllSpeech();
        setIsVideoModalOpen(false);
      }}
      initialCharacterId={selectedCharacter}
      soundEnabled={soundEnabled}
    />

    <FunnyEchoToy
      isOpen={isEchoModalOpen}
      onClose={() => {
        stopAllSpeech();
        setIsEchoModalOpen(false);
      }}
      buddy={selectedCharacter}
      soundEnabled={soundEnabled}
      childName={childName}
    />

    <SillyCostumeModal
      isOpen={isCostumeModalOpen}
      onClose={() => {
        stopAllSpeech();
        setIsCostumeModalOpen(false);
      }}
      buddy={selectedCharacter}
      soundEnabled={soundEnabled}
      childName={childName}
    />
  </div>;
};

