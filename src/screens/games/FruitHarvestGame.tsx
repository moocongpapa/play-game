import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { DragMatch, DragPiece, DropSlot } from '../../components/DragMatch';
import { ToyArtwork } from '../../components/ToyArtwork';
import { JourneyFinale, JourneyFrame, JourneyToy } from '../../components/PlayJourney';
import { BasketArt, LandscapeArt } from '../../components/development/DevelopmentArt';
import { usePlayJourney, type JourneyStep } from '../../hooks/usePlayJourney';
import type { ToddlerGameProps } from '../../hooks/useToddlerPlay';
import { playCareSound, trySpeakIdleHint } from '../../utils/soundEngine';
const FRUITS = [
  { id: 'apple', name: '사과', emoji: '🍎', color: '#e9aaaa' },
  { id: 'orange', name: '오렌지', emoji: '🍊', color: '#e9c48a' },
  { id: 'peach', name: '복숭아', emoji: '🍑', color: '#e0b1c2' },
];
const STEPS: JourneyStep[] = [
  { id: 'tree-one', label: '첫 번째 과일 나무', picture: '🍎', guide: '과일을 잡아 톡! 같은 과일 그림이 있는 바구니에 쏙 담아 줘.' },
  { id: 'tree-two', label: '햇살 아래 과일 나무', picture: '🍊', guide: '바구니를 들고 다음 나무로 왔어! 맛있는 과일을 더 모아 볼까?' },
  { id: 'tree-three', label: '소풍 갈 준비', picture: '🍑', guide: '소풍에 가져갈 과일을 조금 더 따 보자!' },
  { id: 'picnic', label: '함께 차리는 소풍', picture: '🍽️', guide: '우리가 딴 과일이야! 같은 그림의 접시에 하나씩 놓아 줘.' },
];
export function FruitHarvestGame(props: ToddlerGameProps) {
  const journey = usePlayJourney(props, STEPS);
  return <JourneyFrame props={props} journey={journey} className="harvest-play">
    {journey.phase === 'finished' ? <JourneyFinale props={props} journey={journey} scene="picnic">
      {FRUITS.map(fruit => <JourneyToy key={fruit.id} props={props} label={`${fruit.name} 나눠 먹기`} voice="냠냠! 우리가 함께 딴 과일이라 더 맛있어!"><ToyArtwork emoji={fruit.emoji}/></JourneyToy>)}
    </JourneyFinale> : <>
      <div className="journey-keepsakes" aria-label="모은 과일 바구니">{FRUITS.slice(0, journey.step).map(fruit => <span key={fruit.id}><BasketArt color={fruit.color}/></span>)}</div>
      <HarvestScene key={journey.key} props={props} stage={journey.step} cycle={journey.cycle} locked={journey.locked} onComplete={journey.complete}/>
    </>}
  </JourneyFrame>;
}
function HarvestScene({ props, stage, cycle, locked, onComplete }: { props: ToddlerGameProps; stage: number; cycle: number; locked: boolean; onComplete: (text: string) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const pickedRef = useRef(new Set<string>());
  const picnic = stage === 3;
  const fruits = Array.from({ length: picnic || props.ageGroup === 'baby' ? 3 : 6 }, (_, i) => ({ ...FRUITS[(i + stage + cycle) % 3], key: `fruit-${i}` }));
  const hint = fruits.find(f => !picked.includes(f.key));
  const drop = (id: string, target: string) => {
    const fruit = fruits.find(f => f.key === id);
    if (!fruit || pickedRef.current.has(id) || locked) return false;
    if (fruit.id !== target) { trySpeakIdleHint(STEPS[picnic ? 3 : 0].guide, props.soundEnabled, props.buddy); return false; }
    pickedRef.current.add(id); setPicked([...pickedRef.current]); playCareSound('bubble', props.soundEnabled);
    if (pickedRef.current.size === fruits.length) onComplete(picnic ? '소풍 준비 끝! 우리가 모은 과일을 함께 나눠 먹자!' : '바구니가 가득 찼어! 과일을 정말 잘 모았네!');
    else trySpeakIdleHint(`${fruit.name}, 쏙! 맛있겠네!`, props.soundEnabled, props.buddy);
    return true;
  };
  return <DragMatch canDrop={(id, target) => fruits.find(f => f.key === id)?.id === target} juicy resetKey={stage} disabled={locked} onDrop={drop} hint={hint ? { pieceId: hint.key, targetId: hint.id } : undefined}>
    {picnic ? <div className="harvest-picnic">{FRUITS.map(fruit => <DropSlot key={fruit.id} id={fruit.id} label={`${fruit.name} 접시`} className="picnic-plate" filled={fruits.some(f => f.id === fruit.id && picked.includes(f.key))}><ToyArtwork emoji={fruit.emoji}/></DropSlot>)}</div> :
      <div className={`discovery-scene harvest-scene harvest-orchard-${stage}`}><LandscapeArt orchard/>
        {fruits.map((fruit, i) => <DragPiece key={fruit.key} id={fruit.key} label={fruit.name} disabled={picked.includes(fruit.key)} className={`harvest-fruit ${picked.includes(fruit.key) ? 'fruit-picked' : ''}`} style={{ left: `${[23, 48, 74, 31, 57, 78][i]}%`, top: `${[25, 18, 27, 51, 48, 55][i]}%`, '--sway-delay': `${i * -.47}s` } as React.CSSProperties}><span className="fruit-stem"/><ToyArtwork emoji={fruit.emoji}/></DragPiece>)}
      </div>}
    {picnic ? <div className="picnic-fruit-choices">{fruits.map(fruit => <DragPiece key={fruit.key} id={fruit.key} label={fruit.name} disabled={picked.includes(fruit.key)}><ToyArtwork emoji={fruit.emoji}/></DragPiece>)}</div> :
      <div className="harvest-baskets">{FRUITS.map(fruit => {
        const count = fruits.filter(f => f.id === fruit.id && picked.includes(f.key)).length;
        return <DropSlot key={fruit.id} id={fruit.id} label={`${fruit.name} 바구니`} className="harvest-basket" filled={fruits.filter(f => f.id === fruit.id).every(f => picked.includes(f.key))}>
          <motion.span key={count} className="basket-weight" animate={count ? { scaleY: [1, .83, 1.07, 1], scaleX: [1, 1.08, .96, 1] } : undefined} transition={{ duration: .5 }}><BasketArt color={fruit.color}/><span className="basket-fruit-picture"><ToyArtwork emoji={fruit.emoji}/></span>{count > 0 && <span className="harvest-inside">{Array.from({ length: count }, (_, i) => <ToyArtwork key={i} emoji={fruit.emoji}/>)}</span>}</motion.span>
        </DropSlot>;
      })}</div>}
  </DragMatch>;
}
