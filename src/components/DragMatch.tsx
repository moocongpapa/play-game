import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { animate, motion, MotionConfig, useMotionValue, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { ArrowUp, Check, Hand } from 'lucide-react';
import { findMagnetTarget, magnetTolerance, MAGNET_SPRING, type DropBounds } from '../utils/dropTarget';
import { useIdleScaffolding } from '../hooks/useIdleScaffolding';
import { ScaffoldingHint } from './ScaffoldingHint';
import { PlayVoiceContext } from './PlayFlowContext';
import { emitJuice } from '../utils/juice';
import { playBubblePop, playJellyTap } from '../utils/soundEngine';

type Piece = { id: string; label: string; children: ReactNode; className: string };
type Gesture = Piece & { pointerId: number; source: HTMLButtonElement; rect: DOMRect; targets: DropBounds[]; startX: number; startY: number; moved: boolean; phase: 'dragging' | 'settling' };
type MatchContext = {
  disabled: boolean; activeId: string | null; overId: string | null; helpId: string;
  start: (event: PointerEvent<HTMLButtonElement>, piece: Piece) => void;
  move: (event: PointerEvent<HTMLButtonElement>) => void;
  end: (event: PointerEvent<HTMLButtonElement>) => void;
  cancel: () => void;
  cancelPointer: (event: PointerEvent<HTMLButtonElement>) => void;
  select: (piece: Piece) => void;
  drop: (id: string) => void;
  register: (id: string, node: HTMLButtonElement | null) => void;
  registerPiece: (id: string, node: HTMLButtonElement | null) => void;
  showHint: boolean; hasDemo: boolean; hintPieceId?: string; hintTargetId?: string;
};
const MatchContext = createContext<MatchContext | null>(null);
function useMatch() {
  const context = useContext(MatchContext);
  if (!context) throw new Error('Drag pieces and slots need a DragMatch provider');
  return context;
}

/** Pointer capture works with fingers, pens and mice, including outside the source tile. */
export function DragMatch({ children, onDrop, canDrop, disabled = false, resetKey, hint, onDragMove, juicy = true }: {
  children: ReactNode; onDrop: (pieceId: string, targetId: string) => boolean; disabled?: boolean; resetKey: string | number;
  canDrop?: (pieceId: string, targetId: string) => boolean;
  juicy?: boolean;
  hint?: { pieceId: string; targetId: string };
  onDragMove?: (point: { x: number; y: number; targetId: string | null } | null) => void;
}) {
  const helpId = useId();
  const slots = useRef(new Map<string, HTMLButtonElement>());
  const pieces = useRef(new Map<string, HTMLButtonElement>());
  const voice = useContext(PlayVoiceContext);
  const help = useIdleScaffolding({
    resetKey: JSON.stringify([resetKey, hint?.pieceId, hint?.targetId]), disabled: disabled || !hint,
    voice: voice ? { ...voice, text: '반짝이는 그림을 이쪽으로 쏙!' } : undefined,
  });
  const dragCallback = useRef(onDragMove);
  dragCallback.current = onDragMove;
  const [demo, setDemo] = useState<{ x: number; y: number; dx: number; dy: number } | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const [ghost, setGhost] = useState<Gesture | null>(null);
  const [selected, setSelected] = useState<Piece | null>(null);
  const selectedRef = useRef<Piece | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const settlingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animations = useRef<ReturnType<typeof animate>[]>([]);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useMotionValue(1);
  const reducedMotion = useReducedMotion();

  const cancel = () => {
    const current = gesture.current;
    gesture.current = null;
    if (current?.source.hasPointerCapture(current.pointerId)) current.source.releasePointerCapture(current.pointerId);
    if (settlingTimer.current) clearTimeout(settlingTimer.current);
    animations.current.forEach(animation => animation.stop());
    animations.current = [];
    setGhost(null);
    setOverId(null);
    selectedRef.current = null;
    setSelected(null);
    dragCallback.current?.(null);
  };

  useEffect(() => {
    cancel();
    setAnnouncement('');
    const hide = () => { if (document.hidden) cancel(); };
    const scroll = () => { if (gesture.current) cancel(); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') cancel(); };
    window.addEventListener('blur', cancel);
    window.addEventListener('resize', cancel);
    window.addEventListener('scroll', scroll, true);
    window.addEventListener('keydown', escape);
    document.addEventListener('visibilitychange', hide);
    return () => {
      cancel();
      window.removeEventListener('blur', cancel);
      window.removeEventListener('resize', cancel);
      window.removeEventListener('scroll', scroll, true);
      window.removeEventListener('keydown', escape);
      document.removeEventListener('visibilitychange', hide);
    };
  }, [resetKey]);

  useEffect(() => {
    if (disabled && gesture.current?.phase !== 'settling') cancel();
  }, [disabled]);

  const showHint = !ghost && help.isIdle;
  useEffect(() => {
    if (!showHint || !hint) { setDemo(null); return; }
    const measure = () => {
      const from = pieces.current.get(hint.pieceId)?.getBoundingClientRect();
      const to = slots.current.get(hint.targetId)?.getBoundingClientRect();
      if (!from || !to || from.top < 70 || to.top < 70 || from.bottom > innerHeight || to.bottom > innerHeight) { setDemo(null); return; }
      // Demonstrate beside the artwork, leaving the shape and the slot visible.
      const beside = (rect: DOMRect) => ({ x: Math.min(innerWidth - 40, rect.right - 10), y: rect.top + rect.height * .62 });
      const start = beside(from);
      const finish = beside(to);
      setDemo({ ...start, dx: finish.x - start.x, dy: finish.y - start.y });
    };
    measure(); window.addEventListener('scroll', measure, true); window.addEventListener('resize', measure);
    return () => { window.removeEventListener('scroll', measure, true); window.removeEventListener('resize', measure); };
  }, [showHint, hint?.pieceId, hint?.targetId]);
  const targetAt = (clientX: number, clientY: number) => {
    const current = gesture.current;
    if (!current) return null;
    // Freeze geometry at pickup: an expanding slot must not enlarge its own hit area.
    const targets = current.targets.filter(target => {
      const node = slots.current.get(target.id);
      return node && !node.disabled;
    });
    return findMagnetTarget(clientX, clientY, targets, magnetTolerance(window.innerWidth),
      canDrop ? id => canDrop(current.id, id) : undefined);
  };

  const select = (piece: Piece) => {
    if (juicy && gesture.current?.phase === 'settling') cancel();
    if (disabled || gesture.current) return;
    help.reset();
    // Some assistive inputs emit both a pointer tap and a detail=0 click.
    // Selecting the same piece twice must not silently cancel the choice.
    selectedRef.current = piece;
    setSelected(piece);
    setAnnouncement(`${piece.label}. 놓을 자리를 고르세요. 취소하려면 Escape를 누르세요.`);
  };

  const start = (event: PointerEvent<HTMLButtonElement>, piece: Piece) => {
    if (disabled || !event.isPrimary || event.button !== 0) return;
    // A finishing spring must never swallow the child's next grab.
    if (juicy && gesture.current?.phase === 'settling') cancel();
    if (gesture.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    help.reset();
    const targets = Array.from(slots.current).filter(([, node]) => !node.disabled).map(([id, node]) => ({ id, ...rectBounds(node.getBoundingClientRect()) }));
    gesture.current = { ...piece, source: event.currentTarget, rect, targets, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false, phase: 'dragging' };
    event.currentTarget.setPointerCapture(event.pointerId);
    selectedRef.current = null;
    setSelected(null);
    x.set(rect.left);
    y.set(rect.top);
    opacity.set(1);
    if (juicy) { setGhost(gesture.current); playJellyTap(voice?.soundEnabled ?? false); }
  };

  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId || current.phase !== 'dragging') return;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    if (!current.moved && Math.hypot(dx, dy) < 6) return;
    if (!current.moved) { current.moved = true; setGhost(current); }
    const target = targetAt(event.clientX, event.clientY);
    const acceptable = target && (!canDrop || canDrop(current.id, target));
    const magnet = acceptable ? current.targets.find(slot => slot.id === target) : null;
    const pullX = magnet ? ((magnet.left + magnet.right) / 2 - event.clientX) * .3 : 0;
    const pullY = magnet ? ((magnet.top + magnet.bottom) / 2 - event.clientY) * .3 : 0;
    x.set(current.rect.left + dx + pullX);
    y.set(current.rect.top + dy - 12 + pullY);
    setOverId(acceptable ? target : null);
    dragCallback.current?.({ x: event.clientX, y: event.clientY, targetId: target });
  };

  const end = (event: PointerEvent<HTMLButtonElement>) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId || current.phase !== 'dragging') return;
    // Mark settled before releasing capture or invoking game callbacks to reject duplicate drops.
    current.phase = 'settling';
    if (current.source.hasPointerCapture(current.pointerId)) current.source.releasePointerCapture(current.pointerId);
    if (!current.moved) {
      gesture.current = null;
      setGhost(null);
      select(current);
      return;
    }
    const targetId = disabled ? null : targetAt(event.clientX, event.clientY);
    const targetRect = current.targets.find(slot => slot.id === targetId);
    const accepted = targetId !== null && onDrop(current.id, targetId);
    help.reset();
    dragCallback.current?.(null);
    setAnnouncement(accepted ? '쏙! 알맞은 자리에 놓았어요.' : '괜찮아요. 다시 옮겨 보세요.');
    setOverId(null);
    const duration = reducedMotion ? 0 : .5;
    const settling = accepted && !reducedMotion ? MAGNET_SPRING : { duration, ease: 'easeOut' as const };
    animations.current = [
      animate(x, accepted && targetRect ? (targetRect.left + targetRect.right - current.rect.width) / 2 : current.rect.left, settling),
      animate(y, accepted && targetRect ? (targetRect.top + targetRect.bottom - current.rect.height) / 2 : current.rect.top, settling),
    ];
    // Complete the spring before fading; cancel/next-grab must never deliver a stale snap.
    void Promise.all(animations.current).then(() => {
      if (gesture.current !== current) return;
      if (accepted) {
        playBubblePop(voice?.soundEnabled ?? false);
        emitJuice({ kind: 'snap', x: targetRect ? (targetRect.left + targetRect.right) / 2 : event.clientX, y: targetRect ? (targetRect.top + targetRect.bottom) / 2 : event.clientY });
        animations.current = [animate(opacity, 0, { duration: reducedMotion ? 0 : .12 })];
        settlingTimer.current = setTimeout(cancel, reducedMotion ? 0 : 130);
      } else cancel();
    });
  };

  const drop = (id: string) => {
    const piece = selectedRef.current;
    if (disabled || !piece || gesture.current) return;
    selectedRef.current = null;
    setSelected(null);
    const accepted = onDrop(piece.id, id);
    if (accepted) { playBubblePop(voice?.soundEnabled ?? false); emitJuice({ kind: 'snap' }); }
    help.reset();
    setAnnouncement(accepted ? '쏙! 알맞은 자리에 놓았어요.' : '괜찮아요. 다시 옮겨 보세요.');
  };

  return <MotionConfig reducedMotion="user"><MatchContext.Provider value={{ disabled, activeId: ghost?.id ?? selected?.id ?? null, overId, helpId, start, move, end, cancel, select, drop,
    cancelPointer: event => { if (gesture.current?.pointerId === event.pointerId && gesture.current.phase === 'dragging') cancel(); },
    showHint, hasDemo: !!demo, hintPieceId: hint?.pieceId, hintTargetId: hint?.targetId,
    register: (id, node) => { if (node) slots.current.set(id, node); else slots.current.delete(id); },
    registerPiece: (id, node) => { if (node) pieces.current.set(id, node); else pieces.current.delete(id); } }}>
    <span id={helpId} className="sr-only">그림을 잡아 알맞은 자리로 옮겨 놓으세요. 그림과 자리를 차례로 누르거나 Enter 키로 선택할 수도 있어요.</span>
    <span role="status" aria-live="polite" className="sr-only">{announcement}</span>
    {children}
    {demo && showHint && createPortal(<div className="drag-help-demo" aria-hidden="true" style={{ left: demo.x, top: demo.y, '--help-dx': `${demo.dx}px`, '--help-dy': `${demo.dy}px` } as React.CSSProperties}><Hand /></div>, document.body)}
    {ghost && createPortal(<motion.div aria-hidden="true" className={`drag-ghost ${ghost.className}`} style={{ x, y, opacity, scale: juicy && !reducedMotion ? 1.1 : 1, width: ghost.rect.width, height: ghost.rect.height }}>
      {ghost.children}
    </motion.div>, document.body)}
  </MatchContext.Provider></MotionConfig>;
}

