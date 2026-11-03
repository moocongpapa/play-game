import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Paintbrush, Wind, Sparkles } from 'lucide-react';
import type { CharacterId, AgeGroup } from '../../types';
import { PlayGuide, PlayProgress } from '../../components/ToddlerPlay';
import { PixiStageOverlay, type PixiStageHandle } from '../../components/PixiStageOverlay';
import {
  speakText,
  isSpeechBusy,
  stopAllSpeech,
  playSparkleChime,
  playCorrectFanfare,
  playCelebrationFanfare,
  playBouncyBoing,
  playJellyTap,
  playStarGain,
  playRisingStepChime,
  playCareSound,
} from '../../utils/soundEngine';
import { fireConfetti, fireStarExplosion } from '../../utils/confetti';
import { emitJuice } from '../../utils/juice';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import { useGameActivity } from '../../hooks/useGameActivity';
import { RoundContinuation } from '../../components/RoundContinuation';
import './CreativePlay.css';
import { usePlayMemory } from '../../components/PlayMemoryContext';

interface CakeDecoGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup?: AgeGroup;
  childName?: string;
}

interface CakeRound {
  id: 'strawberry' | 'donut' | 'royal';
  title: string;
  badge: string;
  emoji: string;
  guideText: string;
  candleVoice: string;
  finishedVoice: string;
}

const CAKE_ROUNDS: CakeRound[] = [
  {
    id: 'strawberry',
    title: '달콤 딸기 2단 케이크',
    badge: '🎂 딸기 케이크 꾸미기',
    emoji: '🎂',
    guideText: '예쁜 크림 색깔을 골라 케이크에 쓱쓱 칠하고 달콤한 과일 토핑을 올려 볼까?',
    candleVoice: '우와! 맛있는 케이크 완성! 이제 촛불을 눌러 후~ 불어 꺼 봐!',
    finishedVoice: '후~! 생일 축하합니다! 달콤한 딸기 케이크 냠냠 정말 맛있다!',
  },
  {
    id: 'donut',
    title: '무지개 스프링클 도넛',
    badge: '🍩 무지개 도넛 색칠',
    emoji: '🍩',
    guideText: '이번엔 동그란 도넛에 알록달록 초코 시럽을 칠하고 토핑을 콕콕 올려 봐!',
    candleVoice: '달콤한 도넛이 완성됐어! 반짝이는 촛불을 후~ 불어 꺼 볼까?',
    finishedVoice: '와아! 쫀득쫀득 무지개 도넛 최고야! 고마워!',
  },
  {
    id: 'royal',
    title: '왕관 파티 생일 케이크',
    badge: '👑 왕관 파티 케이크',
    emoji: '👑',
    guideText: '마지막은 특별한 파티 케이크야! 내 맘대로 크림을 칠하고 왕관 토핑으로 꾸며 봐!',
    candleVoice: '멋진 파티 케이크 완성! 다 같이 촛불을 후~ 불어 꺼 보자!',
    finishedVoice: '대단해! 세상에서 제일 멋진 파티 케이크 요리사야!',
  },
];

const CREAM_COLORS = [
  { id: 'pink', label: '딸기크림', hex: '#F472B6', shade: '#FBCFE8', num: 0xF472B6 },
  { id: 'choco', label: '초코크림', hex: '#92400E', shade: '#D97706', num: 0xD97706 },
  { id: 'lemon', label: '레몬버터', hex: '#FACC15', shade: '#FEF08A', num: 0xFACC15 },
  { id: 'mint', label: '민트소다', hex: '#38BDF8', shade: '#BAE6FD', num: 0x38BDF8 },
  { id: 'grape', label: '포도크림', hex: '#A855F7', shade: '#E9D5FF', num: 0xA855F7 },
];

const TOPPING_ITEMS = ['🍓', '🍒', '🍫', '🍬', '👑'];

interface PlacedTopping {
  id: number;
  emoji: string;
  x: number;
  y: number;
}

const TOPPING_SPOTS = [
  { x: 112, y: 112 },
  { x: 160, y: 106 },
  { x: 208, y: 112 },
  { x: 96, y: 168 },
  { x: 160, y: 166 },
  { x: 224, y: 168 },
];

