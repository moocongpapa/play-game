import React, { lazy, Suspense } from 'react';
import { ArrowRight, Check, Hand, Music2, Search, Sparkles, Volume2 } from 'lucide-react';
import { CareFriend, ToothBrushArt } from './ToddlerPlay';
import { CharacterAvatar } from './CharacterAvatar';
import type { CharacterId, GameId } from '../types';
import { GAME_CATALOG } from '../data/gameCatalog';
import { ToyArtwork } from './ToyArtwork';

const DevelopmentThumbnail = lazy(() => import('./development/DevelopmentThumbnail').then(m => ({ default: m.DevelopmentThumbnail })));

const Toy = ({ emoji, x, y, size = 36, rotate = 0, shadow = false }: { emoji: string; x: number; y: number; size?: number; rotate?: number; shadow?: boolean }) =>
  <span className={`scene-toy ${shadow ? 'scene-silhouette' : ''}`} style={{ left: `${x}%`, top: `${y}%`, width: `${size}%`, height: `${size * 1.55}%`, transform: `rotate(${rotate}deg)` }}><ToyArtwork emoji={emoji} /></span>;

export function GameArtwork({ gameId, buddy = 'jelly' }: { gameId: GameId; buddy?: CharacterId }) {
  const theme = GAME_CATALOG[gameId].theme;
  let scene: React.ReactNode;
  switch (gameId) {
    case 'path_tracing':
    case 'fruit_harvest':
    case 'symmetry_puzzle':
    case 'size_ordering':
    case 'day_night_weather':
    case 'goodnight_sleep':
    case 'emotion_face':
    case 'sensory_paint':
      scene = <Suspense fallback={<Sparkles className="scene-pop" />}><DevelopmentThumbnail gameId={gameId} buddy={buddy} /></Suspense>;
      break;
    case 'object_recognition':
      scene = <><span className="scene-plate" /><Toy emoji="🍎" x={8} y={31} size={31} rotate={-10} /><Toy emoji="🍌" x={48} y={28} size={39} rotate={10} /><Search className="scene-search" /></>;
      break;
    case 'shape_color':
      scene = <><span className="shape-board"><i /><i /><i /></span><Toy emoji="🔴" x={8} y={31} size={24} /><Toy emoji="🔺" x={38} y={30} size={25} /><Toy emoji="🟦" x={68} y={12} size={25} rotate={12} /><ArrowRight className="scene-arrow down" /></>;
      break;
    case 'korean_letters':
      scene = <><span className="letter-bubble bubble-one">가</span><span className="letter-bubble bubble-two">나</span><span className="letter-bubble bubble-three">가</span><Hand className="scene-hand" /></>;
      break;
    case 'sound_quiz':
      scene = <><Toy emoji="🐶" x={12} y={15} size={42} /><span className="sound-rings"><Volume2 /></span><Toy emoji="🐱" x={66} y={42} size={24} /></>;
      break;
    case 'counting_food':
      scene = <><span className="picnic-cloth" /><Toy emoji="🍓" x={8} y={35} size={27} /><Toy emoji="🍓" x={36} y={35} size={27} /><Toy emoji="🍓" x={64} y={35} size={27} /><span className="counting-dots"><i /><i /><i /></span></>;
      break;
    case 'number_parade':
      scene = <><span className="number-card-digits"><b>1</b><b>2</b><b>3</b></span><span className="number-card-friends"><span><ToyArtwork emoji="🐰" /></span><span><ToyArtwork emoji="🐻" /></span></span><Sparkles className="scene-pop" /></>;
      break;
    case 'cloud_shapes':
      scene = <><Toy emoji="☁️" x={4} y={9} size={49} /><Toy emoji="☁️" x={54} y={31} size={43} /><Toy emoji="⭐" x={18} y={28} size={21} /><Toy emoji="⭐" x={65} y={47} size={19} /></>;
      break;
    case 'treasure_hunt':
      scene = <><Toy emoji="🧸" x={8} y={11} size={38} /><span className="treasure-bush left" /><span className="treasure-chest"><span /><i /></span><Toy emoji="⭐" x={62} y={10} size={23} /><Search className="scene-search" /></>;
      break;
    case 'emotion_quiz':
      scene = <><Toy emoji="😊" x={5} y={12} size={44} rotate={-9} /><Toy emoji="😲" x={51} y={23} size={42} rotate={8} /><span className="little-heart">♥</span></>;
      break;
    case 'pattern_sequence':
      scene = <><span className="pattern-track" />{['🍎','🍌','🍎'].map((emoji, i) => <Toy key={i} emoji={emoji} x={4 + i * 24} y={35} size={22} />)}<span className="missing-toy">?</span><ArrowRight className="scene-arrow" /></>;
      break;
    case 'word_puzzle':
      scene = <><Toy emoji="🍎" x={31} y={-2} size={36} /><span className="letter-tile tile-one">사</span><span className="letter-tile tile-two">과</span><Check className="scene-check" /></>;
      break;
    case 'rhythm_game':
      scene = <><span className="xylophone">{['#e99e94','#e5bd6f','#8ebaac','#8fb9d2','#bba5d1'].map((c,i) => <i key={c} style={{ background: c, height: `${100-i*9}%` }} />)}</span><span className="mallet" /><Music2 className="scene-music" /></>;
      break;
    case 'size_comparison':
      scene = <><span className="scene-ground" /><Toy emoji="🧸" x={5} y={5} size={49} /><Toy emoji="🧸" x={64} y={46} size={25} /><span className="size-line tall" /><span className="size-line short" /></>;
      break;
    case 'memory_card':
      scene = <><span className="memory-tile first"><ToyArtwork emoji="🍎" /><Check /></span><span className="memory-tile second"><ToyArtwork emoji="🍎" /><Check /></span><span className="memory-tile back"><Sparkles /></span></>;
      break;
    case 'shadow_quiz':
      scene = <><Toy emoji="🐰" x={8} y={8} size={38} shadow /><ArrowRight className="scene-arrow to-shadow" /><Toy emoji="🐰" x={60} y={8} size={38} /></>;
      break;
    case 'stage_adventure':
      scene = <><span className="adventure-rainbow" /><span className="adventure-path" /><Toy emoji="🐶" x={4} y={36} size={25} /><Toy emoji="🍎" x={39} y={26} size={23} /><Toy emoji="⭐" x={73} y={2} size={23} /><span className="adventure-flag" /></>;
      break;
    case 'tooth_brush':
      scene = <><span className="mini-care-friend"><CareFriend buddy={buddy} /></span><span className="mini-care-teeth" /><span className="mini-toothbrush"><ToothBrushArt /></span><Sparkles className="scene-pop" /></>;
      break;
    case 'feeding':
      scene = <><span className="mini-care-friend mini-food-friend"><CareFriend buddy={buddy} /></span><span className="mini-food-plate" /><Toy emoji="🥕" x={12} y={38} size={30} rotate={-35} /><svg className="feeding-action-path" viewBox="0 0 300 180"><path d="M50 100Q57 72 94 72M84 65L95 72L85 80" /></svg><Toy emoji="🍎" x={36} y={59} size={27} /><Toy emoji="🥦" x={66} y={55} size={29} /></>;
      break;
    case 'bubble_pop':
      scene = <><span className="mini-soap soap-a"><ToyArtwork emoji="🍓" /></span><span className="mini-soap soap-b"><ToyArtwork emoji="🐧" /></span><span className="mini-soap soap-c"><Sparkles /></span><Hand className="scene-hand" /></>;
      break;
    case 'peekaboo_hide':
      scene = <><span className="mini-hide-friend"><CharacterAvatar id={buddy} mood="still" /></span><span className="mini-hide-friend second"><CharacterAvatar id="rano" mood="still" /></span><span className="mini-hide-bush" /><span className="mini-hide-bush second" /><Search className="scene-search" /></>;
      break;
    case 'animal_xylophone':
      scene = <><span className="mini-animal-keys">{['🐻', '🐱', '🐧', '🐰'].map((emoji, i) => <span key={emoji} style={{ background: ['#e8a2aa', '#e9c67e', '#94bdd5', '#c8aad4'][i] }}><ToyArtwork emoji={emoji} /></span>)}</span><Music2 className="scene-music" /></>;
      break;
    case 'balloon_pop':
      scene = <>{['#df91a5','#e5bb6e','#91b8cf'].map((c,i) => <span key={c} className={`picture-balloon balloon-${i}`} style={{ background: c }}><i /></span>)}<Hand className="scene-hand" /><Sparkles className="scene-pop" /></>;
      break;
    case 'fruit_munch':
      scene = (
        <>
          <span className="scene-plate" />
          <Toy emoji="🍉" x={10} y={18} size={42} rotate={-10} />
          <Toy emoji="🍓" x={52} y={14} size={34} rotate={15} />
          <Toy emoji="🍌" x={66} y={42} size={30} rotate={-20} />
          <Sparkles className="scene-pop" />
        </>
      );
      break;
    case 'trampoline_jump':
      scene = (
        <>
          <span className="xylophone" style={{ bottom: '10px', left: '15%', width: '70%', height: '16px', borderRadius: '10px' }}>
            <i style={{ background: '#7ec7c1', width: '100%' }} />
          </span>
          <Toy emoji="⭐" x={42} y={8} size={42} />
          <Toy emoji="☁️" x={8} y={18} size={32} />
          <Toy emoji="☁️" x={68} y={14} size={28} />
          <Sparkles className="scene-pop" />
        </>
      );
      break;
    case 'bubble_bath':
      scene = (
        <>
          <Toy emoji="🛁" x={14} y={26} size={46} />
          <Toy emoji="🐤" x={54} y={16} size={32} rotate={10} />
          <Toy emoji="🫧" x={34} y={8} size={28} />
          <Sparkles className="scene-pop" />
        </>
      );
      break;
    case 'block_tower':
      scene = (
        <>
          <span className="xylophone" style={{ bottom: '8px', left: '22%', width: '56%', height: '42px', flexDirection: 'column', gap: '4px' }}>
            <i style={{ background: '#f59e0b', width: '65%', height: '11px', borderRadius: '6px' }} />
            <i style={{ background: '#10b981', width: '80%', height: '11px', borderRadius: '6px' }} />
            <i style={{ background: '#f43f5e', width: '95%', height: '11px', borderRadius: '6px' }} />
          </span>
          <Toy emoji="👑" x={38} y={6} size={36} />
          <Toy emoji="⭐" x={74} y={22} size={24} />
          <Sparkles className="scene-pop" />
        </>
      );
      break;
    case 'mirror_maze':
      scene = (
        <>
          <Toy emoji="🪞" x={16} y={16} size={46} rotate={-12} />
          <Toy emoji="⭐" x={56} y={14} size={38} />
          <Toy emoji="💎" x={66} y={50} size={26} />
          <Sparkles className="scene-pop" />
        </>
      );
      break;
    case 'forest_peekaboo':
      scene = (
        <>
          <Toy emoji="🌳" x={4} y={14} size={40} />
          <Toy emoji="🐻" x={36} y={12} size={44} rotate={-6} />
          <Toy emoji="🪵" x={64} y={44} size={32} />
          <Search className="scene-search" />
          <Sparkles className="scene-pop" />
        </>
      );
      break;
    case 'magic_slime':
      scene = (
        <>
          <Toy emoji="🫧" x={24} y={14} size={50} />
          <Toy emoji="🍓" x={12} y={38} size={32} rotate={-15} />
          <Toy emoji="🫐" x={64} y={22} size={28} rotate={12} />
          <Toy emoji="✨" x={60} y={50} size={26} />
          <Sparkles className="scene-pop" />
        </>
      );
      break;
    case 'magic_potion':
      scene = (
        <>
          <Toy emoji="🧪" x={16} y={16} size={46} rotate={-10} />
          <Toy emoji="✨" x={54} y={14} size={38} />
          <Toy emoji="🔮" x={66} y={48} size={28} />
          <Toy emoji="🦄" x={36} y={38} size={32} />
          <Sparkles className="scene-pop" />
        </>
      );
      break;
    case 'fruit_catcher':
      scene = (
        <>
          <Toy emoji="🧺" x={30} y={38} size={48} />
          <Toy emoji="🍎" x={14} y={10} size={34} rotate={-12} />
          <Toy emoji="🍓" x={48} y={8} size={28} rotate={10} />
          <Toy emoji="🍌" x={70} y={18} size={30} rotate={20} />
          <Sparkles className="scene-pop" />
        </>
      );
      break;
    case 'pipe_connect':
      scene = (
        <>
          <Toy emoji="🍳" x={14} y={20} size={46} rotate={-8} />
          <Toy emoji="🍿" x={54} y={10} size={38} rotate={12} />
          <Toy emoji="🌽" x={20} y={6} size={28} rotate={-15} />
          <Toy emoji="🧈" x={66} y={42} size={30} rotate={10} />
          <Sparkles className="scene-pop" />
        </>
      );
      break;
  }
  return <div className={`game-artwork theme-${theme}`} aria-hidden="true"><span className="scene-cloud cloud-a" /><span className="scene-cloud cloud-b" />{scene}</div>;
}
