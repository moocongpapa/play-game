import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Wand2, BookOpen, RotateCcw, Heart, Star } from 'lucide-react';
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
  playBubblePop,
  playCareSound,
  playJellyTap,
  playStarGain,
} from '../../utils/soundEngine';
import { fireConfetti, fireStarExplosion } from '../../utils/confetti';
import { emitJuice, JUICE_SPRING } from '../../utils/juice';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';

interface MagicPotionGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup?: AgeGroup;
  childName?: string;
}

interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  color: string;
  rgb: [number, number, number];
}

interface Recipe {
  id: string;
  name: string;
  emoji: string;
  title: string;
  color: string;
  required: string[];
}

const INGREDIENTS: Ingredient[] = [
  { id: 'star_powder', name: '별가루', emoji: '✨', color: '#fbbf24', rgb: [251, 191, 36] },
  { id: 'berry_syrup', name: '딸기 시럽', emoji: '🍓', color: '#f43f5e', rgb: [244, 63, 94] },
  { id: 'gem_tear', name: '보석 눈물', emoji: '💎', color: '#38bdf8', rgb: [56, 189, 248] },
  { id: 'moon_mint', name: '달빛 민트', emoji: '🍃', color: '#34d399', rgb: [52, 211, 153] },
  { id: 'purple_dust', name: '보라 마법가루', emoji: '🔮', color: '#c084fc', rgb: [192, 132, 252] },
  { id: 'golden_honey', name: '황금 꿀', emoji: '🍯', color: '#f59e0b', rgb: [245, 158, 11] },
];

const RECIPES: Recipe[] = [
  { id: 'unicorn', name: '별빛 아기 유니콘', emoji: '🦄', title: '별빛 유니콘', color: '#f472b6', required: ['star_powder', 'gem_tear'] },
  { id: 'dragon', name: '무지개 아기 드래곤', emoji: '🐲', title: '무지개 드래곤', color: '#34d399', required: ['berry_syrup', 'moon_mint'] },
  { id: 'fairy', name: '날개 요정 친구', emoji: '🧚', title: '분홍 요정', color: '#c084fc', required: ['purple_dust', 'golden_honey'] },
  { id: 'stardust_cat', name: '별사탕 아기 고양이', emoji: '🐱', title: '별사탕 고양이', color: '#fbbf24', required: ['star_powder', 'berry_syrup'] },
  { id: 'jelly_bear', name: '황금 젤리 곰', emoji: '🧸', title: '황금 젤리 곰', color: '#f59e0b', required: ['golden_honey', 'gem_tear'] },
  { id: 'phoenix', name: '황금 불사조', emoji: '🦚', title: '황금 불사조', color: '#ec4899', required: ['star_powder', 'berry_syrup', 'golden_honey'] },
];

const GUIDE = '보글보글! 신비한 마법 재료를 퐁당 넣고 뱅글뱅글 저어보자!';

