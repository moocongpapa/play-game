import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CharacterId } from '../types';

interface CharacterAvatarProps {
  id: CharacterId;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  mood?: 'happy' | 'dancing' | 'talking' | 'waving' | 'excited' | 'thinking';
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
  const motionProps = reduceMotion ? {} : getMotionVariant();

  // Render vector character artwork based on character id
  const renderSVG = () => {
    switch (id) {
      case 'ggomi': // 꼬미 (여자 곰 - Pink/Brown Bear + Ribbon)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* Bear Ears */}
            <circle cx="25" cy="25" r="14" fill="#C48B71" />
            <circle cx="25" cy="25" r="8" fill="#FFB7D5" />
            <circle cx="75" cy="25" r="14" fill="#C48B71" />
            <circle cx="75" cy="25" r="8" fill="#FFB7D5" />
            
            {/* Head */}
            <circle cx="50" cy="52" r="36" fill="#DDB096" />
            <circle cx="50" cy="52" r="33" fill="#E8C3AC" />
            
            {/* Pink Ribbon */}
            <path d="M 62 18 C 58 12, 54 22, 62 22 C 70 22, 66 12, 62 18 Z" fill="#FF4081" />
            <path d="M 72 18 C 68 12, 64 22, 72 22 C 80 22, 76 12, 72 18 Z" fill="#FF4081" />
            <circle cx="67" cy="19" r="4" fill="#FF80AB" />

            {/* Muzzle */}
            <ellipse cx="50" cy="58" rx="14" ry="10" fill="#FFF3E0" />
            <ellipse cx="50" cy="54" rx="5" ry="3.5" fill="#5D4037" />
            <path d="M 50 57.5 L 50 62 M 46 62 Q 50 65 54 62" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Eyes */}
            <circle cx="36" cy="48" r="4" fill="#3E2723" />
            <circle cx="64" cy="48" r="4" fill="#3E2723" />
            <circle cx="37.5" cy="46.5" r="1.5" fill="#FFFFFF" />
            <circle cx="65.5" cy="46.5" r="1.5" fill="#FFFFFF" />

            {/* Rosy Cheeks */}
            <ellipse cx="30" cy="56" rx="5" ry="3" fill="#FF80AB" opacity="0.6" />
            <ellipse cx="70" cy="56" rx="5" ry="3" fill="#FF80AB" opacity="0.6" />
          </svg>
        );

      case 'rano': // 라노 (남자 공룡 - Mint Dino with soft yellow belly & back spikes)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* Back Spikes */}
            <polygon points="18,35 10,42 20,48" fill="#FFD54F" />
            <polygon points="15,48 6,56 18,62" fill="#FFD54F" />
            <polygon points="16,62 8,70 20,74" fill="#FFD54F" />

            {/* Head & Body */}
            <path d="M 22 55 Q 22 20 52 20 Q 82 20 82 55 Q 82 82 52 82 Q 22 82 22 55 Z" fill="#81C784" />
            
            {/* Cute Yellow Belly */}
            <ellipse cx="52" cy="65" rx="18" ry="14" fill="#FFF59D" />

            {/* Cute Nostrils */}
            <circle cx="70" cy="52" r="1.5" fill="#388E3C" />
            <circle cx="75" cy="52" r="1.5" fill="#388E3C" />

            {/* Big Eyes */}
            <circle cx="42" cy="42" r="6" fill="#FFFFFF" />
            <circle cx="60" cy="42" r="6" fill="#FFFFFF" />
            <circle cx="43" cy="42" r="3.5" fill="#2E7D32" />
            <circle cx="61" cy="42" r="3.5" fill="#2E7D32" />
            <circle cx="44.5" cy="40.5" r="1" fill="#FFFFFF" />
            <circle cx="62.5" cy="40.5" r="1" fill="#FFFFFF" />

            {/* Smile */}
            <path d="M 46 56 Q 58 64 68 56" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" fill="none" />

