import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Wand2 } from 'lucide-react';
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
  playJellyTap,
  playStarGain,
  playRisingStepChime,
} from '../../utils/soundEngine';
import { fireConfetti, fireStarExplosion } from '../../utils/confetti';
import { emitJuice } from '../../utils/juice';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';

interface ScratchArtGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup?: AgeGroup;
  childName?: string;
}

interface ScratchScene {
  id: 'dino' | 'unicorn' | 'ocean';
  title: string;
  badge: string;
  emoji: string;
  guideText: string;
  revealedVoice: string;
  foilColorA: string;
  foilColorB: string;
  particleColor: number;
}

const SCRATCH_SCENES: ScratchScene[] = [
  {
    id: 'dino',
    title: '무지개 네온 공룡 나라',
    badge: '🦖 네온 공룡 스크래치',
    emoji: '🦖',
    guideText: '까만 마법 종이를 손가락으로 쓱싹쓱싹 문질러 숨어 있는 무지개 공룡을 찾아봐!',
    revealedVoice: '우와! 반짝반짝 무지개 네온 공룡이 나타났어요! 정말 멋지다!',
    foilColorA: '#1E1B4B',
    foilColorB: '#312E81',
    particleColor: 0x4ADE80,
  },
  {
    id: 'unicorn',
    title: '별빛 유니콘과 요술 성',
    badge: '🦄 별빛 유니콘 스크래치',
    emoji: '🦄',
    guideText: '이번엔 은빛 마법 종이를 쓱싹 문질러 별빛 유니콘과 무지개 성을 깨워 볼까?',
    revealedVoice: '짜잔! 알록달록 별빛 유니콘과 요술 성이 환하게 빛나요!',
    foilColorA: '#3B0764',
    foilColorB: '#581C87',
    particleColor: 0xF472B6,
  },
  {
    id: 'ocean',
    title: '반짝반짝 바닷속 고래',
    badge: '🐳 무지개 고래 스크래치',
    emoji: '🐳',
    guideText: '마지막 마법 종이 밑에는 누가 숨어 있을까? 손가락으로 신나게 쓱싹 문질러 봐!',
    revealedVoice: '대단해! 바닷속 무지개 고래와 보물상자가 나타났어요! 최고의 화가야!',
    foilColorA: '#0C4A6E',
    foilColorB: '#1E3A8A',
    particleColor: 0x38BDF8,
  },
];

const GRID_COLS = 10;
const GRID_ROWS = 8;
const TOTAL_CELLS = GRID_COLS * GRID_ROWS;

