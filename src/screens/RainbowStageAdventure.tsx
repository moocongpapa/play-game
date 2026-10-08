import { DragMatch, DragPiece, DropSlot, DragHint } from '../components/DragMatch';
import { RoundContinuation } from '../components/RoundContinuation';
import { useSoundClue } from '../hooks/useSoundClue';
import { PLAY_THEMES } from '../data/playThemes';
import { pickNextRound, shuffle } from '../utils/roundDeck';
import { CHARACTERS } from '../data/characters';
import { GameArtwork } from '../components/GameArtwork';
import { ToyArtwork, BasketArtwork } from '../components/ToyArtwork';
import { useGameTimeouts } from '../hooks/useGameTimeouts';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { JellyButton } from '../components/JellyButton';
import {
  speakText,
  playDingDongDang,
  playJellyTap,
  playBouncyBoing,
  playWrongBoing,
  playSparkleChime,
  playCelebrationFanfare,
  playBalloonPop,
} from '../utils/soundEngine';
import { fireConfetti, fireStarExplosion, fireCelebrationFireworks, fireBalloonPopParticle } from '../utils/confetti';
import { AgeGroup, CharacterId } from '../types';
import { Sparkles, Trophy, Home, RotateCcw, Volume2, Star } from 'lucide-react';

interface RainbowStageAdventureProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  onGoHome: () => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
}

// Level 1 Data (Animal Sounds)
interface AnimalQuizItem {
  id: string;
  name: string;
  soundKey: string;
  soundPrompt: string;
  emoji: string;
  color: string;
}

const ANIMAL_QUIZ_LIST: AnimalQuizItem[] = [
  { id: 'dog', name: '강아지', soundKey: 'dog', soundPrompt: '멍멍!', emoji: '🐶', color: '#FFE0B2' },
  { id: 'cat', name: '고양이', soundKey: 'cat', soundPrompt: '야옹~', emoji: '🐱', color: '#FFCDD2' },
  { id: 'duck', name: '오리', soundKey: 'duck', soundPrompt: '꽥꽥!', emoji: '🦆', color: '#FFF9C4' },
  { id: 'cow', name: '소', soundKey: 'cow', soundPrompt: '음메~', emoji: '🐮', color: '#BBDEFB' },
  { id: 'pig', name: '돼지', soundKey: 'pig', soundPrompt: '꿀꿀!', emoji: '🐷', color: '#F8BBD0' },
  { id: 'frog', name: '개구리', soundKey: 'frog', soundPrompt: '개굴개굴!', emoji: '🐸', color: '#C8E6C9' },
  { id: 'sheep', name: '양', soundKey: 'sheep', soundPrompt: '매애~', emoji: '🐑', color: '#FFF8E1' },
  { id: 'horse', name: '말', soundKey: 'horse', soundPrompt: '히이잉~', emoji: '🐴', color: '#EFEBE9' },
  { id: 'rooster', name: '수탉', soundKey: 'rooster', soundPrompt: '꼬끼오!', emoji: '🐓', color: '#FFE0B2' },
  { id: 'bird', name: '새', soundKey: 'bird', soundPrompt: '짹짹~', emoji: '🐦', color: '#E1F5FE' },
];

// Level 2 Data (Color Basket Sort)
interface BasketSortItem {
  id: string;
  name: string;
  colorId: 'red' | 'yellow' | 'green';
  emoji: string;
}

const SORT_ITEMS: BasketSortItem[] = [
  { id: 'apple', name: '사과', colorId: 'red', emoji: '🍎' },
  { id: 'banana', name: '바나나', colorId: 'yellow', emoji: '🍌' },
  { id: 'watermelon', name: '수박', colorId: 'green', emoji: '🍉' },
  { id: 'strawberry', name: '딸기', colorId: 'red', emoji: '🍓' },
  { id: 'lemon', name: '레몬', colorId: 'yellow', emoji: '🍋' },
  { id: 'kiwi', name: '키위', colorId: 'green', emoji: '🥝' },
  { id: 'cherries', name: '체리', colorId: 'red', emoji: '🍒' },
  { id: 'pineapple', name: '파인애플', colorId: 'yellow', emoji: '🍍' },
  { id: 'green-apple', name: '초록 사과', colorId: 'green', emoji: '🍏' },
];