            {/* Rosy Cheeks */}
            <ellipse cx="36" cy="50" rx="4" ry="2.5" fill="#FF8A80" opacity="0.6" />
            <ellipse cx="68" cy="50" rx="4" ry="2.5" fill="#FF8A80" opacity="0.6" />
          </svg>
        );

      case 'jelly': // 젤리 (여자 토끼 - Lavender Bunny + Long Ears + Flower)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* Long Bunny Ears */}
            <ellipse cx="35" cy="22" rx="8" ry="20" fill="#E1BEE7" transform="rotate(-10 35 22)" />
            <ellipse cx="35" cy="22" rx="4" ry="14" fill="#F8BBD0" transform="rotate(-10 35 22)" />
            <ellipse cx="65" cy="22" rx="8" ry="20" fill="#E1BEE7" transform="rotate(10 65 22)" />
            <ellipse cx="65" cy="22" rx="4" ry="14" fill="#F8BBD0" transform="rotate(10 65 22)" />

            {/* Head */}
            <circle cx="50" cy="58" r="34" fill="#F3E5F5" />
            <circle cx="50" cy="58" r="31" fill="#FFFFFF" />

            {/* Flower Pin on Ear */}
            <circle cx="68" cy="38" r="4" fill="#FF80AB" />
            <circle cx="68" cy="38" r="1.5" fill="#FFF59D" />

            {/* Nose & Mouth */}
            <polygon points="50,56 47,53 53,53" fill="#EC407A" />
            <path d="M 50 56 L 50 60 M 46 60 Q 50 63 54 60" stroke="#8E24AA" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Sparkling Eyes */}
            <ellipse cx="37" cy="52" rx="4" ry="5" fill="#4A148C" />
            <ellipse cx="63" cy="52" rx="4" ry="5" fill="#4A148C" />
            <circle cx="38" cy="50" r="1.8" fill="#FFFFFF" />
            <circle cx="64" cy="50" r="1.8" fill="#FFFFFF" />

            {/* Cheeks */}
            <ellipse cx="30" cy="60" rx="5" ry="3" fill="#FF80AB" opacity="0.6" />
            <ellipse cx="70" cy="60" rx="5" ry="3" fill="#FF80AB" opacity="0.6" />
          </svg>
        );

      case 'dochi': // 도치 (남자 고슴도치 - Peach Body + Soft Quills)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* Soft Quills Hair */}
            <path d="M 15 45 Q 20 15 50 15 Q 80 15 85 45 Q 90 70 80 80 Q 50 90 20 80 Z" fill="#FFA726" />
            <path d="M 22 45 Q 25 22 50 22 Q 75 22 78 45 Q 82 65 75 74 Q 50 82 25 74 Z" fill="#FB8C00" />

            {/* Face */}
            <ellipse cx="50" cy="56" rx="28" ry="24" fill="#FFE0B2" />
            
            {/* Nose */}
            <circle cx="50" cy="58" r="4" fill="#4E342E" />
            <path d="M 50 62 Q 46 66 50 68 Q 54 66 50 62" fill="#E65100" />

            {/* Cute Eyes */}
            <circle cx="38" cy="50" r="3.5" fill="#3E2723" />
            <circle cx="62" cy="50" r="3.5" fill="#3E2723" />
            <circle cx="39" cy="48.5" r="1.2" fill="#FFFFFF" />
            <circle cx="63" cy="48.5" r="1.2" fill="#FFFFFF" />

            {/* Cheeks */}
            <ellipse cx="32" cy="58" rx="4" ry="2.5" fill="#FF7043" opacity="0.6" />
            <ellipse cx="68" cy="58" rx="4" ry="2.5" fill="#FF7043" opacity="0.6" />
          </svg>
        );

      case 'ggulgguli': // 꿀꿀이 (돼지 - Peach Pink Pig + Cute Snout)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* Ears */}
            <path d="M 20 30 Q 15 12 35 20 Z" fill="#FF8A80" />
            <path d="M 80 30 Q 85 12 65 20 Z" fill="#FF8A80" />

            {/* Head */}
            <circle cx="50" cy="54" r="34" fill="#FFCDD2" />
            <circle cx="50" cy="54" r="31" fill="#FFEBEE" />

            {/* Big Pig Snout */}
            <ellipse cx="50" cy="58" rx="13" ry="9" fill="#FF8A80" />
            <circle cx="45" cy="58" r="2.5" fill="#C62828" />
            <circle cx="55" cy="58" r="2.5" fill="#C62828" />

            {/* Eyes */}
            <circle cx="36" cy="46" r="3.5" fill="#37474F" />
            <circle cx="64" cy="46" r="3.5" fill="#37474F" />
            <circle cx="37" cy="44.5" r="1.2" fill="#FFFFFF" />
            <circle cx="65" cy="44.5" r="1.2" fill="#FFFFFF" />

            {/* Cheeks */}
            <ellipse cx="28" cy="54" rx="5" ry="3" fill="#FF5252" opacity="0.4" />
            <ellipse cx="72" cy="54" rx="5" ry="3" fill="#FF5252" opacity="0.4" />
          </svg>
        );

      case 'eumme': // 음메 (양 - Fluffy White Sheep + Bell)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* Tiny Horns */}
            <path d="M 22 30 Q 12 25 18 18 Q 28 20 26 30 Z" fill="#FFE082" />
            <path d="M 78 30 Q 88 25 82 18 Q 72 20 74 30 Z" fill="#FFE082" />

            {/* Fluffy Cloud Head */}
            <circle cx="32" cy="38" r="14" fill="#ECEFF1" />
            <circle cx="68" cy="38" r="14" fill="#ECEFF1" />
            <circle cx="50" cy="30" r="16" fill="#ECEFF1" />
            <circle cx="28" cy="58" r="14" fill="#ECEFF1" />
            <circle cx="72" cy="58" r="14" fill="#ECEFF1" />
            <circle cx="50" cy="70" r="16" fill="#ECEFF1" />
            
            {/* Soft Face */}
            <ellipse cx="50" cy="52" rx="22" ry="18" fill="#FFF3E0" />

            {/* Eyes */}
            <circle cx="41" cy="48" r="3" fill="#37474F" />
            <circle cx="59" cy="48" r="3" fill="#37474F" />

            {/* Smile & Nose */}
            <path d="M 50 52 Q 47 56 50 58 Q 53 56 50 52" fill="#E57373" />

            {/* Bell Collar */}
            <circle cx="50" cy="72" r="4" fill="#FFCA28" />
          </svg>
        );

      case 'nurungji': // 누룽지 (황토색 강아지 - Golden Ocher Puppy)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            {/* Floppy Ears */}
            <path d="M 18 35 C 5 45, 10 70, 24 60 Z" fill="#8D6E63" />
            <path d="M 82 35 C 95 45, 90 70, 76 60 Z" fill="#8D6E63" />

            {/* Head */}
            <circle cx="50" cy="52" r="34" fill="#FFB74D" />
            <circle cx="50" cy="52" r="31" fill="#FFE082" />

            {/* Cute Snout */}
            <ellipse cx="50" cy="60" rx="12" ry="9" fill="#FFFFFF" />
            <ellipse cx="50" cy="56" rx="4.5" ry="3" fill="#3E2723" />
            <path d="M 50 59 L 50 63 M 46 63 Q 50 66 54 63" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Eyes */}
            <circle cx="36" cy="46" r="4" fill="#3E2723" />
            <circle cx="64" cy="46" r="4" fill="#3E2723" />
            <circle cx="37.5" cy="44.5" r="1.5" fill="#FFFFFF" />
            <circle cx="65.5" cy="44.5" r="1.5" fill="#FFFFFF" />

            {/* Cheeks */}
            <ellipse cx="28" cy="54" rx="4" ry="2.5" fill="#FF8A80" opacity="0.6" />
            <ellipse cx="72" cy="54" rx="4" ry="2.5" fill="#FF8A80" opacity="0.6" />
          </svg>
        );
    }
  };

  return (
    <motion.div
      {...motionProps}
      onClick={onClick}
      className={`relative flex items-center justify-center ${onClick ? 'cursor-pointer' : ''} select-none ${getDimension()} ${className}`}
    >
      {renderSVG()}
      {showBadge && (
        <span className="absolute -bottom-1 -right-1 text-2xl bg-white rounded-full shadow p-1 border-2 border-[#FF9E4A]">
          ✨
        </span>
      )}
    </motion.div>
  );
};
