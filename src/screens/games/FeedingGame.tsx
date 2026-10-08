import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Crown, Heart } from 'lucide-react';
import { PlayResultScene } from '../../components/PlayResultScene';
import { FOOD_REACTIONS } from '../../data/foodReactions';
import { CareFriend, PlayGuide, PlayHint, PlayProgress, PlayShell } from '../../components/ToddlerPlay';
import { DragMatch, DragPiece, DropSlot } from '../../components/DragMatch';
import { RoundContinuation } from '../../components/RoundContinuation';
import { ToyArtwork } from '../../components/ToyArtwork';
import { FOOD_PLATES } from '../../data/toddlerPlay';
import { pickNextRound } from '../../utils/roundDeck';
import { playCareSound, speakText } from '../../utils/soundEngine';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import { useToddlerPlay, type ToddlerGameProps } from '../../hooks/useToddlerPlay';

const GUIDE = '배가 고파! 맛있는 음식을 잡아서 내 입으로 쏙 옮겨 줘!';
export function FeedingGame(props: ToddlerGameProps) {
  const { round, completed, finish, next } = useToddlerPlay(props, GUIDE);
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const [plate, setPlate] = useState(() => pickNextRound(FOOD_PLATES, 'feeding:plates').items);
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
    playCareSound('chew', props.soundEnabled);
    speakText(`${FOOD_REACTIONS[id]?.word || '냠냠!'} ${food.name}, 맛있다!`, props.soundEnabled, { characterId: props.buddy, playIntroSFX: false });
    scheduleGameTimeout(() => {
      setChewing(false);
      busy.current = false;
      if (eatenRef.current.size === plate.length) finish(`${props.childName}야, 골고루 먹으니 힘이 쑥쑥! 배가 든든해. 고마워!`);
    }, 1600);
    return true;
  };
  return <PlayShell className="feeding-play">
    <PlayGuide {...props} title={completed ? '든든해! 고마워!' : '아~ 한 입 쏙!'} guide={GUIDE} happy={completed} />
    <DragMatch resetKey={round} disabled={completed || chewing} onDrop={feed} hint={nextFood ? { pieceId: nextFood.id, targetId: 'mouth' } : undefined} onDragMove={point => {
      const rect = portrait.current?.getBoundingClientRect();
      setAnticipating(point?.targetId === 'mouth');
      setGaze(point && rect ? { x: Math.max(-6, Math.min(6, (point.x - rect.left - rect.width / 2) / 20)), y: Math.max(-4, Math.min(4, (point.y - rect.top - rect.height / 2) / 20)) } : { x: 0, y: 0 });
    }}>
      {completed ? <PlayResultScene kind="picnic" buddy={props.buddy} toys={plate.map(food => food.emoji)} /> : <>
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
      </>}
      {completed ? <RoundContinuation onNext={() => { clearGameTimeouts(); eatenRef.current.clear(); setEaten([]); busy.current = false; setChewing(false); setLastFood(null); setPlate(pickNextRound(FOOD_PLATES, 'feeding:plates').items); next(); }} delayMs={5500} /> : <PlayHint>음식을 입으로 쏙!</PlayHint>}
    </DragMatch>
  </PlayShell>;
}
