import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { Flame, Star, Feather, ArrowLeft, ArrowRight, Hand } from 'lucide-react';
import type { CharacterId, AgeGroup } from '../../types';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { PlayGuide, PlayProgress } from '../../components/ToddlerPlay';
import { ToyArtwork } from '../../components/ToyArtwork';
import { RoundContinuation } from '../../components/RoundContinuation';
import { PixiStageOverlay, type PixiStageHandle } from '../../components/PixiStageOverlay';
import {
  speakText, stopAllSpeech, playSparkleChime, playCorrectFanfare,
  playComboChime, playWrongBoing, playCareSound, playJellyTap,
} from '../../utils/soundEngine';
import { fireConfetti, fireStarExplosion } from '../../utils/confetti';
import { emitJuice, recordPlaySuccess, resetCombo } from '../../utils/juice';
import { createGameFrameClock, fallingItemPosition, isFallingItemCaught } from '../../utils/gameFrameClock';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import { useGameActivity } from '../../hooks/useGameActivity';
import './FruitCatcherGame.css';

interface FruitCatcherGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup?: AgeGroup;
  childName?: string;
}

interface FallingItem {
  id: number;
  kind: 'fruit' | 'star' | 'feather' | 'giant_rainbow' | 'ice' | 'stone';
  emoji: string;
  x: number;
  y: number;
  speed: number;
  size: number;
}

const FRUITS = ['🍎', '🍓', '🍌', '🍇', '🍊', '🍉'];
const GUIDE = '하늘에서 과일이 슝슝 떨어져요! 바구니를 움직여 맛있게 받아보자!';
const BASKET_Y = 82;

