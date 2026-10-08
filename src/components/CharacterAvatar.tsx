import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CharacterId } from '../types';
import { CharacterArtwork } from './CharacterArtwork';

interface CharacterAvatarProps {
  id: CharacterId;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  mood?: 'happy' | 'dancing' | 'talking' | 'waving' | 'excited' | 'thinking' | 'still';
  onClick?: () => void;
  className?: string;
  showBadge?: boolean;
}


export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  id,
  size = 'md',
  mood = 'happy',
  onClick,
  className = '',
  showBadge = false,
}) => {
  const getDimension = () => {
    switch (size) {
      case 'sm': return 'w-12 h-12';
      case 'md': return 'w-20 h-20';
      case 'lg': return 'w-32 h-32';
      case 'xl': return 'w-44 h-44';
      case '2xl': return 'w-60 h-60';
    }
  };

  const getMotionVariant = () => {
    switch (mood) {
      case 'dancing':
        return {
          animate: {
            y: [0, -12, 0],
            rotate: [-5, 5, -5],
          },
          transition: {
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          },
        };
      case 'waving':
        return {
          animate: {
            rotate: [0, 8, -8, 0],
          },
          transition: {
            duration: 1.2,
            repeat: Infinity,
          },
        };
      case 'excited':
        return {
          animate: {
            scale: [1, 1.1, 1],
            y: [0, -18, 0],
          },
          transition: {
            duration: 0.6,
            repeat: Infinity,
          },
        };
      case 'talking':
        return {
          animate: {
            scale: [1, 1.05, 1],
          },
          transition: {
            duration: 0.4,
            repeat: Infinity,
          },
        };
      default:
        return {
          animate: {
            y: [0, -4, 0],
          },
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          },
        };
    }
  };

  const reduceMotion = useReducedMotion();
  const motionProps = reduceMotion || mood === 'still' ? {} : getMotionVariant();

  return (
    <motion.div
      {...motionProps}
      data-character={id}
      data-mood={mood}
      data-juice-target={onClick ? '' : undefined}
      onClick={onClick}
      className={`character-avatar relative flex items-center justify-center ${onClick ? 'cursor-pointer' : ''} select-none ${getDimension()} ${className}`}
    >
      <CharacterArtwork id={id} />
      {showBadge && (
        <span className="absolute -bottom-1 -right-1 text-2xl bg-white rounded-full shadow p-1 border-2 border-[#FF9E4A]">
          ✨
        </span>
      )}
    </motion.div>
  );
};