export const ScratchArtGame: React.FC<ScratchArtGameProps> = ({
  buddy,
  onCompleteQuiz,
  soundEnabled,
  ageGroup = 'sprout',
}) => {
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const pixiRef = useRef<PixiStageHandle>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const lastSoundTimeRef = useRef(0);
  const roundDoneRef = useRef(false);
  const scratchedCellsRef = useRef<Set<number>>(new Set());

  const [round, setRound] = useState(0);
  const totalRounds = 3;
  const currentScene = SCRATCH_SCENES[round] || SCRATCH_SCENES[0];

  // Goal threshold: baby needs 35%, sprout 42%, older 50%
  const targetRatio = ageGroup === 'baby' ? 0.35 : ageGroup === 'sprout' ? 0.42 : 0.48;

  const [progressPct, setProgressPct] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [buddyBubble, setBuddyBubble] = useState('손가락으로 까만 종이를 쓱싹 문질러 봐!');

  const paintFoilCover = useCallback((scene: ScratchScene) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);

    // Metallic dark starry foil gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, scene.foilColorA);
    grad.addColorStop(0.5, scene.foilColorB);
    grad.addColorStop(1, '#0F172A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw cute silver/gold guide stars & "쓱싹쓱싹 문질러요!" pattern on the foil
    ctx.fillStyle = 'rgba(254, 240, 138, 0.28)';
    for (let i = 0; i < 24; i++) {
      const sx = ((i * 73) % (w - 40)) + 20;
      const sy = ((i * 59) % (h - 40)) + 20;
      ctx.beginPath();
      ctx.arc(sx, sy, (i % 3) + 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center hint silhouette outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(w * 0.12, h * 0.14, w * 0.76, h * 0.72);
    ctx.setLineDash([]);
  }, []);

  const setupRound = useCallback(
    (roundIdx: number) => {
      roundDoneRef.current = false;
      scratchedCellsRef.current.clear();
      setProgressPct(0);
      setIsRevealed(false);
      const scene = SCRATCH_SCENES[roundIdx] || SCRATCH_SCENES[0];
      setBuddyBubble('손가락으로 쓱싹 문지르면 무지개 그림이 나타나요!');
      paintFoilCover(scene);
    },
    [paintFoilCover]
  );

  useEffect(() => {
    setupRound(round);
  }, [round, setupRound]);

  useEffect(() => {
    const scene = SCRATCH_SCENES[round] || SCRATCH_SCENES[0];
    speakText(scene.guideText, soundEnabled, { characterId: buddy });
  }, [round, soundEnabled, buddy]);

  useEffect(() => {
    return () => {
      clearGameTimeouts();
      stopAllSpeech();
    };
  }, [clearGameTimeouts]);

  const completeScratchReveal = useCallback(
    (scene: ScratchScene, currentRound: number) => {
      if (roundDoneRef.current) return;
      roundDoneRef.current = true;
      setIsRevealed(true);
      setProgressPct(100);

      playCorrectFanfare(soundEnabled);
      playSparkleChime(soundEnabled);
      setBuddyBubble(`우와! ${scene.title} 완성! 반짝반짝 최고야!`);
      speakText(scene.revealedVoice, soundEnabled, { characterId: buddy });

      fireStarExplosion();
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        pixiRef.current?.emitBurst({
          x: rect.width / 2,
          y: rect.height / 2,
          color: scene.particleColor,
          count: 34,
          kind: 'star',
        });
      }

      scheduleGameTimeout(() => {
        if (currentRound + 1 < totalRounds) {
          playStarGain(soundEnabled);
          setRound((r) => r + 1);
        } else {
          playCelebrationFanfare(soundEnabled);
          fireConfetti();
          onCompleteQuiz(3);
        }
      }, 2600);
    },
    [buddy, onCompleteQuiz, scheduleGameTimeout, soundEnabled]
  );

  const scratchAtPoint = useCallback(
    (localX: number, localY: number, radius = 44, clientX?: number, clientY?: number) => {
      if (roundDoneRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scaleX = canvas.width / canvas.clientWidth;
      const scaleY = canvas.height / canvas.clientHeight;
      const cx = localX * scaleX;
      const cy = localY * scaleY;
      const r = radius * Math.max(scaleX, scaleY);

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Mark grid cells covered by this brush stroke
      const cellW = canvas.width / GRID_COLS;
      const cellH = canvas.height / GRID_ROWS;
      const minC = Math.max(0, Math.floor((cx - r * 0.8) / cellW));
      const maxC = Math.min(GRID_COLS - 1, Math.floor((cx + r * 0.8) / cellW));
      const minR = Math.max(0, Math.floor((cy - r * 0.8) / cellH));
      const maxR = Math.min(GRID_ROWS - 1, Math.floor((cy + r * 0.8) / cellH));

      let addedNewCell = false;
      for (let rr = minR; rr <= maxR; rr++) {
        for (let cc = minC; cc <= maxC; cc++) {
          const idx = rr * GRID_COLS + cc;
          if (!scratchedCellsRef.current.has(idx)) {
            scratchedCellsRef.current.add(idx);
            addedNewCell = true;
          }
        }
      }

      const now = performance.now();
      if (now - lastSoundTimeRef.current > 130) {
        lastSoundTimeRef.current = now;
        const ratio = scratchedCellsRef.current.size / TOTAL_CELLS;
        const step = Math.min(8, Math.max(1, Math.ceil((ratio / targetRatio) * 8)));
        playRisingStepChime(step, 8, soundEnabled);
        if (clientX !== undefined && clientY !== undefined) {
          pixiRef.current?.emitBurst({
            x: localX,
            y: localY,
            color: currentScene.particleColor,
            count: 6,
            kind: 'star',
          });
        }
      }

      if (addedNewCell) {
        const rawRatio = scratchedCellsRef.current.size / TOTAL_CELLS;
        const normalizedPct = Math.min(100, Math.round((rawRatio / targetRatio) * 100));
        setProgressPct(normalizedPct);

        if (rawRatio >= targetRatio) {
          completeScratchReveal(currentScene, round);
        } else if (normalizedPct >= 50) {
          setBuddyBubble('우와! 알록달록 무지개 빛깔이 보이기 시작했어! 조금만 더 쓱싹!');
        }
      }
    },
    [completeScratchReveal, currentScene, round, soundEnabled, targetRatio]
  );

  // Magic wand helper button: scratches 3 big glowing circles at once!
  const handleMagicWand = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (roundDoneRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      playJellyTap(soundEnabled);
      playSparkleChime(soundEnabled);
      emitJuice({ kind: 'pop', x: e.clientX, y: e.clientY });

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      for (let i = 0; i < 3; i++) {
        const rx = w * (0.2 + Math.random() * 0.6);
        const ry = h * (0.2 + Math.random() * 0.6);
        scratchAtPoint(rx, ry, 58, e.clientX, e.clientY);
      }
    },
    [scratchAtPoint, soundEnabled]
  );

  return (
    <div
      ref={boardRef}
      className="scratch-art-stage relative flex flex-col justify-between w-full h-[var(--game-play-height,calc(100dvh-84px))] min-h-[var(--game-play-height,calc(100dvh-84px))] rounded-3xl overflow-hidden select-none bg-gradient-to-b from-[#0F172A] via-[#1E1B4B] to-[#312E81] border-3 border-[#818CF8] p-3 sm:p-5"
    >
      <style>{`
        @keyframes neonPulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.92; }
          50% { transform: scale(1.04); opacity: 1; }
        }
        .neon-art-glow {
          animation: neonPulseGlow 1.8s ease-in-out infinite;
          @media (prefers-reduced-motion: reduce) {
            animation: none;
          }
        }
      `}</style>

      <PixiStageOverlay ref={pixiRef} className="z-20 pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-30 flex items-center justify-between w-full gap-2">
        <PlayGuide
          buddy={buddy}
          title="마법 스크래치 색칠"
          guide={currentScene.guideText}
          soundEnabled={soundEnabled}
          happy={isRevealed}
        />

        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border-2 border-[#A855F7]">
          <span className="text-lg" aria-hidden="true">{currentScene.emoji}</span>
          <span className="font-black text-[#6B21A8] text-xs sm:text-sm whitespace-nowrap">
            {currentScene.badge} · {progressPct}%
          </span>
        </div>

        <PlayProgress total={totalRounds} done={round} label={`${round + 1}/${totalRounds}`} />
      </div>

      {/* Artist Buddy Banner */}
      <div className="relative z-20 flex items-center justify-center gap-3 my-1">
        <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-3xl border-2 border-[#C084FC] shadow-md">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
            <CharacterAvatar
              id={buddy}
              size="sm"
              mood={isRevealed ? 'excited' : progressPct > 20 ? 'happy' : 'still'}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-[#7E22CE]">
              {round + 1}단계 · {currentScene.title}
            </span>
            <span className="text-xs sm:text-sm font-black text-[#3B0764]">{buddyBubble}</span>
          </div>
        </div>
      </div>

      {/* Center Scratch-Off Rainbow Neon Art Canvas */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center min-h-0 my-1">
        <div className="relative w-full max-w-[380px] aspect-[4/3] rounded-3xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.45)] border-4 border-[#FDE047] bg-[#090D16]">
          {/* Underlying Glowing Rainbow Neon SVG Masterpiece */}
          <svg
            viewBox="0 0 400 300"
            className="neon-art-glow absolute inset-0 w-full h-full pointer-events-none"
          >
            <defs>
              <linearGradient id="rainbowNeonBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EC4899" />
                <stop offset="25%" stopColor="#8B5CF6" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="75%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
              <linearGradient id="neonStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="35%" stopColor="#4ADE80" />
                <stop offset="70%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#F472B6" />
              </linearGradient>
            </defs>

            {/* Vibrant Rainbow Backdrop */}
            <rect width="400" height="300" fill="url(#rainbowNeonBg)" opacity="0.28" />

            {/* Rainbow Arch & Stars */}
            <path
              d="M40,260 A160,160 0 0,1 360,260"
              fill="none"
              stroke="url(#neonStroke)"
              strokeWidth="18"
              strokeLinecap="round"
              opacity="0.75"
            />
            <circle cx="70" cy="60" r="10" fill="#FDE047" />
            <circle cx="330" cy="55" r="12" fill="#F472B6" />
            <circle cx="200" cy="36" r="9" fill="#38BDF8" />

            {currentScene.id === 'dino' && (
              /* Scene 1: Cute Neon Rainbow Dinosaur & Volcano */
              <g>
                {/* Neon Palm & Ferns */}
                <path d="M40,270 Q65,210 95,240" fill="none" stroke="#4ADE80" strokeWidth="8" strokeLinecap="round" />
                <path d="M310,270 Q340,210 370,245" fill="none" stroke="#38BDF8" strokeWidth="8" strokeLinecap="round" />
                {/* Cute Chubby Neon Dino */}
                <ellipse cx="205" cy="195" rx="68" ry="52" fill="#4ADE80" stroke="#FDE047" strokeWidth="6" />
                <ellipse cx="205" cy="204" rx="42" ry="32" fill="#FEF08A" />
                <circle cx="155" cy="122" r="44" fill="#4ADE80" stroke="#FDE047" strokeWidth="6" />
                {/* Rainbow Back Spikes */}
                <polygon points="188,88 205,64 212,96" fill="#F472B6" />
                <polygon points="222,108 246,88 244,124" fill="#38BDF8" />
                <polygon points="252,140 278,128 268,162" fill="#FACC15" />
                {/* Tail */}
                <path d="M265,205 Q330,195 335,150 Q300,165 268,180 Z" fill="#4ADE80" stroke="#FDE047" strokeWidth="5" />
                {/* Eyes & Big Smile */}
                <circle cx="140" cy="114" r="8" fill="#0F172A" />
                <circle cx="138" cy="111" r="3" fill="#FFFFFF" />
                <ellipse cx="166" cy="126" rx="8" ry="5" fill="#FB7185" />
                <path d="M126,134 Q146,152 168,134" fill="none" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" />
              </g>
            )}

            {currentScene.id === 'unicorn' && (
              /* Scene 2: Neon Starry Unicorn & Magic Castle */
              <g>
                {/* Fluffy Rainbow Clouds */}
                <ellipse cx="120" cy="245" rx="70" ry="26" fill="#FBCFE8" />
                <ellipse cx="275" cy="245" rx="75" ry="28" fill="#DDD6FE" />
                {/* Unicorn Body & Head */}
                <ellipse cx="210" cy="192" rx="64" ry="44" fill="#FFFFFF" stroke="#F472B6" strokeWidth="6" />
                <circle cx="156" cy="126" r="38" fill="#FFFFFF" stroke="#F472B6" strokeWidth="6" />
                {/* Golden Horn */}
                <polygon points="136,96 112,42 158,86" fill="#FDE047" stroke="#F59E0B" strokeWidth="4" />
                {/* Rainbow Mane & Tail */}
                <path d="M178,96 Q216,105 198,144" fill="none" stroke="#EC4899" strokeWidth="12" strokeLinecap="round" />
                <path d="M186,112 Q224,124 206,156" fill="none" stroke="#38BDF8" strokeWidth="10" strokeLinecap="round" />
                <path d="M272,182 Q332,162 324,218" fill="none" stroke="#A855F7" strokeWidth="14" strokeLinecap="round" />
                {/* Sparkly Eye & Smile */}
                <circle cx="142" cy="122" r="7" fill="#1E1B4B" />
                <circle cx="140" cy="119" r="2.5" fill="#FFFFFF" />
                <ellipse cx="162" cy="134" rx="7" ry="4.5" fill="#F472B6" />
              </g>
            )}

            {currentScene.id === 'ocean' && (
              /* Scene 3: Glowing Rainbow Whale & Sea Stars */
              <g>
                {/* Coral & Bubbles */}
                <circle cx="92" cy="95" r="10" fill="#BAE6FD" opacity="0.85" />
                <circle cx="112" cy="68" r="14" fill="#E0F2FE" opacity="0.85" />
                {/* Water Spout */}
                <path d="M195,98 Q170,48 135,62 M195,98 Q220,48 255,62" fill="none" stroke="#7DD3FC" strokeWidth="8" strokeLinecap="round" />
                {/* Cute Chubby Rainbow Whale */}
                <ellipse cx="195" cy="178" rx="88" ry="58" fill="#38BDF8" stroke="#FDE047" strokeWidth="6" />
                <path d="M122,192 Q195,242 268,192" fill="#BAE6FD" />
                <path d="M276,174 L334,136 L324,178 L338,214 Z" fill="#F472B6" stroke="#FDE047" strokeWidth="5" strokeLinejoin="round" />
                {/* Crown on Whale */}
                <polygon points="172,120 180,94 195,110 210,94 218,120" fill="#FDE047" stroke="#CA8A04" strokeWidth="3" />
                {/* Cute Eyes & Smile */}
                <circle cx="148" cy="166" r="8.5" fill="#0F172A" />
                <circle cx="146" cy="163" r="3" fill="#FFFFFF" />
                <ellipse cx="132" cy="178" rx="8" ry="5" fill="#FB7185" />
                <path d="M152,184 Q172,200 192,184" fill="none" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" />
              </g>
            )}
          </svg>

          {/* Top Scratch-Off Foil Canvas */}
          <AnimatePresence>
            {!isRevealed && (
              <motion.canvas
                ref={canvasRef}
                width={400}
                height={300}
                exit={{ opacity: 0, scale: 1.06 }}
                transition={{ duration: 0.45 }}
                onPointerDown={(e) => {
                  isDrawingRef.current = true;
                  const rect = e.currentTarget.getBoundingClientRect();
                  scratchAtPoint(
                    e.clientX - rect.left,
                    e.clientY - rect.top,
                    46,
                    e.clientX,
                    e.clientY
                  );
                }}
                onPointerMove={(e) => {
                  if (!isDrawingRef.current) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  scratchAtPoint(
                    e.clientX - rect.left,
                    e.clientY - rect.top,
                    44,
                    e.clientX,
                    e.clientY
                  );
                }}
                onPointerUp={() => {
                  isDrawingRef.current = false;
                }}
                onPointerCancel={() => {
                  isDrawingRef.current = false;
                }}
                aria-label="마법 스크래치 캔버스 — 문질러서 그림을 나타내세요"
                className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Magic Wand Helper Button */}
        <div className="relative z-30 mt-3 flex items-center justify-center">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={handleMagicWand}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-sm sm:text-base text-white shadow-lg border-3 border-[#FDE047] bg-gradient-to-r from-[#9333EA] via-[#EC4899] to-[#F59E0B]"
          >
            <Wand2 className="w-5 h-5 text-yellow-200" />
            <span>
              {isRevealed ? '우와! 무지개 네온 그림 완성! ✨' : '마법 지팡이로 쓱싹 지우기! 🪄'}
            </span>
            <Sparkles className="w-5 h-5 text-yellow-200" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