export const FruitCatcherGame: React.FC<FruitCatcherGameProps> = ({
  buddy, onCompleteQuiz, soundEnabled, ageGroup = 'sprout',
}) => {
  const { scheduleGameTimeout, cancelGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const { paused, isBlocked } = useGameActivity();
  const pixiRef = useRef<PixiStageHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemNodes = useRef(new Map<number, HTMLDivElement>());
  const clockRef = useRef(createGameFrameClock());
  const latest = useRef({ buddy, soundEnabled, onCompleteQuiz });
  latest.current = { buddy, soundEnabled, onCompleteQuiz };

  const targetCatches = ageGroup === 'baby' ? 10 : ageGroup === 'sprout' ? 14 : 18;
  const allowObstacles = ageGroup !== 'baby';
  const baseSpeed = ageGroup === 'baby' ? 0.35 : ageGroup === 'sprout' ? 0.52 : 0.68;
  const [basketX, setBasketX] = useState(50);
  const [basketWidthScale, setBasketWidthScale] = useState(1);
  const [hasMagnet, setHasMagnet] = useState(false);
  const [catches, setCatches] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isFever, setIsFever] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  // React owns membership and feedback. The frame loop paints positions directly.
  const [items, setItems] = useState<FallingItem[]>([]);
  const itemsRef = useRef<FallingItem[]>([]);
  const nextIdRef = useRef(1);
  const playRef = useRef({ basketX: 50, widthScale: 1, magnet: false, catches: 0, combo: 0, fever: false, frozen: false, won: false });
  const hitStopUntilRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const powerTimers = useRef<{ fever: number | null; magnet: number | null; width: number | null; frozen: number | null }>({ fever: null, magnet: null, width: null, frozen: null });

  useLayoutEffect(() => { clockRef.current.resetFrame(); }, [paused]);
  useEffect(() => {
    if (!isBlocked()) speakText(GUIDE, latest.current.soundEnabled, { characterId: buddy });
    return () => stopAllSpeech();
  }, [buddy, isBlocked]);

  const moveBasketTo = useCallback((x: number) => {
    if (isBlocked() || playRef.current.frozen || playRef.current.won) return;
    const next = Math.max(12, Math.min(88, x));
    playRef.current.basketX = next;
    setBasketX(next);
  }, [isBlocked]);
  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || (event.type === 'pointermove' && event.pointerType === 'mouse' && event.buttons === 0)) return;
    if ((event.target as HTMLElement).closest('button')) return;
    const rect = containerRef.current.getBoundingClientRect();
    moveBasketTo((event.clientX - rect.left) / rect.width * 100);
  }, [moveBasketTo]);
  const moveBasket = (direction: 'left' | 'right') => {
    if (isBlocked() || playRef.current.frozen || playRef.current.won) return;
    moveBasketTo(playRef.current.basketX + (direction === 'left' ? -15 : 15));
    playJellyTap(latest.current.soundEnabled);
  };

  const paintItem = useCallback((node: HTMLDivElement, item: FallingItem) => {
    const container = containerRef.current;
    if (!container) return;
    const point = fallingItemPosition(item.x, item.y, container.clientWidth, container.clientHeight);
    node.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
  }, []);

  const startNextRound = useCallback(() => {
    clearGameTimeouts();
    powerTimers.current = { fever: null, magnet: null, width: null, frozen: null };
    playRef.current = { basketX: 50, widthScale: 1, magnet: false, catches: 0, combo: 0, fever: false, frozen: false, won: false };
    itemsRef.current = [];
    setItems([]); setBasketX(50); setBasketWidthScale(1); setHasMagnet(false);
    setCatches(0); setCombo(0); setIsFever(false); setIsFrozen(false); setGameWon(false);
    hitStopUntilRef.current = 0;
    lastSpawnRef.current = clockRef.current.step(performance.now(), true).elapsedMs - 500;
    clockRef.current.resetFrame();
  }, [clearGameTimeouts]);

  useEffect(() => {
    let animId = 0;
    clockRef.current.resetFrame();
    const loop = (now: number) => {
      const { frames: dt, elapsedMs } = clockRef.current.step(now, isBlocked());
      const play = playRef.current;
      if (dt === 0 || play.won || elapsedMs < hitStopUntilRef.current) {
        animId = requestAnimationFrame(loop);
        return;
      }
      const { buddy, soundEnabled, onCompleteQuiz } = latest.current;
      const nextItems: FallingItem[] = [];
      let membershipChanged = false;
      const spawnInterval = play.fever ? 450 : 750;
      if (elapsedMs - lastSpawnRef.current > spawnInterval) {
        lastSpawnRef.current = elapsedMs;
        const id = nextIdRef.current++;
        const rand = Math.random();
        let kind: FallingItem['kind'] = 'fruit';
        let emoji = FRUITS[Math.floor(Math.random() * FRUITS.length)];
        let size = 48;
        if (id % 6 === 0) { kind = 'giant_rainbow'; emoji = '🌈'; size = 64; }
        else if (rand < .1) { kind = 'star'; emoji = '⭐'; }
        else if (rand < .16) { kind = 'feather'; emoji = '🪶'; }
        else if (allowObstacles && rand < .3) {
          kind = ageGroup === 'bloom' && Math.random() < .5 ? 'stone' : 'ice';
          emoji = kind === 'ice' ? '🧊' : '🪨';
        }
        nextItems.push({ id, kind, emoji, x: 10 + Math.random() * 80, y: 0,
          speed: baseSpeed * (kind === 'giant_rainbow' ? .92 : .8 + Math.random() * .4), size });
        membershipChanged = true;
      }

      for (const item of itemsRef.current) {
        item.y += item.speed * dt;
        if (play.magnet && (item.kind === 'fruit' || item.kind === 'giant_rainbow')) {
          item.x += (play.basketX - item.x) * (1 - Math.pow(.95, dt));
        }
        const caught = isFallingItemCaught(item, { x: play.basketX, y: BASKET_Y, width: 100 * play.widthScale },
          { width: containerRef.current?.clientWidth || 360, height: containerRef.current?.clientHeight || 640 });
        if (!caught) {
          if (item.y < 102) nextItems.push(item);
          else membershipChanged = true;
          continue;
        }
        membershipChanged = true;
        if (item.kind === 'ice' || item.kind === 'stone') {
          resetCombo(); play.combo = 0; play.fever = false; play.frozen = true;
          setCombo(0); setIsFever(false); setIsFrozen(true);
          playWrongBoing(soundEnabled);
          speakText('조심해! 차가운 얼음은 피해야 해!', soundEnabled, { characterId: buddy, playIntroSFX: false });
          cancelGameTimeout(powerTimers.current.frozen);
          powerTimers.current.frozen = scheduleGameTimeout(() => { playRef.current.frozen = false; setIsFrozen(false); }, 900);
          continue;
        }

        play.catches = Math.min(targetCatches, play.catches + (item.kind === 'giant_rainbow' ? 2 : 1));
        play.combo++;
        setCatches(play.catches); setCombo(play.combo);
        playComboChime(play.combo, soundEnabled); recordPlaySuccess(); playCareSound('drink', soundEnabled);
        if (play.combo >= 4 && !play.fever) {
          play.fever = true; setIsFever(true);
          speakText('우와! 콤보 피버! 황금 과일이 쏟아져요!', soundEnabled, { characterId: buddy, playIntroSFX: false });
          [20, 40, 60, 80].forEach((x, index) => nextItems.push({ id: nextIdRef.current++,
            kind: index === 1 ? 'star' : 'fruit', emoji: index === 1 ? '⭐' : FRUITS[index % FRUITS.length],
            x, y: -index * 6, speed: baseSpeed * .95, size: 48 }));
          cancelGameTimeout(powerTimers.current.fever);
          powerTimers.current.fever = scheduleGameTimeout(() => { playRef.current.fever = false; setIsFever(false); }, 5000);
        }
        const climax = item.kind === 'giant_rainbow' || item.kind === 'star' || play.catches >= targetCatches;
        if (climax) hitStopUntilRef.current = elapsedMs + 55;
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const point = fallingItemPosition(item.x, BASKET_Y, rect.width, rect.height);
          emitJuice({ kind: climax ? 'success' : 'pop', x: rect.left + point.x, y: rect.top + point.y, climax });
          pixiRef.current?.emitBurst({ x: point.x, y: point.y, color: item.kind === 'star' || item.kind === 'giant_rainbow' ? 0xfacc15 : 0xf43f5e,
            count: item.kind === 'giant_rainbow' ? 24 : 14, kind: 'star' });
        }
        if (item.kind === 'giant_rainbow') { playSparkleChime(soundEnabled); fireStarExplosion(); }
        else if (item.kind === 'star') {
          play.magnet = true; setHasMagnet(true); playSparkleChime(soundEnabled);
          cancelGameTimeout(powerTimers.current.magnet);
          powerTimers.current.magnet = scheduleGameTimeout(() => { playRef.current.magnet = false; setHasMagnet(false); }, 5000);
        } else if (item.kind === 'feather') {
          play.widthScale = 1.5; setBasketWidthScale(1.5); playSparkleChime(soundEnabled);
          cancelGameTimeout(powerTimers.current.width);
          powerTimers.current.width = scheduleGameTimeout(() => { playRef.current.widthScale = 1; setBasketWidthScale(1); }, 6000);
        }
        if (play.catches >= targetCatches) {
          play.won = true; setGameWon(true);
          playCorrectFanfare(soundEnabled); fireConfetti();
          speakText('우와! 바구니 가득 맛있는 과일을 모두 모았어요!', soundEnabled, { characterId: buddy, playIntroSFX: false });
          onCompleteQuiz(3);
          nextItems.length = 0;
          break;
        }
      }
      itemsRef.current = nextItems;
      if (membershipChanged) setItems([...nextItems]);
      for (const item of nextItems) {
        const node = itemNodes.current.get(item.id);
        if (node) paintItem(node, item);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [baseSpeed, allowObstacles, ageGroup, targetCatches, scheduleGameTimeout, cancelGameTimeout, isBlocked, paintItem]);

  return (
    <div ref={containerRef} onPointerDown={handlePointerMove} onPointerMove={handlePointerMove} data-paused={paused || undefined}
      className={`fruit-catcher-stage relative flex flex-col justify-between w-full h-full select-none overflow-hidden touch-none ${isFever ? 'ring-4 ring-amber-400 ring-inset' : ''}`}
      style={{ background: isFever ? 'linear-gradient(to bottom, #fce8ad 0%, #f8d7c1 55%, #d8e8b9 100%)' : 'linear-gradient(to bottom, #9ed4e5 0%, #e5f3ef 60%, #c6dfae 100%)' }}>
      <PixiStageOverlay ref={pixiRef} ambientKind="picnic" />
      <header className="relative z-20 flex flex-wrap items-center justify-between p-3 gap-2">
        <PlayGuide buddy={buddy} soundEnabled={soundEnabled && !paused} title="바구니 과일 캐치" guide={GUIDE} happy={gameWon || isFever} />
        <div className="flex items-center gap-2">
          {combo >= 2 && <div className="flex items-center gap-1 px-3 py-2 bg-amber-100/90 text-amber-700 rounded-full" aria-label={`${combo}개 연속 받기`}><Flame className="w-6 h-6" /></div>}
          <PlayProgress total={targetCatches} done={catches} label="받은 과일" />
        </div>
      </header>
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex gap-2 pointer-events-none">
        {hasMagnet && <div className="p-2 bg-amber-100 text-amber-600 rounded-full shadow-sm" role="img" aria-label="별빛 자석 파워"><Star className="w-7 h-7 fill-current" /></div>}
        {basketWidthScale > 1 && <div className="p-2 bg-pink-100 text-pink-600 rounded-full shadow-sm" role="img" aria-label="커진 바구니"><Feather className="w-7 h-7" /></div>}
      </div>
      <div className="absolute inset-0 pointer-events-none z-10" aria-hidden="true">
        {items.map(item => <div key={item.id} ref={node => {
          if (node) { itemNodes.current.set(item.id, node); paintItem(node, item); }
          else itemNodes.current.delete(item.id);
        }} className="absolute left-0 top-0 flex items-center justify-center will-change-transform" data-falling-item={item.id}
          style={{ width: item.size, height: item.size }}><ToyArtwork emoji={item.emoji} className="w-full h-full drop-shadow-md" /></div>)}
      </div>
      <div className="absolute z-20 pointer-events-none" style={{ left: `${basketX}%`, top: `${BASKET_Y}%`, transform: 'translate(-50%, -50%)' }}>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2"><CharacterAvatar id={buddy} mood={isFrozen ? 'thinking' : gameWon ? 'excited' : 'happy'} size="md" /></div>
        <div className={`fruit-catcher-basket relative flex items-center justify-center h-16 rounded-3xl border-4 border-amber-800/70 shadow-lg bg-amber-300 ${isFrozen ? 'ring-4 ring-sky-200' : ''}`}
          style={{ width: 100 * basketWidthScale }} aria-label={`바구니 ${catches}개`}>
          <ToyArtwork emoji="🧺" className="w-16 h-16" />
          {catches > 0 && <span className="absolute -top-3 -right-2 px-2 py-0.5 bg-rose-300 text-rose-900 text-xs font-black rounded-full border-2 border-white shadow-sm">{catches}</span>}
        </div>
      </div>
      <footer className="relative z-20 flex items-center justify-between p-3 pointer-events-auto">
        <button type="button" onClick={() => moveBasket('left')} disabled={paused || isFrozen || gameWon}
          className="flex items-center justify-center w-16 h-16 bg-white/90 text-sky-700 rounded-full shadow-lg border-2 border-sky-300 active:scale-95" aria-label="왼쪽으로 이동"><ArrowLeft className="w-8 h-8" /></button>
        <Hand className="w-9 h-9 text-sky-700/60" aria-hidden="true" />
        <button type="button" onClick={() => moveBasket('right')} disabled={paused || isFrozen || gameWon}
          className="flex items-center justify-center w-16 h-16 bg-white/90 text-sky-700 rounded-full shadow-lg border-2 border-sky-300 active:scale-95" aria-label="오른쪽으로 이동"><ArrowRight className="w-8 h-8" /></button>
      </footer>
      {gameWon && <RoundContinuation delayMs={1200} onNext={startNextRound} />}
    </div>
  );
};
