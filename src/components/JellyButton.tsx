import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { playJellyTap } from '../utils/soundEngine';

interface JellyButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  soundEnabled?: boolean;
  disabled?: boolean;
  id?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'pink' | 'green' | 'purple' | 'blue' | 'yellow' | 'white';
}

export const JellyButton: React.FC<JellyButtonProps> = ({
  children,
  onClick,
  className = '',
  soundEnabled = true,
  disabled = false,
  id,
  size = 'md',
  variant = 'primary',
}) => {
  const handleClick = () => {
    if (disabled) return;
    if (soundEnabled) {
      playJellyTap();
    }
    if (onClick) {
      onClick();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-b from-[#FFB366] to-[#FF9E4A] text-[#4A3E3D] border-b-4 border-[#E07A26] shadow-md';
      case 'secondary':
        return 'bg-gradient-to-b from-[#FFE082] to-[#FFD15C] text-[#4A3E3D] border-b-4 border-[#D9A326] shadow-md';
      case 'pink':
        return 'bg-gradient-to-b from-[#FFB7D5] to-[#FF80AB] text-[#4A3E3D] border-b-4 border-[#D81B60] shadow-md';
      case 'green':
        return 'bg-gradient-to-b from-[#A5D6A7] to-[#66BB6A] text-[#4A3E3D] border-b-4 border-[#388E3C] shadow-md';
      case 'purple':
        return 'bg-gradient-to-b from-[#CE93D8] to-[#AB47BC] text-white border-b-4 border-[#7B1FA2] shadow-md';
      case 'blue':
        return 'bg-gradient-to-b from-[#90CAF9] to-[#42A5F5] text-white border-b-4 border-[#1976D2] shadow-md';
      case 'yellow':
        return 'bg-gradient-to-b from-[#FFE082] to-[#FFA000] text-[#4A3E3D] border-b-4 border-[#C77C00] shadow-md';
      case 'white':
        return 'bg-white text-[#4A3E3D] border-b-4 border-[#E0D5C1] shadow-sm';
      default:
        return 'bg-[#FF9E4A] text-[#4A3E3D] border-b-4 border-[#E07A26] shadow-md';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-base rounded-2xl min-h-[40px]';
      case 'md':
        return 'px-5 py-3 text-lg font-bold rounded-3xl min-h-[52px]';
      case 'lg':
        return 'px-7 py-4 text-xl font-bold rounded-3xl min-h-[64px]';
      case 'xl':
        return 'px-9 py-5 text-2xl font-black rounded-[32px] min-h-[76px]';
    }
  };

  return (
    <motion.button
      id={id}
      whileHover={{ scale: disabled ? 1 : 1.04 }}
      whileTap={{ scale: disabled ? 1 : 0.92, y: 2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      onClick={handleClick}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center font-bold tracking-wide select-none touch-manipulation transition-colors ${getSizeStyles()} ${getVariantStyles()} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {children}
    </motion.button>
  );
};
