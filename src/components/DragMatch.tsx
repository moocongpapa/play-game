import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { animate, motion, MotionConfig, useMotionValue, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { ArrowUp, Check, Hand } from 'lucide-react';
import { findDropTarget } from '../utils/dropTarget';

type Piece = { id: string; label: string; children: ReactNode; className: string };
type Gesture = Piece & { pointerId: number; source: HTMLButtonElement; rect: DOMRect; startX: number; startY: number; moved: boolean; phase: 'dragging' | 'settling' };
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
};
const MatchContext = createContext<MatchContext | null>(null);
function useMatch() {
  const context = useContext(MatchContext);
  if (!context) throw new Error('Drag pieces and slots need a DragMatch provider');
  return context;
}

/** Pointer capture works with fingers, pens and mice, including outside the source tile. */
export function DragMatch({ children, onDrop, disabled = false, resetKey }: {
  children: ReactNode; onDrop: (pieceId: string, targetId: string) => boolean; disabled?: boolean; resetKey: string | number;
}) {
  const helpId = useId();
  const slots = useRef(new Map<string, HTMLButtonElement>());
  const gesture = useRef<Gesture | null>(null);
  const [ghost, setGhost] = useState<Gesture | null>(null);
  const [selected, setSelected] = useState<Piece | null>(null);
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
    setSelected(null);
  };

  useEffect(() => {
    cancel();
    setAnnouncement('');
    const hide = () => { if (document.hidden) cancel(); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') cancel(); };
    window.addEventListener('blur', cancel);
    window.addEventListener('resize', cancel);
    window.addEventListener('scroll', cancel, true);
    window.addEventListener('keydown', escape);
    document.addEventListener('visibilitychange', hide);
    return () => {
      cancel();
      window.removeEventListener('blur', cancel);
      window.removeEventListener('resize', cancel);
      window.removeEventListener('scroll', cancel, true);
      window.removeEventListener('keydown', escape);
      document.removeEventListener('visibilitychange', hide);
    };
  }, [resetKey]);

  useEffect(() => {
    if (disabled && gesture.current?.phase !== 'settling') cancel();
  }, [disabled]);

  const targetAt = (clientX: number, clientY: number) => findDropTarget(clientX, clientY,
    Array.from(slots.current).filter(([, node]) => !node.disabled).map(([id, node]) => ({ id, ...rectBounds(node.getBoundingClientRect()) })));

  const select = (piece: Piece) => {
    if (disabled || gesture.current) return;
    setSelected(current => current?.id === piece.id ? null : piece);
    setAnnouncement(`${piece.label}. 놓을 자리를 고르세요. 취소하려면 Escape를 누르세요.`);
  };

  const start = (event: PointerEvent<HTMLButtonElement>, piece: Piece) => {
    if (disabled || gesture.current || !event.isPrimary || event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    gesture.current = { ...piece, source: event.currentTarget, rect, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false, phase: 'dragging' };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelected(null);
    x.set(rect.left);
    y.set(rect.top);
    opacity.set(1);
  };

  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId || current.phase !== 'dragging') return;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    if (!current.moved && Math.hypot(dx, dy) < 6) return;
    if (!current.moved) { current.moved = true; setGhost(current); }
    x.set(current.rect.left + dx);
    y.set(current.rect.top + dy - 12);
    setOverId(targetAt(event.clientX, event.clientY));
  };

  const end = (event: PointerEvent<HTMLButtonElement>) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId || current.phase !== 'dragging') return;
    // Mark settled before releasing capture or invoking game callbacks to reject duplicate drops.
    current.phase = 'settling';
    if (current.source.hasPointerCapture(current.pointerId)) current.source.releasePointerCapture(current.pointerId);
    if (!current.moved) {
      gesture.current = null;
      select(current);
      return;
    }
    const targetId = disabled ? null : targetAt(event.clientX, event.clientY);
    const targetRect = targetId ? slots.current.get(targetId)?.getBoundingClientRect() : null;
    const accepted = targetId !== null && onDrop(current.id, targetId);
    setAnnouncement(accepted ? '쏙! 알맞은 자리에 놓았어요.' : '괜찮아요. 다시 옮겨 보세요.');
    setOverId(null);
    const duration = reducedMotion ? 0 : 0.24;
    animations.current = [
      animate(x, accepted && targetRect ? targetRect.left + (targetRect.width - current.rect.width) / 2 : current.rect.left, { duration }),
      animate(y, accepted && targetRect ? targetRect.top + (targetRect.height - current.rect.height) / 2 : current.rect.top, { duration }),
      animate(opacity, accepted ? 0 : 1, { duration }),
    ];
    settlingTimer.current = setTimeout(cancel, duration * 1000 + 30);
  };

  const drop = (id: string) => {
    if (disabled || !selected || gesture.current) return;
    const piece = selected;
    setSelected(null);
    setAnnouncement(onDrop(piece.id, id) ? '쏙! 알맞은 자리에 놓았어요.' : '괜찮아요. 다시 옮겨 보세요.');
  };

  return <MotionConfig reducedMotion="user"><MatchContext.Provider value={{ disabled, activeId: ghost?.id ?? selected?.id ?? null, overId, helpId, start, move, end, cancel, select, drop,
    cancelPointer: event => { if (gesture.current?.pointerId === event.pointerId && gesture.current.phase === 'dragging') cancel(); },
    register: (id, node) => { if (node) slots.current.set(id, node); else slots.current.delete(id); } }}>
    <span id={helpId} className="sr-only">그림을 잡아 알맞은 자리로 옮겨 놓으세요. 그림과 자리를 차례로 누르거나 Enter 키로 선택할 수도 있어요.</span>
    <span role="status" aria-live="polite" className="sr-only">{announcement}</span>
    {children}
    {ghost && createPortal(<motion.div aria-hidden="true" className={`drag-ghost ${ghost.className}`} style={{ x, y, opacity, width: ghost.rect.width, height: ghost.rect.height }}>
      {ghost.children}
    </motion.div>, document.body)}
  </MatchContext.Provider></MotionConfig>;
}