// Level 4 Data (Shadow Silhouette Puzzle)
interface ShadowPuzzleItem {
  id: string;
  name: string;
  emoji: string;
  bg: string;
}

const SHADOW_PUZZLE_LIST: ShadowPuzzleItem[] = [
  { id: 'car', name: '자동차', emoji: '🚗', bg: '#FFEBEE' },
  { id: 'butterfly', name: '나비', emoji: '🦋', bg: '#F3E5F5' },
  { id: 'rocket', name: '우주선', emoji: '🚀', bg: '#E0F7FA' },
  { id: 'dog', name: '강아지', emoji: '🐶', bg: '#FFF8E1' },
  { id: 'rabbit', name: '토끼', emoji: '🐰', bg: '#F3E5F5' },
  { id: 'penguin', name: '펭귄', emoji: '🐧', bg: '#E0F2F1' },
  { id: 'turtle', name: '거북이', emoji: '🐢', bg: '#E8F5E9' },
  { id: 'elephant', name: '코끼리', emoji: '🐘', bg: '#E3F2FD' },
  { id: 'plane', name: '비행기', emoji: '✈️', bg: '#FFF8E1' },
  { id: 'train', name: '기차', emoji: '🚂', bg: '#FCE4EC' },
];

export const RainbowStageAdventure: React.FC<RainbowStageAdventureProps> = ({
  onCompleteQuiz,
  buddy,
  onGoHome,
  soundEnabled,
  childName,
}) => {
  const friend = CHARACTERS[buddy];
  const { playClue, status: clueStatus } = useSoundClue(soundEnabled, buddy);
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();

  const reducedMotion = useReducedMotion();
  const clearingLevel = useRef(false);
  const poppedIds = useRef(new Set<string>());
  // Current Stage (1, 2, 3, 4, 5=Trophy Party)
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [clearedLevels, setClearedLevels] = useState<number[]>([]);
  const [stampAnimationLevel, setStampAnimationLevel] = useState<number | null>(null);

  // -------------------------------------------------------------
  // LEVEL 1 State: Animal Sound Match
  // -------------------------------------------------------------
  const [l1Target, setL1Target] = useState<AnimalQuizItem>(ANIMAL_QUIZ_LIST[0]);
  const [l1Options, setL1Options] = useState<AnimalQuizItem[]>([]);
  const [l1WrongId, setL1WrongId] = useState<string | null>(null);

  const initLevel1 = () => {
    const target = pickNextRound(ANIMAL_QUIZ_LIST, 'adventure:animals');
    const others = ANIMAL_QUIZ_LIST.filter((a) => a.id !== target.id).sort(() => Math.random() - 0.5).slice(0, 2);
    const opts = [target, ...others].sort(() => Math.random() - 0.5);

    setL1Target(target);
    setL1Options(opts);
    setL1WrongId(null);

    scheduleGameTimeout(() => {
      playClue(target.soundKey, target.soundPrompt);
    }, 400);
  };

  const handleL1Select = (item: AnimalQuizItem) => {
    if (clearingLevel.current) return;
    if (item.id === l1Target.id) {
      // Correct!
      playDingDongDang(soundEnabled);
      fireConfetti();
      triggerStageClear(1, `정답이에요! 짝짝짝! 귀여운 ${l1Target.name}였어요!`);
    } else {
      // Wrong boing
      setL1WrongId(item.id);
      playWrongBoing(soundEnabled);
      speakText(`다시 소리를 잘 들어볼까요?`, soundEnabled, { characterId: buddy });
      scheduleGameTimeout(() => {
        setL1WrongId(null);
        playClue(l1Target.soundKey, l1Target.soundPrompt);
      }, 700);
    }
  };

  // -------------------------------------------------------------
  // LEVEL 2 State: Color Basket Sort
  // -------------------------------------------------------------
  const [l2SortedCount, setL2SortedCount] = useState(0);
  const [l2RemainingItems, setL2RemainingItems] = useState<BasketSortItem[]>([]);
  const [l2BasketBounce, setL2BasketBounce] = useState<'red' | 'yellow' | 'green' | null>(null);

  const initLevel2 = () => {
    setL2SortedCount(0);
    const selected = [...SORT_ITEMS].sort(() => Math.random() - 0.5).slice(0, 3);
    setL2RemainingItems(selected);

    scheduleGameTimeout(() => {
      speakText(`알록달록 과일을 같은 색깔 바구니에 쏙 넣어주세요!`, soundEnabled, { characterId: buddy });
    }, 400);
  };

  const handleL2SortFruit = (fruit: BasketSortItem, basketColor: 'red' | 'yellow' | 'green') => {
    if (clearingLevel.current || !l2RemainingItems.some(item => item.id === fruit.id)) return;
    if (fruit.colorId === basketColor) {
      // Correct match
      playJellyTap(soundEnabled);
      playSparkleChime(soundEnabled);
      setL2BasketBounce(basketColor);
      scheduleGameTimeout(() => setL2BasketBounce(null), 500);

      const nextRemaining = l2RemainingItems.filter((f) => f.id !== fruit.id);
      setL2RemainingItems(nextRemaining);
      const nextCount = l2SortedCount + 1;
      setL2SortedCount(nextCount);

      if (nextCount >= 3) {
        playDingDongDang(soundEnabled);
        fireConfetti();
        triggerStageClear(2, `우와! 과일들을 바구니에 예쁘게 다 모았어요! 멋지다!`);
      } else {
        speakText(`쏙! 참 잘했어요!`, soundEnabled, { characterId: buddy, playIntroSFX: false });
      }
    } else {
      // Wrong basket
      playWrongBoing(soundEnabled);
      speakText(`다른 색깔 바구니를 찾아볼까요?`, soundEnabled, { characterId: buddy });
    }
  };

  // -------------------------------------------------------------
  // LEVEL 3 State: Floating Balloon Pop
  // -------------------------------------------------------------
  const [l3Balloons, setL3Balloons] = useState<
    Array<{ id: string; x: number; color: string; bg: string; emoji: string; size: number }>
  >([]);
  const [l3Popped, setL3Popped] = useState(0);

  const initLevel3 = () => {
    setL3Popped(0);
    const palettes = [
      { color: '#FF6B8B', bg: '#FF4081', emoji: '🍓' },
      { color: '#FFD15C', bg: '#FFA000', emoji: '⭐' },
      { color: '#4ADE80', bg: '#22C55E', emoji: '🍏' },
      { color: '#60A5FA', bg: '#3B82F6', emoji: '🐬' },
      { color: '#C084FC', bg: '#A855F7', emoji: '🍇' },
    ];
    const theme = pickNextRound(PLAY_THEMES, 'adventure:balloons');
    const pictures = shuffle(theme.items);
    const initialBalloons = palettes.map((p, i) => ({
      id: `bal-${i}`,
      x: 15 + i * 16,
      color: p.color,
      bg: p.bg,
      emoji: pictures[i].emoji,
      size: 90,
    }));
    setL3Balloons(initialBalloons);

    scheduleGameTimeout(() => {
      speakText(`${friend.name}와 함께 둥둥 떠오르는 풍선 5개를 팡팡 터뜨려보자!`, soundEnabled, {
        characterId: buddy,
      });
    }, 400);
  };

  const handleL3Pop = (id: string, color: string, e: React.MouseEvent | React.TouchEvent) => {
    if (clearingLevel.current || poppedIds.current.has(id)) return;
    poppedIds.current.add(id);
    playBalloonPop(soundEnabled);

    let cx = window.innerWidth * 0.5;
    let cy = window.innerHeight * 0.5;
    if ('clientX' in e && e.clientX) {
      cx = e.clientX;
      cy = e.clientY;
    } else if ('touches' in e && e.touches[0]) {
      cx = e.touches[0].clientX;
      cy = e.touches[0].clientY;
    }

    fireBalloonPopParticle(cx, cy, color);
    setL3Balloons((prev) => prev.filter((b) => b.id !== id));

    const nextCount = l3Popped + 1;
    setL3Popped(nextCount);

    const koreanNumbers = ['하나!', '둘!', '셋!', '넷!', '다섯!'];
    speakText(koreanNumbers[nextCount - 1] || `${nextCount}!`, soundEnabled, {
      characterId: buddy,
      playIntroSFX: false,
    });

    if (nextCount >= 5) {
      playDingDongDang(soundEnabled);
      fireConfetti();
      triggerStageClear(3, `와아! 풍선 5개를 모두 팡팡 터뜨렸어요!`);
    }
  };

  // -------------------------------------------------------------
  // LEVEL 4 State: Shadow Silhouette Puzzle
  // -------------------------------------------------------------
  const [l4Target, setL4Target] = useState<ShadowPuzzleItem>(SHADOW_PUZZLE_LIST[0]);
  const [l4Options, setL4Options] = useState<ShadowPuzzleItem[]>([]);
  const [l4Solved, setL4Solved] = useState(false);

  const initLevel4 = () => {
    setL4Solved(false);
    const target = pickNextRound(SHADOW_PUZZLE_LIST, 'adventure:shadows');
    const others = SHADOW_PUZZLE_LIST.filter((s) => s.id !== target.id).sort(() => Math.random() - 0.5).slice(0, 2);
    const opts = [target, ...others].sort(() => Math.random() - 0.5);

    setL4Target(target);
    setL4Options(opts);

    scheduleGameTimeout(() => {
      speakText(`깜깜한 그림자가 나타났어요! 이 그림자에 꼭 맞는 친구를 맞춰주세요!`, soundEnabled, {
        characterId: buddy,
      });
    }, 400);
  };

  const handleL4Match = (item: ShadowPuzzleItem) => {
    if (l4Solved) return;

    if (item.id === l4Target.id) {
      setL4Solved(true);
      playSparkleChime(soundEnabled);
      playDingDongDang(soundEnabled);
      fireConfetti();
      fireStarExplosion();
      triggerStageClear(4, `정답이에요! 그림자에 쏙 들어맞았어요!`);
    } else {
      playWrongBoing(soundEnabled);
      speakText(`그림자 모양을 다시 한번 살펴볼까요?`, soundEnabled, { characterId: buddy });
    }
  };

  // -------------------------------------------------------------
  // Stage Clearance & Progression
  // -------------------------------------------------------------
  const triggerStageClear = (levelNumber: number, praiseMessage: string) => {
    if (clearingLevel.current) return;
    clearingLevel.current = true;
    setStampAnimationLevel(levelNumber);
    setClearedLevels((prev) => (prev.includes(levelNumber) ? prev : [...prev, levelNumber]));
    onCompleteQuiz(2);

    speakText(`와, 정말 잘했어! 멋지다! ${praiseMessage}`, soundEnabled, { characterId: buddy });

    scheduleGameTimeout(() => {
      setStampAnimationLevel(null);
      if (levelNumber === 4) {
        // Grand Final Celebration!
        setCurrentLevel(5);
        speakText(`축하합니다! ${childName}야, 모든 단계를 완료하고 황금 트로피를 받았어요! 최고야!`, soundEnabled, { characterId: buddy });
      } else {
        const next = (levelNumber + 1) as 2 | 3 | 4;
        setCurrentLevel(next);
      }
    }, 2200);
  };

  // Init levels whenever currentLevel changes
  useEffect(() => {
    clearingLevel.current = false;
    poppedIds.current.clear();
    if (currentLevel === 1) initLevel1();
    if (currentLevel === 2) initLevel2();
    if (currentLevel === 3) initLevel3();
    if (currentLevel === 4) initLevel4();
    if (currentLevel === 5) {
      playCelebrationFanfare(soundEnabled);
      fireCelebrationFireworks(1600);
    }
    return clearGameTimeouts;
  }, [currentLevel, clearGameTimeouts]);

  // Restart Adventure
  const restartAdventure = () => {
    clearGameTimeouts();
    setClearedLevels([]);
    setStampAnimationLevel(null);
    clearingLevel.current = false;
    if (currentLevel === 1) initLevel1();
    else setCurrentLevel(1);
    speakText(`신나는 무지개 모험을 처음부터 다시 시작해요!`, soundEnabled, { characterId: buddy });
  };

  return (
    <div className="adventure-board relative w-full max-w-3xl mx-auto flex flex-col items-center select-none overflow-hidden pb-8">
      {/* Top Header & Stage Badges */}
      <div className="w-full bg-white/95 backdrop-blur-xs p-3.5 sm:p-4 rounded-[32px] border-3 border-amber-300 shadow-md mb-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">

            <h1 className="text-base sm:text-xl font-black text-[#4A3E3D] flex items-center gap-1.5">
              <span>🌈 {childName}의 무지개 스테이지 모험</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h1>
          </div>

          <button
            onClick={restartAdventure}
            className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-black rounded-full flex items-center gap-1 border border-rose-300 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 처음부터
          </button>
        </div>

        {/* 4 Stage Stepper Bar */}
        <div className="stage-steps grid grid-cols-4 gap-1.5 sm:gap-2">
          {[
            { lvl: 1, label: '동물소리', game: 'sound_quiz' as const },
            { lvl: 2, label: '색깔분류', game: 'counting_food' as const },
            { lvl: 3, label: '풍선팡팡', game: 'balloon_pop' as const },
            { lvl: 4, label: '그림자', game: 'shadow_quiz' as const },
          ].map((s) => {
            const isCleared = clearedLevels.includes(s.lvl);
            const isCurrent = currentLevel === s.lvl;

            return (
              <motion.div
                key={`stage-step-${s.lvl}`}
                animate={{ scale: isCurrent ? [1, 1.04, 1] : 1 }}
                transition={{ duration: 1.5, repeat: isCurrent ? Infinity : 0 }}
                className={`py-1.5 px-2 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${
                  isCurrent
                    ? 'bg-amber-100 border-amber-400 shadow-xs'
                    : isCleared
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-gray-100/70 border-gray-200 text-gray-400 opacity-70'
                }`}
              >
                <div className="w-full mb-1"><GameArtwork gameId={s.game} /></div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black">{s.lvl}단계</span>
                  {isCleared && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />}
                </div>
                <span className="text-[10px] font-bold truncate">{s.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* STAMP CLEAR POPUP OVERLAY */}
      <AnimatePresence>
        {stampAnimationLevel && (
          <motion.div
            initial={{ scale: 0.2, opacity: 0, rotate: -20 }}
            animate={{ scale: [0.5, 1.25, 1], opacity: 1, rotate: [-15, 5, 0] }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 18 }}
            className="fixed inset-0 m-auto z-50 pointer-events-none flex flex-col items-center justify-center"
          >
            <div className="bg-white/95 border-4 border-amber-400 rounded-[40px] p-8 shadow-2xl flex flex-col items-center text-center max-w-xs">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 0.8 }}
                className="text-7xl mb-2 filter drop-shadow-md"
              >
                ⭐
              </motion.div>
              <span className="text-3xl font-black text-amber-600 mb-1">
                {stampAnimationLevel}단계 클리어!
              </span>
              <span className="text-sm font-bold text-gray-600">
                별 스탬프를 쾅 찍었어요! 🌟
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* LEVEL 1: 동물/사물 소리 짝 맞추기 */}
      {/* ========================================================= */}
      {currentLevel === 1 && (
        <motion.div
          key="stage-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-[#FFF3E0] rounded-[36px] border-4 border-[#FFA726] p-4 sm:p-6 shadow-lg flex flex-col items-center text-center gap-4"
        >
          {/* Character & Question Banner */}
          <div className="flex items-center gap-3 bg-white/90 p-3 sm:p-4 rounded-3xl border-2 border-orange-200 shadow-xs w-full max-w-md">
            <CharacterAvatar id={buddy} size="md" mood="talking" className="!w-16 !h-16 shrink-0" />
            <div className="text-left flex-1 min-w-0">
              <span className="text-xs font-black text-orange-600 block">Level 1 &bull; 소리 듣고 동물 찾기</span>
              <p className="text-base sm:text-lg font-black text-[#4A3E3D] leading-snug">
                "{l1Target.soundPrompt}" 소리의 주인은 누구일까요?
              </p>
            </div>
            <button
              onClick={() => playClue(l1Target.soundKey, l1Target.soundPrompt)}
              className="p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full active:scale-95 shadow-xs cursor-pointer"
              title="다시 듣기"
            >
              <Volume2 className="w-6 h-6 animate-pulse" />
            </button>
          </div>

          {(!soundEnabled || clueStatus === 'fallback') && <div className="visual-prompt"><ToyArtwork emoji={l1Target.emoji} label="찾을 동물" /><span aria-hidden="true">→ ?</span></div>}

          {/* Large Animal Cards (Jumbo touch targets for 3~4 year olds) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-xl my-2">
            {l1Options.map((opt) => (
              <motion.button
                key={opt.id}
                whileHover={{ scale: 1.05 }}
                animate={{
                  x: l1WrongId === opt.id ? [-8, 8, -8, 8, 0] : 0,
                }}
                transition={{ type: 'spring', stiffness: 350, damping: 15 }}
                onClick={() => handleL1Select(opt)}
                style={{ backgroundColor: opt.color }}
                className="stage-animal-option p-2 sm:p-6 rounded-[24px] border-4 border-amber-300 shadow-md flex flex-col items-center justify-center gap-2 cursor-pointer touch-manipulation min-h-[140px]"
              >
                <span className="text-6xl sm:text-7xl filter drop-shadow-sm select-none"><ToyArtwork emoji={opt.emoji} /></span>
                <span className="text-xl sm:text-2xl font-black text-[#4A3E3D]">{opt.name}</span>
              </motion.button>
            ))}
          </div>

          <p className="text-xs font-bold text-orange-800/80 bg-white/70 py-1.5 px-4 rounded-full">
            💡 소리 버튼을 누르면 울음소리를 다시 들을 수 있어요!
          </p>
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* LEVEL 2: 색깔 과일 바구니 분류 (드래그 & 원터치) */}
      {/* ========================================================= */}
      {currentLevel === 2 && (
        <DragMatch resetKey={currentLevel} disabled={l2SortedCount >= 3} onDrop={(id, basketId) => {
          const fruit = l2RemainingItems.find(item => item.id === id);
          if (!fruit || clearingLevel.current || !['red', 'yellow', 'green'].includes(basketId)) return false;
          handleL2SortFruit(fruit, basketId as BasketSortItem['colorId']);
          return fruit.colorId === basketId;
        }}>
        <motion.div
          key="stage-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-[#E8F5E9] rounded-[36px] border-4 border-[#66BB6A] p-4 sm:p-6 shadow-lg flex flex-col items-center text-center gap-4"
        >
          {/* Guide Banner */}
          <div className="flex items-center gap-3 bg-white/90 p-3 sm:p-4 rounded-3xl border-2 border-emerald-200 shadow-xs w-full max-w-md">
            <CharacterAvatar id={buddy} size="md" mood="happy" className="!w-16 !h-16 shrink-0" />
            <div className="text-left flex-1 min-w-0">
              <span className="text-xs font-black text-emerald-600 block">Level 2 &bull; 색깔 바구니 분류</span>
              <p className="text-base sm:text-lg font-black text-[#4A3E3D] leading-snug">
                과일을 같은 색깔 바구니에 쏙 넣어주세요! ({l2SortedCount}/3)
              </p>
            </div>
          </div>

          {/* Fruit Selection Deck */}
          <div className="fruit-tray w-full max-w-md bg-white/80 p-3.5 rounded-3xl border-2 border-emerald-200 shadow-xs flex items-center justify-center gap-4 min-h-[100px]">
            {l2RemainingItems.length === 0 ? (
              <span className="text-sm font-black text-emerald-700 animate-pulse">
                모든 과일을 다 넣었어요! 짝짝짝! 👏
              </span>
            ) : (
              l2RemainingItems.map((fruit) => {
                return (
                  <DragPiece
                    key={fruit.id}
                    id={fruit.id} label={fruit.name}
                    className="fruit-drag-piece p-2 sm:p-4 rounded-3xl border-3 border-amber-200 shadow-md flex flex-col items-center bg-white"
                  >
                    <span className="text-5xl sm:text-6xl drop-shadow-sm select-none"><ToyArtwork emoji={fruit.id === 'watermelon' ? 'watermelon-whole' : fruit.emoji} /></span>
                    <span className="text-xs font-black text-[#4A3E3D] mt-1">{fruit.name}</span>
                  </DragPiece>
                );
              })
            )}
          </div>

          {/* 3 Color Baskets (Red, Yellow, Green) */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 w-full max-w-xl">
            {[
              { colorId: 'red' as const, label: '빨강 바구니', bg: '#FFEBEE', border: '#EF5350', basketEmoji: '🧺 🔴' },
              { colorId: 'yellow' as const, label: '노랑 바구니', bg: '#FFFDE7', border: '#FBC02D', basketEmoji: '🧺 🟡' },
              { colorId: 'green' as const, label: '초록 바구니', bg: '#E8F5E9', border: '#4CAF50', basketEmoji: '🧺 🟢' },
            ].map((basket) => {
              const isBouncing = l2BasketBounce === basket.colorId;

              return (
                <DropSlot
                  key={basket.colorId} id={basket.colorId} label={basket.label}
                  className={`color-basket basket-${basket.colorId} p-2 sm:p-5 rounded-[24px] border-3 shadow-md flex flex-col items-center justify-center gap-1.5 min-h-[130px]`}
                >
                  <motion.span className="w-full flex justify-center" animate={{ scale: isBouncing ? [1, 1.15, 1] : 1 }}>
                    <BasketArtwork color={basket.border} />
                  </motion.span>
                  <span className="text-xs sm:text-sm font-black text-[#4A3E3D]">{basket.label}</span>
                </DropSlot>
              );
            })}
          </div>

          <DragHint>과일을 잡아 바구니에 쏙!</DragHint>
        </motion.div>
        </DragMatch>
      )}

      {/* ========================================================= */}
      {/* LEVEL 3: 둥둥 풍선 터뜨리기 (숫자 카운트와 함께 팡!) */}
      {/* ========================================================= */}
      {currentLevel === 3 && (
        <motion.div
          key="stage-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full h-[520px] bg-gradient-to-b from-[#E0F2FE] via-[#F0F9FF] to-[#FEF3C7] rounded-[36px] border-4 border-sky-400 p-4 shadow-lg overflow-hidden flex flex-col justify-between"
        >
          {/* Top Banner */}
          <div className="z-20 w-full bg-white/90 p-3 rounded-2xl border-2 border-sky-300 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CharacterAvatar id={buddy} size="sm" mood="happy" className="!w-10 !h-10" />
              <span className="text-sm font-black text-[#4A3E3D]">
                풍선을 터치해 팡팡! ({l3Popped}/5)
              </span>
            </div>
            <span className="text-xl">🎈</span>
          </div>

          {/* Floating Balloons */}
          <div className="absolute inset-0 z-10 overflow-hidden pointer-events-auto">
            {l3Balloons.map((b) => (
              <motion.button
                key={b.id}
                aria-label="풍선 터뜨리기"
                initial={reducedMotion ? false : { y: 460, scale: 0.8 }}
                animate={reducedMotion ? { y: 150 + (l3Balloons.indexOf(b) % 3) * 95, scale: 1 } : { y: -140, scale: 1 }}
                transition={reducedMotion ? { duration: 0 } : { y: { duration: 9, delay: l3Balloons.indexOf(b) * 0.6, ease: 'linear', repeat: Infinity } }}
                onClick={(e) => handleL3Pop(b.id, b.color, e)}
                style={{
                  left: `calc(${Math.max(22, Math.min(78, b.x))}% - ${b.size / 2}px)`,
                  width: b.size,
                  height: b.size * 1.25,
                  background: `radial-gradient(circle at 35% 35%, #FFFFFF 0%, ${b.color} 50%, ${b.bg} 100%)`,
                }}
                className="absolute rounded-full cursor-pointer shadow-lg flex items-center justify-center border-2 border-white/60 active:scale-90 touch-manipulation"
              >
                <div className="absolute top-2 left-3 w-3 h-5 bg-white/70 rounded-full blur-[1px] -rotate-12" />
                <span className="text-3xl select-none"><ToyArtwork emoji={b.emoji} /></span>
              </motion.button>
            ))}
          </div>

          <div className="z-20 text-center">
            <span className="text-xs font-bold text-sky-800 bg-white/80 py-1 px-4 rounded-full">
              떠오르는 풍선을 손가락으로 콕 찔러보세요!
            </span>
          </div>
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* LEVEL 4: 그림자 실루엣 퍼즐 */}
      {/* ========================================================= */}
      {currentLevel === 4 && (
        <DragMatch resetKey={l4Target.id} disabled={l4Solved} onDrop={id => {
          const item = l4Options.find(option => option.id === id);
          if (!item || l4Solved || clearingLevel.current) return false;
          handleL4Match(item);
          return item.id === l4Target.id;
        }}>
        <motion.div
          key="stage-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-[#EDE7F6] rounded-[36px] border-4 border-[#BA68C8] p-4 sm:p-6 shadow-lg flex flex-col items-center text-center gap-4"
        >
          {/* Guide Banner */}
          <div className="flex items-center gap-3 bg-white/90 p-3 sm:p-4 rounded-3xl border-2 border-purple-200 shadow-xs w-full max-w-md">
            <CharacterAvatar id={buddy} size="md" mood="talking" className="!w-16 !h-16 shrink-0" />
            <div className="text-left flex-1 min-w-0">
              <span className="text-xs font-black text-purple-600 block">Level 4 &bull; 그림자 실루엣 퍼즐</span>
              <p className="text-base sm:text-lg font-black text-[#4A3E3D] leading-snug">
                그림을 잡아 같은 그림자 위에 올려 주세요!
              </p>
            </div>
          </div>

          {/* Central Silhouette Display Frame */}
          <DropSlot id="shadow" label="그림자" filled={l4Solved} className="w-40 h-40 sm:w-60 sm:h-60 rounded-[36px] bg-white border-4 border-dashed border-purple-400 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
            <motion.span
              animate={l4Solved ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : {}}
              transition={{ duration: 0.6 }}
              className={`text-8xl sm:text-9xl transition-all duration-500 select-none ${
                l4Solved ? 'filter-none' : 'filter brightness-0 contrast-200 opacity-80'
              }`}
            >
              <ToyArtwork emoji={l4Target.emoji} />
            </motion.span>
            {l4Solved && (
              <span className="text-base font-black text-purple-700 mt-2 animate-bounce">
                {l4Target.name} 완성! ✨
              </span>
            )}
          </DropSlot>
          <DragHint>그림자 위에 쏙!</DragHint>

          {/* Object Choice Cards */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-md">
            {l4Options.map((opt) => (
              <DragPiece
                key={opt.id}
                whileHover={{ scale: 1.08 }}
                id={opt.id} label={opt.name}
                className="p-4 rounded-3xl bg-white border-3 border-purple-300 shadow-md flex flex-col items-center justify-center cursor-pointer active:scale-95 touch-manipulation min-h-[100px]"
              >
                <span className="text-5xl sm:text-6xl drop-shadow-xs select-none"><ToyArtwork emoji={opt.emoji} /></span>
                <span className="text-sm font-black text-[#4A3E3D] mt-1">{opt.name}</span>
              </DragPiece>
            ))}
          </div>
        </motion.div>
        </DragMatch>
      )}

      {/* ========================================================= */}
      {/* LEVEL 5: 최종 완료 축하 트로피 & 인터랙티브 축하 파티 화면 */}
      {/* ========================================================= */}
      {currentLevel === 5 && (
        <motion.div
          key="stage-trophy-party"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-full bg-gradient-to-b from-[#FFF9C4] via-[#FFE082] to-[#FFCC80] rounded-[40px] border-4 border-amber-400 p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-5 relative overflow-hidden"
        >
          {/* Trophy Header */}
          <motion.button
            aria-label="트로피 축하하기"
            onClick={() => {
              playSparkleChime(soundEnabled);
              fireConfetti();
            }}
            animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-amber-400/30 border-4 border-amber-500 flex items-center justify-center shadow-lg"
          >
            <Trophy className="w-14 h-14 sm:w-16 sm:h-16 text-amber-600 drop-shadow-md" />
          </motion.button>

          <div>
            <h2 className="text-2xl sm:text-4xl font-black text-[#4A3E3D] mb-1">
              🏆 축하합니다! 트로피 획득! 🏆
            </h2>
            <p className="text-base sm:text-xl font-black text-amber-800">
              {childName}야, 4가지 무지개 모험을 모두 멋지게 해냈어요!
            </p>
          </div>

          {/* The selected friend celebrates the whole adventure with the child. */}
          <div className="flex flex-col items-center gap-2 my-2">
            <CharacterAvatar id={buddy} size="lg" mood="dancing" />
            <span className="text-lg font-black text-amber-900">{friend.name}도 신나서 짝짝짝!</span>
          </div>

          {/* Interactive touch hint */}
          <div className="bg-white/80 py-2 px-5 rounded-full border-2 border-amber-300 text-xs sm:text-sm font-black text-amber-900 animate-pulse">
            ✨ 트로피를 콕 누르면 축하 꽃가루가 날려요! ✨
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-3 w-full max-w-sm mt-2">
            <RoundContinuation onNext={restartAdventure} delayMs={5000} label="새로운 모험이 곧 시작돼요!" />
            <JellyButton
              soundEnabled={soundEnabled}
              onClick={onGoHome}
              variant="secondary"
              size="lg"
              className="w-full"
            >
              <Home className="w-5 h-5 mr-1.5" /> 홈으로 가기
            </JellyButton>
          </div>
        </motion.div>
      )}
    </div>
  );
};
