import { useContext, useEffect, useRef, useState } from 'react';
import { Hand, Heart, Sparkles } from 'lucide-react';
import { CharacterAvatar } from './CharacterAvatar';
import { CHARACTERS } from '../data/characters';
import { CHARACTER_GREETINGS } from '../data/characterGreetings';
import { playBouncyBoing, playJellyTap, speakText, stopAllSpeech } from '../utils/soundEngine';
import { useGameTimeouts } from '../hooks/useGameTimeouts';
import { usePageVisible } from '../hooks/useToddlerPlay';
import { PlayHintsPausedContext } from './PlayFlowContext';
import { emitJuice } from '../utils/juice';
import type { CharacterId } from '../types';
import './PlayExperience.css';

type Reaction = 'pet' | 'tickle' | 'five';
const PET_LINES: Record<CharacterId, string> = {
  jelly: '사르르, 쓰다듬어 주니까 포근해!', ggomi: '포근포근! 곰돌이도 기분 좋아!',
  rano: '그르릉, 공룡도 쓰담쓰담 좋아!', dochi: '살살 쓰다듬어 줘서 고마워!',
  ggulgguli: '꿀꿀! 기분이 몽글몽글해!', eumme: '몽실몽실! 구름처럼 포근해!',
  nurungji: '멍멍! 좋아서 꼬리가 살랑살랑!', pingu: '포근해! 날개가 파닥파닥!',
};

export function CompanionTouch({ id, playing, replayKey, onInteraction, soundEnabled }: {
  id: CharacterId; playing: boolean; replayKey: number; onInteraction: () => void; soundEnabled: boolean;
}) {
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [reactionKey, setReactionKey] = useState(0);
  const [lean, setLean] = useState(0);
  const paused = useContext(PlayHintsPausedContext);
  const visible = usePageVisible();
  const last = useRef(-Infinity);
  const stroke = useRef<{ id: number; x: number } | null>(null);
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const greeting = CHARACTER_GREETINGS[id];
  useEffect(() => { clearGameTimeouts(); setReaction(null); setLean(0); stroke.current = null; }, [id, replayKey, clearGameTimeouts]);
  useEffect(() => {
    if (!visible || paused) { clearGameTimeouts(); setReaction(null); setLean(0); stroke.current = null; stopAllSpeech(); }
  }, [visible, paused, clearGameTimeouts]);
  const react = (kind: Reaction) => {
    if (!visible || paused || performance.now() - last.current < 700) return;
    last.current = performance.now();
    onInteraction(); clearGameTimeouts(); setReaction(kind); setReactionKey(key => key + 1);
    if (kind === 'tickle') playBouncyBoing(soundEnabled); else playJellyTap(soundEnabled);
    if (kind === 'five') emitJuice({ kind: 'success' });
    speakText(kind === 'pet' ? PET_LINES[id] : kind === 'tickle' ? `${CHARACTERS[id].name} 배가 간질간질! 헤헤헤!` : '짝! 우리 손이 만났네! 하이파이브!', soundEnabled, { characterId: id, playIntroSFX: false });
    scheduleGameTimeout(() => { setReaction(null); setLean(0); }, 2300);
  };
  return <div className={`greeting-stage companion-touch greeting-${greeting.move} ${playing ? 'is-playing' : ''}`} data-still={paused || !visible} style={{ '--greeting-color': greeting.color } as React.CSSProperties}>
    <span className="greeting-scenery" aria-hidden="true" />
    <div className={`companion-body buddy-${reaction || 'idle'} buddy-species-${id}`} style={{ '--pet-lean': `${lean}deg` } as React.CSSProperties}>
      <span className="companion-ground" aria-hidden="true" />
      <div key={`${replayKey}:${reactionKey}`} className="greeting-performer companion-performer" aria-hidden="true"><CharacterAvatar id={id} mood="still"
        expression={reaction === 'pet' ? 'comfort' : reaction || playing ? 'excited' : 'happy'}
        view={!reaction && playing && ['ballet', 'kick', 'skate'].includes(greeting.move) ? 'three-quarter' : 'front'}
        size="2xl" className="greeting-avatar companion-avatar" /></div>
      <button className="buddy-touch-zone buddy-head" aria-label={`${CHARACTERS[id].name} 머리 쓰다듬기`}
        onPointerDown={event => { if (!event.isPrimary || event.button !== 0) return; event.currentTarget.setPointerCapture(event.pointerId); stroke.current = { id: event.pointerId, x: event.clientX }; react('pet'); }}
        onPointerMove={event => { if (stroke.current?.id === event.pointerId) setLean(Math.max(-7, Math.min(7, (event.clientX - stroke.current.x) / 8))); }}
        onPointerUp={() => { stroke.current = null; }} onPointerCancel={() => { stroke.current = null; }} onLostPointerCapture={() => { stroke.current = null; }}
        onClick={event => { if (!event.detail) react('pet'); }}><span className="buddy-touch-mark"><Heart /></span></button>
      <button className="buddy-touch-zone buddy-belly" aria-label={`${CHARACTERS[id].name} 배 간지럽히기`} onClick={() => react('tickle')}><span className="buddy-touch-mark"><Sparkles /></span></button>
      <button className="buddy-touch-zone buddy-hand" aria-label={`${CHARACTERS[id].name} 하이파이브`} onClick={() => react('five')}><span className="buddy-touch-mark"><Hand /></span></button>
      {reaction && <span key={reactionKey} className={`buddy-reaction-float reaction-${reaction}`} aria-hidden="true">{reaction === 'pet' ? <Heart fill="currentColor" /> : reaction === 'five' ? <Hand /> : <><Sparkles /><Heart /></>}</span>}
    </div>
    <span className="greeting-caption" aria-live="polite">{reaction === 'pet' ? '쓰담쓰담, 포근해!' : reaction === 'tickle' ? '간질간질! 헤헤!' : reaction === 'five' ? '짝! 하이파이브!' : playing ? greeting.soundWord : '머리 쓰담 · 배 콕 · 손 짝!'}</span>
  </div>;
}
