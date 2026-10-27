import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { CharacterId } from '../types';
import { CHARACTERS } from '../data/characters';
import { CharacterArtwork, type CharacterExpression, type CharacterView } from './CharacterArtwork';
import { playCareSound, subscribeSpeechState } from '../utils/soundEngine';
import { CHARACTER_PERFORMANCE } from '../utils/characterPerformance';
import { emitJuice } from '../utils/juice';

type CharacterMood = 'happy' | 'dancing' | 'talking' | 'waving' | 'excited' | 'thinking' | 'still' | 'sleepy' | 'comfort';
interface CharacterAvatarProps {
  id: CharacterId;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  mood?: CharacterMood;
  expression?: CharacterExpression;
  view?: CharacterView;
  variant?: 'full' | 'portrait';
  onClick?: () => void;
  className?: string;
  showBadge?: boolean;
  interactive?: boolean;
}

const DIMENSIONS = { sm: 'w-12 h-12', md: 'w-20 h-20', lg: 'w-32 h-32', xl: 'w-44 h-44', '2xl': 'w-60 h-60' };
const EXPRESSIONS: Record<CharacterMood, CharacterExpression> = {
  happy: 'happy', still: 'happy', waving: 'happy', dancing: 'excited', excited: 'excited',
  talking: 'talking', thinking: 'curious', sleepy: 'sleepy', comfort: 'comfort',
};
// Species rhythms keep a group of friends from breathing or blinking in unison.
const RHYTHMS: Record<CharacterId, [number, number]> = {
  ggomi: [3.6, .2], jelly: [3.1, 1.1], rano: [3.8, .7], dochi: [4.1, 2.4],
  ggulgguli: [3.5, 1.7], eumme: [4.4, 3.2], nurungji: [2.9, 2.1], pingu: [3.7, .5],
};

let gazeInitialized = false;
function ensureGlobalGazeTracker() {
  if (gazeInitialized || typeof window === 'undefined' || typeof document === 'undefined') return;
  gazeInitialized = true;
  let rafId = 0;
  let targetX = 0;
  let targetY = 0;
  const update = () => {
    rafId = 0;
    const root = document.documentElement;
    root.style.setProperty('--gaze-x', `${(targetX * 2.2).toFixed(2)}px`);
    root.style.setProperty('--gaze-y', `${(targetY * 1.8).toFixed(2)}px`);
    root.style.setProperty('--head-tilt', `${(targetX * 2.8).toFixed(2)}deg`);
  };
  const onMove = (e: globalThis.PointerEvent) => {
    if (!window.innerWidth || !window.innerHeight) return;
    targetX = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth - 0.5) * 2));
    targetY = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight - 0.5) * 2));
    if (!rafId) rafId = window.requestAnimationFrame(update);
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onMove, { passive: true });
}

