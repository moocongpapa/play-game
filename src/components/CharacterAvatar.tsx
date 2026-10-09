import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { CharacterId } from '../types';
import { CHARACTERS } from '../data/characters';
import { CharacterArtwork, type CharacterExpression, type CharacterView } from './CharacterArtwork';

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

export function CharacterAvatar({ id, size = 'md', mood = 'happy', expression, view = 'front', variant,
  onClick, className = '', showBadge = false }: CharacterAvatarProps) {
  const reduceMotion = useReducedMotion();
  const [delighted, setDelighted] = useState(false);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(releaseTimer.current), []);

  const reactToTouch = () => {
    clearTimeout(releaseTimer.current);
    setDelighted(true);
    releaseTimer.current = setTimeout(() => setDelighted(false), 850);
  };
  const still = reduceMotion || mood === 'still';
  const lively = mood === 'excited' || mood === 'dancing';
  const animate = still ? { y: 0, rotate: 0, scaleX: 1, scaleY: 1 } : lively ? {
    y: [0, 2, -9, 0, 1, 0], rotate: mood === 'dancing' ? [0, -4, 0, 4, 0, 0] : 0,
    scaleX: [1, 1.055, .98, 1.045, 1, 1], scaleY: [1, .95, 1.035, .96, 1, 1],
  } : { y: 0, rotate: 0, scaleX: [1, 1.012, 1], scaleY: [1, .989, 1] };
  const portrait = variant ?? (size === 'sm' ? 'portrait' : 'full');

  return <motion.div
    animate={animate}
    transition={{ duration: still ? .2 : lively ? 1.7 : RHYTHMS[id][0], repeat: still ? 0 : Infinity, ease: 'easeInOut' }}
    style={{ transformOrigin: '50% 94%', '--friend-breath': `${RHYTHMS[id][0]}s`, '--friend-delay': `${RHYTHMS[id][1]}s` } as CSSProperties}
    data-character={id} data-mood={mood} data-idle={!still && !lively} data-portrait={portrait === 'portrait'}
    data-juice-target={onClick ? '' : undefined}
    onPointerDown={reactToTouch}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    aria-label={onClick ? `${CHARACTERS[id].name}와 놀기` : undefined}
    onKeyDown={onClick ? event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); reactToTouch(); onClick(); }
    } : undefined}
    className={`character-avatar relative flex items-center justify-center ${onClick ? 'cursor-pointer' : ''} select-none ${DIMENSIONS[size]} ${className}`}
  >
    <CharacterArtwork id={id} expression={delighted && !expression && mood !== 'talking' ? 'excited' : expression ?? EXPRESSIONS[mood]} view={view} variant={portrait} />
    {showBadge && <span className="absolute -bottom-1 -right-1 text-2xl bg-white rounded-full shadow p-1 border-2 border-[#FF9E4A]" aria-hidden="true">✨</span>}
  </motion.div>;
}
