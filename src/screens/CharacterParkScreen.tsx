import { useContext, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';
import { ArrowLeftRight, Footprints, Hand, Heart, Music2, Palette, Pause, Play, RotateCw, Sparkles } from 'lucide-react';
import { CHARACTER_LIST, CHARACTERS } from '../data/characters';
import { PARK_ACTIONS, PARK_DRAWING_SPEECHES, PARK_GUIDE, type ParkAction } from '../data/characterPark';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { PlayHintsPausedContext } from '../components/PlayFlowContext';
import { useCharacterParkMotion } from '../hooks/useCharacterParkMotion';
import { useGameTimeouts } from '../hooks/useGameTimeouts';
import { usePageVisible } from '../hooks/useToddlerPlay';
import { playBouncyBoing, playCelebrationFanfare, playJellyTap, playSparkleChime, speakText, stopAllSpeech, stopPlaySounds } from '../utils/soundEngine';
import type { CharacterId } from '../types';
import { useRoamingDrag } from '../hooks/useRoamingDrag';
import { emitJuice } from '../utils/juice';
import { listGallery } from '../sketch/storage';
import { renderCharacterSprite } from '../sketch/render';
import { templates } from '../sketch/art';
import { usePlayMemory } from '../components/PlayMemoryContext';
import { RideKeepsake } from '../components/PlayKeepsakeArtwork';
import './CharacterParkScreen.css';

const ACTION_ICONS = { jump: Sparkles, roll: RotateCw, turn: ArrowLeftRight, dance: Music2, wave: Hand, run: Footprints };
const CUSTOM_SPOTS = [
  { left: '24%', top: '34%' },
  { left: '72%', top: '36%' },
  { left: '50%', top: '68%' },
] as const;

interface CustomParkDrawing {
  id: string;
  title: string;
  spriteUrl: string;
}

export function CharacterParkScreen({
  buddy,
  soundEnabled,
  onOpenDrawing,
}: {
  buddy: CharacterId;
  soundEnabled: boolean;
  onOpenDrawing?: () => void;
}) {
  const field = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [reaction, setReaction] = useState<{ id: CharacterId; action: ParkAction; serial: number } | null>(null);
  const [customDrawings, setCustomDrawings] = useState<CustomParkDrawing[]>([]);
  const [customReaction, setCustomReaction] = useState<{ id: string; title: string; serial: number } | null>(null);
  const [riding, setRiding] = useState(false);
  const { memory } = usePlayMemory();
  const visible = usePageVisible();
  const reduced = useReducedMotion();
  const blocked = useContext(PlayHintsPausedContext);
  const { nodes, held, react, getPosition, move, release } = useCharacterParkMotion(field, visible && !paused && !reduced && !blocked);
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const lastTap = useRef(-Infinity);
  const serial = useRef(0);
  const initial = useRef({ buddy, soundEnabled });
  const endRide = () => { setRiding(false); held.current.delete(buddy); };

  useEffect(() => {
    let active = true;
    listGallery()
      .then((items) => {
        if (!active) return;
        const recent = items.slice(0, 3).map((item, idx) => {
          const tpl = templates.find((t) => t.id === item.artwork.template);
          return {
            id: item.id,
            title: tpl ? `내 ${tpl.name}` : `내 그림 ${idx + 1}`,
            spriteUrl: renderCharacterSprite(item.artwork),
          };
        });
        setCustomDrawings(recent);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    speakText(PARK_GUIDE, initial.current.soundEnabled, { characterId: initial.current.buddy });
    return () => { stopAllSpeech(); stopPlaySounds(); };
  }, []);
  useEffect(() => {
    if (!visible || blocked) { clearGameTimeouts(); endRide(); setReaction(null); setCustomReaction(null); stopAllSpeech(); stopPlaySounds(); }
  }, [visible, blocked, clearGameTimeouts]);

  const touchFriend = (id: CharacterId) => {
    if (!visible || blocked || performance.now() - lastTap.current < 180) return;
    lastTap.current = performance.now();
    const action = react(id);
    if (!action) return;
    endRide();
    clearGameTimeouts();
    setCustomReaction(null);
    setReaction({ id, action, serial: ++serial.current });
    if (action === 'jump' || action === 'roll') playBouncyBoing(soundEnabled);
    else if (action === 'wave' || action === 'dance') playSparkleChime(soundEnabled);
    else playJellyTap(soundEnabled);
    // The touched friend speaks in their own voice; the engine cancels prior speech.
    speakText(PARK_ACTIONS[action].speech, soundEnabled, { characterId: id, playIntroSFX: false });
    scheduleGameTimeout(() => setReaction(null), 2100);
  };

  const touchCustomDrawing = (item: CustomParkDrawing, index: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (!visible || blocked || performance.now() - lastTap.current < 180) return;
    lastTap.current = performance.now();
    clearGameTimeouts();
    endRide();
    setReaction(null);
    setCustomReaction({ id: item.id, title: item.title, serial: ++serial.current });
    playCelebrationFanfare(soundEnabled);
    playBouncyBoing(soundEnabled);
    const rect = e.currentTarget.getBoundingClientRect();
    emitJuice({ kind: 'success', x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    const speech = PARK_DRAWING_SPEECHES[index % PARK_DRAWING_SPEECHES.length];
    speakText(speech, soundEnabled, { characterId: buddy, playIntroSFX: false });
    scheduleGameTimeout(() => setCustomReaction(null), 2400);
  };

  const drag = useRoamingDrag({ field, held, getPosition, move, release, blocked: !visible || blocked,
    onTap: touchFriend,
    onDrop: (_id, point) => {
      clearGameTimeouts(); endRide(); setReaction(null); playJellyTap(soundEnabled);
      emitJuice({ kind: 'snap', x: point.x, y: point.y });
    },
  });

  return <section className="character-park" data-still={paused || reduced || !visible || blocked} data-reduced={Boolean(reduced)} aria-label="친구 놀이터" aria-description="친구를 잡아 원하는 곳에 놓아 보세요. 짧게 누르면 함께 놀고, 방향키로도 옮길 수 있어요." data-juice-surface>
    <h1 className="sr-only">친구 놀이터</h1>
    <div className="park-scenery" aria-hidden="true" />
    <div className="park-cloud park-cloud-one" aria-hidden="true" /><div className="park-cloud park-cloud-two" aria-hidden="true" />
    <div className="park-pennants" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} />)}</div>
    <span className="park-tap-guide" aria-hidden="true"><Hand /><span>친구를 콕!{customDrawings.length > 0 ? ` · 내 그림 ${customDrawings.length}` : ''}</span></span>
    {onOpenDrawing && (
      <button
        type="button"
        className="park-sketch-btn"
        aria-label="스케치북에서 내 그림 색칠해서 놀이터로 데려오기"
        onClick={() => {
          playJellyTap(soundEnabled);
          stopAllSpeech();
          onOpenDrawing();
        }}
      >
        <Palette aria-hidden="true" />
        <span>내 그림 데려오기</span>
      </button>
    )}
    {!reduced && <button className="park-pause" aria-label={paused ? '친구들 다시 움직이기' : '친구들 움직임 멈추기'} aria-pressed={paused} onClick={() => {
      setPaused(value => !value); playJellyTap(soundEnabled); stopAllSpeech();
    }}>{paused ? <Play fill="currentColor" /> : <Pause fill="currentColor" />}</button>}
    <div ref={field} className="park-field">
      {memory.paintedRide && <button type="button" className="park-painted-ride" data-riding={riding}
        aria-label={`내가 색칠한 ${memory.paintedRide.kind === 'rocket' ? '로켓' : memory.paintedRide.kind === 'boat' ? '배' : '자동차'}를 친구와 타기`}
        onClick={() => {
          if (!visible || blocked || riding) return;
          clearGameTimeouts(); setReaction(null); setCustomReaction(null);
          held.current.add(buddy); setRiding(true);
          playBouncyBoing(soundEnabled);
          speakText(memory.paintedRide?.kind === 'rocket' ? '네가 색칠한 로켓이야! 같이 날아가자!' : '네가 색칠한 자동차야! 같이 타자!', soundEnabled, { characterId: buddy, playIntroSFX: false });
          scheduleGameTimeout(endRide, 1800);
        }}>
        {riding && <span className="park-ride-passenger"><CharacterAvatar id={buddy} size="md" mood="excited"/></span>}
        <RideKeepsake ride={memory.paintedRide}/>
        <span className="park-ride-star" aria-hidden="true"><Sparkles/></span>
      </button>}
      {customDrawings.map((item, idx) => {
        const spot = CUSTOM_SPOTS[idx % CUSTOM_SPOTS.length];
        const isReacting = customReaction?.id === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className="park-custom-drawing"
            data-reacting={isReacting}
            style={{ left: spot.left, top: spot.top, '--custom-delay': `${idx * -0.9}s` } as CSSProperties}
            aria-label={`내가 그린 ${item.title} 친구와 놀기`}
            onClick={(e) => touchCustomDrawing(item, idx, e)}
          >
            <span className="park-shadow" aria-hidden="true" />
            <span className="park-custom-performer" aria-hidden="true">
              <img src={item.spriteUrl} alt="" className="park-custom-img" />
            </span>
            <span className="park-custom-badge" aria-hidden="true">🎨 {item.title}</span>
            {isReacting && (
              <span key={customReaction.serial} className="park-reaction" aria-hidden="true">
                <Sparkles />
                <Heart className="park-love" fill="currentColor" />
                <span>유하 그림 최고!</span>
              </span>
            )}
          </button>
        );
      })}
      {CHARACTER_LIST.map(friend => {
        const selected = reaction?.id === friend.id;
        const ReactionIcon = selected ? ACTION_ICONS[reaction.action] : Heart;
        return <button key={friend.id} ref={node => { if (node) nodes.current.set(friend.id, node); else nodes.current.delete(friend.id); }}
          className="park-friend" data-park-friend={friend.id} data-reacting={selected}
          data-riding={riding && friend.id === buddy || undefined} aria-hidden={riding && friend.id === buddy || undefined} tabIndex={riding && friend.id === buddy ? -1 : 0}
          style={{ '--friend-color': friend.color } as CSSProperties}
          aria-label={`${friend.name}와 놀기`}
          {...drag.handlers(friend.id)}
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
    <div className="park-status" aria-live="polite">{customReaction ? `${customReaction.title} · 신나게 폴짝!` : reaction ? `${CHARACTERS[reaction.id].name} · ${PARK_ACTIONS[reaction.action].label}` : <span aria-hidden="true"><Heart size={13} fill="currentColor" /> 우리 모두 함께 놀자</span>}</div>
  </section>;
}
