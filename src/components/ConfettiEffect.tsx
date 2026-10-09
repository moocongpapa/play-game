import React, { useEffect } from 'react';
import { useReducedMotion } from 'motion/react';
import { CharacterAvatar } from './CharacterAvatar';
import { fireConfetti } from '../utils/confetti';
import type { CharacterId } from '../types';
import { Star } from 'lucide-react';

export const ConfettiEffect: React.FC<{ active: boolean; buddy: CharacterId }> = ({ active, buddy }) => {
  const reducedMotion = useReducedMotion();
  useEffect(() => { if (active && !reducedMotion) fireConfetti(); }, [active, reducedMotion]);
  if (!active) return null;
  return <div className="celebration-buddy" role="status"><CharacterAvatar id={buddy} size="md" mood="excited" /><Star className="size-8 fill-amber-200 text-amber-500" aria-hidden="true" /><span className="sr-only">참 잘했어!</span></div>;
};
