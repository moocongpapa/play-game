import React from 'react';
import { motion } from 'motion/react';

interface ConfettiEffectProps {
  active: boolean;
}

export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({ active }) => {
  if (!active) return null;

  const particles = Array.from({ length: 32 });
  const symbols = ['🌟', '💖', '🎈', '✨', '🌸', '🎉', '🍬'];
  const colors = ['#FF80AB', '#FFD54F', '#81C784', '#64B5F6', '#BA68C8', '#FF8A65'];

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((_, i) => {
        const symbol = symbols[i % symbols.length];
        const color = colors[i % colors.length];
        const startX = 20 + Math.random() * 60; // center-ish start
        const targetX = (Math.random() - 0.5) * 800;
        const targetY = -(200 + Math.random() * 500);

        return (
          <motion.div
            key={i}
            initial={{
              x: `${startX}vw`,
              y: '80vh',
              scale: 0.2,
              rotate: 0,
              opacity: 1,
            }}
            animate={{
              x: `calc(${startX}vw + ${targetX}px)`,
              y: `calc(80vh + ${targetY}px)`,
              scale: [0.5, 1.5, 1],
              rotate: Math.random() * 720 - 360,
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 1.8 + Math.random() * 0.8,
              ease: 'easeOut',
            }}
            style={{ color }}
            className="absolute text-3xl sm:text-4xl drop-shadow-md select-none"
          >
            {symbol}
          </motion.div>
        );
      })}
    </div>
  );
};
