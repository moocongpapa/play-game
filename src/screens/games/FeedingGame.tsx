import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
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
import { playCareReaction, playCareSound, trySpeakIdleHint } from '../../utils/soundEngine';
import { usePlayMemory } from '../../components/PlayMemoryContext';
import { CakeKeepsake } from '../../components/PlayKeepsakeArtwork';
import { BasketArt } from '../../components/development/DevelopmentArt';
import type { PlayCake } from '../../utils/playMemory';
import { buddyPlayMotion } from '../../utils/buddyPlay';

import { useCareReactions } from '../../hooks/useCareReactions';
import { CHARACTER_PERFORMANCE } from '../../utils/characterPerformance';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import { type ToddlerGameProps } from '../../hooks/useToddlerPlay';
import './ConnectedPlay.css';

type MealFood = { id: string; name: string; emoji: string; reactionId?: string; harvestId?: string; cake?: PlayCake };
const HARVEST_PICTURES = { apple: '🍎', orange: '🍊', peach: '🍑' };
function MealArtwork({ food }: { food: MealFood }) {
  return food.cake ? <CakeKeepsake cake={food.cake} /> : <ToyArtwork emoji={food.emoji} />;
}

const STEPS: JourneyStep[] = [
  { id: 'menu', label: '오늘의 맛있는 접시', picture: '🍽️', guide: '무엇을 함께 먹을까? 마음에 드는 접시를 골라 줘!' },
  { id: 'meal', label: '아~ 골고루 한 입', picture: '🥕', guide: '배가 고파! 맛있는 음식을 잡아서 내 입으로 쏙 옮겨 줘!' },
  { id: 'water', label: '물도 꿀꺽', picture: 'drink', guide: '물도 마시자! 물컵을 입으로 가져다 줘.' },
  { id: 'wipe', label: '입도 뽀송뽀송', picture: 'wipe', guide: '수건으로 입을 살살 닦아 주면 식사 끝!' },
];
export function FeedingGame(props: ToddlerGameProps) {
  useCareReactions(props.buddy, props.soundEnabled);
  const journey = usePlayJourney(props, STEPS);
  // The selected plate is a snapshot: consuming pantry fruit must not replace the
  // remaining pieces while the child's hand is still on this meal.
  const [plate, setPlate] = useState<MealFood[]>(() => FOOD_PLATES[0].items);
  return <JourneyFrame props={props} journey={journey} className="feeding-play">
    {journey.phase === 'finished' ? <JourneyFinale props={props} journey={journey} scene="picnic">
      {plate.map(food => <JourneyToy key={food.id} props={props} label={`${food.name} 이야기 듣기`} voice={`${food.name}, 맛있다!`} reaction={FOOD_REACTIONS[food.reactionId ?? food.id]?.motion === 'crunch' ? 'chew' : 'yum'}><MealArtwork food={food}/></JourneyToy>)}
    </JourneyFinale> : journey.step === 0 ? <ChooseMenu key={journey.key} props={props} locked={journey.locked} onChoose={foods => { setPlate(foods); journey.complete(foods.some(food => food.harvestId) ? '우리가 딴 과일이네! 함께 먹자!' : foods.some(food => food.cake) ? '네가 꾸민 케이크네! 함께 먹자!' : '맛있는 접시를 골랐네! 우리 함께 먹자!'); }}/>
      : journey.step === 1 ? <FeedMeal key={journey.key} props={props} plate={plate} completed={journey.locked} finish={journey.complete}/>
      : <CareRoutine key={journey.key} props={props} kind={journey.step === 2 ? 'drink' : 'wipe'} locked={journey.locked} onComplete={journey.complete}/>}
  </JourneyFrame>;
}
function ChooseMenu({ props, locked, onChoose }: { props: ToddlerGameProps; locked: boolean; onChoose: (plate: MealFood[]) => void }) {
  const { memory } = usePlayMemory();
  const chosen = useRef(false);
  const hint = useIdleScaffolding({ resetKey: 'menu', disabled: locked, voice: { text: STEPS[0].guide, buddy: props.buddy, soundEnabled: props.soundEnabled } });
  const keepsakes: MealFood[] = memory.fruitBasket.slice(0, memory.latestCake ? 3 : 4).map(fruit => ({
    id: `picked-${fruit.id}`, harvestId: fruit.id, reactionId: fruit.kind,
    name: fruit.label, emoji: HARVEST_PICTURES[fruit.kind],
  }));
  if (memory.latestCake) keepsakes.push({ id: 'my-cake', name: '내가 꾸민 케이크', emoji: '🎂', cake: memory.latestCake });
  const plates: { id: string; items: MealFood[]; remembered?: boolean }[] = FOOD_PLATES.map(plate => ({ ...plate }));
  if (keepsakes.length) plates[0] = { id: 'our-keepsakes', items: keepsakes, remembered: true };
  return <div className="menu-choices" aria-label="먹고 싶은 접시 고르기">{plates.map((plate, i) => <button key={plate.id} type="button" className={`menu-plate ${plate.remembered ? 'our-keepsake-plate' : ''}`} aria-label={`${plate.remembered ? '우리가 준비한 ' : ''}${plate.items.map(f => f.name).join(', ')} 접시`} disabled={locked}
    onClick={() => { if (chosen.current) return; chosen.current = true; onChoose(plate.items); }}>{plate.items.map(food => <MealArtwork key={food.id} food={food}/>)}{plate.remembered && <span className="meal-keepsake-badge" aria-hidden="true"><BasketArt color="#d8b88b"/></span>}{i === 0 && hint.isIdle && <ScaffoldingHint/>}</button>)}</div>;
}
function FeedMeal({ props, plate, completed, finish }: { props: ToddlerGameProps; plate: MealFood[]; completed: boolean; finish: (text: string) => void }) {
  const { takeFruit } = usePlayMemory();
  const reducedMotion = useReducedMotion();
  const { scheduleGameTimeout } = useGameTimeouts();
  const [eaten, setEaten] = useState<string[]>([]);
  const eatenRef = useRef(new Set<string>());
  const [chewing, setChewing] = useState(false);
  const [savoring, setSavoring] = useState(false);
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
    if (food.harvestId) takeFruit(food.harvestId);
    setEaten([...eatenRef.current]);
    setChewing(true);
    setSavoring(false);
    setAnticipating(false);
    setGaze({ x: 0, y: 0 });
    setLastFood(food.reactionId ?? food.id);
    const motionKind = FOOD_REACTIONS[food.reactionId ?? food.id]?.motion;
    if (motionKind === 'sour' || motionKind === 'spicy' || motionKind === 'freeze' || motionKind === 'fizzy') {
      playCareSound(motionKind, props.soundEnabled);
    }
    const voiceDuration = playCareReaction(motionKind === 'crunch' ? 'chew' : 'yum', props.soundEnabled, props.buddy);
    const mealDuration = Math.max(1300, voiceDuration);
    scheduleGameTimeout(() => { setChewing(false); setSavoring(true); }, Math.max(800, mealDuration - 320));
    scheduleGameTimeout(() => {
      setChewing(false);
      setSavoring(false);
      busy.current = false;
      if (eatenRef.current.size === plate.length) finish(food.cake ? '네가 꾸민 케이크도 맛있게 먹었어! 고마워!' : food.harvestId ? '우리가 딴 과일이라 더 맛있어! 배가 든든해. 고마워!' : `${props.childName}야, 골고루 먹으니 힘이 쑥쑥! 배가 든든해. 고마워!`);
      else if (food.harvestId) trySpeakIdleHint(`네가 딴 ${food.name}야! 맛있어!`, props.soundEnabled, props.buddy);
      else if (food.cake) trySpeakIdleHint('네가 꾸민 케이크야! 정말 예쁘고 맛있어!', props.soundEnabled, props.buddy);
    }, mealDuration);
    return true;
  };
  return <DragMatch resetKey="meal" disabled={completed || chewing || savoring} onDrop={feed} hint={nextFood ? { pieceId: nextFood.id, targetId: 'mouth' } : undefined} onDragMove={point => {
      const rect = portrait.current?.getBoundingClientRect();
      setAnticipating(point?.targetId === 'mouth');
      setGaze(point && rect ? { x: Math.max(-6, Math.min(6, (point.x - rect.left - rect.width / 2) / 20)), y: Math.max(-4, Math.min(4, (point.y - rect.top - rect.height / 2) / 20)) } : { x: 0, y: 0 });
    }}>
      <div className="feeding-scene">
        <motion.div ref={portrait} style={{ '--chew-beat': `${CHARACTER_PERFORMANCE[props.buddy].chewBeat}ms` } as React.CSSProperties} className={`feeding-friend ${chewing ? `is-chewing food-${reaction?.motion}` : ''}`}
          {...(!reducedMotion && (chewing || savoring) ? buddyPlayMotion(props.buddy, 'eat') : {})}>
          <CareFriend buddy={props.buddy} gaze={gaze} blush={chewing ? reaction?.blush : undefined} mouth={chewing ? 'chew' : savoring || completed ? 'smile' : anticipating ? 'open' : 'rest'} />
          {chewing && reaction && <><span className="food-reaction-word" key={lastFood}>{reaction.word}</span>
            {reaction.motion === 'crown' && <Crown className="broccoli-crown" fill="currentColor" />}
            {reaction.motion === 'sour' && <span className="mukbang-overlay sour-stars" aria-hidden="true">🍋✨😵</span>}
            {reaction.motion === 'spicy' && <span className="mukbang-overlay spicy-flames" aria-hidden="true">💨🌶️🔥</span>}
            {reaction.motion === 'freeze' && <span className="mukbang-overlay freeze-icicles" aria-hidden="true">❄️🧊🥶</span>}
            {reaction.motion === 'fizzy' && <span className="mukbang-overlay fizzy-bubbles" aria-hidden="true">🫧🥤🫧</span>}
          </>}
          <DropSlot id="mouth" label="친구의 입" className="feeding-mouth" filled={completed}><span aria-hidden="true" /></DropSlot>
          {(chewing || completed) && <motion.span key={eaten.length} className="feeding-heart" initial={{ y: 15, opacity: 0, scale: .7 }} animate={{ y: -18, opacity: 1, scale: 1 }}><Heart fill="currentColor" /></motion.span>}
        </motion.div>

        <div className="picnic-table-edge" aria-hidden="true" />
        <PlayProgress total={plate.length} done={eaten.length} label="맛본 음식" />
      </div>
      <div className="food-plate" aria-label="과일과 채소 접시">
        {plate.map(food => <DragPiece key={food.id} id={food.id} label={food.name} disabled={eaten.includes(food.id)} className={`food-piece ${eaten.includes(food.id) ? 'food-eaten' : ''}`}>
          <MealArtwork food={food}/><span className="sr-only">{food.name}</span>
        </DragPiece>)}
      </div>
    </DragMatch>;
}
