import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Crown, Heart } from 'lucide-react';
import { JourneyFrame, JourneyFinale, JourneyToy } from '../../components/PlayJourney';
import { CareRoutine } from '../../components/development/CareRoutine';
import { ScaffoldingHint } from '../../components/ScaffoldingHint';
import { useIdleScaffolding } from '../../hooks/useIdleScaffolding';
import { usePlayJourney, type JourneyStep } from '../../hooks/usePlayJourney';
import { FOOD_REACTIONS } from '../../data/foodReactions';
import { CareFriend, PlayProgress } from '../../components/ToddlerPlay';
import { DragMatch, DragPiece, DropSlot } from '../../components/DragMatch';
import { ToyArtwork } from '../../components/ToyArtwork';
import { FOOD_PLATES } from '../../data/toddlerPlay';
import { playCareReaction } from '../../utils/soundEngine';
import { useCareReactions } from '../../hooks/useCareReactions';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import { type ToddlerGameProps } from '../../hooks/useToddlerPlay';

const STEPS: JourneyStep[] = [
  { id: 'menu', label: '오늘의 맛있는 접시', picture: '🍽️', guide: '무엇을 함께 먹을까? 마음에 드는 접시를 골라 줘!' },
  { id: 'meal', label: '아~ 골고루 한 입', picture: '🥕', guide: '배가 고파! 맛있는 음식을 잡아서 내 입으로 쏙 옮겨 줘!' },
  { id: 'water', label: '물도 꿀꺽', picture: 'drink', guide: '물도 마시자! 물컵을 입으로 가져다 줘.' },
  { id: 'wipe', label: '입도 뽀송뽀송', picture: 'wipe', guide: '수건으로 입을 살살 닦아 주면 식사 끝!' },
];
export function FeedingGame(props: ToddlerGameProps) {
  useCareReactions(props.buddy, props.soundEnabled);
  const journey = usePlayJourney(props, STEPS);
  const [menu, setMenu] = useState(0);
  const plate = FOOD_PLATES[menu].items;
  return <JourneyFrame props={props} journey={journey} className="feeding-play">
    {journey.phase === 'finished' ? <JourneyFinale props={props} journey={journey} scene="picnic">
      {plate.map(food => <JourneyToy key={food.id} props={props} label={`${food.name} 이야기 듣기`} voice={`${food.name}, 맛있다!`} reaction={FOOD_REACTIONS[food.id]?.motion === 'crunch' ? 'chew' : 'yum'}><ToyArtwork emoji={food.emoji}/></JourneyToy>)}
    </JourneyFinale> : journey.step === 0 ? <ChooseMenu key={journey.key} props={props} locked={journey.locked} onChoose={index => { setMenu(index); journey.complete('맛있는 접시를 골랐네! 우리 함께 먹자!'); }}/>
      : journey.step === 1 ? <FeedMeal key={journey.key} props={props} plate={plate} completed={journey.locked} finish={journey.complete}/>
      : <CareRoutine key={journey.key} props={props} kind={journey.step === 2 ? 'drink' : 'wipe'} locked={journey.locked} onComplete={journey.complete}/>}
  </JourneyFrame>;
}
function ChooseMenu({ props, locked, onChoose }: { props: ToddlerGameProps; locked: boolean; onChoose: (index: number) => void }) {
  const chosen = useRef(false);
  const hint = useIdleScaffolding({ resetKey: 'menu', disabled: locked, voice: { text: STEPS[0].guide, buddy: props.buddy, soundEnabled: props.soundEnabled } });
  return <div className="menu-choices" aria-label="먹고 싶은 접시 고르기">{FOOD_PLATES.map((plate, i) => <button key={plate.id} type="button" className="menu-plate" aria-label={`${plate.items.map(f => f.name).join(', ')} 접시`} disabled={locked}
    onClick={() => { if (chosen.current) return; chosen.current = true; onChoose(i); }}>{plate.items.map(food => <ToyArtwork key={food.id} emoji={food.emoji}/>)}{i === 0 && hint.isIdle && <ScaffoldingHint/>}</button>)}</div>;
}
function FeedMeal({ props, plate, completed, finish }: { props: ToddlerGameProps; plate: typeof FOOD_PLATES[number]['items']; completed: boolean; finish: (text: string) => void }) {
  const { scheduleGameTimeout } = useGameTimeouts();
  const [eaten, setEaten] = useState<string[]>([]);
  const eatenRef = useRef(new Set<string>());
  const [chewing, setChewing] = useState(false);
  const busy = useRef(false);
  const portrait = useRef<HTMLDivElement>(null);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [anticipating, setAnticipating] = useState(false);
  const [lastFood, setLastFood] = useState<string | null>(null);
  const reaction = lastFood ? FOOD_REACTIONS[lastFood] : null;
  const nextFood = plate.find(food => !eaten.includes(food.id));
  const feed = (id: string) => {
    const food = plate.find(item => item.id === id);
    if (!food || completed || busy.current || eatenRef.current.has(id)) return false;
    busy.current = true;
    eatenRef.current.add(id);
    setEaten([...eatenRef.current]);
    setChewing(true);
    setLastFood(id);
    const voiceDuration = playCareReaction(FOOD_REACTIONS[id]?.motion === 'crunch' ? 'chew' : 'yum', props.soundEnabled, props.buddy);
    scheduleGameTimeout(() => {
      setChewing(false);
      busy.current = false;
      if (eatenRef.current.size === plate.length) finish(`${props.childName}야, 골고루 먹으니 힘이 쑥쑥! 배가 든든해. 고마워!`);
    }, Math.max(1600, voiceDuration));
    return true;
  };
  return <DragMatch resetKey="meal" disabled={completed || chewing} onDrop={feed} hint={nextFood ? { pieceId: nextFood.id, targetId: 'mouth' } : undefined} onDragMove={point => {
      const rect = portrait.current?.getBoundingClientRect();
      setAnticipating(point?.targetId === 'mouth');
      setGaze(point && rect ? { x: Math.max(-6, Math.min(6, (point.x - rect.left - rect.width / 2) / 20)), y: Math.max(-4, Math.min(4, (point.y - rect.top - rect.height / 2) / 20)) } : { x: 0, y: 0 });
    }}>
      <div className="feeding-scene">
        <div ref={portrait} className={`feeding-friend ${chewing ? `is-chewing food-${reaction?.motion}` : ''}`}>
          <CareFriend buddy={props.buddy} gaze={gaze} blush={chewing ? reaction?.blush : undefined} mouth={chewing ? 'chew' : anticipating ? 'open' : 'rest'} />
          {chewing && reaction && <><span className="food-reaction-word" key={lastFood}>{reaction.word}</span>{reaction.motion === 'crown' && <Crown className="broccoli-crown" fill="currentColor" />}</>}
          <DropSlot id="mouth" label="친구의 입" className="feeding-mouth" filled={completed}><span aria-hidden="true" /></DropSlot>
          {(chewing || completed) && <motion.span key={eaten.length} className="feeding-heart" initial={{ y: 15, opacity: 0, scale: .7 }} animate={{ y: -18, opacity: 1, scale: 1 }}><Heart fill="currentColor" /></motion.span>}
        </div>
        <div className="picnic-table-edge" aria-hidden="true" />
        <PlayProgress total={plate.length} done={eaten.length} label="맛본 음식" />
      </div>
      <div className="food-plate" aria-label="과일과 채소 접시">
        {plate.map(food => <DragPiece key={food.id} id={food.id} label={food.name} disabled={eaten.includes(food.id)} className={`food-piece ${eaten.includes(food.id) ? 'food-eaten' : ''}`}>
          <ToyArtwork emoji={food.emoji} /><span>{food.name}</span>
        </DragPiece>)}
      </div>
    </DragMatch>;
}