function rectBounds(rect: DOMRect) { return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }; }

type PieceProps = Omit<HTMLMotionProps<'button'>, 'id' | 'children'> & { id: string; label: string; children: ReactNode };
export function DragPiece({ id, label, children, className = '', disabled, ...props }: PieceProps) {
  const match = useMatch();
  const piece = { id, label, children, className };
  return <motion.button {...props} ref={node => match.registerPiece(id, node)} type="button" className={`drag-piece ${className}`} disabled={disabled || match.disabled}
    aria-label={`${label} 옮기기`} aria-describedby={match.helpId} aria-pressed={match.activeId === id}
    data-drag-piece={id} data-picked={match.activeId === id}
    data-help={match.hintPieceId === id && match.showHint}
    onPointerDown={event => match.start(event, piece)} onPointerMove={match.move} onPointerUp={match.end}
    onPointerCancel={match.cancelPointer} onLostPointerCapture={match.cancelPointer}
    onClick={event => { if (event.detail === 0) match.select(piece); }}
    onContextMenu={event => event.preventDefault()} onDragStart={event => event.preventDefault()}>
    {children}
    {match.hintPieceId === id && match.showHint && <ScaffoldingHint ringOnly={match.hasDemo} />}
  </motion.button>;
}

export function DropSlot({ id, label, children, className = '', filled = false }: {
  id: string; label: string; children: ReactNode; className?: string; filled?: boolean;
}) {
  const match = useMatch();
  const reduced = useReducedMotion();
  return <motion.button type="button" ref={node => match.register(id, node)} aria-label={`${label}${filled ? ', 완성' : ' 놓는 자리'}`}
    animate={{ scale: match.overId === id && !reduced ? 1.15 : 1 }} transition={reduced ? { duration: 0 } : MAGNET_SPRING}
    aria-describedby={match.helpId} disabled={filled || match.disabled} onClick={() => match.drop(id)}
    data-drop-slot={id} data-ready={!!match.activeId && !filled} data-over={match.overId === id} data-filled={filled}
    data-help={match.hintTargetId === id && match.showHint && !filled}
    className={`drop-slot ${className}`}>
    {children}
    {match.hintTargetId === id && match.showHint && !filled && <ScaffoldingHint ringOnly />}
    {filled && <span className="drop-check" aria-hidden="true"><Check /></span>}
  </motion.button>;
}

export function DragHint({ children = '잡아서 쏙 옮겨요!' }: { children?: ReactNode }) {
  return <div className="drag-hint"><span className="drag-hint-demo" aria-hidden="true"><Hand /><ArrowUp /></span><span>{children}</span></div>;
}
