import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Sparkles } from 'lucide-react';
import { CareFriend, PlayGuide, PlayHint, PlayProgress, PlayShell, ToothBrushArt } from '../../components/ToddlerPlay';
import { RoundContinuation } from '../../components/RoundContinuation';
import { useToddlerPlay, type ToddlerGameProps } from '../../hooks/useToddlerPlay';
import { brushStroke, CLEAN_STROKES, TEETH, type BrushPoint } from '../../utils/brushing';
import { playCareSound } from '../../utils/soundEngine';

const GUIDE = '칫솔을 잡고 이 위를 왔다 갔다, 쓱싹쓱싹 닦아 줘!';
export function ToothBrushGame(props: ToddlerGameProps) {
  const { round, completed, finish, next } = useToddlerPlay(props, GUIDE);
  const [clean, setClean] = useState<number[]>(() => TEETH.map(() => 0));
  const progress = useRef(clean);
  const stage = useRef<HTMLButtonElement>(null);
  const gesture = useRef<{ id: number; point: BrushPoint; element: HTMLButtonElement } | null>(null);
  const [brush, setBrush] = useState<BrushPoint | null>(null);
  const soundAt = useRef(0);
  const cancel = () => {
    const current = gesture.current;
    gesture.current = null;
    if (current?.element.hasPointerCapture(current.id)) current.element.releasePointerCapture(current.id);
    setBrush(null);
  };
  useEffect(() => {
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
  }, []);
  const update = (values: number[]) => {
    progress.current = values;
    setClean(values);
    if (values.every(value => value >= CLEAN_STROKES)) {
      cancel();
      finish(`${props.childName}야, 이가 반짝반짝 하얘졌어! 꼼꼼하게 닦아 줘서 고마워!`);
    }
  };
  const locate = (event: PointerEvent<HTMLButtonElement>): BrushPoint => {
    const rect = stage.current!.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width * 300, y: (event.clientY - rect.top) / rect.height * 258 };
  };
  const start = (event: PointerEvent<HTMLButtonElement>) => {
    if (completed || gesture.current || !event.isPrimary || event.button !== 0) return;
    const point = locate(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { id: event.pointerId, point, element: event.currentTarget };
    setBrush(point);
  };
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId || completed) return;
    const point = locate(event);
    const values = brushStroke(progress.current, current.point, point);
    const changed = values.some((value, i) => value > progress.current[i]);
    current.point = point;
    setBrush(point);
    if (changed) {
      if (performance.now() - soundAt.current > 150) { playCareSound('brush', props.soundEnabled); soundAt.current = performance.now(); }
      update(values);
    }
  };
  const keyboardBrush = () => {
    if (completed) return;
    const index = progress.current.findIndex(value => value < CLEAN_STROKES);
    if (index < 0) return;
    const tooth = TEETH[index];
    playCareSound('brush', props.soundEnabled);
    update(brushStroke(progress.current, { x: tooth.x - 14, y: tooth.y }, { x: tooth.x + 14, y: tooth.y }));
  };
  const pointerProps = {
    onPointerDown: start, onPointerMove: move,
    onPointerUp: (event: PointerEvent<HTMLButtonElement>) => { if (gesture.current?.id === event.pointerId) cancel(); },
    onPointerCancel: (event: PointerEvent<HTMLButtonElement>) => { if (gesture.current?.id === event.pointerId) cancel(); },
    onLostPointerCapture: (event: PointerEvent<HTMLButtonElement>) => { if (gesture.current?.id === event.pointerId) cancel(); },
    onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
  };
  return <PlayShell className="brush-play">
    <PlayGuide {...props} title={completed ? '반짝반짝 깨끗해!' : '쓱싹쓱싹, 치카치카!'} guide={GUIDE} happy={completed} />
    <div className="bathroom-scene">
      <span className="bathroom-sparkle" aria-hidden="true"><Sparkles /></span>
      <button ref={stage} type="button" className={`brushing-friend ${brush ? 'is-brushing' : ''}`} aria-label="이를 쓱싹 닦기" disabled={completed} {...pointerProps} onClick={event => { if (event.detail === 0) keyboardBrush(); }}>
        <CareFriend buddy={props.buddy} smilingEyes={completed}>
          {TEETH.map((tooth, i) => <g key={i}>
            <rect x={tooth.x - 16} y={tooth.y - 14} width="32" height="29" rx="8" fill={clean[i] >= CLEAN_STROKES ? '#fffef7' : '#f4ead1'} stroke="#e5d6bc" strokeWidth="1.5" />
            <g opacity={Math.max(0, 1 - clean[i] / CLEAN_STROKES)}>
              <path d={`M${tooth.x - 10} ${tooth.y - 4} q8 -12 18 0 q8 13 -6 15 q-18 0 -12 -15`} fill={['#baa2bb', '#c9ae7f', '#a4b996'][(i + round) % 3]} opacity=".75" />
              <circle cx={tooth.x - 3} cy={tooth.y} r="1.5" fill="#7d6d70" /><circle cx={tooth.x + 4} cy={tooth.y} r="1.5" fill="#7d6d70" />
              <path d={`M${tooth.x - 2} ${tooth.y + 5} q3 3 5 -1`} stroke="#7d6d70" fill="none" strokeWidth="1.3" />
            </g>
            {clean[i] >= CLEAN_STROKES && <path d={`M${tooth.x} ${tooth.y - 6} v12 M${tooth.x - 6} ${tooth.y} h12`} stroke="#dfc379" strokeWidth="2" className="tooth-shine" />}
            {brush && clean[i] > 0 && clean[i] < CLEAN_STROKES && <g className="tooth-foam" fill="#fff" stroke="#b8dce0"><circle cx={tooth.x - 5} cy={tooth.y - 4} r="10" /><circle cx={tooth.x + 7} cy={tooth.y + 4} r="8" /><circle cx={tooth.x + 6} cy={tooth.y - 13} r="5" /></g>}
          </g>)}
        </CareFriend>
        {brush && <span className="moving-brush" style={{ left: `${brush.x / 3}%`, top: `${brush.y / 258 * 100}%` }}><ToothBrushArt /></span>}
      </button>
      <div className="sink-rim" aria-hidden="true" />
      <PlayProgress total={8} done={clean.filter(value => value >= CLEAN_STROKES).length} label="깨끗해진 이" />
    </div>
    {completed ? <RoundContinuation onNext={() => { cancel(); progress.current = TEETH.map(() => 0); setClean(progress.current); next(); }} delayMs={4000} /> : <>
      <button type="button" className="brush-tool" aria-label="칫솔 잡고 옮기기" {...pointerProps} onClick={event => { if (event.detail === 0) stage.current?.focus(); }}><ToothBrushArt /></button>
      <PlayHint>칫솔로 쓱싹쓱싹!</PlayHint>
    </>}
  </PlayShell>;
}
