import { motion, useReducedMotion } from 'motion/react';
import './ScaffoldingHint.css';

/** Decorative only: the underlying toy remains the full, unobstructed touch target. */
export function ScaffoldingHint({ ringOnly = false }: { ringOnly?: boolean }) {
  const reduced = useReducedMotion();
  return <span className="scaffolding-hint" aria-hidden="true">
    <motion.span className="scaffolding-glow"
      animate={reduced ? { opacity: .8 } : { scale: [1, 1.1, 1], opacity: [.5, 1, .5] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
    {!ringOnly && <motion.span className="scaffolding-finger"
      animate={reduced ? {} : { scale: [1, 1.25, 1], y: [0, -8, 0] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>👆</motion.span>}
  </span>;
}
