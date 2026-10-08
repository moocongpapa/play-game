import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CharacterId } from '../types';

interface CharacterAvatarProps {
  id: CharacterId;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  mood?: 'happy' | 'dancing' | 'talking' | 'waving' | 'excited' | 'thinking' | 'still';
  onClick?: () => void;
  className?: string;
  showBadge?: boolean;
}


const BODY_PALETTE = {
  ggomi: { fur: '#DDB096', edge: '#C09279', belly: '#FFF0D9', dress: '#ED9CB7' },
  jelly: { fur: '#F3E5F5', edge: '#D5BADF', belly: '#FFF9FA', dress: '#C4ABE0' },
  dochi: { fur: '#FFD1A1', edge: '#DBA06F', belly: '#FFF1D6', dress: '#8DC1B4' },
  ggulgguli: { fur: '#FFCDD2', edge: '#E6A5AB', belly: '#FFF0E9', dress: '#E9BD75' },
  eumme: { fur: '#F4F3EB', edge: '#D8DAD3', belly: '#FFF9EB', dress: '#9EC5D4' },
  nurungji: { fur: '#EDBC75', edge: '#C99A64', belly: '#FFF2D8', dress: '#A2BEA0' },
};

function FriendBody({ id }: { id: keyof typeof BODY_PALETTE }) {
  const c = BODY_PALETTE[id];
  return <g data-body="full" stroke={c.edge} strokeWidth="1.3" strokeLinejoin="round">
    <ellipse className="friend-ground-shadow" cx="50" cy="95" rx="29" ry="3" fill="#88715D" opacity=".12" stroke="none" />
    {id === 'jelly' && <circle cx="73" cy="78" r="9" fill="white" />}
    {id === 'nurungji' && <path className="friend-tail" d="M71 75 Q89 80 85 63 Q98 82 76 85" fill={c.fur} />}
    {id === 'ggulgguli' && <path d="M72 77 Q91 72 88 83 Q82 90 80 80" fill="none" strokeWidth="3" />}
    {id === 'dochi' && <path d="M28 79 L23 69 L29 62 L26 52 L38 52 H65 L76 52 L73 63 L79 70 L73 81Z" fill="#DDA16D" />}
    <g className="friend-leg friend-leg-left">
    <path d="M34 77 Q29 85 28 90 Q27 96 37 95 H44 L45 80" fill={c.fur} />
    <ellipse cx="36" cy="91" rx="6" ry="3" fill={id === 'eumme' || id === 'ggulgguli' ? '#B49180' : c.belly} stroke="none" />
    </g>
    <g className="friend-leg friend-leg-right">
    <path d="M56 80 L56 94 Q73 99 73 91 L66 77" fill={c.fur} />
    <ellipse cx="64" cy="91" rx="6" ry="3" fill={id === 'eumme' || id === 'ggulgguli' ? '#B49180' : c.belly} stroke="none" />
    </g>
    <path d="M34 53 Q50 46 66 53 Q74 66 73 78 Q72 88 50 89 Q28 88 27 78 Q26 64 34 53Z" fill={c.fur} />
    {id === 'eumme' && <path d="M31 63 Q23 59 28 69 Q21 78 29 81 Q26 91 38 86 Q46 96 51 89 Q62 94 66 86 Q78 88 72 78 Q80 69 70 65" fill={c.fur} />}
    <ellipse cx="50" cy="73" rx="15" ry="12" fill={c.belly} stroke="none" />
    {id === 'ggomi' || id === 'jelly' ? <>
      <path d="M36 58 Q50 63 64 58 L69 83 Q50 93 31 83Z" fill={c.dress} stroke="none" />
      <path d="M37 77 Q50 83 64 77" fill="none" stroke="#FFF8EC" strokeWidth="2" />
      <path d="M50 75 C39 68 44 64 50 68 C56 63 61 69 50 75" fill="#FFF4DC" stroke="none" />
    </> : <>
      <path d="M33 56 Q50 63 68 56 L64 63 L51 69 L36 63Z" fill={c.dress} stroke="none" />
      <circle cx="50" cy="66" r="3" fill={id === 'eumme' ? '#EDCA6A' : '#FFF4DC'} stroke="none" />
    </>}
    <g className="friend-arm friend-arm-left">
      <path d="M35 59 Q24 54 18 66 Q13 75 19 78 Q25 82 33 70" fill={c.fur} />
      <ellipse cx="21" cy="73" rx="3" ry="4" fill={c.belly} stroke="none" />
    </g>
    <g className="friend-arm friend-arm-right">
      <path d="M65 59 Q75 55 80 44 Q84 36 90 41 Q99 52 73 71" fill={c.fur} />
      <ellipse cx="87" cy="46" rx="3" ry="4" fill={c.belly} stroke="none" />
    </g>
  </g>;
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

  // Render vector character artwork based on character id
  const renderSVG = () => {
    switch (id) {
      case 'ggomi': // 꼬미 (여자 곰 - Pink/Brown Bear + Ribbon)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <FriendBody id={id} />
            <g transform="translate(13 0) scale(.74)">
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
            </g>
          </svg>
        );

      case 'rano': // 라노 (남자 공룡 - Mint Dino with soft yellow belly & back spikes)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <ellipse className="friend-ground-shadow" cx="50" cy="94" rx="31" ry="3" fill="#628578" opacity=".15" />
            <path className="friend-tail" d="M75 66 Q93 71 91 47 Q104 88 72 85Z" fill="#7DB58A" />
            <path className="friend-arm friend-arm-left" d="M27 73 Q22 59 14 65 Q8 72 23 80" fill="#81C784" stroke="#68A572" strokeWidth="1.5" />
            <path className="friend-arm friend-arm-right" d="M75 67 Q88 52 92 59 Q97 68 78 77" fill="#81C784" stroke="#68A572" strokeWidth="1.5" />
            <g className="friend-leg friend-leg-left">
              <path d="M28 78 L28 88 Q20 97 36 96 H46 V80" fill="#81C784" stroke="#68A572" strokeWidth="1.5" />
              <path d="M30 91 V95 M36 91 V95" stroke="#FFF5CD" strokeWidth="2" strokeLinecap="round" />
            </g>
            <g className="friend-leg friend-leg-right">
              <path d="M58 80 V95 H76 Q82 88 71 85 L73 78" fill="#81C784" stroke="#68A572" strokeWidth="1.5" />
              <path d="M66 91 V95 M72 91 V95" stroke="#FFF5CD" strokeWidth="2" strokeLinecap="round" />
            </g>
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
            <FriendBody id={id} />
            <g transform="translate(13 0) scale(.74)">
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
            </g>
          </svg>
        );

      case 'dochi': // 도치 (남자 고슴도치 - Peach Body + Soft Quills)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <FriendBody id={id} />
            <g transform="translate(13 0) scale(.74)">
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
            </g>
          </svg>
        );

      case 'ggulgguli': // 꿀꿀이 (돼지 - Peach Pink Pig + Cute Snout)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <FriendBody id={id} />
            <g transform="translate(13 0) scale(.74)">
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
            </g>
          </svg>
        );

      case 'eumme': // 음메 (양 - Fluffy White Sheep + Bell)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <FriendBody id={id} />
            <g transform="translate(13 0) scale(.74)">
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
            </g>
          </svg>
        );

      case 'pingu':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" aria-hidden="true">
            <ellipse className="friend-ground-shadow" cx="50" cy="90" rx="31" ry="4" fill="#7395a3" opacity=".15" />
            <g className="friend-leg friend-leg-left"><ellipse cx="34" cy="85" rx="13" ry="6" fill="#edb66b" transform="rotate(-12 34 85)" /></g>
            <g className="friend-leg friend-leg-right"><ellipse cx="66" cy="85" rx="13" ry="6" fill="#edb66b" transform="rotate(12 66 85)" /></g>
            <path className="friend-arm friend-arm-left" d="M24 47 Q10 43 9 65 Q11 73 26 60" fill="#405c73" stroke="#365168" strokeWidth="2" strokeLinejoin="round" />
            <path className="friend-arm friend-arm-right" d="M76 47 Q89 33 94 43 Q94 54 77 64" fill="#405c73" stroke="#365168" strokeWidth="2" strokeLinejoin="round" />
            <path d="M20 49 Q17 12 50 10 Q83 12 80 49 L83 66 Q82 89 50 89 Q18 89 17 66Z" fill="#526f86" />
            <path d="M25 49 Q22 24 37 23 Q46 22 50 32 Q56 21 66 23 Q80 26 75 49 Q85 80 50 82 Q15 80 25 49Z" fill="#fff8e9" />
            <path d="M42 12 Q45 4 52 10 Q58 4 61 14" fill="#526f86" />
            <ellipse cx="36" cy="41" rx="3.8" ry="4.6" fill="#35495b" /><ellipse cx="64" cy="41" rx="3.8" ry="4.6" fill="#35495b" />
            <circle cx="37" cy="39" r="1.3" fill="white" /><circle cx="65" cy="39" r="1.3" fill="white" />
            <ellipse cx="28" cy="49" rx="5.5" ry="3.2" fill="#eea6a2" /><ellipse cx="72" cy="49" rx="5.5" ry="3.2" fill="#eea6a2" />
            <path d="M43 48 Q50 43 57 48 Q50 59 43 48Z" fill="#eeb36b" stroke="#d19b58" strokeWidth="1" />
            <path d="M24 58 Q50 66 76 58 L75 66 Q50 74 25 66Z" fill="#84c9bb" />
            <path d="M61 65 L71 65 L75 81 Q69 86 63 82Z" fill="#73bbaa" />
            <path d="M65 79 L72 77" stroke="#e2f3db" strokeWidth="2" strokeLinecap="round" />
            <circle cx="50" cy="77" r="2" fill="#d9e8dd" />
          </svg>
        );

      case 'nurungji': // 누룽지 (황토색 강아지 - Golden Ocher Puppy)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <FriendBody id={id} />
            <g transform="translate(13 0) scale(.74)">
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
            </g>
          </svg>
        );
    }
  };

  return (
    <motion.div
      {...motionProps}
      data-character={id}
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