export const MagicPotionGame: React.FC<MagicPotionGameProps> = ({
  buddy,
  onCompleteQuiz,
  soundEnabled,
  ageGroup = 'sprout',
}) => {
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const pixiRef = useRef<PixiStageHandle>(null);
  const cauldronRef = useRef<HTMLDivElement>(null);

  const [round, setRound] = useState(0);
  const totalRounds = 3;
  const isRecipeMode = ageGroup !== 'baby';

  // Target recipe for sprout / bloom
  const targetRecipe = RECIPES[round % RECIPES.length];
  const requiredCount = isRecipeMode ? targetRecipe.required.length : 2;

  const [addedIngredients, setAddedIngredients] = useState<Ingredient[]>([]);
  const [liquidColor, setLiquidColor] = useState<[number, number, number]>([147, 51, 234]); // default magical violet
  const [stirProgress, setStirProgress] = useState(0); // 0 to 3
  const [phase, setPhase] = useState<'adding' | 'stirring' | 'brewing' | 'revealed' | 'complete'>('adding');
  const [createdCreature, setCreatedCreature] = useState<Recipe | null>(null);
  const [wandAngle, setWandAngle] = useState(20);
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);

  // Bubble animation inside cauldron
  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles((prev) => {
        const next = prev
          .map((b) => ({ ...b, y: b.y - 12 }))
          .filter((b) => b.y > 10);
        if (next.length < 8) {
          next.push({
            id: Math.random(),
            x: 20 + Math.random() * 60,
            y: 80 + Math.random() * 10,
            size: 8 + Math.random() * 14,
          });
        }
        return next;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Initial speech guide
  useEffect(() => {
    speakText(GUIDE, soundEnabled, { characterId: buddy });
    return () => {
      stopAllSpeech();
      clearGameTimeouts();
    };
  }, [buddy, soundEnabled, clearGameTimeouts]);

  // Drop ingredient into cauldron
  const handleSelectIngredient = (ingredient: Ingredient) => {
    if (phase !== 'adding' || addedIngredients.length >= requiredCount) return;

    playCareSound('drink', soundEnabled);
    playBubblePop(soundEnabled);

    const nextAdded = [...addedIngredients, ingredient];
    setAddedIngredients(nextAdded);

    // Dynamic color mixing (weighted RGB blending)
    setLiquidColor((prev) => {
      const weightPrev = 0.5;
      const weightNew = 0.5;
      return [
        Math.round(prev[0] * weightPrev + ingredient.rgb[0] * weightNew),
        Math.round(prev[1] * weightPrev + ingredient.rgb[1] * weightNew),
        Math.round(prev[2] * weightPrev + ingredient.rgb[2] * weightNew),
      ];
    });

    if (cauldronRef.current) {
      const rect = cauldronRef.current.getBoundingClientRect();
      emitJuice({ kind: 'pop', x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      pixiRef.current?.emitBurst({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        color: (ingredient.rgb[0] << 16) | (ingredient.rgb[1] << 8) | ingredient.rgb[2],
        count: 12,
        kind: 'bubble',
      });
    }

    if (nextAdded.length >= requiredCount) {
      speakText('빙글빙글 저어주세요! 마법이 일어나고 있어!', soundEnabled, { characterId: buddy, playIntroSFX: false });
      setPhase('stirring');
    } else {
      speakText('재료를 퐁당! 알록달록 색깔이 섞이고 있어!', soundEnabled, { characterId: buddy, playIntroSFX: false });
    }
  };

  // Stir mechanic
  const handleStir = useCallback(() => {
    if (phase !== 'stirring') return;

    playCareSound('bubble', soundEnabled);
    playJellyTap(soundEnabled);
    setWandAngle((prev) => (prev + 90) % 360);

    const nextStir = stirProgress + 1;
    setStirProgress(nextStir);

    if (cauldronRef.current) {
      const rect = cauldronRef.current.getBoundingClientRect();
      emitJuice({ kind: 'pop', x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      pixiRef.current?.emitBurst({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        color: (liquidColor[0] << 16) | (liquidColor[1] << 8) | liquidColor[2],
        count: 10,
        kind: 'star',
      });
    }

    if (nextStir >= 3) {
      setPhase('brewing');
      scheduleGameTimeout(() => {
        // Determine creature
        let result = targetRecipe;
        if (!isRecipeMode) {
          result = RECIPES[round % RECIPES.length];
        }
        setCreatedCreature(result);
        setPhase('revealed');
        playSparkleChime(soundEnabled);
        playCorrectFanfare(soundEnabled);
        fireStarExplosion();
        speakText('우와! 반짝반짝 신기한 마법 생명체가 태어났어요!', soundEnabled, { characterId: buddy, playIntroSFX: false });
      }, 1200);
    }
  }, [phase, soundEnabled, stirProgress, targetRecipe, isRecipeMode, round, liquidColor, buddy, scheduleGameTimeout]);

  // Next round
  const handleNextRound = () => {
    if (round + 1 >= totalRounds) {
      setPhase('complete');
      playCelebrationFanfare(soundEnabled);
      fireConfetti();
      scheduleGameTimeout(() => {
        onCompleteQuiz(3);
      }, 2500);
    } else {
      setRound((r) => r + 1);
      setAddedIngredients([]);
      setStirProgress(0);
      setPhase('adding');
      setCreatedCreature(null);
      setLiquidColor([147, 51, 234]);
      playStarGain(soundEnabled);
      speakText(GUIDE, soundEnabled, { characterId: buddy, playIntroSFX: false });
    }
  };

  const currentColorRgb = `rgb(${liquidColor[0]}, ${liquidColor[1]}, ${liquidColor[2]})`;

  return (
    <div
      className="magic-potion-stage relative flex flex-col justify-between w-full h-full select-none overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 50% 30%, #312e81 0%, #1e1b4b 60%, #0f172a 100%)',
      }}
    >
      <PixiStageOverlay ref={pixiRef} ambientKind="magic" />

      {/* Top Header */}
      <header className="relative z-10 flex flex-wrap items-center justify-between p-3 gap-2">
        <PlayGuide
          buddy={buddy}
          soundEnabled={soundEnabled}
          title="알록달록 마법 물약"
          guide={GUIDE}
          happy={phase === 'revealed'}
        />
        <PlayProgress total={totalRounds} done={round + 1} label="완성 물약" />
      </header>

      {/* Recipe Goal Banner for Sprout / Bloom */}
      {isRecipeMode && phase !== 'revealed' && phase !== 'complete' && (
        <div className="relative z-10 flex items-center justify-center px-4 py-1">
          <div className="flex items-center gap-3 px-4 py-2 bg-indigo-900/80 backdrop-blur-md rounded-2xl border border-indigo-400/30 shadow-lg text-white text-sm">
            <BookOpen className="w-5 h-5 text-amber-300" />
            <span className="font-bold text-amber-200">목표 마법 레시피:</span>
            <span className="font-extrabold text-base text-pink-300 flex items-center gap-1">
              <span>{targetRecipe.emoji}</span> {targetRecipe.name}
            </span>
            <div className="flex items-center gap-1.5 ml-2">
              {targetRecipe.required.map((reqId) => {
                const ing = INGREDIENTS.find((i) => i.id === reqId);
                const isAdded = addedIngredients.some((i) => i.id === reqId);
                return (
                  <span
                    key={reqId}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border transition-all ${
                      isAdded
                        ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 scale-105'
                        : 'bg-white/10 border-white/20 text-white/80'
                    }`}
                  >
                    <span>{ing?.emoji}</span>
                    <span>{ing?.name}</span>
                    {isAdded && '✓'}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Center Cauldron & Creation Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-2 min-h-0">
        <AnimatePresence mode="wait">
          {phase === 'revealed' && createdCreature ? (
            /* Creature Revealed Screen */
            <motion.div
              key="creature-reveal"
              initial={{ scale: 0.2, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={JUICE_SPRING}
              className="flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-purple-900/90 to-indigo-950/95 border-2 border-amber-300/60 rounded-3xl shadow-2xl backdrop-blur-md max-w-sm"
            >
              <div className="relative mb-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                  className="absolute -inset-4 rounded-full bg-gradient-to-r from-amber-400 via-pink-400 to-indigo-400 opacity-60 blur-md"
                />
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className="relative text-7xl p-6 bg-white/20 rounded-full border-2 border-white/50 shadow-inner cursor-pointer"
                  onClick={() => {
                    playSparkleChime(soundEnabled);
                    fireStarExplosion();
                  }}
                >
                  {createdCreature.emoji}
                </motion.div>
              </div>

              <h2 className="text-2xl font-black text-amber-200 drop-shadow flex items-center gap-2 mb-1">
                <Sparkles className="w-6 h-6 text-amber-300 animate-spin" />
                {createdCreature.title}
                <Sparkles className="w-6 h-6 text-amber-300 animate-spin" />
              </h2>
              <p className="text-white/90 text-sm font-medium mb-5">
                신비한 마법이 솥 안에서 반짝이며 탄생했어요!
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextRound}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-pink-500 text-white font-black text-base rounded-full shadow-lg shadow-pink-500/40 border border-white/40"
              >
                <Star className="w-5 h-5 fill-current" />
                <span>{round + 1 >= totalRounds ? '모험 완성하기!' : '다음 마법 만들기'}</span>
              </motion.button>
            </motion.div>
          ) : (
            /* Brewing Cauldron */
            <div className="relative flex flex-col items-center">
              {/* Cauldron Vessel */}
              <div
                ref={cauldronRef}
                onClick={phase === 'stirring' ? handleStir : undefined}
                className={`relative w-64 h-56 flex flex-col items-center justify-center cursor-pointer transition-transform ${
                  phase === 'stirring' ? 'hover:scale-105 active:scale-95' : ''
                }`}
              >
                {/* Glowing Aura Behind Cauldron */}
                <div
                  className="absolute inset-2 rounded-full opacity-60 blur-xl transition-all duration-700 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, ${currentColorRgb} 0%, transparent 70%)`,
                  }}
                />

                {/* Cauldron Cast Iron Body */}
                <svg viewBox="0 0 200 180" className="w-full h-full drop-shadow-2xl">
                  {/* Feet */}
                  <ellipse cx="60" cy="168" rx="14" ry="8" fill="#1e293b" />
                  <ellipse cx="140" cy="168" rx="14" ry="8" fill="#1e293b" />
                  {/* Cauldron Pot */}
                  <path
                    d="M 30,50 C 15,100 25,160 100,160 C 175,160 185,100 170,50 Z"
                    fill="url(#cauldronMetal)"
                  />
                  {/* Cauldron Rim */}
                  <ellipse cx="100" cy="48" rx="76" ry="20" fill="#334155" stroke="#475569" strokeWidth="4" />
                  {/* Inner Liquid Surface */}
                  <ellipse
                    cx="100"
                    cy="48"
                    rx="68"
                    ry="15"
                    fill={currentColorRgb}
                    className="transition-colors duration-700"
                  />
                  {/* Liquid highlight swirl */}
                  <ellipse
                    cx="96"
                    cy="46"
                    rx="50"
                    ry="9"
                    fill="rgba(255,255,255,0.35)"
                    className={phase === 'brewing' || phase === 'stirring' ? 'animate-pulse' : ''}
                  />

                  {/* Shading gradients */}
                  <defs>
                    <linearGradient id="cauldronMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#334155" />
                      <stop offset="50%" stopColor="#1e293b" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Bubbles Floating Inside/Above Liquid */}
                <div className="absolute inset-x-8 top-6 h-20 pointer-events-none overflow-hidden">
                  {bubbles.map((b) => (
                    <div
                      key={b.id}
                      className="absolute rounded-full border border-white/60 bg-white/30 backdrop-blur-xs transition-transform"
                      style={{
                        left: `${b.x}%`,
                        top: `${b.y}%`,
                        width: `${b.size}px`,
                        height: `${b.size}px`,
                      }}
                    />
                  ))}
                </div>

                {/* Magic Stirring Wand */}
                {phase === 'stirring' && (
                  <motion.div
                    animate={{ rotate: [wandAngle, wandAngle + 30, wandAngle] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="absolute top-2 right-12 z-20 pointer-events-none drop-shadow-lg"
                  >
                    <Wand2 className="w-16 h-16 text-amber-300 filter drop-shadow" />
                  </motion.div>
                )}
              </div>

              {/* Status & Action Prompt Pill */}
              <div className="mt-3">
                {phase === 'adding' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-950/70 border border-purple-400/40 rounded-full text-purple-200 text-xs font-bold shadow-md">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>
                      재료를 퐁당 넣어주세요! ({addedIngredients.length}/{requiredCount})
                    </span>
                  </div>
                )}
                {phase === 'stirring' && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStir}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-purple-500 text-white font-extrabold text-sm rounded-full shadow-lg shadow-purple-500/50 border border-white/40 animate-bounce"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>솥을 톡톡 눌러 저어봐요! ({stirProgress}/3)</span>
                  </motion.button>
                )}
                {phase === 'brewing' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/30 border border-amber-400/50 rounded-full text-amber-200 text-xs font-bold animate-pulse">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>보글보글! 신비한 마법이 피어오르고 있어요...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Ingredients Shelf */}
      <footer className="relative z-10 p-3 bg-slate-950/80 backdrop-blur-md border-t border-indigo-500/20">
        <div className="flex items-center justify-center gap-2 max-w-xl mx-auto overflow-x-auto py-1">
          {INGREDIENTS.map((item) => {
            const isAlreadyAdded = addedIngredients.some((a) => a.id === item.id);
            const isNeeded = targetRecipe.required.includes(item.id);
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.92 }}
                disabled={phase !== 'adding' || addedIngredients.length >= requiredCount}
                onClick={() => handleSelectIngredient(item)}
                className={`relative flex flex-col items-center justify-center p-2 rounded-2xl min-w-[64px] h-20 transition-all border ${
                  isAlreadyAdded
                    ? 'opacity-40 bg-slate-800 border-slate-700 pointer-events-none'
                    : isRecipeMode && isNeeded
                    ? 'bg-indigo-900/70 border-amber-400/80 shadow-md shadow-amber-400/20'
                    : 'bg-indigo-950/60 border-indigo-500/30 hover:border-indigo-400'
                }`}
              >
                {isRecipeMode && isNeeded && !isAlreadyAdded && (
                  <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full shadow">
                    필요
                  </span>
                )}
                <span className="text-3xl mb-1 filter drop-shadow">{item.emoji}</span>
                <span className="text-white text-xs font-bold tracking-tight">{item.name}</span>
              </motion.button>
            );
          })}
        </div>
      </footer>
    </div>
  );
};
