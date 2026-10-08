import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { fireConfetti, fireStarExplosion } from '../utils/confetti';

interface ConfettiEffectProps {
  active: boolean;
}

export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({ active }) => {
  useEffect(() => {
    if (active) {
      fireConfetti();
      const timer = setTimeout(() => {
        fireStarExplosion();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!active) return null;

  const particles = Array.from({ length: 28 });
  const symbols = ['🌟', '💖', '🎈', '✨', '🌸', '🎉', '🍬', '⭐', '🌈'];
  const colors = ['#FF80AB', '#FFD54F', '#81C784', '#64B5F6', '#BA68C8', '#FF8A65'];

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((_, i) => {
        const symbol = symbols[i % symbols.length];
        const color = colors[i % colors.length];
        const startX = 15 + Math.random() * 70;
        const targetX = (Math.random() - 0.5) * 800;
        const targetY = -(250 + Math.random() * 550);

        return (
          <motion.div
            key={i}
            initial={{
              x: `${startX}vw`,
              y: '85vh',
              scale: 0.3,
              rotate: 0,
              opacity: 1,
            }}
            animate={{
              x: `calc(${startX}vw + ${targetX}px)`,
              y: `calc(85vh + ${targetY}px)`,
              scale: [0.5, 1.8, 1.2],
              rotate: Math.random() * 720 - 360,
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 1.8 + Math.random() * 0.8,
              ease: 'easeOut',
            }}
            style={{ color }}
            className="absolute text-4xl sm:text-5xl drop-shadow-lg select-none"
          >
            {symbol}
          </motion.div>
        );
      })}
    </div>
  );
};