export function CharacterAvatar({ id, size = 'md', mood = 'happy', expression, view = 'front', variant,
  onClick, className = '', showBadge = false, interactive = false }: CharacterAvatarProps) {
  const isInteractive = interactive;
  const reduceMotion = useReducedMotion();
  const [delighted, setDelighted] = useState(false);
  const [liveSpeaking, setLiveSpeaking] = useState(false);
  const [tickled, setTickled] = useState(false);
  const [tooting, setTooting] = useState(false);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const tickleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const tootTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const tapTimesRef = useRef<number[]>([]);
  const dragTrackerRef = useRef<{ isDown: boolean; startX: number; lastX: number; lastDir: number; reversals: number; startTime: number }>({
    isDown: false,
    startX: 0,
    lastX: 0,
    lastDir: 0,
    reversals: 0,
    startTime: 0,
  });

  useEffect(() => {
    if (!reduceMotion) ensureGlobalGazeTracker();
    const unsub = subscribeSpeechState(({ speaking, characterId }) => {
      setLiveSpeaking(speaking && (characterId === id || !characterId));
    });
    return () => {
      unsub();
      clearTimeout(releaseTimer.current);
      clearTimeout(tickleTimer.current);
      clearTimeout(tootTimer.current);
    };
  }, [id, reduceMotion]);

  const reactToTouch = (e?: PointerEvent<HTMLDivElement>) => {
    clearTimeout(releaseTimer.current);
    setDelighted(true);
    if (e) {
      emitJuice({ kind: 'pop', x: e.clientX, y: e.clientY });
    }
    releaseTimer.current = setTimeout(() => setDelighted(false), 850);
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    reactToTouch(e);
    if (!isInteractive) return;

    dragTrackerRef.current = {
      isDown: true,
      startX: e.clientX,
      lastX: e.clientX,
      lastDir: 0,
      reversals: 0,
      startTime: performance.now(),
    };

    // Check for 3 rapid taps on the lower body (Toot Easter Egg)
    const rect = e.currentTarget.getBoundingClientRect();
    const isLower = e.clientY - rect.top > rect.height * 0.52;
    if (isLower) {
      const now = performance.now();
      const recent = tapTimesRef.current.filter(t => now - t < 950);
      recent.push(now);
      tapTimesRef.current = recent;
      if (recent.length >= 3) {
        tapTimesRef.current = [];
        clearTimeout(tootTimer.current);
        setTooting(true);
        playCareSound('toot', true);
        emitJuice({ kind: 'pop', x: e.clientX, y: e.clientY });
        tootTimer.current = setTimeout(() => setTooting(false), 1800);
      }
    }
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isInteractive || !dragTrackerRef.current.isDown || tickled || tooting) return;
    const now = performance.now();
    const dx = e.clientX - dragTrackerRef.current.lastX;
    if (Math.abs(dx) > 10) {
      const dir = dx > 0 ? 1 : -1;
      if (dragTrackerRef.current.lastDir !== 0 && dir !== dragTrackerRef.current.lastDir) {
        dragTrackerRef.current.reversals += 1;
        if (dragTrackerRef.current.reversals >= 3 && now - dragTrackerRef.current.startTime < 1200) {
          // Trigger Tickle Easter Egg!
          clearTimeout(tickleTimer.current);
          setTickled(true);
          playCareSound('giggle', true);
          emitJuice({ kind: 'pop', x: e.clientX, y: e.clientY });
          tickleTimer.current = setTimeout(() => setTickled(false), 1600);
          dragTrackerRef.current.reversals = 0;
        }
      }
      dragTrackerRef.current.lastDir = dir;
      dragTrackerRef.current.lastX = e.clientX;
    }
  };

  const handlePointerUp = () => {
    dragTrackerRef.current.isDown = false;
  };

  const effectiveMood: CharacterMood = liveSpeaking && mood !== 'sleepy' ? 'talking' : mood;
  const still = reduceMotion || (effectiveMood === 'still' && !delighted && !tickled && !tooting);
  const lively = effectiveMood === 'excited' || effectiveMood === 'dancing' || delighted || tickled || tooting;
  const animate = still ? { y: 0, rotate: 0, scaleX: 1, scaleY: 1 } : tickled ? {
    rotate: [-12, 12, -10, 10, -6, 6, 0],
    scaleX: [1, 1.15, 0.9, 1.12, 1],
    scaleY: [1, 0.9, 1.1, 0.94, 1],
    y: [0, -8, 2, -6, 0],
  } : tooting ? {
    y: [0, -4, 2, 0],
    scaleX: [1, 1.08, 0.98, 1],
    scaleY: [1, 0.94, 1.03, 1],
    rotate: [0, -3, 3, 0],
  } : lively ? {
    y: [0, 2, -9, 0, 1, 0], rotate: effectiveMood === 'dancing' || delighted ? [0, -4, 0, 4, 0, 0] : 0,
    scaleX: [1, 1.055, .98, 1.045, 1, 1], scaleY: [1, .95, 1.035, .96, 1, 1],
  } : effectiveMood === 'talking' ? {
    y: [0, -3.5, 0, -2, 0], rotate: [0, -1.5, 1.5, 0],
    scaleX: [1, 1.03, .985, 1.02, 1], scaleY: [1, .97, 1.03, .985, 1],
  } : { y: 0, rotate: 0, scaleX: [1, 1.012, 1], scaleY: [1, .989, 1] };

  const portrait = variant ?? (size === 'sm' ? 'portrait' : 'full');
  const activeExpression = tickled ? 'excited' : tooting ? 'curious' : liveSpeaking && mood !== 'sleepy'
    ? 'talking'
    : delighted && !expression && effectiveMood !== 'talking'
    ? 'excited'
    : expression ?? EXPRESSIONS[effectiveMood];

  return <motion.div
    animate={animate}
    transition={{ duration: still ? .2 : tickled ? 0.35 : tooting ? 0.45 : effectiveMood === 'talking' ? CHARACTER_PERFORMANCE[id].chewBeat / 600 : lively ? 1.5 : RHYTHMS[id][0], repeat: still || tickled || tooting ? 0 : Infinity, ease: 'easeInOut' }}
    style={{ transformOrigin: '50% 94%', '--friend-breath': `${RHYTHMS[id][0]}s`, '--friend-speech': `${CHARACTER_PERFORMANCE[id].chewBeat * 1.1}ms`, '--friend-delay': `${RHYTHMS[id][1]}s` } as CSSProperties}
    data-character={id} data-mood={effectiveMood} data-speaking={liveSpeaking || undefined} data-idle={!still && !lively} data-portrait={portrait === 'portrait'}
    data-juice-target={onClick ? '' : undefined}
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerUp}
    onPointerCancel={handlePointerUp}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    aria-label={onClick ? `${CHARACTERS[id].name}와 놀기` : undefined}
    onKeyDown={onClick ? event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); reactToTouch(); onClick(); }
    } : undefined}
    className={`character-avatar relative flex items-center justify-center ${onClick ? 'cursor-pointer' : ''} select-none ${DIMENSIONS[size]} ${className}`}
  >
    <CharacterArtwork id={id} expression={activeExpression} view={view} variant={portrait} />
    {tickled && <span className="avatar-easter-bubble tickle-bubble" aria-hidden="true">간질간질~ 꺄르르! 😄</span>}
    {tooting && (
      <>
        <span className="avatar-easter-bubble toot-bubble" aria-hidden="true">뿡~💨 히히!</span>
        <span className="toot-cloud-puff" aria-hidden="true">💨</span>
      </>
    )}
    {showBadge && <span className="absolute -bottom-1 -right-1 text-2xl bg-white rounded-full shadow p-1 border-2 border-[#FF9E4A]" aria-hidden="true">✨</span>}
  </motion.div>;
}

