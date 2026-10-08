import React from 'react';
import { ArrowRight, Check, Hand, Music2, Search, Sparkles, Volume2 } from 'lucide-react';
import type { GameId } from '../types';
import { GAME_CATALOG } from '../data/gameCatalog';
import { ToyArtwork } from './ToyArtwork';

const Toy = ({ emoji, x, y, size = 36, rotate = 0, shadow = false }: { emoji: string; x: number; y: number; size?: number; rotate?: number; shadow?: boolean }) =>
  <span className={`scene-toy ${shadow ? 'scene-silhouette' : ''}`} style={{ left: `${x}%`, top: `${y}%`, width: `${size}%`, height: `${size * 1.55}%`, transform: `rotate(${rotate}deg)` }}><ToyArtwork emoji={emoji} /></span>;

export function GameArtwork({ gameId }: { gameId: GameId }) {
  const theme = GAME_CATALOG[gameId].theme;
  let scene: React.ReactNode;
  switch (gameId) {
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
      scene = <><Toy emoji="🐰" x={8} y={8} size={38} shadow /><ArrowRight className="scene-arrow" /><Toy emoji="🐰" x={60} y={8} size={38} /></>;
      break;
    case 'stage_adventure':
      scene = <><span className="adventure-rainbow" /><span className="adventure-path" /><Toy emoji="🐶" x={4} y={36} size={25} /><Toy emoji="🍎" x={39} y={26} size={23} /><Toy emoji="⭐" x={73} y={2} size={23} /><span className="adventure-flag" /></>;
      break;
    case 'balloon_pop':
      scene = <>{['#df91a5','#e5bb6e','#91b8cf'].map((c,i) => <span key={c} className={`picture-balloon balloon-${i}`} style={{ background: c }}><i /></span>)}<Hand className="scene-hand" /><Sparkles className="scene-pop" /></>;
      break;
  }
  return <div className={`game-artwork theme-${theme}`} aria-hidden="true"><span className="scene-cloud cloud-a" /><span className="scene-cloud cloud-b" />{scene}</div>;
}
