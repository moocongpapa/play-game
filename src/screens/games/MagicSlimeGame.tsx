import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Gift, RotateCcw, Hand, Palette } from 'lucide-react';
import type { CharacterId, AgeGroup } from '../../types';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { PlayGuide } from '../../components/ToddlerPlay';
import { PixiStageOverlay, type PixiStageHandle } from '../../components/PixiStageOverlay';
import {
  speakText,
  stopAllSpeech,
  playBouncyBoing,
  playSparkleChime,
  playCorrectFanfare,
  playComboChime,
  playJellyTap,
} from '../../utils/soundEngine';
import { fireConfetti, fireStarExplosion } from '../../utils/confetti';
import { emitJuice, JUICE_SPRING } from '../../utils/juice';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';

interface MagicSlimeGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup?: AgeGroup;
  childName?: string;
}

type SlimeTool = 'squish' | 'glitter' | 'topping';

interface SlimeColor {
  name: string;
  gradient: string;
  highlight: string;
  border: string;
  hex: number;
}

const SLIME_COLORS: SlimeColor[] = [
  {
    name: '딸기 핑크',
    gradient: 'from-[#FF758F] via-[#FF4D6D] to-[#C9184A]',
    highlight: '#FFCCD5',
    border: '#A4133C',
    hex: 0xff4d6d,
  },
  {
    name: '블루베리',
    gradient: 'from-[#7DD3FC] via-[#38BDF8] to-[#0284C7]',
    highlight: '#E0F2FE',
    border: '#0369A1',
    hex: 0x38bdf8,
  },
  {
    name: '포도 라벤더',
    gradient: 'from-[#E9D5FF] via-[#C084FC] to-[#7C3AED]',
    highlight: '#F3E8FF',
    border: '#6B21A8',
    hex: 0xc084fc,
  },
  {
    name: '레몬 골드',
    gradient: 'from-[#FEF08A] via-[#FDE047] to-[#F59E0B]',
    highlight: '#FEF9C3',
    border: '#B45309',
    hex: 0xfde047,
  },
  {
    name: '메론 민트',
    gradient: 'from-[#A7F3D0] via-[#34D399] to-[#059669]',
    highlight: '#D1FAE5',
    border: '#047857',
    hex: 0x34d399,
  },
  {
    name: '유니콘 무지개',
    gradient: 'from-[#F472B6] via-[#A78BFA] to-[#38BDF8]',
    highlight: '#FFFFFF',
    border: '#7C3AED',
    hex: 0xa78bfa,
  },
];

const FRUIT_TOPPINGS = ['🍓', '🍒', '🍊', '🍌', '🧸', '🌸', '👑', '⭐'];
const SPANGLE_EMOJIS = ['✨', '⭐', '💖', '💎', '🌟'];

interface PlacedTopping {
  id: number;
  emoji: string;
  relX: number; // -1 to 1 from slime center
  relY: number;
  rotation: number;
}

const GUIDE = '말랑말랑 슬라임을 콕콕 주무르고, 반짝이와 과일 토핑을 올려 예쁘게 꾸며볼까?';

