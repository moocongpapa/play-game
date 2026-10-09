import { useRef } from 'react';
import { playBouncyBoing, trySpeakIdleHint } from '../../utils/soundEngine';
import { DragMatch, DragPiece, DropSlot } from '../../components/DragMatch';
import { JourneyFinale, JourneyFrame, JourneyToy } from '../../components/PlayJourney';
import { WingArt, LandscapeArt } from '../../components/development/DevelopmentArt';
import { usePlayJourney, type JourneyStep } from '../../hooks/usePlayJourney';
import type { ToddlerGameProps } from '../../hooks/useToddlerPlay';

const STEPS: JourneyStep[] = [
  { id: 'first', label: '첫 번째 날개 친구', picture: 'wing', guide: '한쪽 날개가 비었네? 같은 무늬의 날개를 잡아서 쏙 붙여 줘!' },
  { id: 'second', label: '또 다른 날개 친구', picture: 'wing', guide: '꽃밭에 새 친구가 왔어! 이번에는 어떤 무늬일까?' },
  { id: 'third', label: '함께 날아 볼까?', picture: 'wing', guide: '마지막 친구의 날개도 찾아서 모두 함께 날아 보자!' },
];
export function SymmetryPuzzleGame(props: ToddlerGameProps) {
  const journey = usePlayJourney(props, STEPS);
  const patterns = [0, 1, 2].map(i => (journey.cycle * 3 + i) % 6);
  return <JourneyFrame props={props} journey={journey} className="symmetry-play">
    {journey.phase === 'finished' ? <JourneyFinale props={props} journey={journey}>
      {patterns.map(pattern => <JourneyToy key={pattern} props={props} label={`날개 친구 ${pattern % 3 + 1} 날리기`} voice="팔랑팔랑! 꽃밭에서 같이 날자!">
        <span className="journey-butterfly"><WingArt pattern={pattern} side="left"/><WingArt pattern={pattern}/></span>
      </JourneyToy>)}
    </JourneyFinale> : <>
      <div className="journey-keepsakes" aria-label="완성한 날개 친구들">{patterns.slice(0, journey.step).map(pattern => <span key={pattern} className="journey-butterfly"><WingArt pattern={pattern} side="left"/><WingArt pattern={pattern}/></span>)}</div>
      <WingScene key={journey.key} props={props} pattern={patterns[journey.step]} locked={journey.locked} onComplete={journey.complete}/>
    </>}
  </JourneyFrame>;
}
function WingScene({ props, pattern, locked, onComplete }: { props: ToddlerGameProps; pattern: number; locked: boolean; onComplete: (praise: string) => void }) {
  const placed = useRef(false);
  const choices = [0, 1, 2].map(i => Math.floor(pattern / 3) * 3 + (pattern + i + 1) % 3);
  return <DragMatch canDrop={id => id === String(pattern)} juicy resetKey={pattern} disabled={locked} hint={{ pieceId: String(pattern), targetId: 'wing' }}
    onDrop={id => { if (placed.current || locked) return false; if (Number(id) !== pattern) { playBouncyBoing(props.soundEnabled); trySpeakIdleHint('왼쪽 날개의 무늬도 살펴봐!', props.soundEnabled, props.buddy); return false; } placed.current = true; onComplete('날개가 꼭 닮았네! 팔랑팔랑, 고마워!'); return true; }}>
    <div className="discovery-scene symmetry-scene"><LandscapeArt/>
      <div className={`symmetry-friend ${locked ? 'wing-flight' : ''}`}>
        <div className="symmetry-left"><WingArt pattern={pattern} side="left"/></div>
        <DropSlot id="wing" label="오른쪽 날개" className="symmetry-right" filled={locked}><WingArt pattern={pattern} silhouette={!locked}/></DropSlot>
        <span className="butterfly-body"><i/><i/><b>⌣</b></span>{locked && <span className="snap-ring"/>}
      </div>
    </div>
    <div className="wing-choices" aria-label="날개 조각">{choices.map(p => <DragPiece key={p} id={String(p)} label={`${['동그라미', '하트', '별'][p % 3]} 무늬 날개`} className="wing-choice"><WingArt pattern={p}/></DragPiece>)}</div>
  </DragMatch>;
}
