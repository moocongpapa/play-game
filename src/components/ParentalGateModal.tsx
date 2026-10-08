import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Shield, Lock, X } from 'lucide-react';
import { JellyButton } from './JellyButton';
import { JUICE_SPRING } from '../utils/juice';

interface ParentalGateModalProps { isOpen: boolean; onClose: () => void; onSuccess: () => void }
export function ParentalGateModal({ isOpen, onClose, onSuccess }: ParentalGateModalProps) {
  const [pressProgress, setPressProgress] = useState(0);
  const timer = useRef<number | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const success = useRef(onSuccess);
  success.current = onSuccess;
  const reduced = useReducedMotion();
  const cancel = () => {
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = null;
    setPressProgress(0);
  };
  const start = () => {
    if (timer.current !== null) return;
    const started = performance.now();
    timer.current = window.setInterval(() => {
      const progress = Math.min(100, (performance.now() - started) / 30);
      setPressProgress(progress);
      if (progress === 100) { cancel(); success.current(); }
    }, 50);
  };
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement;
    panel.current?.focus();
    const hide = () => { if (document.hidden) cancel(); };
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', hide);
    return () => {
      cancel(); window.removeEventListener('blur', cancel); document.removeEventListener('visibilitychange', hide);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, [isOpen]);
  return <AnimatePresence>{isOpen && <div className="parent-gate-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" data-no-juice>
    <motion.div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="parent-gate-title"
      initial={{ scale: reduced ? 1 : .2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: reduced ? 1 : .9, opacity: 0 }} transition={JUICE_SPRING}
      onKeyDown={event => {
        if (event.key === 'Escape') { cancel(); onClose(); }
        if (event.key === 'Tab') {
          const buttons = panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
          if (!buttons?.length) return;
          const first = buttons[0]; const last = buttons[buttons.length - 1];
          if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }}
      className="parent-gate-panel relative w-full max-w-md bg-[#FFF9E6] rounded-3xl p-6 border-4 border-[#FFA000] shadow-2xl text-center">
      <button type="button" aria-label="부모님 확인 닫기" onClick={onClose} className="absolute top-3 right-3 grid size-12 place-items-center rounded-full bg-amber-100"><X /></button>
      <div className="inline-flex p-4 rounded-full bg-amber-100 text-[#FF9E4A] mb-3"><Shield className="w-10 h-10" /></div>
      <h2 id="parent-gate-title" className="text-2xl font-black text-[#4A3E3D] mb-2">부모님 확인</h2>
      <p className="text-base font-bold text-[#8C7B79] mb-6">아래 버튼을 <span className="text-[#b46c25]">3초 동안 꾹</span> 눌러주세요.</p>
      <button type="button" aria-label="3초 동안 눌러 보호자 설정 열기"
        onPointerDown={event => { if (!event.isPrimary || event.button !== 0) return; event.currentTarget.setPointerCapture(event.pointerId); start(); }}
        onPointerUp={cancel} onPointerCancel={cancel} onLostPointerCapture={cancel}
        onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); if (!event.repeat) start(); } }}
        onKeyUp={event => { if (event.key === ' ' || event.key === 'Enter') cancel(); }} onBlur={cancel}
        className="relative overflow-hidden w-full min-h-20 py-5 px-6 mb-5 rounded-2xl bg-gradient-to-b from-[#FFB366] to-[#FF9E4A] text-white font-black text-xl shadow-lg"
        style={{ touchAction: 'none' }}>
        <span className="absolute inset-0 bg-[#d48136]" style={{ width: `${pressProgress}%` }} />
        <span className="relative z-10 flex items-center justify-center gap-2"><Lock /> 꾹 누르고 있기 ({Math.min(3, Math.floor(pressProgress * .03))}초)</span>
      </button>
      <JellyButton variant="white" size="lg" onClick={onClose} className="w-full">닫기</JellyButton>
    </motion.div>
  </div>}</AnimatePresence>;
}