function rectBounds(rect: DOMRect) { return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }; }

type PieceProps = Omit<HTMLMotionProps<'button'>, 'id' | 'children'> & { id: string; label: string; children: ReactNode };
export function DragPiece({ id, label, children, className = '', disabled, ...props }: PieceProps) {
  const match = useMatch();
  const piece = { id, label, children, className };
  return <motion.button {...props} type="button" className={`drag-piece ${className}`} disabled={disabled || match.disabled}
    aria-label={`${label} 옮기기`} aria-describedby={match.helpId} aria-pressed={match.activeId === id}
    data-drag-piece={id} data-picked={match.activeId === id}
    onPointerDown={event => match.start(event, piece)} onPointerMove={match.move} onPointerUp={match.end}
    onPointerCancel={match.cancelPointer} onLostPointerCapture={match.cancelPointer}
    onClick={event => { if (event.detail === 0) match.select(piece); }}
    onContextMenu={event => event.preventDefault()} onDragStart={event => event.preventDefault()}>
    {children}
  </motion.button>;
}

export function DropSlot({ id, label, children, className = '', filled = false }: {
  id: string; label: string; children: ReactNode; className?: string; filled?: boolean;
}) {
  const match = useMatch();
  return <button type="button" ref={node => match.register(id, node)} aria-label={`${label}${filled ? ', 완성' : ' 놓는 자리'}`}
    aria-describedby={match.helpId} disabled={filled || match.disabled} onClick={() => match.drop(id)}
    data-drop-slot={id} data-ready={!!match.activeId && !filled} data-over={match.overId === id} data-filled={filled}
    className={`drop-slot ${className}`}>
    {children}
    {filled && <span className="drop-check" aria-hidden="true"><Check /></span>}
  </button>;
}

export function DragHint({ children = '잡아서 쏙 옮겨요!' }: { children?: ReactNode }) {
  return <div className="drag-hint"><span className="drag-hint-demo" aria-hidden="true"><Hand /><ArrowUp /></span><span>{children}</span></div>;
}
