import React from 'react';
import { Hand, Heart, Sparkles, Star } from 'lucide-react';
import { CharacterAvatar } from './CharacterAvatar';
import { CHARACTERS } from '../data/characters';
import { CHARACTER_GREETINGS } from '../data/characterGreetings';
import type { CharacterId } from '../types';
import './CharacterGreeting.css';

interface CharacterGreetingProps {
  id: CharacterId;
  playing: boolean;
  replayKey: number;
  onReplay: () => void;
}

/** Vector animation keeps the familiar friend sharp at every screen size. */
export function CharacterGreeting({ id, playing, replayKey, onReplay }: CharacterGreetingProps) {
  const greeting = CHARACTER_GREETINGS[id];
  return <button
    className={`greeting-stage greeting-${greeting.move} ${playing ? 'is-playing' : ''}`}
    style={{ '--greeting-color': greeting.color } as React.CSSProperties}
    onClick={onReplay}
    aria-label={`${CHARACTERS[id].name} ${greeting.title} 인사 다시 보기`}
  >
    <span className="greeting-scenery" aria-hidden="true" />
    <span className="greeting-tap-hint" aria-hidden="true"><Hand size={19} /> 콕!</span>
    <span key={replayKey} className="greeting-animation" aria-hidden="true">
      <span className="greeting-ground" />
      <span className="greeting-performer">
        <CharacterAvatar id={id} mood="still" size="2xl" className="greeting-avatar" />
      </span>
      <span className="greeting-particles">
        <Star /><Heart /><Sparkles /><Star /><Heart />
      </span>
    </span>
    <span className="greeting-caption" aria-hidden="true">{playing ? greeting.soundWord : '친구를 콕 눌러봐!'}</span>
  </button>;
}
