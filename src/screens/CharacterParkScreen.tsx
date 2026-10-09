import { useContext, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';
import { ArrowLeftRight, Footprints, Hand, Heart, Music2, Pause, Play, RotateCw, Sparkles } from 'lucide-react';
import { CHARACTER_LIST, CHARACTERS } from '../data/characters';
import { PARK_ACTIONS, PARK_GUIDE, type ParkAction } from '../data/characterPark';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { PlayHintsPausedContext } from '../components/PlayFlowContext';
import { useCharacterParkMotion } from '../hooks/useCharacterParkMotion';
import { useGameTimeouts } from '../hooks/useGameTimeouts';
import { usePageVisible } from '../hooks/useToddlerPlay';
import { playBouncyBoing, playJellyTap, playSparkleChime, speakText, stopAllSpeech, stopPlaySounds } from '../utils/soundEngine';
import type { CharacterId } from '../types';
import './CharacterParkScreen.css';

const ACTION_ICONS = { jump: Sparkles, roll: RotateCw, turn: ArrowLeftRight, dance: Music2, wave: Hand, run: Footprints };

export function CharacterParkScreen({ buddy, soundEnabled }: { buddy: CharacterId; soundEnabled: boolean }) {
  const field = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [reaction, setReaction] = useState<{ id: CharacterId; action: ParkAction; serial: number } | null>(null);
  const visible = usePageVisible();
  const reduced = useReducedMotion();
  const blocked = useContext(PlayHintsPausedContext);
  const { nodes, held, react } = useCharacterParkMotion(field, visible && !paused && !reduced && !blocked);
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const lastTap = useRef(-Infinity);
  const serial = useRef(0);
  const initial = useRef({ buddy, soundEnabled });

  useEffect(() => {
    speakText(PARK_GUIDE, initial.current.soundEnabled, { characterId: initial.current.buddy });
    return () => { stopAllSpeech(); stopPlaySounds(); };
  }, []);
  useEffect(() => {
    if (!visible || blocked) { clearGameTimeouts(); setReaction(null); stopAllSpeech(); stopPlaySounds(); }
  }, [visible, blocked, clearGameTimeouts]);

  const touchFriend = (id: CharacterId) => {
    if (!visible || blocked || performance.now() - lastTap.current < 180) return;
    lastTap.current = performance.now();
    const action = react(id);
    if (!action) return;
    clearGameTimeouts();
    setReaction({ id, action, serial: ++serial.current });
    if (action === 'jump' || action === 'roll') playBouncyBoing(soundEnabled);
    else if (action === 'wave' || action === 'dance') playSparkleChime(soundEnabled);
    else playJellyTap(soundEnabled);
    // The touched friend speaks in their own voice; the engine cancels prior speech.
    speakText(PARK_ACTIONS[action].speech, soundEnabled, { characterId: id, playIntroSFX: false });
    scheduleGameTimeout(() => setReaction(null), 2100);
  };

  return <section className="character-park" data-still={paused || reduced || !visible || blocked} data-reduced={Boolean(reduced)} aria-label="친구 놀이터" data-juice-surface>
    <h1 className="sr-only">친구 놀이터</h1>
    <div className="park-scenery" aria-hidden="true" />
    <div className="park-cloud park-cloud-one" aria-hidden="true" /><div className="park-cloud park-cloud-two" aria-hidden="true" />
    <div className="park-pennants" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} />)}</div>
    <span className="park-tap-guide" aria-hidden="true"><Hand /><span>친구를 콕!</span></span>
    {!reduced && <button className="park-pause" aria-label={paused ? '친구들 다시 움직이기' : '친구들 움직임 멈추기'} aria-pressed={paused} onClick={() => {
      setPaused(value => !value); playJellyTap(soundEnabled); stopAllSpeech();
    }}>{paused ? <Play fill="currentColor" /> : <Pause fill="currentColor" />}</button>}
    <div ref={field} className="park-field">
      {CHARACTER_LIST.map(friend => {
        const selected = reaction?.id === friend.id;
        const ReactionIcon = selected ? ACTION_ICONS[reaction.action] : Heart;
        return <button key={friend.id} ref={node => { if (node) nodes.current.set(friend.id, node); else nodes.current.delete(friend.id); }}
          className="park-friend" data-park-friend={friend.id} data-reacting={selected}
          style={{ '--friend-color': friend.color } as CSSProperties}
          aria-label={`${friend.name}와 놀기`}
          onPointerDown={event => {
            if (event.button !== 0 || !event.isPrimary) return;
            event.currentTarget.setPointerCapture(event.pointerId); held.current.add(friend.id); touchFriend(friend.id);
          }}
          onPointerUp={() => held.current.delete(friend.id)} onPointerCancel={() => held.current.delete(friend.id)} onLostPointerCapture={() => held.current.delete(friend.id)}
          onFocus={event => { if (event.currentTarget.matches(':focus-visible')) held.current.add(friend.id); }} onBlur={() => held.current.delete(friend.id)}
          onClick={event => { if (event.detail === 0) touchFriend(friend.id); }}>
          <span className="park-shadow" aria-hidden="true" />
          <span className="park-facing" aria-hidden="true"><span className="park-performer"><CharacterAvatar id={friend.id} size="lg" mood="still"
            view={selected ? 'front' : friend.id === 'rano' || friend.id === 'nurungji' ? 'side' : 'three-quarter'}
            expression={selected ? reaction.action === 'wave' || reaction.action === 'turn' ? 'happy' : 'excited' : 'happy'}
            className="park-avatar" /></span></span>
          {selected && <span key={reaction.serial} className="park-reaction" aria-hidden="true"><ReactionIcon /><Heart className="park-love" fill="currentColor" /><span>{PARK_ACTIONS[reaction.action].label}</span></span>}
        </button>;
      })}
    </div>
    <div className="park-status" aria-live="polite">{reaction ? `${CHARACTERS[reaction.id].name} · ${PARK_ACTIONS[reaction.action].label}` : <span aria-hidden="true"><Heart size={13} fill="currentColor" /> 우리 모두 함께 놀자</span>}</div>
  </section>;
}
