import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Crown, Hand } from 'lucide-react';
import type { CharacterId, AgeGroup } from '../../types';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { PlayGuide, PlayProgress } from '../../components/ToddlerPlay';
import { RoundContinuation } from '../../components/RoundContinuation';
import { ToyArtwork } from '../../components/ToyArtwork';
import { PlayHintsPausedContext } from '../../components/PlayFlowContext';
import { useIdleScaffolding } from '../../hooks/useIdleScaffolding';
import { speakText, stopAllSpeech, playBouncyBoing, playCorrectFanfare } from '../../utils/soundEngine';
import { fireStarExplosion } from '../../utils/confetti';
import { emitJuice, subscribeWindGust, JUICE_SPRING } from '../../utils/juice';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import './BlockTowerGame.css';

const PALETTES = [
  { light: '#f7d1d9', base: '#e8a5b4', edge: '#bc7f91', emoji: '🍓' },
  { light: '#faeab8', base: '#edcc83', edge: '#bc9d5f', emoji: '⭐' },
  { light: '#d8ead0', base: '#a9c898', edge: '#77996b', emoji: '🍀' },
  { light: '#d5edf0', base: '#a3cbd3', edge: '#719ba8', emoji: '🐬' },
  { light: '#e7def3', base: '#c2b1da', edge: '#9880b5', emoji: '🦄' },
  { light: '#f9dfbf', base: '#e8bd8e', edge: '#b58b60', emoji: '🍊' },
];
const GUIDE = '블록이 둥실둥실! 화면을 톡 누르면 차곡차곡 쌓여. 함께 멋진 집을 만들자!';
type Block = { offset: number; palette: number };
export function BlockTowerGame({ buddy, onCompleteQuiz, soundEnabled, ageGroup = 'sprout' }: {
  buddy: CharacterId; onCompleteQuiz: (stars: number) => void; soundEnabled: boolean; ageGroup?: AgeGroup; childName?: string;
}) {
  const reduced = useReducedMotion();
  const paused = useContext(PlayHintsPausedContext);
  const stage = useRef<HTMLDivElement>(null), crane = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 360, height: 650 });
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [falling, setFalling] = useState<{ from: number; to: number; y: number; palette: number } | null>(null);
  const [completed, setCompleted] = useState(false), [sway, setSway] = useState(0);
  const target = ageGroup === 'baby' ? 5 : ageGroup === 'sprout' ? 6 : 7;
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const latest = useRef({ blocks, falling, completed, paused }); latest.current = { blocks, falling, completed, paused };
  const lock = useRef(false), craneX = useRef(0);
  const pendingLanding = useRef(false);
  const blockWidth = Math.min(220, size.width * .48);
  const buddySize = Math.min(112, Math.max(40, size.height * .16));
  const blockHeight = Math.max(12, Math.min(44, (size.height - 138 - buddySize) / target));
  const floor = size.height - 42;
  const craneY = Math.min(128, Math.max(90, size.height * .19));
  const amplitude = Math.min(96, Math.max(0, (size.width - blockWidth) / 2 - 18));
  const help = useIdleScaffolding({ resetKey: blocks.length, disabled: !!falling || completed,
    voice: { text: GUIDE, buddy, soundEnabled } });
  useLayoutEffect(() => {
    const node = stage.current!;
    const resize = () => { const r = node.getBoundingClientRect(); setSize({ width: r.width, height: r.height }); };
    resize(); const observer = new ResizeObserver(resize); observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    speakText(GUIDE, soundEnabled, { characterId: buddy, playIntroSFX: false });
    return () => {
      clearGameTimeouts();
      stopAllSpeech();
    };
  }, [buddy, soundEnabled, clearGameTimeouts]);
  useEffect(() => {
    let frame = 0, last = performance.now(), phase = 0;
    const step = (now: number) => {
      const dt = Math.min(.04, (now - last) / 1000); last = now;
      if (!document.hidden && !latest.current.paused && !latest.current.falling && !latest.current.completed && !reduced) phase += dt * (ageGroup === 'baby' ? 1.1 : 1.55);
      craneX.current = reduced ? 0 : Math.sin(phase) * amplitude;
      if (crane.current) crane.current.style.transform = `translateX(${craneX.current}px)`;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step); return () => cancelAnimationFrame(frame);
  }, [amplitude, ageGroup, reduced]);
  useEffect(() => subscribeWindGust(power => {
    if (paused || completed) return;
    setSway(power * 3); scheduleGameTimeout(() => setSway(0), 400);
  }), [paused, completed, scheduleGameTimeout]);
  const drop = useCallback(() => {
    if (lock.current || paused || document.hidden || completed) return;
    lock.current = true; help.reset();
    const previous = blocks.at(-1)?.offset ?? 0;
    const offset = Math.max(-32, Math.min(32, previous * .45 + craneX.current * .3));
    playBouncyBoing(soundEnabled);
    setFalling({ from: craneX.current, to: offset, y: floor - (blocks.length + 1) * blockHeight, palette: blocks.length % PALETTES.length });
  }, [paused, completed, blocks, soundEnabled, floor, blockHeight, help.reset]);
  const land = () => {
    if (!falling || !lock.current) return;
    if (paused || document.hidden) { pendingLanding.current = true; return; }
    pendingLanding.current = false;
    const next = [...blocks, { offset: falling.to, palette: falling.palette }];
    setBlocks(next); setFalling(null); lock.current = false;
    setSway(falling.to * .06); scheduleGameTimeout(() => setSway(0), 280);
    const rect = stage.current!.getBoundingClientRect();
    emitJuice({ kind: 'snap', x: rect.left + size.width / 2 + falling.to, y: rect.top + falling.y });
    if (next.length === target) {
      setCompleted(true); lock.current = true;
      playCorrectFanfare(soundEnabled); fireStarExplosion(); onCompleteQuiz(1);
      speakText('우와! 멋진 블록 집이 완성됐어! 고마워!', soundEnabled, { characterId: buddy, playIntroSFX: false });
    }
  };
  useEffect(() => {
    const resume = () => { if (!document.hidden && !paused && pendingLanding.current) land(); };
    resume(); document.addEventListener('visibilitychange', resume);
    return () => document.removeEventListener('visibilitychange', resume);
  }, [paused, falling, blocks]);
  const toy = (palette: number) => <><i/><ToyArtwork emoji={PALETTES[palette].emoji}/><i/></>;
  const style = (palette: number): CSSProperties => ({ '--block-light': PALETTES[palette].light, '--block-base': PALETTES[palette].base, '--block-edge': PALETTES[palette].edge, width: blockWidth, height: blockHeight } as CSSProperties);
  return <div ref={stage} className="block-tower-stage">
    <div className="block-meadow" aria-hidden="true"><span/><span/><span/></div>
    <PlayGuide buddy={buddy} soundEnabled={soundEnabled} title="차곡차곡 블록 탑" guide={GUIDE} happy={completed}/>
    <PlayProgress total={target} done={blocks.length} label="쌓은 블록"/>
    <button type="button" className="block-drop-surface" aria-label="화면을 눌러 블록 내려놓기" disabled={completed || paused || !!falling} onClick={drop}/>
    <div className="block-crane" ref={crane} style={{ top: craneY, marginLeft: -blockWidth / 2 }} aria-hidden="true">
      <span className="block-crane-cloud"/>
      {!falling && !completed && <div className="wooden-block" style={style(blocks.length % PALETTES.length)}>{toy(blocks.length % PALETTES.length)}</div>}
    </div>
    {falling && <motion.div className="wooden-block falling-block" aria-hidden="true" style={{ ...style(falling.palette), marginLeft: -blockWidth / 2 }}
      initial={{ x: falling.from, y: craneY }} animate={{ x: falling.to, y: falling.y }} transition={{ duration: reduced ? 0 : .38, ease: [.5, .05, .8, 1] }} onAnimationComplete={land}>{toy(falling.palette)}</motion.div>}
    <motion.div className="block-built-tower" aria-hidden="true" animate={{ rotate: reduced ? 0 : sway }} transition={JUICE_SPRING} style={{ bottom: 42, width: blockWidth }}>
      {blocks.map((block, i) => <motion.div key={i} className="wooden-block" style={{ ...style(block.palette), left: block.offset, bottom: i * blockHeight }}
        initial={reduced ? false : { scaleY: .8, scaleX: 1.08 }} animate={{ scaleY: 1, scaleX: 1 }} transition={JUICE_SPRING}>{toy(block.palette)}</motion.div>)}
      <div className="block-buddy" style={{ bottom: blocks.length * blockHeight - 2, left: blockWidth / 2 + (blocks.at(-1)?.offset || 0), width: buddySize, height: buddySize }}>
        {completed && <Crown className="block-crown" fill="currentColor"/>}<CharacterAvatar id={buddy} className="!w-full !h-full" mood={completed ? 'excited' : falling ? 'thinking' : 'happy'}/>
      </div>
    </motion.div>
    <div className="block-pedestal" style={{ width: Math.min(320, size.width - 40), top: floor }}/>
    {(help.isIdle || blocks.length === 0) && !falling && !completed && <motion.div className="block-tap-demo" aria-hidden="true"
      animate={reduced ? {} : { y: [0, 12, 0], scale: [1, .88, 1] }} transition={{ duration: 1.8, repeat: Infinity }}><Hand/></motion.div>}
    {completed && <RoundContinuation delayMs={1200} onNext={() => { setBlocks([]); setCompleted(false); lock.current = false; }}/>}
  </div>;
}
