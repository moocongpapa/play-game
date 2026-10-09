import { useRef, useState } from 'react';
import { DragMatch, DragPiece, DropSlot } from '../../components/DragMatch';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JourneyFinale, JourneyFrame, JourneyToy } from '../../components/PlayJourney';
import { SeatArt } from '../../components/development/DevelopmentArt';
import { CareObjectArt } from '../../components/development/CareRoutine';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import { usePlayJourney, type JourneyStep } from '../../hooks/usePlayJourney';
import { playCareSound, playBouncyBoing, trySpeakIdleHint } from '../../utils/soundEngine';
import type { ToddlerGameProps } from '../../hooks/useToddlerPlay';
const BEARS = [{ id: 'small', name: '아기 곰', size: 64 }, { id: 'medium', name: '엄마 곰', size: 87 }, { id: 'large', name: '아빠 곰', size: 110 }];
const STEPS: JourneyStep[] = [
  { id: 'chairs', label: '곰 가족의 의자', picture: 'chair', guide: '작은 곰, 중간 곰, 커다란 곰! 크기가 꼭 맞는 자리를 찾아 줘.' },
  { id: 'bowls', label: '곰 가족의 밥그릇', picture: 'bowl', guide: '곰 가족이 배가 고프대! 곰의 크기에 맞는 밥그릇을 놓아 줘.' },
  { id: 'blankets', label: '곰 가족의 이불', picture: 'blanket', guide: '이제 포근하게 쉬자! 작은 곰부터 큰 곰까지 꼭 맞는 이불을 덮어 줘.' },
];
export function SizeOrderingGame(props: ToddlerGameProps) {
  const journey = usePlayJourney(props, STEPS);
  return <JourneyFrame props={props} journey={journey} className="ordering-play">
    {journey.phase === 'finished' ? <JourneyFinale props={props} journey={journey} scene="bedroom">
      {BEARS.map(bear => <JourneyToy key={bear.id} props={props} label={`${bear.name} 토닥이기`} voice="포근하고 편안해. 우리를 돌봐 줘서 고마워!"><span className="journey-bear-rest" style={{ width: `${bear.size / 110 * 100}%` }}><CharacterAvatar id="ggomi" size="md" mood="happy"/><CareObjectArt kind="blanket"/></span></JourneyToy>)}
    </JourneyFinale> : <BearScene key={journey.key} props={props} stage={journey.step} cycle={journey.cycle} locked={journey.locked} onComplete={journey.complete}/>}
  </JourneyFrame>;
}
function BearScene({ props, stage, cycle, locked, onComplete }: { props: ToddlerGameProps; stage: number; cycle: number; locked: boolean; onComplete: (text: string) => void }) {
  const [placed, setPlaced] = useState<string[]>([]);
  const [wobble, setWobble] = useState('');
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const claimed = useRef(new Set<string>());
  const order = [2, 0, 1].map(i => BEARS[(i + cycle + stage) % 3]);
  const hint = order.find(bear => !placed.includes(bear.id));
  const item = ['의자', '밥그릇', '이불'][stage];
  return <DragMatch canDrop={(id, target) => id === target} juicy resetKey={stage} disabled={locked} hint={hint ? { pieceId: hint.id, targetId: hint.id } : undefined}
    onDrop={(id, target) => {
      if (locked || claimed.current.has(id)) return false;
      if (id !== target) { setWobble(target); clearGameTimeouts(); scheduleGameTimeout(() => setWobble(''), 750); playBouncyBoing(props.soundEnabled); trySpeakIdleHint('어라, 자리가 조금 다르네! 다른 데도 앉아볼까?', props.soundEnabled, props.buddy); return false; }
      claimed.current.add(id); setPlaced([...claimed.current]); playCareSound('bubble', props.soundEnabled);
      if (claimed.current.size === 3) onComplete(['의자가 딱 맞아! 이제 밥을 먹어 볼까?', '냠냠, 배가 든든해졌어! 포근한 이불도 찾아 줄래?', '작은 곰부터 큰 곰까지 모두 포근해! 고마워!'][stage]);
      else trySpeakIdleHint('딱 맞아! 편안해~', props.soundEnabled, props.buddy);
      return true;
    }}>
    <div className="bear-room"><div className="bear-window" aria-hidden="true"/><div className="bear-seats">
      {BEARS.map(bear => <DropSlot key={bear.id} id={bear.id} label={`${bear.name} ${item}`} filled={placed.includes(bear.id)} className={`bear-seat ${wobble === bear.id ? 'seat-wobble' : ''}`}>
        <span className="seat-size" style={{ width: `${bear.size / 110 * 95}%`, maxWidth: bear.size }}>{stage === 2 ? <span className="bear-bed"/> : <SeatArt variant={0}/>}</span>
        {(stage > 0 || placed.includes(bear.id)) && <span className="seated-bear" style={{ width: `${bear.size / 110 * 95}%`, maxWidth: bear.size, height: bear.size }}><CharacterAvatar id="ggomi" size="sm" variant="full" mood={placed.includes(bear.id) ? 'happy' : 'still'}/></span>}
        {stage > 0 && <span className="bear-care-item" style={{ width: `${bear.size / 110 * 95}%`, maxWidth: bear.size, opacity: placed.includes(bear.id) ? 1 : .23 }}>{stage === 1 ? <SeatArt variant={2}/> : <CareObjectArt kind="blanket"/>}</span>}
      </DropSlot>)}
    </div><span className="bear-order-line" aria-hidden="true"><i/><i/><i/></span></div>
    <div className="bear-family" aria-label="크기가 다른 놀잇감">{order.map(bear => <DragPiece key={bear.id} id={bear.id} label={stage === 0 ? bear.name : `${bear.name} 크기 ${item}`} disabled={placed.includes(bear.id)} className={`bear-piece ${placed.includes(bear.id) ? 'bear-seated' : ''}`}>
      <span style={{ width: `${bear.size / 110 * 95}%`, maxWidth: bear.size, height: bear.size }}>{stage === 0 ? <CharacterAvatar id="ggomi" size="sm" variant="full" mood="still"/> : stage === 1 ? <SeatArt variant={2}/> : <CareObjectArt kind="blanket"/>}</span>
      <span className="bear-size-dots" aria-hidden="true">{Array.from({ length: BEARS.indexOf(bear) + 1 }, (_, i) => <i key={i}/>)}</span>
    </DragPiece>)}</div>
  </DragMatch>;
}
