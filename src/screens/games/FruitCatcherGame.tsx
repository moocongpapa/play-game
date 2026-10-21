import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Flame, Star, Feather, ArrowLeft, ArrowRight } from 'lucide-react';
import type { CharacterId, AgeGroup } from '../../types';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { PlayGuide, PlayProgress } from '../../components/ToddlerPlay';
import { PixiStageOverlay, type PixiStageHandle } from '../../components/PixiStageOverlay';
import {
  speakText,
  stopAllSpeech,
  playSparkleChime,
  playCorrectFanfare,
  playCelebrationFanfare,
  playComboChime,
  playWrongBoing,
  playCareSound,
  playJellyTap,
} from '../../utils/soundEngine';
import { fireConfetti, fireStarExplosion } from '../../utils/confetti';
import { emitJuice, recordPlaySuccess, resetCombo } from '../../utils/juice';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';

interface FruitCatcherGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup?: AgeGroup;
  childName?: string;
}

interface FallingItem {
  id: number;
  kind: 'fruit' | 'star' | 'feather' | 'ice' | 'stone';
  emoji: string;
  x: number; // percentage 5% to 95%
  y: number; // percentage 0% to 100%
  speed: number;
  size: number;
  points: number;
}

const FRUITS = [
  { emoji: '🍎', name: '사과' },
  { emoji: '🍓', name: '딸기' },
  { emoji: '🍌', name: '바나나' },
  { emoji: '🍇', name: '포도' },
  { emoji: '🍊', name: '오렌지' },
  { emoji: '🍉', name: '수박' },
];

const GUIDE = '하늘에서 과일이 슝슝 떨어져요! 바구니를 움직여 맛있게 받아보자!';

