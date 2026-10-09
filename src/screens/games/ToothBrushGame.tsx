import { useContext, useEffect, useRef, useState, type PointerEvent } from 'react';
import { Sparkles } from 'lucide-react';
import { CareFriend, PlayProgress, ToothBrushArt } from '../../components/ToddlerPlay';
import { JourneyFrame, JourneyFinale, JourneyToy } from '../../components/PlayJourney';
import { CareRoutine, CareObjectArt } from '../../components/development/CareRoutine';
import { usePlayJourney, type JourneyStep } from '../../hooks/usePlayJourney';
import { type ToddlerGameProps } from '../../hooks/useToddlerPlay';
import { brushRow, CLEAN_STROKES, TEETH, type BrushPoint } from '../../utils/brushing';
import { playCareReaction, speakText } from '../../utils/soundEngine';
import { useCareReactions } from '../../hooks/useCareReactions';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import { useGentleHelp } from '../../hooks/useGentleHelp';
import { PlayHintsPausedContext } from '../../components/PlayFlowContext';
import { GentleHint } from '../../components/GentleHint';

const STEPS: JourneyStep[] = [
  { id: 'paste', label: '치약을 조금, 쏙!', picture: 'paste', guide: '칫솔에 치약을 조금 짜 볼까? 치약을 칫솔로 옮겨 줘.' },
  { id: 'upper', label: '윗니를 쓱싹쓱싹', picture: 'teeth', guide: '반짝이는 윗니부터 왔다 갔다, 쓱싹쓱싹 닦아 줘!' },
  { id: 'lower', label: '아랫니도 반짝반짝', picture: 'teeth', guide: '윗니가 깨끗해졌어! 이번에는 아랫니도 꼼꼼하게 닦자.' },
  { id: 'rinse', label: '우르르, 퉤!', picture: 'rinse', guide: '물컵으로 입을 헹구고, 물방울을 눌러 우르르 퉤! 뱉어 보자.' },
];
export function ToothBrushGame(props: ToddlerGameProps) {
  useCareReactions(props.buddy, props.soundEnabled);
  const journey = usePlayJourney(props, STEPS);
  const [clean, setClean] = useState<number[]>(() => TEETH.map(() => 0));
  return <JourneyFrame props={props} journey={journey} className="brush-play">
    {journey.phase === 'finished' ? <JourneyFinale props={props} journey={journey} scene="mirror">
      <JourneyToy props={props} label="반짝이는 이 살펴보기" voice="이가 반짝반짝! 활짝 웃어 볼까?"><CareObjectArt kind="teeth"/></JourneyToy>
      <JourneyToy props={props} label="칫솔 씻고 정리하기" voice="칫솔도 깨끗하게 씻고 제자리에! 다음에도 함께 닦자!"><ToothBrushArt/></JourneyToy>
    </JourneyFinale> : journey.step === 0 || journey.step === 3 ?
      <CareRoutine key={journey.key} props={props} kind={journey.step === 0 ? 'paste' : 'rinse'} locked={journey.locked} onComplete={text => { if (journey.step === 0) setClean(TEETH.map(() => 0)); journey.complete(text); }}/>
      : <BrushingRow key={journey.key} props={props} row={journey.step - 1} round={journey.cycle} completed={journey.locked} initialClean={clean} onClean={setClean} finish={journey.complete}/>}
  </JourneyFrame>;
}
function BrushingRow({ props, row, round, completed, initialClean, onClean, finish }: {
  props: ToddlerGameProps; row: number; round: number; completed: boolean; initialClean: number[]; onClean: (values: number[]) => void; finish: (text: string) => void;
}) {
  const paused = useContext(PlayHintsPausedContext);
  const help = useGentleHelp(round, completed || paused);
  useEffect(() => {
    if (help.level === 3) speakText('이 위에서 칫솔을 왔다 갔다, 쓱싹쓱싹!', props.soundEnabled, { characterId: props.buddy, playIntroSFX: false });
  }, [help.level]);
  const [clean, setClean] = useState<number[]>(initialClean);
  const progress = useRef(clean);
  const stage = useRef<HTMLButtonElement>(null);
  const gesture = useRef<{ id: number; point: BrushPoint; element: HTMLButtonElement; cleaned: boolean } | null>(null);
  const [brush, setBrush] = useState<BrushPoint | null>(null);
  const soundAt = useRef(0);
  const finishing = useRef(false);
  const { scheduleGameTimeout } = useGameTimeouts();
  const voiceUntil = useRef(0);
  const cancel = () => {
    const current = gesture.current;
    gesture.current = null;
    if (current?.element.hasPointerCapture(current.id)) current.element.releasePointerCapture(current.id);
    setBrush(null);
    help.release();
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
    help.progress();
    setClean(values); onClean(values);
    if (!finishing.current && values.slice(row * 4, row * 4 + 4).every(value => value >= CLEAN_STROKES)) {
      finishing.current = true;
      cancel();
      scheduleGameTimeout(() => finish(row === 0 ? '윗니가 반짝반짝! 아랫니도 닦아 볼까?' : '모든 이가 하얘졌어! 이제 입을 헹구자.'), Math.max(0, voiceUntil.current - performance.now()));
    }
  };
  const locate = (event: PointerEvent<HTMLButtonElement>): BrushPoint => {
    const rect = stage.current!.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width * 300, y: (event.clientY - rect.top) / rect.height * 258 };
  };
  const start = (event: PointerEvent<HTMLButtonElement>) => {
    if (completed || finishing.current || gesture.current || !event.isPrimary || event.button !== 0) return;
    const point = locate(event);
    help.hold();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { id: event.pointerId, point, element: event.currentTarget, cleaned: false };
    setBrush(point);
  };
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId || completed) return;
    const point = locate(event);
    const values = brushRow(progress.current, current.point, point, row);
    const changed = values.some((value, i) => value > progress.current[i]);
    current.point = point;
    setBrush(point);
    if (changed) {
      current.cleaned = true;
      if (performance.now() - soundAt.current > 150) {
        voiceUntil.current = performance.now() + playCareReaction('brush', props.soundEnabled, props.buddy);
        soundAt.current = performance.now();
      }
      update(values);
    }
  };
  const keyboardBrush = () => {
    if (completed || finishing.current) return;
    const index = progress.current.findIndex((value, i) => Math.floor(i / 4) === row && value < CLEAN_STROKES);
    if (index < 0) return;
    const tooth = TEETH[index];
    voiceUntil.current = performance.now() + playCareReaction('brush', props.soundEnabled, props.buddy);
    update(brushRow(progress.current, { x: tooth.x - 14, y: tooth.y }, { x: tooth.x + 14, y: tooth.y }, row));
  };
  const pointerProps = {
    onPointerDown: start, onPointerMove: move,
    onPointerUp: (event: PointerEvent<HTMLButtonElement>) => { if (gesture.current?.id === event.pointerId) { if (!gesture.current.cleaned) help.miss(); cancel(); } },
    onPointerCancel: (event: PointerEvent<HTMLButtonElement>) => { if (gesture.current?.id === event.pointerId) cancel(); },
    onLostPointerCapture: (event: PointerEvent<HTMLButtonElement>) => { if (gesture.current?.id === event.pointerId) cancel(); },
    onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
  };
  return <>
    <div className="bathroom-scene" data-help={help.level >= 2}>
      <span className="bathroom-sparkle" aria-hidden="true"><Sparkles /></span>
      <button ref={stage} type="button" className={`brushing-friend ${brush ? 'is-brushing' : ''}`} aria-label="이를 쓱싹 닦기" disabled={completed} {...pointerProps} onClick={event => { if (event.detail === 0) keyboardBrush(); }}>
        <CareFriend buddy={props.buddy} smilingEyes={completed}>
          {TEETH.map((tooth, i) => <g key={i} className={Math.floor(i / 4) === row ? 'active-tooth' : undefined}>
            <rect x={tooth.x - 16} y={tooth.y - 14} width="32" height="29" rx="8" fill={clean[i] >= CLEAN_STROKES ? '#fffef7' : '#f4ead1'} stroke={Math.floor(i / 4) === row ? '#dab777' : '#e5d6bc'} strokeWidth={Math.floor(i / 4) === row ? 3 : 1.5} />
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
        {!brush && <GentleHint level={help.level >= 3 ? 3 : 0} text="쓱싹쓱싹" motion="rub" />}
      </button>
      <div className="sink-rim" aria-hidden="true" />
      <PlayProgress total={8} done={clean.filter(value => value >= CLEAN_STROKES).length} label="깨끗해진 이" />
    </div>
    <button type="button" className="brush-tool" data-help={help.level >= 1} aria-label="칫솔 잡고 옮기기" disabled={completed} {...pointerProps} onClick={event => { if (event.detail === 0) stage.current?.focus(); }}><ToothBrushArt /></button>
  </>;
}
