import { useEffect, useRef, type ReactNode } from 'react';
import { animate, motion, useMotionValue, useReducedMotion } from 'motion/react';
import { JUICE_SPRING, emitJuice } from '../../utils/juice';

/** Capture makes a pull continuous outside the handle. Tap/keyboard is an equal-access shortcut. */
export function PullToy({ children, label, direction = 1, distance = 90, onPull, onProgress, disabled = false, className = '' }: {
  children: ReactNode; label: string; direction?: 1 | -1; distance?: number; onPull: () => void; onProgress?: (amount: number) => void; disabled?: boolean; className?: string;
}) {
  const y = useMotionValue(0);
  const reduced = useReducedMotion();
  const drag = useRef<{ id: number; start: number; amount: number; node: HTMLButtonElement } | null>(null);
  const animation = useRef<ReturnType<typeof animate> | null>(null);
  const progress = useRef(onProgress); progress.current = onProgress;
  const cancel = () => {
    const old = drag.current; drag.current = null;
    if (old?.node.hasPointerCapture(old.id)) old.node.releasePointerCapture(old.id);
    animation.current?.stop();
    animation.current = animate(y, 0, reduced ? { duration: 0 } : JUICE_SPRING);
    progress.current?.(0);
  };
  useEffect(() => {
    const hide = () => { if (document.hidden) cancel(); };
    window.addEventListener('blur', cancel); window.addEventListener('resize', cancel); document.addEventListener('visibilitychange', hide);
    return () => { cancel(); animation.current?.stop(); window.removeEventListener('blur', cancel); window.removeEventListener('resize', cancel); document.removeEventListener('visibilitychange', hide); };
  }, []);
  useEffect(() => { if (disabled) cancel(); }, [disabled]);
  const commit = () => { if (!disabled) { emitJuice({ kind: 'snap' }); onPull(); } };
  return <motion.button type="button" className={`pull-toy ${className}`} aria-label={label} disabled={disabled} style={{ y }} whileTap={reduced ? undefined : { scale: 1.1 }} transition={JUICE_SPRING}
    onPointerDown={e => { if (disabled || !e.isPrimary || e.button !== 0) return; animation.current?.stop(); drag.current = { id: e.pointerId, start: e.clientY, amount: 0, node: e.currentTarget }; e.currentTarget.setPointerCapture(e.pointerId); }}
    onPointerMove={e => { const d = drag.current; if (!d || d.id !== e.pointerId) return; d.amount = Math.max(0, Math.min(1, (e.clientY - d.start) * direction / distance)); y.set(d.amount * distance * direction); progress.current?.(d.amount); }}
    onPointerUp={e => { const d = drag.current; if (!d || d.id !== e.pointerId) return; const accepted = d.amount >= .45 || Math.abs(e.clientY - d.start) < 6; cancel(); if (accepted) commit(); }}
    onPointerCancel={cancel} onLostPointerCapture={() => { if (drag.current) cancel(); }} onClick={e => { if (e.detail === 0) commit(); }}>
    {children}
  </motion.button>;
}
