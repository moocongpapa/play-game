import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { Heart, Pause, Play, RotateCcw, Check } from 'lucide-react';
import type { CharacterId } from '../../types';
import { HABITAT_FRIENDS, MAX_HABITAT_FRIENDS, type HabitatFriend, type HabitatKind } from '../../data/habitatFriends';
import { CreatureArtwork } from './CreatureArtwork';
import { HabitatBackdrop } from './HabitatBackdrop';
import { useHabitatMotion, type LivingFriend } from './useHabitatMotion';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import { usePageVisible } from '../../hooks/useToddlerPlay';
import { playBubblePop, playJellyTap, playSparkleChime, speakText, stopAllSpeech, stopPlaySounds } from '../../utils/soundEngine';
import type { HabitatPlacement } from '../../utils/habitatMotion';
import './HabitatPlay.css';

interface HabitatTap {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

const TAP_EMOJIS_AQUARIUM = ['🫧', '✨', '⭐', '💖', '🐠'];
const TAP_EMOJIS_GARDEN = ['🌸', '✨', '🍀', '🌼', '💖'];

export interface HabitatPlayProps {
  buddy: CharacterId;
  childName: string;
  soundEnabled: boolean;
}

export function HabitatPlay({ kind, buddy, childName, soundEnabled }: HabitatPlayProps & { kind: HabitatKind }) {
  const catalogue = HABITAT_FRIENDS[kind];
  const uid = useRef(0);
  const makeFriend = (species: HabitatFriend, position?: HabitatPlacement): LivingFriend => ({
    uid: `${kind}-${++uid.current}`,
    species,
    position,
  });

  const [friends, setFriends] = useState<LivingFriend[]>(() => catalogue.map(species => makeFriend(species)));
  const friendsRef = useRef(friends);
  friendsRef.current = friends;

  const [selected, setSelected] = useState(catalogue[0].id);
  const [happyUid, setHappyUid] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [taps, setTaps] = useState<HabitatTap[]>([]);

  const field = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const visible = usePageVisible();
  const reduced = useReducedMotion();
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const latest = useRef({ buddy, soundEnabled, childName });
  latest.current = { buddy, soundEnabled, childName };
  const lastTap = useRef(-Infinity);

  const { nodes, held } = useHabitatMotion(field, friends, visible && !paused && !reduced, happyUid);
  const happyFriend = friends.find(friend => friend.uid === happyUid);
  const selectedFriend = catalogue.find(friend => friend.id === selected) || catalogue[0];

  useEffect(() => {
    const p = latest.current;
    speakText(
      `${p.childName}야, ${kind === 'aquarium' ? '바다' : '곤충'} 친구들을 콕 눌러 봐!`,
      p.soundEnabled,
      { characterId: p.buddy }
    );
    return () => {
      stopAllSpeech();
      stopPlaySounds();
    };
  }, [kind, buddy]);

  useEffect(() => {
    if (!visible) {
      clearGameTimeouts();
      setHappyUid(null);
      held.current.clear();
      setTaps([]);
      stopAllSpeech();
      stopPlaySounds();
    }
  }, [visible, clearGameTimeouts, held]);

  const addTapEffect = (clientX: number, clientY: number) => {
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pool = kind === 'aquarium' ? TAP_EMOJIS_AQUARIUM : TAP_EMOJIS_GARDEN;
    const emoji = pool[Math.floor(Math.random() * pool.length)];
    const newTap: HabitatTap = {
      id: Date.now() + Math.random(),
      x: clientX - rect.left,
      y: clientY - rect.top,
      emoji,
    };
    setTaps(prev => [...prev.slice(-6), newTap]);
  };

  useEffect(() => {
    if (!taps.length) return;
    const timer = setTimeout(() => setTaps([]), 950);
    return () => clearTimeout(timer);
  }, [taps]);

  const react = (friend: LivingFriend, added = false) => {
    clearGameTimeouts();
    setHappyUid(friend.uid);
    if (kind === 'aquarium') playBubblePop(soundEnabled);
    else playSparkleChime(soundEnabled);

    speakText(
      added ? `안녕, ${friend.species.name}! ${friend.species.greeting}` : `${friend.species.name}! ${friend.species.greeting}`,
      soundEnabled,
      { characterId: buddy, playIntroSFX: false }
    );
    scheduleGameTimeout(() => setHappyUid(null), 1600);
  };

  const addFriend = (species: HabitatFriend, position?: HabitatPlacement, clientPos?: { x: number; y: number }) => {
    if (performance.now() - lastTap.current < 180) return;
    lastTap.current = performance.now();
    if (clientPos) addTapEffect(clientPos.x, clientPos.y);

    setSelected(species.id);
    const current = friendsRef.current;
    // At the population cap, greet an existing friend instead of covering the habitat.
    const existing = current.length >= MAX_HABITAT_FRIENDS ? current.find(friend => friend.species.id === species.id) : undefined;
    if (existing) {
      react(existing);
      return;
    }
    const next = makeFriend(species, position);
    friendsRef.current = [...current.slice(-(MAX_HABITAT_FRIENDS - 1)), next];
    setFriends(friendsRef.current);
    react(next, true);
  };

  const touchFriend = (friend: LivingFriend, clientPos?: { x: number; y: number }) => {
    if (performance.now() - lastTap.current < 180) return;
    lastTap.current = performance.now();
    if (clientPos) addTapEffect(clientPos.x, clientPos.y);
    react(friend);
  };

  const reset = () => {
    clearGameTimeouts();
    setHappyUid(null);
    held.current.clear();
    setTaps([]);
    friendsRef.current = catalogue.map(species => makeFriend(species));
    setFriends(friendsRef.current);
    playJellyTap(soundEnabled);
    speakText('친구들이 다시 모였네! 반가워!', soundEnabled, { characterId: buddy, playIntroSFX: false });
  };

  return (
    <section
      className={`habitat-screen habitat-${kind}`}
      data-still={paused || reduced || !visible}
      aria-label={kind === 'aquarium' ? '바다 친구 수족관' : '곤충 놀이터'}
    >
      <h1 className="sr-only">{kind === 'aquarium' ? '바다 친구 수족관' : '곤충 놀이터'}</h1>

      <div ref={sceneRef} className="habitat-scene">
        <HabitatBackdrop kind={kind} />
        <div className="habitat-light" aria-hidden="true" />

        {kind === 'aquarium' && (
          <div className="habitat-bubbles" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <i key={i} style={{ '--bubble-order': i } as React.CSSProperties} />
            ))}
          </div>
        )}

        <div className="habitat-controls">
          <button
            onClick={() => setPaused(value => !value)}
            aria-label={paused ? '친구들 다시 움직이기' : '친구들 움직임 멈추기'}
            aria-pressed={paused}
          >
            {paused ? <Play fill="currentColor" /> : <Pause fill="currentColor" />}
          </button>
          <button onClick={reset} aria-label="친구들 다시 모으기">
            <RotateCcw />
          </button>
        </div>

        <div ref={field} className="habitat-population">
          <button
            className="habitat-add-surface"
            aria-label={`${selectedFriend.name} ${kind === 'aquarium' ? '물속에' : '풀밭에'} 부르기`}
            onClick={event => {
              const rect = field.current?.getBoundingClientRect();
              const pos = event.detail && rect
                ? { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height }
                : { x: 0.5, y: 0.5 };
              addFriend(selectedFriend, pos, { x: event.clientX, y: event.clientY });
            }}
          />

          {friends.map(friend => (
            <button
              key={friend.uid}
              ref={node => {
                if (node) nodes.current.set(friend.uid, node);
                else nodes.current.delete(friend.uid);
              }}
              className={`habitat-creature movement-${friend.species.motion} ${
                friend.species.large ? 'creature-large' : ''
              } ${happyUid === friend.uid ? 'is-delighted' : ''}`}
              aria-label={`${friend.species.name}에게 인사하기`}
              style={{ '--friend-color': friend.species.color } as React.CSSProperties}
              onPointerDown={event => {
                if (event.button !== 0 || !event.isPrimary) return;
                held.current.add(friend.uid);
                event.currentTarget.setPointerCapture(event.pointerId);
                touchFriend(friend, { x: event.clientX, y: event.clientY });
              }}
              onPointerUp={() => held.current.delete(friend.uid)}
              onPointerCancel={() => held.current.delete(friend.uid)}
              onLostPointerCapture={() => held.current.delete(friend.uid)}
              onFocus={() => held.current.add(friend.uid)}
              onBlur={() => held.current.delete(friend.uid)}
              onClick={event => {
                if (event.detail === 0) touchFriend(friend);
              }}
            >
              <span className="creature-facing">
                <CreatureArtwork id={friend.species.id} happy={happyUid === friend.uid} />
              </span>
              {happyUid === friend.uid && (
                <>
                  <span className="creature-heart" aria-hidden="true">
                    <Heart fill="currentColor" />
                  </span>
                  <span className="creature-name">{friend.species.name}</span>
                </>
              )}
            </button>
          ))}
        </div>

        {/* Floating Tap Sparkles & Bubbles */}
        {taps.map(t => (
          <span
            key={t.id}
            className="habitat-floating-tap"
            style={{ left: t.x, top: t.y }}
            aria-hidden="true"
          >
            {t.emoji}
          </span>
        ))}

        <div className="habitat-reaction" aria-live="polite">
          {happyFriend ? (
            <>
              <Heart size={16} fill="currentColor" />
              <span>{happyFriend.species.reaction}</span>
            </>
          ) : (
            <span aria-hidden="true">{kind === 'aquarium' ? '물방울 친구들' : '작은 숲 친구들'}</span>
          )}
        </div>
      </div>

      <div className="habitat-tray" aria-label={kind === 'aquarium' ? '수족관 친구 고르기' : '곤충 친구 고르기'}>
        {catalogue.map(species => (
          <button
            key={species.id}
            className="habitat-choice"
            aria-label={`${species.name} 부르기`}
            aria-pressed={selected === species.id}
            onClick={() => addFriend(species)}
            style={{ '--friend-color': species.color } as React.CSSProperties}
          >
            <CreatureArtwork id={species.id} />
            <span>{species.name}</span>
            {selected === species.id && <Check className="habitat-chosen" aria-hidden="true" />}
          </button>
        ))}
      </div>
    </section>
  );
}