export const MagicSlimeGame: React.FC<MagicSlimeGameProps> = ({
  buddy,
  onCompleteQuiz,
  soundEnabled,
}) => {
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const pixiRef = useRef<PixiStageHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeTool, setActiveTool] = useState<SlimeTool>('squish');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedTopping, setSelectedTopping] = useState('🍓');
  const [toppings, setToppings] = useState<PlacedTopping[]>([]);
  const [spangles, setSpangles] = useState<PlacedTopping[]>([]);
  const [isGifted, setIsGifted] = useState(false);
  const [decorationsCount, setDecorationsCount] = useState(0);

  const currentColor = SLIME_COLORS[selectedColorIdx];

  // 24 vertices for jelly blob mesh
  const VERTEX_COUNT = 24;
  const verticesRef = useRef<
    {
      x: number;
      y: number;
      vx: number;
      vy: number;
      restR: number;
      curR: number;
      vr: number;
    }[]
  >([]);

  const centerRef = useRef({ x: 200, y: 200, baseR: 125 });
  const isPointerDownRef = useRef(false);
  const lastPointerRef = useRef({ x: 200, y: 200 });
  const lastSquishSpeechRef = useRef(0);

  // Initialize jellyfish spring control points
  useEffect(() => {
    const baseR = centerRef.current.baseR;
    verticesRef.current = Array.from({ length: VERTEX_COUNT }, (_, i) => {
      const angle = (i / VERTEX_COUNT) * Math.PI * 2;
      return {
        x: Math.cos(angle) * baseR,
        y: Math.sin(angle) * baseR,
        vx: 0,
        vy: 0,
        restR: baseR,
        curR: baseR,
        vr: 0,
      };
    });
  }, []);

  // Guide speech on mount
  useEffect(() => {
    stopAllSpeech();
    speakText(GUIDE, soundEnabled, { characterId: buddy });
    return () => {
      clearGameTimeouts();
      stopAllSpeech();
    };
  }, [buddy, soundEnabled, clearGameTimeouts]);

  // Jelly physics simulation loop on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const stiffness = 0.12;
    const damping = 0.84;
    const neighborK = 0.22;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      centerRef.current.x = cx;
      centerRef.current.y = cy;

      const verts = verticesRef.current;
      if (verts.length === VERTEX_COUNT) {
        // Integrate spring physics
        for (let i = 0; i < VERTEX_COUNT; i++) {
          const v = verts[i];
          const prev = verts[(i - 1 + VERTEX_COUNT) % VERTEX_COUNT];
          const next = verts[(i + 1) % VERTEX_COUNT];

          // Hooke's spring to rest radius
          const springF = (v.restR - v.curR) * stiffness;
          // Neighbor curvature smoothing
          const neighborF = (prev.curR + next.curR - 2 * v.curR) * neighborK;

          v.vr = (v.vr + springF + neighborF) * damping;
          v.curR += v.vr;

          const angle = (i / VERTEX_COUNT) * Math.PI * 2;
          v.x = Math.cos(angle) * v.curR;
          v.y = Math.sin(angle) * v.curR;
        }

        // Draw Jelly Slime Blob
        ctx.save();
        ctx.translate(cx, cy);

        // Path with smooth Bezier curve loops
        ctx.beginPath();
        for (let i = 0; i < VERTEX_COUNT; i++) {
          const v0 = verts[i];
          const v1 = verts[(i + 1) % VERTEX_COUNT];
          const midX = (v0.x + v1.x) / 2;
          const midY = (v0.y + v1.y) / 2;
          if (i === 0) {
            ctx.moveTo((verts[VERTEX_COUNT - 1].x + v0.x) / 2, (verts[VERTEX_COUNT - 1].y + v0.y) / 2);
          }
          ctx.quadraticCurveTo(v0.x, v0.y, midX, midY);
        }
        ctx.closePath();

        // Shading & Gradient
        const grad = ctx.createRadialGradient(-35, -35, 10, 0, 0, centerRef.current.baseR * 1.3);
        const col = SLIME_COLORS[selectedColorIdx];
        grad.addColorStop(0, col.highlight);
        grad.addColorStop(0.5, col.border);
        grad.addColorStop(1, '#3b0764');

        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(0,0,0,0.22)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 12;
        ctx.fill();

        // Shiny Slime Gel Shimmer Border
        ctx.lineWidth = 6;
        ctx.strokeStyle = col.highlight;
        ctx.stroke();

        // Top Glossy Reflection highlight
        ctx.beginPath();
        ctx.ellipse(-28, -48, 55, 24, -Math.PI / 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.48)';
        ctx.shadowBlur = 0;
        ctx.fill();

        ctx.restore();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [selectedColorIdx]);

  // Pull / Squish Jelly deformation
  const deformJellyAt = useCallback(
    (clientX: number, clientY: number, pullForce = 34) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const px = clientX - rect.left - canvas.width / 2;
      const py = clientY - rect.top - canvas.height / 2;
      const touchDist = Math.hypot(px, py);
      const touchAngle = Math.atan2(py, px);

      const verts = verticesRef.current;
      if (!verts.length) return;

      verts.forEach((v, i) => {
        const vAngle = (i / VERTEX_COUNT) * Math.PI * 2;
        let diff = Math.abs(touchAngle - vAngle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;

        if (diff < Math.PI * 0.45) {
          const factor = Math.cos((diff / (Math.PI * 0.45)) * (Math.PI / 2));
          // Squish inwards or pull outwards depending on touch distance
          const delta = touchDist > v.restR ? pullForce * factor : -pullForce * factor;
          v.vr += delta * 0.35;
        }
      });
    },
    [],
  );

  // Pointer interactions on Slime
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relX = (e.clientX - rect.left - canvas.width / 2) / centerRef.current.baseR;
    const relY = (e.clientY - rect.top - canvas.height / 2) / centerRef.current.baseR;

    if (activeTool === 'squish') {
      deformJellyAt(e.clientX, e.clientY, 48);
      playJellyTap(soundEnabled);
      emitJuice({ kind: 'pop', x: e.clientX, y: e.clientY });

      if (Date.now() - lastSquishSpeechRef.current > 4000) {
        lastSquishSpeechRef.current = Date.now();
        speakText('말랑말랑 쫀득쫀득! 정말 기분 좋아!', soundEnabled, {
          characterId: buddy,
          playIntroSFX: false,
        });
      }
    } else if (activeTool === 'glitter') {
      // Scatter spangles
      const newSpangle: PlacedTopping = {
        id: Date.now() + Math.random(),
        emoji: SPANGLE_EMOJIS[Math.floor(Math.random() * SPANGLE_EMOJIS.length)],
        relX: Math.max(-0.85, Math.min(0.85, relX)),
        relY: Math.max(-0.85, Math.min(0.85, relY)),
        rotation: (Math.random() - 0.5) * 60,
      };
      setSpangles((prev) => [...prev.slice(-30), newSpangle]);
      setDecorationsCount((c) => c + 1);

      playSparkleChime(soundEnabled);
      deformJellyAt(e.clientX, e.clientY, 24);
      pixiRef.current?.emitBurst({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        color: currentColor.hex,
        secondaryColor: 0xffffff,
        count: 14,
        kind: 'star',
      });
    } else if (activeTool === 'topping') {
      // Place fruit or stamp topping
      const newTopping: PlacedTopping = {
        id: Date.now() + Math.random(),
        emoji: selectedTopping,
        relX: Math.max(-0.8, Math.min(0.8, relX)),
        relY: Math.max(-0.8, Math.min(0.8, relY)),
        rotation: (Math.random() - 0.5) * 35,
      };
      setToppings((prev) => [...prev.slice(-16), newTopping]);
      setDecorationsCount((c) => c + 1);

      playBouncyBoing(soundEnabled);
      deformJellyAt(e.clientX, e.clientY, 32);
      emitJuice({ kind: 'snap', x: e.clientX, y: e.clientY });

      speakText('반짝이 토핑 쏙! 알록달록 정말 예뻐!', soundEnabled, {
        characterId: buddy,
        playIntroSFX: false,
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current) return;
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };

    if (Math.hypot(dx, dy) > 6) {
      deformJellyAt(e.clientX, e.clientY, 26);
      if (activeTool === 'squish' && Math.random() < 0.2) {
        playJellyTap(soundEnabled);
      }
    }
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
  };

  // Gift Creation to Buddy
  const handleGiftSlime = useCallback(() => {
    if (isGifted) return;

    setIsGifted(true);
    playCorrectFanfare(soundEnabled);
    playComboChime(10, soundEnabled);
    fireConfetti();
    fireStarExplosion();
    onCompleteQuiz(10);
    stopAllSpeech();
    speakText('우와! 반짝반짝 예쁜 슬라임 선물 고마워! 정말 마음에 들어!', soundEnabled, {
      characterId: buddy,
    });

    scheduleGameTimeout(() => {
      setIsGifted(false);
      setToppings([]);
      setSpangles([]);
      setDecorationsCount(0);
    }, 4000);
  }, [isGifted, soundEnabled, buddy, onCompleteQuiz, scheduleGameTimeout]);

  // Reset slime bowl
  const handleResetSlime = () => {
    playBouncyBoing(soundEnabled);
    setToppings([]);
    setSpangles([]);
    setDecorationsCount(0);
  };

  return (
    <div
      ref={stageRef}
      className="magic-slime-stage relative flex flex-col justify-between w-full h-[var(--game-play-height,calc(100dvh-84px))] min-h-[var(--game-play-height,calc(100dvh-84px))] rounded-3xl overflow-hidden select-none bg-gradient-to-b from-[#FDF2F8] via-[#FCE7F3] to-[#EDE9FE] border-3 border-[#F472B6] p-3 sm:p-5 shadow-inner"
    >
      {/* Background Soft Glow */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-10 left-10 w-44 h-44 rounded-full bg-pink-300/35 blur-3xl" />
        <div className="absolute bottom-12 right-8 w-52 h-52 rounded-full bg-purple-300/35 blur-3xl" />
      </div>

      <PixiStageOverlay ref={pixiRef} ambientKind="none" className="z-30" />

      {/* Top HUD: Guide & Actions */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        <PlayGuide
          buddy={buddy}
          soundEnabled={soundEnabled}
          title="반짝이 마법 슬라임"
          guide={GUIDE}
          happy={isGifted}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetSlime}
            type="button"
            aria-label="슬라임 깨끗이 비우기"
            className="px-3.5 py-1.5 rounded-full bg-white/90 border-2 border-pink-300 text-pink-700 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>새로 만들기</span>
          </button>
          <button
            onClick={handleGiftSlime}
            type="button"
            aria-label="친구에게 슬라임 선물하기"
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:scale-95 border-2 border-white"
          >
            <Gift className="w-4 h-4 fill-current" />
            <span>선물하기!</span>
          </button>
        </div>
      </div>

      {/* Central Interactive Slime Dish Area */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center pointer-events-auto py-2">
        <div className="relative w-72 sm:w-88 h-72 sm:h-88 flex items-center justify-center">
          {/* Glass Pastel Dish Rim */}
          <div className="absolute inset-0 rounded-full bg-white/70 border-8 border-white/90 shadow-[0_16px_36px_rgba(236,72,153,0.18),inset_0_4px_16px_rgba(255,255,255,0.85)] backdrop-blur-md pointer-events-none" />

          {/* Interactive Jelly Slime Canvas */}
          <canvas
            ref={canvasRef}
            width={340}
            height={340}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative z-10 w-full h-full cursor-grab active:cursor-grabbing touch-none rounded-full"
            aria-label="말랑말랑 마법 슬라임 (손가락으로 주무르거나 탭해 꾸미기)"
          />

          {/* Attached Spangles Overlay */}
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            {spangles.map((sp) => (
              <span
                key={sp.id}
                style={{
                  transform: `translate(${sp.relX * 105}px, ${sp.relY * 105}px) rotate(${
                    sp.rotation
                  }deg)`,
                }}
                className="absolute text-lg sm:text-xl drop-shadow-sm select-none"
              >
                {sp.emoji}
              </span>
            ))}
          </div>

          {/* Attached Fruit Toppings Overlay */}
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            {toppings.map((tp) => (
              <span
                key={tp.id}
                style={{
                  transform: `translate(${tp.relX * 100}px, ${tp.relY * 100}px) rotate(${
                    tp.rotation
                  }deg)`,
                }}
                className="absolute text-2xl sm:text-3xl drop-shadow-md select-none animate-bounce"
              >
                {tp.emoji}
              </span>
            ))}
          </div>

          {/* Gift Celebration Box Animation */}
          <AnimatePresence>
            {isGifted && (
              <motion.div
                initial={{ scale: 0.3, y: 40, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={JUICE_SPRING}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/95 rounded-full p-4 border-4 border-pink-400 shadow-2xl"
              >
                <div className="scale-125 mb-1">
                  <CharacterAvatar id={buddy} size="lg" mood="dancing" />
                </div>
                <div className="px-3.5 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5 border-2 border-white">
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>선물 고마워! 최고야!</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Creative Palette & Decorating Toolbox */}
      <div className="relative z-30 flex flex-col gap-2 pointer-events-auto">
        {/* Tool Mode Tabs */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => {
              setActiveTool('squish');
              playJellyTap(soundEnabled);
            }}
            type="button"
            className={`px-4 py-1.5 rounded-full font-black text-xs sm:text-sm flex items-center gap-1.5 transition-transform active:scale-95 shadow-sm ${
              activeTool === 'squish'
                ? 'bg-pink-500 text-white border-2 border-white shadow-md scale-105'
                : 'bg-white/80 text-pink-700 border border-pink-200'
            }`}
          >
            <Hand className="w-4 h-4" />
            <span>조물조물 주무르기</span>
          </button>
          <button
            onClick={() => {
              setActiveTool('glitter');
              playSparkleChime(soundEnabled);
            }}
            type="button"
            className={`px-4 py-1.5 rounded-full font-black text-xs sm:text-sm flex items-center gap-1.5 transition-transform active:scale-95 shadow-sm ${
              activeTool === 'glitter'
                ? 'bg-purple-600 text-white border-2 border-white shadow-md scale-105'
                : 'bg-white/80 text-purple-700 border border-purple-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>반짝이 스팽글</span>
          </button>
          <button
            onClick={() => {
              setActiveTool('topping');
              playBouncyBoing(soundEnabled);
            }}
            type="button"
            className={`px-4 py-1.5 rounded-full font-black text-xs sm:text-sm flex items-center gap-1.5 transition-transform active:scale-95 shadow-sm ${
              activeTool === 'topping'
                ? 'bg-amber-500 text-white border-2 border-white shadow-md scale-105'
                : 'bg-white/80 text-amber-800 border border-amber-200'
            }`}
          >
            <span>🍓 과일 토핑 도장</span>
          </button>
        </div>

        {/* Dynamic Tool Sub-tray */}
        <div className="flex items-center justify-center gap-2 p-2 rounded-2xl bg-white/85 border-2 border-pink-200 shadow-sm overflow-x-auto">
          {activeTool === 'squish' && (
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-black text-pink-800 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" /> 슬라임 색소:
              </span>
              {SLIME_COLORS.map((col, idx) => (
                <button
                  key={col.name}
                  onClick={() => {
                    setSelectedColorIdx(idx);
                    playSparkleChime(soundEnabled);
                  }}
                  type="button"
                  aria-label={`${col.name} 색소 섞기`}
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                    col.gradient
                  } shadow-md transition-transform active:scale-90 ${
                    selectedColorIdx === idx
                      ? 'ring-3 ring-pink-500 ring-offset-2 scale-110'
                      : 'border-2 border-white'
                  }`}
                />
              ))}
            </div>
          )}

          {activeTool === 'glitter' && (
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-black text-purple-900">
                화면을 쓱쓱 문지르면 별빛 스팽글이 가득 뿌려져요!
              </span>
            </div>
          )}

          {activeTool === 'topping' && (
            <div className="flex items-center gap-2">
              {FRUIT_TOPPINGS.map((tp) => (
                <button
                  key={tp}
                  onClick={() => {
                    setSelectedTopping(tp);
                    playBouncyBoing(soundEnabled);
                  }}
                  type="button"
                  aria-label={`${tp} 토핑 선택`}
                  className={`w-9 h-9 rounded-2xl text-xl flex items-center justify-center transition-transform active:scale-90 shadow-sm ${
                    selectedTopping === tp
                      ? 'bg-amber-100 border-2 border-amber-500 scale-110 shadow-md'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  {tp}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
