import { useEffect, useRef, useState, type PointerEvent, type MouseEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { PlayGuide, PlayHint, PlayProgress, PlayShell } from '../../components/ToddlerPlay';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { ToyArtwork } from '../../components/ToyArtwork';
import { useToddlerPlay, usePageVisible, type ToddlerGameProps } from '../../hooks/useToddlerPlay';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import { BUBBLE_TOYS } from '../../data/toddlerPlay';
import { playCareSound, playSparkleChime, speakText } from '../../utils/soundEngine';
import { fireStarExplosion } from '../../utils/confetti';
import { emitJuice } from '../../utils/juice';

const GUIDE = '몽실몽실 비눗방울을 톡! 황금 방울에서는 별이 쏟아져!';
interface Bubble { id: number; lane: number; size: number; toy: string | null; golden: boolean; duration: number; delay: number }
export function BubblePopGame(props: ToddlerGameProps) {
  useToddlerPlay(props, GUIDE);
  const visible = usePageVisible();
  const reduced = useReducedMotion();
  const { scheduleGameTimeout } = useGameTimeouts();
  const arena = useRef<HTMLDivElement>(null);
  const sequence = useRef(0);
  const handled = useRef(new Set<number>());
  const popped = useRef(0);
  const [count, setCount] = useState(0);
  const [happy, setHappy] = useState(false);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; golden: boolean }[]>([]);
  const makeBubble = (delay = 0): Bubble => {
    const id = ++sequence.current;
    return { id, lane: (id - 1) % 5, size: 72 + (id % 3) * 12, toy: id % 3 === 0 ? null : BUBBLE_TOYS[id % BUBBLE_TOYS.length], golden: id % 5 === 0, duration: 11 + id % 3, delay };
  };
  const [bubbles, setBubbles] = useState<Bubble[]>(() => Array.from({ length: 5 }, (_, i) => makeBubble(-2 - i * 2)));
  useEffect(() => {
    if (!visible || reduced) return;
    const timer = window.setInterval(() => {
      const bubble = makeBubble();
      setBubbles(current => [...current.slice(-7), bubble]);
    }, 1800);
    return () => window.clearInterval(timer);
  }, [visible, reduced]);
  useEffect(() => {
    const active = new Set(bubbles.map(bubble => bubble.id));
    for (const id of handled.current) if (!active.has(id)) handled.current.delete(id);
  }, [bubbles]);
  const pop = (bubble: Bubble, element: HTMLButtonElement) => {
    if (handled.current.has(bubble.id)) return;
    handled.current.add(bubble.id);
    const rect = element.getBoundingClientRect();
    const area = arena.current!.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    emitJuice({ kind: 'pop', x, y });
    setBursts(current => [...current.slice(-4), { id: bubble.id, x: (x - area.left) / area.width * 100, y: (y - area.top) / area.height * 100, golden: bubble.golden }]);
    scheduleGameTimeout(() => setBursts(current => current.filter(burst => burst.id !== bubble.id)), 750);
    const replacement = reduced ? makeBubble() : null;
    setBubbles(current => [...current.filter(item => item.id !== bubble.id), ...(replacement ? [replacement] : [])]);
    playCareSound('bubble', props.soundEnabled);
    popped.current += 1;
    setCount(popped.current);
    if (bubble.golden) {
      playSparkleChime(props.soundEnabled);
      fireStarExplosion({ x: x / window.innerWidth, y: y / window.innerHeight });
    }
    if (popped.current % 8 === 0) {
      props.onCompleteQuiz(1);
      setHappy(true);
      speakText('퐁퐁! 반짝이는 방울을 잘 찾았어! 계속 놀자!', props.soundEnabled, { characterId: props.buddy });
      scheduleGameTimeout(() => setHappy(false), 1600);
    }
  };
  return <PlayShell className="bubble-play">
    <PlayGuide {...props} title="몽실몽실, 톡!" guide={GUIDE} happy={happy} />
    <div ref={arena} className={`bubble-sky ${visible ? '' : 'play-paused'} ${reduced ? 'bubble-still' : ''}`} aria-label="비눗방울 놀이터">
      <span className="bubble-sun" aria-hidden="true" /><span className="bubble-cloud cloud-one" aria-hidden="true" /><span className="bubble-cloud cloud-two" aria-hidden="true" />
      <div className="bubble-buddy" aria-hidden="true"><CharacterAvatar id={props.buddy} size="lg" mood={happy ? 'happy' : 'waving'} /></div>
      <span className="bubble-wand" aria-hidden="true" />
      {bubbles.map(bubble => <button key={bubble.id} type="button" className={`soap-bubble ${bubble.golden ? 'golden-bubble' : ''}`} aria-label={bubble.golden ? '황금 비눗방울 터뜨리기' : '비눗방울 터뜨리기'}
        style={{ '--bubble-x': `${14 + bubble.lane * 18}%`, '--bubble-size': `${bubble.size}px`, '--bubble-time': `${bubble.duration}s`, '--bubble-delay': `${bubble.delay}s`, '--bubble-still-y': `${15 + (bubble.lane % 3) * 25}%` } as React.CSSProperties}
        onPointerDown={(event: PointerEvent<HTMLButtonElement>) => { if (event.button !== 0) return; event.preventDefault(); pop(bubble, event.currentTarget); }}
        onClick={(event: MouseEvent<HTMLButtonElement>) => { if (event.detail === 0) pop(bubble, event.currentTarget); }}
        onAnimationEnd={() => setBubbles(current => current.filter(item => item.id !== bubble.id))}>
        {bubble.golden ? <Sparkles aria-hidden="true" /> : bubble.toy && <ToyArtwork emoji={bubble.toy} />}
      </button>)}
      {bursts.map(burst => <span key={burst.id} className={`soap-burst ${burst.golden ? 'soap-burst-gold' : ''}`} style={{ left: `${burst.x}%`, top: `${burst.y}%` }} aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <motion.i key={i} initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: Math.cos(i * Math.PI * 2 / 7) * 55, y: Math.sin(i * Math.PI * 2 / 7) * 55, opacity: 0, scale: .2 }} transition={{ duration: .65 }} />)}</span>)}
    </div>
    <PlayProgress total={8} done={count % 8} label={`터뜨린 비눗방울 ${count}개, 이번 놀이`} />
    <PlayHint>톡! 톡! 황금 방울도 찾아봐!</PlayHint>
  </PlayShell>;
}