export const CakeDecoGame: React.FC<CakeDecoGameProps> = ({
  buddy,
  onCompleteQuiz,
  soundEnabled,
}) => {
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const { paused, isBlocked } = useGameActivity();
  const latest = useRef({ soundEnabled, onCompleteQuiz });
  latest.current = { soundEnabled, onCompleteQuiz };
  const [completed, setCompleted] = useState(false);
  const { rememberColor, saveCake } = usePlayMemory();
  const pixiRef = useRef<PixiStageHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const roundDoneRef = useRef(false);

  const [round, setRound] = useState(0);
  const totalRounds = 3;
  const currentCake = CAKE_ROUNDS[round] || CAKE_ROUNDS[0];

  const [selectedColor, setSelectedColor] = useState(CREAM_COLORS[0]);
  const [toolMode, setToolMode] = useState<'cream' | 'topping'>('cream');
  type Layers = [string | null, string | null, string | null];
  const layersRef = useRef<Layers>([null, null, null]);
  const toppingsRef = useRef<PlacedTopping[]>([]);
  const candlesReadyRef = useRef(false);
  const [layerColors, setLayerColors] = useState<[string | null, string | null, string | null]>([
    null,
    null,
    null,
  ]);
  const [toppings, setToppings] = useState<PlacedTopping[]>([]);
  const [candlesLit, setCandlesLit] = useState(false);
  const [candlesBlown, setCandlesBlown] = useState(false);

  const setupRound = useCallback((roundIdx: number) => {
    roundDoneRef.current = false;
    setCompleted(false);
    layersRef.current = [null, null, null];
    toppingsRef.current = [];
    candlesReadyRef.current = false;
    setToolMode('cream');
    setLayerColors([null, null, null]);
    setToppings([]);
    setCandlesLit(false);
    setCandlesBlown(false);
    setSelectedColor(CREAM_COLORS[roundIdx % CREAM_COLORS.length]);

  }, []);

  useEffect(() => {
    setupRound(round);
  }, [round, setupRound]);

  useEffect(() => {
    const cake = CAKE_ROUNDS[round] || CAKE_ROUNDS[0];
    if (!isBlocked() && !isSpeechBusy()) speakText(cake.guideText, soundEnabled, { characterId: buddy });
  }, [round, soundEnabled, buddy, isBlocked]);

  useEffect(() => {
    return () => {
      clearGameTimeouts();
      stopAllSpeech();
    };
  }, [clearGameTimeouts]);

  const checkReadyForCandles = useCallback((nextLayers: Layers, nextToppings: PlacedTopping[]) => {
    const painted = nextLayers.filter(Boolean).length;
    if (painted === 3 && nextToppings.length < 2) setToolMode('topping');
    if (painted === 3 && nextToppings.length >= 2 && !candlesReadyRef.current && !roundDoneRef.current) {
      candlesReadyRef.current = true;
      setCandlesLit(true);
      playSparkleChime(soundEnabled);
      speakText('촛불을 후~ 불어 볼까?', soundEnabled, { characterId: buddy, englishText: 'Blow out the candles!' });
    }
  }, [buddy, soundEnabled]);

  const handlePaintLayer = useCallback((layerIdx: 0 | 1 | 2, e?: React.MouseEvent<SVGElement | HTMLElement>, color = selectedColor) => {
    e?.stopPropagation();
    if (isBlocked() || roundDoneRef.current) return;
    const next = [...layersRef.current] as Layers;
    next[layerIdx] = color.hex;
    layersRef.current = next;
    setLayerColors(next);
    rememberColor({ hex: color.hex, label: color.label });
    playJellyTap(soundEnabled);
    playRisingStepChime(next.filter(Boolean).length + toppingsRef.current.length, 5, soundEnabled);
    if (e) {
      emitJuice({ kind: 'pop', x: e.clientX, y: e.clientY });
      const rect = stageRef.current?.getBoundingClientRect();
      if (rect) pixiRef.current?.emitBurst({ x: e.clientX - rect.left, y: e.clientY - rect.top, color: color.num, count: 14, kind: 'star' });
    }
    checkReadyForCandles(next, toppingsRef.current);
  }, [checkReadyForCandles, isBlocked, rememberColor, selectedColor, soundEnabled]);

  const handleAddTopping = useCallback((emoji: string, e?: React.MouseEvent<HTMLElement | SVGElement>) => {
    e?.stopPropagation();
    if (isBlocked() || roundDoneRef.current) return;
    playBouncyBoing(soundEnabled);
    if (e) emitJuice({ kind: 'pop', x: e.clientX, y: e.clientY });
    // A topping also helps with an unfinished cream layer; any first action works.
    const empty = layersRef.current.findIndex(color => color === null);
    if (empty !== -1) {
      const nextLayers = [...layersRef.current] as Layers;
      nextLayers[empty] = selectedColor.hex;
      layersRef.current = nextLayers;
      setLayerColors(nextLayers);
      rememberColor({ hex: selectedColor.hex, label: selectedColor.label });
    }
    const spot = TOPPING_SPOTS[toppingsRef.current.length % TOPPING_SPOTS.length];
    const next = [...toppingsRef.current.slice(-5), { id: Date.now() + Math.random(), emoji, x: spot.x, y: spot.y }];
    toppingsRef.current = next;
    setToppings(next);
    checkReadyForCandles(layersRef.current, next);
  }, [checkReadyForCandles, isBlocked, rememberColor, selectedColor, soundEnabled]);

  const handleBlowCandles = useCallback((e?: React.MouseEvent<HTMLElement | SVGElement>) => {
    e?.stopPropagation();
    if (isBlocked() || roundDoneRef.current) return;
    if (!candlesReadyRef.current) {
      const empty = layersRef.current.findIndex(color => color === null);
      if (empty !== -1) handlePaintLayer(empty as 0 | 1 | 2, e);
      else handleAddTopping(TOPPING_ITEMS[toppingsRef.current.length % TOPPING_ITEMS.length], e);
      return;
    }
    roundDoneRef.current = true;
    setCandlesBlown(true);
    const colors = layersRef.current.filter((color): color is string => !!color);
    saveCake({ title: currentCake.title, colors, toppings: toppingsRef.current.map(t => t.emoji) });
    playCorrectFanfare(soundEnabled);
    playCareSound('chew', soundEnabled);
    const cream = CREAM_COLORS.find(c => c.hex === colors[0])?.label ?? '무지개 크림';
    speakText(`${cream} ${currentCake.id === 'donut' ? '도넛' : '케이크'}네! 냠냠!`, soundEnabled, { characterId: buddy, englishText: currentCake.id === 'donut' ? 'Your colorful donut! Yum yum!' : 'Your colorful cake! Yum yum!' });
    fireStarExplosion();
    const rect = stageRef.current?.getBoundingClientRect();
    if (rect) pixiRef.current?.emitBurst({ x: rect.width / 2, y: rect.height / 2, color: 0xF472B6, count: 32, kind: 'star' });
    scheduleGameTimeout(() => {
      if (round + 1 < totalRounds) {
        playStarGain(latest.current.soundEnabled);
        setRound(r => r + 1);
      } else {
        playCelebrationFanfare(latest.current.soundEnabled);
        fireConfetti();
        setCompleted(true);
        latest.current.onCompleteQuiz(3);
      }
    }, 700);
  }, [buddy, currentCake, handleAddTopping, handlePaintLayer, isBlocked, round, saveCake, scheduleGameTimeout, soundEnabled]);


  return (
    <div
      ref={stageRef}
      data-paused={paused}
      className="cake-deco-stage creative-play relative flex flex-col justify-between w-full h-[var(--game-play-height,calc(100dvh-84px))] min-h-[var(--game-play-height,calc(100dvh-84px))] rounded-3xl overflow-hidden select-none bg-gradient-to-b from-[#FDF2F8] via-[#FCE7F3] to-[#FEF3C7] border-3 border-[#F472B6] p-3 sm:p-5"
    >
      <PixiStageOverlay ref={pixiRef} className="z-20 pointer-events-none" />

      <div className="creative-play-header">
        <PlayGuide buddy={buddy} title="케이크 꾸미기" guide={currentCake.guideText} soundEnabled={soundEnabled} happy={candlesBlown} />
        <div className="creative-pictorial-guide" aria-hidden="true">
          <Paintbrush />
          <span>{currentCake.emoji}</span>
        </div>
        <PlayProgress total={totalRounds} done={completed ? totalRounds : round} label={`${round + 1}/${totalRounds}`} />
      </div>

      {/* Center Interactive Cake / Donut SVG Stage */}
      <div className="creative-play-body">
        <motion.div
          animate={candlesBlown ? { scale: [1, 1.08, 1], y: [0, -10, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="creative-play-art"
          role="button"
          tabIndex={0}
          aria-label={candlesLit ? '촛불 불어 끄기' : '케이크 꾸미기'}
          onClick={handleBlowCandles}
          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleBlowCandles(); } }}
        >
          <svg viewBox="0 0 320 260" className="w-full h-full overflow-visible drop-shadow-xl">
            {/* Fancy Cake Stand Plate */}
            <ellipse cx="160" cy="226" rx="124" ry="20" fill="#FBCFE8" stroke="#DB2777" strokeWidth="4" />
            <ellipse cx="160" cy="222" rx="106" ry="13" fill="#FFFFFF" />

            {currentCake.id === 'donut' ? (
              /* Round 2: Giant Fluffy Donut with 3 Glaze Ring Zones */
              <g>
                {/* Outer Dough Base (Layer 0) */}
                <circle
                  cx="160"
                  cy="148"
                  r="76"
                  fill={layerColors[0] || '#FDE68A'}
                  stroke="#B45309"
                  strokeWidth="5"
                  className="cursor-pointer"
                  onClick={(e) => candlesLit ? handleBlowCandles(e) : handlePaintLayer(0, e)}
                />
                {/* Scalloped Middle Icing Glaze (Layer 1) */}
                <path
                  d="M96,132 C96,92 224,92 224,132 C230,158 212,198 160,198 C108,198 90,158 96,132 Z"
                  fill={layerColors[1] || '#FFFBEB'}
                  stroke="#DB2777"
                  strokeWidth="4.5"
                  className="cursor-pointer"
                  onClick={(e) => candlesLit ? handleBlowCandles(e) : handlePaintLayer(1, e)}
                />
                {/* Top Cream Swirl Ring (Layer 2) */}
                <circle
                  cx="160"
                  cy="148"
                  r="48"
                  fill="none"
                  stroke={layerColors[2] || '#FFFFFF'}
                  strokeWidth="16"
                  strokeDasharray="18 10"
                  className="cursor-pointer"
                  onClick={(e) => candlesLit ? handleBlowCandles(e) : handlePaintLayer(2, e)}
                />
                {/* Donut Hole */}
                <circle cx="160" cy="148" r="24" fill="#FCE7F3" stroke="#B45309" strokeWidth="4" />
              </g>
            ) : (
              /* Round 1 & 3: 2-Tier Birthday Cake with 3 Tap-to-Color Zones */
              <g>
                {/* Bottom Cake Tier (Layer 0) */}
                <rect
                  x="64"
                  y="150"
                  width="192"
                  height="68"
                  rx="20"
                  fill={layerColors[0] || '#FFFBEB'}
                  stroke="#D97706"
                  strokeWidth="4.5"
                  className="cursor-pointer"
                  onClick={(e) => candlesLit ? handleBlowCandles(e) : handlePaintLayer(0, e)}
                />
                {/* Bottom Tier Cream Drip */}
                <path
                  d="M68,162 Q88,182 108,162 Q128,182 148,162 Q168,182 188,162 Q208,182 228,162 Q242,178 252,162"
                  fill="none"
                  stroke={layerColors[1] || '#F9A8D4'}
                  strokeWidth="8"
                  strokeLinecap="round"
                />

                {/* Upper Cake Tier (Layer 1) */}
                <rect
                  x="92"
                  y="96"
                  width="136"
                  height="60"
                  rx="18"
                  fill={layerColors[1] || '#FFFFFF'}
                  stroke="#DB2777"
                  strokeWidth="4.5"
                  className="cursor-pointer"
                  onClick={(e) => candlesLit ? handleBlowCandles(e) : handlePaintLayer(1, e)}
                />

                {/* Top Whipped Cream Frosting Crown (Layer 2) */}
                <path
                  d="M94,104 C94,76 128,76 134,98 C142,74 178,74 186,98 C192,76 226,76 226,104 Z"
                  fill={layerColors[2] || '#FFF1F2'}
                  stroke="#BE185D"
                  strokeWidth="4"
                  className="cursor-pointer"
                  onClick={(e) => candlesLit ? handleBlowCandles(e) : handlePaintLayer(2, e)}
                />
              </g>
            )}

            {/* Birthday Candles on Top */}
            {(candlesLit || candlesBlown) && (
              <g className="cursor-pointer" onClick={handleBlowCandles}>
                {[126, 160, 194].map((cx, i) => (
                  <g key={i}>
                    <rect
                      x={cx - 6}
                      y={44}
                      width="12"
                      height="42"
                      rx="4"
                      fill={i === 1 ? '#60A5FA' : '#F472B6'}
                      stroke="#1E293B"
                      strokeWidth="2.5"
                    />
                    {!candlesBlown ? (
                      <path
                        d={`M${cx},18 C${cx + 10},28 ${cx + 8},40 ${cx},42 C${cx - 8},40 ${cx - 10},28 ${cx},18 Z`}
                        fill="#FACC15"
                        stroke="#EA580C"
                        strokeWidth="2"
                        className="cake-candle-flame"
                      />
                    ) : (
                      <text x={cx} y={32} textAnchor="middle" fontSize="16">
                        💨
                      </text>
                    )}
                  </g>
                ))}
              </g>
            )}

            {/* Placed Fruit / Candy / Crown Toppings */}
            {toppings.map((t) => (
              <text
                key={t.id}
                x={t.x}
                y={t.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="30"
                className="pointer-events-none select-none"
              >
                {t.emoji}
              </text>
            ))}
          </svg>
        </motion.div>

        <div className="creative-tool-shelf creative-cake-shelf" aria-label="크림과 토핑 도구">
          <div className="creative-cake-modes">
            <button type="button" className="creative-tool creative-cake-mode" aria-label="크림 색상" aria-pressed={toolMode === 'cream'} disabled={candlesBlown} onClick={() => { if (!isBlocked()) { setToolMode('cream'); playJellyTap(soundEnabled); } }}><Paintbrush /></button>
            <button type="button" className="creative-tool creative-cake-mode" aria-label="토핑" aria-pressed={toolMode === 'topping'} disabled={candlesBlown} onClick={() => { if (!isBlocked()) { setToolMode('topping'); playJellyTap(soundEnabled); } }}><span aria-hidden="true">🍓</span></button>
          </div>
          <div className="creative-cake-options">
            {toolMode === 'cream' ? CREAM_COLORS.map(c => <button key={c.id} type="button" className="creative-tool" aria-label={`${c.label} 칠하기`} aria-pressed={selectedColor.id === c.id} disabled={candlesBlown} style={{ backgroundColor: c.hex }} onClick={e => {
              if (isBlocked() || roundDoneRef.current) return;
              setSelectedColor(c);
              const empty = layersRef.current.findIndex(color => color === null);
              handlePaintLayer((empty === -1 ? 0 : empty) as 0 | 1 | 2, e, c);
            }}><span className="creative-tool-icon" aria-hidden="true">🖌️</span></button>) : TOPPING_ITEMS.map(emoji => <button key={emoji} type="button" className="creative-tool" aria-label={`${emoji} 토핑 올리기`} disabled={candlesBlown} onClick={e => handleAddTopping(emoji, e)}><span aria-hidden="true">{emoji}</span></button>)}
            <motion.button type="button" whileTap={{ scale: .92 }} className={`creative-tool creative-action-tool${candlesLit && !candlesBlown ? ' creative-candle-ready' : ''}`} disabled={candlesBlown} aria-label={candlesLit ? '후~ 촛불 끄기' : '케이크 꾸미기'} onClick={handleBlowCandles}>{candlesLit ? <Wind /> : <Sparkles />}</motion.button>
          </div>
        </div>
      </div>
      {completed && <RoundContinuation delayMs={700} onNext={() => setRound(0)} />}
    </div>
  );
};
