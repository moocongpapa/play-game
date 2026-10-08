import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Hand, Play, RotateCcw } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { CHARACTER_LIST, CHARACTERS } from '../data/characters';
import { CHARACTER_GREETINGS } from '../data/characterGreetings';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { CompanionTouch } from '../components/CompanionTouch';
import '../components/CharacterGreeting.css';
import { speakText, stopAllSpeech } from '../utils/soundEngine';
import type { CharacterId } from '../types';

interface CharacterTalkScreenProps {
  selectedCharacter: CharacterId;
  onSelectCharacter: (id: CharacterId) => void;
  onGoHome: () => void;
  soundEnabled: boolean;
  childName: string;
}

export const CharacterTalkScreen: React.FC<CharacterTalkScreenProps> = ({
  selectedCharacter, onSelectCharacter, onGoHome, soundEnabled, childName,
}) => {
  const [replayKey, setReplayKey] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduceMotion = useReducedMotion();
  const activeChar = CHARACTERS[selectedCharacter];
  const greeting = CHARACTER_GREETINGS[selectedCharacter];

  useEffect(() => {
    if (!playing) return;
    // Two short loops. Reduced motion shows the greeting pose without spinning.
    const timer = window.setTimeout(() => setPlaying(false), reduceMotion ? 1600 : 4400);
    return () => window.clearTimeout(timer);
  }, [playing, replayKey, reduceMotion]);

  useEffect(() => {
    const stopWhenHidden = () => {
      if (document.hidden) {
        setPlaying(false);
        stopAllSpeech();
      }
    };
    document.addEventListener('visibilitychange', stopWhenHidden);
    return () => {
      document.removeEventListener('visibilitychange', stopWhenHidden);
      stopAllSpeech();
    };
  }, []);

  const sayHello = (id: CharacterId) => {
    onSelectCharacter(id);
    setReplayKey(key => key + 1);
    setPlaying(true);
    speakText(`${childName}야, ${CHARACTERS[id].name}야! ${CHARACTER_GREETINGS[id].message}`, soundEnabled, { characterId: id });
  };

  return <div className="friend-greetings">
    <header className="greeting-heading">
      <p className="eyebrow"><Hand size={17} /> 친구와 인사</p>
      <h1>반가워, {childName}야!</h1>
      <p>머리를 쓰담쓰담, 배를 간질간질! 손바닥도 짝!</p>
    </header>

    <div className="greeting-layout">
      <section className="greeting-card" aria-label={`${activeChar.name}의 인사 무대`}>
        <h2><span>{activeChar.name}</span>의 {greeting.title}</h2>
        <CompanionTouch key={selectedCharacter} id={selectedCharacter} playing={playing} replayKey={replayKey} onInteraction={() => setPlaying(false)} soundEnabled={soundEnabled} />
        <p className="greeting-message" aria-live="polite">{greeting.message}</p>
        <div className="greeting-actions">
          <button className="greeting-replay" onClick={() => sayHello(selectedCharacter)} aria-label={`${activeChar.name} 인사 다시 보기`}><RotateCcw size={21} /><span>한 번 더!</span></button>
          <button className="greeting-play" onClick={onGoHome}><Play size={19} fill="currentColor" /><span>같이 놀자</span><ArrowRight size={18} /></button>
        </div>
      </section>

      <section className="greeting-friends" aria-label="인사할 친구 고르기">
        <h2>다른 친구는 어떻게 인사할까?</h2>
        <div className="greeting-friend-grid">{CHARACTER_LIST.map(char => <button
          key={char.id}
          aria-label={`${char.name} ${CHARACTER_GREETINGS[char.id].title} 인사 보기`}
          aria-pressed={char.id === selectedCharacter}
          onClick={() => sayHello(char.id)}
          style={{ '--greeting-color': CHARACTER_GREETINGS[char.id].color } as React.CSSProperties}
        >
          <CharacterAvatar id={char.id} size="md" mood="still" />
          <span>{char.name}</span>
          {char.id === selectedCharacter && <Check className="greeting-selected" size={18} aria-hidden="true" />}
        </button>)}</div>
        <p className="greeting-friends-note"><Hand size={18} /> 작은 친구도, 큰 친구도 콕!</p>
      </section>
    </div>
  </div>;
};