export const FruitCatcherGame: React.FC<FruitCatcherGameProps> = ({
  buddy,
  onCompleteQuiz,
  soundEnabled,
  ageGroup = 'sprout',
}) => {
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const pixiRef = useRef<PixiStageHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Age based configuration
  const targetCatches = ageGroup === 'baby' ? 10 : ageGroup === 'sprout' ? 14 : 18;
  const allowObstacles = ageGroup !== 'baby';
  const baseSpeed = ageGroup === 'baby' ? 0.35 : ageGroup === 'sprout' ? 0.52 : 0.68;

  const [basketX, setBasketX] = useState(50); // percentage 10% to 90%
  const [basketWidthScale, setBasketWidthScale] = useState(1); // 1 normal, 1.6 with feather
  const [hasMagnet, setHasMagnet] = useState(false);
  const [catches, setCatches] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isFever, setIsFever] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const basketXRef = useRef(basketX);
  basketXRef.current = basketX;
  const itemsRef = useRef<FallingItem[]>([]);
  const nextIdRef = useRef(1);
  const catchesRef = useRef(catches);
  catchesRef.current = catches;
  const isFrozenRef = useRef(isFrozen);
  isFrozenRef.current = isFrozen;
  const gameWonRef = useRef(gameWon);
  gameWonRef.current = gameWon;
  const comboRef = useRef(0);
  const isFeverRef = useRef(false);

  // Initial speech guide
  useEffect(() => {
    speakText(GUIDE, soundEnabled, { characterId: buddy });
    return () => {
      stopAllSpeech();
      clearGameTimeouts();
    };
  }, [buddy, soundEnabled, clearGameTimeouts]);

  // Touch / Pointer Tracking
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isFrozenRef.current || gameWonRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = ((e.clientX - rect.left) / rect.width) * 100;
    const clampedX = Math.max(12, Math.min(88, relativeX));
    setBasketX(clampedX);
  }, []);

  const moveBasket = (direction: 'left' | 'right') => {
    if (isFrozen || gameWon) return;
    setBasketX((prev) => {
      const delta = direction === 'left' ? -15 : 15;
      return Math.max(12, Math.min(88, prev + delta));
    });
    playJellyTap(soundEnabled);
  };

  // Main 60fps Game Loop
  useEffect(() => {
    let animId: number;
    let lastSpawn = performance.now();
    let lastFrame = lastSpawn;

    const loop = (now: number) => {
      if (gameWonRef.current) return;
      // Speeds are tuned per 60Hz frame; scale by elapsed time (clamped after tab stalls).
      const dt = Math.min(50, Math.max(0, now - lastFrame)) / (1000 / 60);
      lastFrame = now;

      // Spawn falling items
      const spawnInterval = isFever ? 450 : 750;
      if (now - lastSpawn > spawnInterval) {
        lastSpawn = now;
        const rand = Math.random();
        let kind: FallingItem['kind'] = 'fruit';
        let emoji = FRUITS[Math.floor(Math.random() * FRUITS.length)].emoji;
        let points = 10;

        if (rand < 0.1) {
          kind = 'star';
          emoji = '⭐';
          points = 25;
        } else if (rand < 0.16) {
          kind = 'feather';
          emoji = '🪶';
          points = 20;
        } else if (allowObstacles && rand < 0.3) {
          kind = ageGroup === 'bloom' && Math.random() < 0.5 ? 'stone' : 'ice';
          emoji = kind === 'ice' ? '🧊' : '🪨';
          points = 0;
        }

        itemsRef.current.push({
          id: nextIdRef.current++,
          kind,
          emoji,
          x: 10 + Math.random() * 80,
          y: 0,
          speed: baseSpeed * (0.8 + Math.random() * 0.4),
          size: 36,
          points,
        });
      }

      // Update positions and check collisions
      const currentBasketX = basketXRef.current;
      const effectiveBasketRadius = 14 * basketWidthScale;
      const basketY = 82; // percentage

      const remaining: FallingItem[] = [];

      for (const item of itemsRef.current) {
        item.y += item.speed * dt;

        // Magnet attraction
        if (hasMagnet && item.kind === 'fruit') {
          const dx = currentBasketX - item.x;
          item.x += dx * (1 - Math.pow(0.95, dt));
        }

        // Check collision with basket
        const isNearY = item.y >= basketY - 5 && item.y <= basketY + 8;
        const isNearX = Math.abs(item.x - currentBasketX) <= effectiveBasketRadius;

        if (isNearY && isNearX) {
          // Catch event!
          if (item.kind === 'fruit' || item.kind === 'star' || item.kind === 'feather') {
            const nextCatches = catchesRef.current + 1;
            setCatches(nextCatches);
            catchesRef.current = nextCatches;

            // Side effects stay outside the state updater so StrictMode cannot replay them.
            const nextC = comboRef.current + 1;
            comboRef.current = nextC;
            setCombo(nextC);
            playComboChime(nextC, soundEnabled);
            if (nextC >= 4 && !isFeverRef.current) {
              isFeverRef.current = true;
              setIsFever(true);
              speakText('우와! 콤보 피버! 황금 과일이 쏟아져요!', soundEnabled, { characterId: buddy, playIntroSFX: false });
              scheduleGameTimeout(() => { isFeverRef.current = false; setIsFever(false); }, 5000);
            }

            recordPlaySuccess();
            playCareSound('drink', soundEnabled);

            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const hitPxX = rect.left + (item.x / 100) * rect.width;
              const hitPxY = rect.top + (basketY / 100) * rect.height;
              emitJuice({ kind: 'pop', x: hitPxX, y: hitPxY });
              pixiRef.current?.emitBurst({
                x: hitPxX,
                y: hitPxY,
                color: item.kind === 'star' ? 0xfacc15 : 0xf43f5e,
                count: 14,
                kind: 'star',
              });
            }

            if (item.kind === 'star') {
              setHasMagnet(true);
              playSparkleChime(soundEnabled);
              scheduleGameTimeout(() => setHasMagnet(false), 5000);
            } else if (item.kind === 'feather') {
              setBasketWidthScale(1.5);
              playSparkleChime(soundEnabled);
              scheduleGameTimeout(() => setBasketWidthScale(1), 6000);
            }

            // Check victory condition
            if (nextCatches >= targetCatches && !gameWonRef.current) {
              setGameWon(true);
              gameWonRef.current = true;
              playCelebrationFanfare(soundEnabled);
              playCorrectFanfare(soundEnabled);
              fireConfetti();
              speakText('우와! 바구니 가득 맛있는 과일을 모두 모았어요!', soundEnabled, { characterId: buddy, playIntroSFX: false });
              scheduleGameTimeout(() => {
                onCompleteQuiz(3);
              }, 2600);
            }
          } else {
            // Obstacle hit (ice / stone)
            resetCombo();
            comboRef.current = 0;
            isFeverRef.current = false;
            setCombo(0);
            setIsFever(false);
            playWrongBoing(soundEnabled);
            speakText('조심해! 차가운 얼음은 피해야 해!', soundEnabled, { characterId: buddy, playIntroSFX: false });
            setIsFrozen(true);
            scheduleGameTimeout(() => setIsFrozen(false), 900);
          }
        } else if (item.y < 98) {
          remaining.push(item);
        }
      }

      itemsRef.current = remaining;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [
    baseSpeed,
    allowObstacles,
    ageGroup,
    isFever,
    hasMagnet,
    basketWidthScale,
    soundEnabled,
    targetCatches,
    scheduleGameTimeout,
    onCompleteQuiz,
  ]);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className={`fruit-catcher-stage relative flex flex-col justify-between w-full h-full select-none overflow-hidden touch-none ${
        isFever ? 'ring-4 ring-amber-400 ring-inset animate-pulse' : ''
      }`}
      style={{
        background: isFever
          ? 'linear-gradient(to bottom, #fde047 0%, #fb923c 50%, #f43f5e 100%)'
          : 'linear-gradient(to bottom, #38bdf8 0%, #bae6fd 60%, #86efac 100%)',
      }}
    >
      <PixiStageOverlay ref={pixiRef} ambientKind="picnic" />

      {/* Top Header */}
      <header className="relative z-10 flex flex-wrap items-center justify-between p-3 gap-2">
        <PlayGuide
          buddy={buddy}
          soundEnabled={soundEnabled}
          title="바구니 과일 캐치"
          guide={GUIDE}
          happy={gameWon || isFever}
        />
        <div className="flex items-center gap-2">
          {combo >= 2 && (
            <div className="flex items-center gap-1 px-3 py-1 bg-amber-400/90 text-slate-900 font-black rounded-full text-xs shadow-md animate-bounce">
              <Flame className="w-4 h-4 fill-current text-rose-600" />
              <span>{combo} COMBO!</span>
            </div>
          )}
          <PlayProgress total={targetCatches} done={catches} label="받은 과일" />
        </div>
      </header>

      {/* Active Powerup Indicators */}
      <div className="relative z-10 flex items-center justify-center gap-2 px-4">
        {hasMagnet && (
          <div className="flex items-center gap-1 px-3 py-1 bg-amber-400 text-slate-900 font-extrabold rounded-full text-xs shadow-lg animate-pulse">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>별빛 자석 파워!</span>
          </div>
        )}
        {basketWidthScale > 1 && (
          <div className="flex items-center gap-1 px-3 py-1 bg-pink-500 text-white font-extrabold rounded-full text-xs shadow-lg animate-pulse">
            <Feather className="w-3.5 h-3.5" />
            <span>거대 무지개 바구니!</span>
          </div>
        )}
      </div>

      {/* Falling Items Rendering Layer */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {itemsRef.current.map((item) => (
          <div
            key={item.id}
            className="absolute transition-transform flex items-center justify-center"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: `${item.size}px`,
            }}
          >
            <span className="drop-shadow-md">{item.emoji}</span>
          </div>
        ))}
      </div>

      {/* Basket & Player Layer */}
      <div
        className="absolute z-20 pointer-events-none transition-all duration-75"
        style={{
          left: `${basketX}%`,
          top: '80%',
          transform: `translate(-50%, -50%) scale(${basketWidthScale})`,
        }}
      >
        <div className="relative flex flex-col items-center">
          {/* Character Peeking behind basket */}
          <div className="relative -mb-3 z-0">
            <CharacterAvatar id={buddy} mood={isFrozen ? 'thinking' : 'happy'} size="md" />
          </div>

          {/* Picnic Basket */}
          <div
            className={`relative flex items-center justify-center px-4 py-2 bg-amber-700 border-4 border-amber-900 rounded-2xl shadow-xl ${
              isFrozen ? 'opacity-80 ring-4 ring-sky-300' : ''
            }`}
            style={{ width: `${100 * basketWidthScale}px`, height: '56px' }}
          >
            <span className="text-3xl filter drop-shadow">🧺</span>
            {catches > 0 && (
              <span className="absolute -top-3 -right-2 px-2 py-0.5 bg-rose-500 text-white text-xs font-black rounded-full border border-white shadow">
                {catches}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Accessible Left / Right Stepper Buttons for Toddlers */}
      <footer className="relative z-20 flex items-center justify-between p-3 pointer-events-auto">
        <button
          type="button"
          onClick={() => moveBasket('left')}
          className="flex items-center justify-center w-14 h-14 bg-white/80 active:bg-white text-sky-700 rounded-full shadow-lg border-2 border-sky-400 active:scale-95 transition-transform"
          aria-label="왼쪽으로 이동"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>

        <div className="text-center bg-black/30 backdrop-blur-xs px-4 py-1.5 rounded-full text-white/90 text-xs font-bold">
          화면을 터치해서 바구니를 움직여요!
        </div>

        <button
          type="button"
          onClick={() => moveBasket('right')}
          className="flex items-center justify-center w-14 h-14 bg-white/80 active:bg-white text-sky-700 rounded-full shadow-lg border-2 border-sky-400 active:scale-95 transition-transform"
          aria-label="오른쪽으로 이동"
        >
          <ArrowRight className="w-8 h-8" />
        </button>
      </footer>
    </div>
  );
};
