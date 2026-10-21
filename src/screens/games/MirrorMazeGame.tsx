import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Sparkles, Compass, Lightbulb, Footprints, ShieldCheck } from 'lucide-react';
import type { CharacterId, AgeGroup } from '../../types';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { PlayGuide, PlayProgress } from '../../components/ToddlerPlay';
import { ToyArtwork } from '../../components/ToyArtwork';
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

interface MirrorMazeGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup?: AgeGroup;
  childName?: string;
}

type Direction = 'N' | 'E' | 'S' | 'W';

interface GridCell {
  x: number;
  y: number;
  type: 'path' | 'wall' | 'mirror' | 'switch' | 'door' | 'receiver' | 'lantern' | 'goal';
  mirrorAngle?: number; // 0: \, 90: /, 180: \, 270: /
  doorKind?: 'light' | 'switch';
  switchId?: number;
  isSwitchPressed?: boolean;
}

interface MazeLevel {
  id: number;
  title: string;
  gridWidth: number;
  gridHeight: number;
  lantern: { x: number; y: number; dir: Direction };
  receiver: { x: number; y: number };
  start: { x: number; y: number };
  goal: { x: number; y: number };
  cells: GridCell[];
}

const GUIDE = '거울을 돌려 별빛을 비추고, 발판 스위치를 밟아 길을 열어볼까?';

// 90-degree reflection for mirrors:
// Angle 0 or 180 is '\' (reflects E<->S, W<->N)
// Angle 90 or 270 is '/' (reflects E<->N, W<->S)
function reflectDirection(dir: Direction, angle: number): Direction | null {
  const normAngle = ((angle % 360) + 360) % 360;
  if (normAngle === 0 || normAngle === 180) {
    // '\' mirror
    if (dir === 'E') return 'S';
    if (dir === 'N') return 'W';
    if (dir === 'W') return 'N';
    if (dir === 'S') return 'E';
  } else {
    // '/' mirror
    if (dir === 'E') return 'N';
    if (dir === 'S') return 'W';
    if (dir === 'W') return 'S';
    if (dir === 'N') return 'E';
  }
  return null;
}

const DIR_OFFSETS: Record<Direction, { dx: number; dy: number }> = {
  N: { dx: 0, dy: -1 },
  E: { dx: 1, dy: 0 },
  S: { dx: 0, dy: 1 },
  W: { dx: -1, dy: 0 },
};

function createLevels(ageGroup: AgeGroup): MazeLevel[] {
  if (ageGroup === 'baby') {
    return [
      // Baby Round 1: 4x4 grid, 1 mirror tap opens the light door!
      {
        id: 1,
        title: '반짝반짝 첫 번째 별빛 거울',
        gridWidth: 4,
        gridHeight: 4,
        lantern: { x: 0, y: 1, dir: 'E' },
        receiver: { x: 2, y: 3 },
        start: { x: 0, y: 2 },
        goal: { x: 3, y: 2 },
        cells: [
          { x: 0, y: 1, type: 'lantern' },
          { x: 1, y: 1, type: 'path' },
          { x: 2, y: 1, type: 'mirror', mirrorAngle: 90 }, // starts at 90 (/), needs 0 (\) to shoot South to (2,3)
          { x: 3, y: 1, type: 'wall' },

          { x: 0, y: 2, type: 'path' },
          { x: 1, y: 2, type: 'door', doorKind: 'light' },
          { x: 2, y: 2, type: 'path' },
          { x: 3, y: 2, type: 'goal' },

          { x: 0, y: 3, type: 'wall' },
          { x: 1, y: 3, type: 'wall' },
          { x: 2, y: 3, type: 'receiver' },
          { x: 3, y: 3, type: 'wall' },
        ],
      },
      // Baby Round 2: Step on Switch to open the gate!
      {
        id: 2,
        title: '찰칵! 마법 발판 스위치',
        gridWidth: 4,
        gridHeight: 4,
        lantern: { x: 0, y: 0, dir: 'E' },
        receiver: { x: 3, y: 0 },
        start: { x: 0, y: 3 },
        goal: { x: 3, y: 3 },
        cells: [
          { x: 0, y: 0, type: 'lantern' },
          { x: 1, y: 0, type: 'path' },
          { x: 2, y: 0, type: 'path' },
          { x: 3, y: 0, type: 'receiver' },

          { x: 0, y: 1, type: 'path' },
          { x: 1, y: 1, type: 'switch', switchId: 1, isSwitchPressed: false },
          { x: 2, y: 1, type: 'wall' },
          { x: 3, y: 1, type: 'path' },

          { x: 0, y: 2, type: 'path' },
          { x: 1, y: 2, type: 'path' },
          { x: 2, y: 2, type: 'door', doorKind: 'switch' },
          { x: 3, y: 2, type: 'path' },

          { x: 0, y: 3, type: 'path' },
          { x: 1, y: 3, type: 'path' },
          { x: 2, y: 3, type: 'path' },
          { x: 3, y: 3, type: 'goal' },
        ],
      },
    ];
  }

  // Sprout (3~4세) & Bloom/Star (4~6세)
  return [
    // Level 1: 5x5 grid with 2 mirrors & light door
    {
      id: 1,
      title: '별빛 거울 두 개를 맞춰요',
      gridWidth: 5,
      gridHeight: 5,
      lantern: { x: 0, y: 0, dir: 'E' },
      receiver: { x: 1, y: 3 },
      start: { x: 0, y: 2 },
      goal: { x: 4, y: 4 },
      cells: [
        { x: 0, y: 0, type: 'lantern' },
        { x: 1, y: 0, type: 'path' },
        { x: 2, y: 0, type: 'path' },
        { x: 3, y: 0, type: 'mirror', mirrorAngle: 90 }, // needs 0 (\) to bounce S
        { x: 4, y: 0, type: 'wall' },

        { x: 0, y: 1, type: 'wall' },
        { x: 1, y: 1, type: 'path' },
        { x: 2, y: 1, type: 'wall' },
        { x: 3, y: 1, type: 'path' },
        { x: 4, y: 1, type: 'wall' },

        { x: 0, y: 2, type: 'path' },
        { x: 1, y: 2, type: 'door', doorKind: 'light' },
        { x: 2, y: 2, type: 'path' },
        { x: 3, y: 2, type: 'path' },
        { x: 4, y: 2, type: 'path' },

        { x: 0, y: 3, type: 'wall' },
        { x: 1, y: 3, type: 'receiver' },
        { x: 2, y: 3, type: 'path' },
        { x: 3, y: 3, type: 'mirror', mirrorAngle: 0 }, // needs 90 (/) to bounce W to receiver
        { x: 4, y: 3, type: 'path' },

        { x: 0, y: 4, type: 'wall' },
        { x: 1, y: 4, type: 'wall' },
        { x: 2, y: 4, type: 'path' },
        { x: 3, y: 4, type: 'path' },
        { x: 4, y: 4, type: 'goal' },
      ],
    },
    // Level 2: Mirror + Switch Combined Multi-step Puzzle
    {
      id: 2,
      title: '거울과 발판을 모두 풀어라!',
      gridWidth: 5,
      gridHeight: 5,
      lantern: { x: 0, y: 1, dir: 'E' },
      receiver: { x: 3, y: 4 },
      start: { x: 0, y: 3 },
      goal: { x: 4, y: 3 },
      cells: [
        { x: 0, y: 0, type: 'wall' },
        { x: 1, y: 0, type: 'path' },
        { x: 2, y: 0, type: 'path' },
        { x: 3, y: 0, type: 'wall' },
        { x: 4, y: 0, type: 'wall' },

        { x: 0, y: 1, type: 'lantern' },
        { x: 1, y: 1, type: 'path' },
        { x: 2, y: 1, type: 'switch', switchId: 1, isSwitchPressed: false },
        { x: 3, y: 1, type: 'mirror', mirrorAngle: 90 }, // needs 0 (\) to bounce S
        { x: 4, y: 1, type: 'wall' },

        { x: 0, y: 2, type: 'path' },
        { x: 1, y: 2, type: 'door', doorKind: 'switch' },
        { x: 2, y: 2, type: 'path' },
        { x: 3, y: 2, type: 'path' },
        { x: 4, y: 2, type: 'wall' },

        { x: 0, y: 3, type: 'path' },
        { x: 1, y: 3, type: 'path' },
        { x: 2, y: 3, type: 'wall' },
        { x: 3, y: 3, type: 'door', doorKind: 'light' },
        { x: 4, y: 3, type: 'goal' },

        { x: 0, y: 4, type: 'wall' },
        { x: 1, y: 4, type: 'wall' },
        { x: 2, y: 4, type: 'wall' },
        { x: 3, y: 4, type: 'receiver' },
        { x: 4, y: 4, type: 'wall' },
      ],
    },
  ];
}

export const MirrorMazeGame: React.FC<MirrorMazeGameProps> = ({
  buddy,
  onCompleteQuiz,
  soundEnabled,
  ageGroup = 'sprout',
}) => {
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const pixiRef = useRef<PixiStageHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const levels = useMemo(() => createLevels(ageGroup), [ageGroup]);
  const [levelIndex, setLevelIndex] = useState(0);
  const currentLevel = levels[levelIndex % levels.length];

  const [cells, setCells] = useState<GridCell[]>(currentLevel.cells);
  const [animalPos, setAnimalPos] = useState<{ x: number; y: number }>(currentLevel.start);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isWalking, setIsWalking] = useState(false);

  // Sync state whenever level changes
  useEffect(() => {
    setCells(currentLevel.cells);
    setAnimalPos(currentLevel.start);
    setIsCompleted(false);
    setIsWalking(false);
  }, [currentLevel]);

  useEffect(() => {
    stopAllSpeech();
    speakText(GUIDE, soundEnabled, { characterId: buddy });
    return () => {
      clearGameTimeouts();
      stopAllSpeech();
    };
  }, [buddy, soundEnabled, clearGameTimeouts]);

  // Compute raycast light beam based on current mirror angles
  const { beamSegments, isReceiverLit } = useMemo(() => {
    const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
    let curX = currentLevel.lantern.x;
    let curY = currentLevel.lantern.y;
    let curDir = currentLevel.lantern.dir;
    let lit = false;

    // Maximum 12 bounces to prevent infinite reflection loops
    for (let step = 0; step < 12; step++) {
      const { dx, dy } = DIR_OFFSETS[curDir];
      let nextX = curX;
      let nextY = curY;
      let hitTarget: GridCell | null = null;

      // Cast ray forward until hitting an obstacle or grid border
      while (true) {
        nextX += dx;
        nextY += dy;
        if (
          nextX < 0 ||
          nextX >= currentLevel.gridWidth ||
          nextY < 0 ||
          nextY >= currentLevel.gridHeight
        ) {
          // Ray exited grid
          break;
        }

        const cell = cells.find((c) => c.x === nextX && c.y === nextY);
        if (!cell) continue;

        if (cell.type === 'wall' || cell.type === 'mirror' || cell.type === 'receiver') {
          hitTarget = cell;
          break;
        }
      }

      const endX = hitTarget ? hitTarget.x : nextX - dx;
      const endY = hitTarget ? hitTarget.y : nextY - dy;

      segments.push({ x1: curX, y1: curY, x2: endX, y2: endY });

      if (!hitTarget) break;

      if (hitTarget.type === 'receiver') {
        lit = true;
        break;
      }

      if (hitTarget.type === 'mirror' && hitTarget.mirrorAngle !== undefined) {
        const nextDir = reflectDirection(curDir, hitTarget.mirrorAngle);
        if (nextDir) {
          curX = hitTarget.x;
          curY = hitTarget.y;
          curDir = nextDir;
          continue;
        }
      }

      // Hit wall or non-reflecting face
      break;
    }

    return { beamSegments: segments, isReceiverLit: lit };
  }, [cells, currentLevel]);

  // Check which doors are unlocked
  const isLightDoorOpen = isReceiverLit;
  const isSwitchDoorOpen = useMemo(() => {
    return cells.some((c) => c.type === 'switch' && c.isSwitchPressed);
  }, [cells]);

  // Rotate a mirror on tap
  const handleRotateMirror = useCallback(
    (x: number, y: number) => {
      if (isWalking || isCompleted) return;

      playSparkleChime(soundEnabled);
      setCells((prev) =>
        prev.map((c) => {
          if (c.x === x && c.y === y && c.type === 'mirror') {
            return { ...c, mirrorAngle: ((c.mirrorAngle || 0) + 90) % 360 };
          }
          return c;
        }),
      );

      emitJuice({ kind: 'snap', x: window.innerWidth / 2, y: window.innerHeight / 2 });
    },
    [isWalking, isCompleted, soundEnabled],
  );

  // Play reaction when beam hits the receiver
  const prevReceiverLitRef = useRef(false);
  useEffect(() => {
    if (isReceiverLit && !prevReceiverLitRef.current) {
      playCorrectFanfare(soundEnabled);
      emitJuice({ kind: 'success', x: window.innerWidth / 2, y: window.innerHeight / 2 });
      pixiRef.current?.emitBurst({
        x: (stageRef.current?.clientWidth || 400) * 0.5,
        y: (stageRef.current?.clientHeight || 400) * 0.4,
        color: 0xfde047,
        secondaryColor: 0x38bdf8,
        count: 24,
        kind: 'star',
      });
      speakText('반짝반짝! 별빛이 거울에 반사되었어!', soundEnabled, {
        characterId: buddy,
        playIntroSFX: false,
      });
    }
    prevReceiverLitRef.current = isReceiverLit;
  }, [isReceiverLit, soundEnabled, buddy]);

  // BFS Pathfinding to move buddy
  const handleTileClick = useCallback(
    (targetX: number, targetY: number) => {
      if (isWalking || isCompleted) return;

      const targetCell = cells.find((c) => c.x === targetX && c.y === targetY);
      if (targetCell?.type === 'mirror') {
        handleRotateMirror(targetX, targetY);
        return;
      }

      // Check if target is walkable or goal
      if (
        targetCell?.type === 'wall' ||
        (targetCell?.type === 'door' &&
          ((targetCell.doorKind === 'light' && !isLightDoorOpen) ||
            (targetCell.doorKind === 'switch' && !isSwitchDoorOpen)))
      ) {
        playBouncyBoing(soundEnabled);
        return;
      }

      // BFS shortest path search
      const queue: { x: number; y: number; path: { x: number; y: number }[] }[] = [
        { x: animalPos.x, y: animalPos.y, path: [] },
      ];
      const visited = new Set<string>([`${animalPos.x},${animalPos.y}`]);
      let foundPath: { x: number; y: number }[] | null = null;

      while (queue.length > 0) {
        const cur = queue.shift()!;
        if (cur.x === targetX && cur.y === targetY) {
          foundPath = cur.path;
          break;
        }

        const neighbors = [
          { x: cur.x + 1, y: cur.y },
          { x: cur.x - 1, y: cur.y },
          { x: cur.x, y: cur.y + 1 },
          { x: cur.x, y: cur.y - 1 },
        ];

        for (const n of neighbors) {
          const key = `${n.x},${n.y}`;
          if (
            n.x < 0 ||
            n.x >= currentLevel.gridWidth ||
            n.y < 0 ||
            n.y >= currentLevel.gridHeight ||
            visited.has(key)
          ) {
            continue;
          }

          const cell = cells.find((c) => c.x === n.x && c.y === n.y);
          if (!cell || cell.type === 'wall' || cell.type === 'mirror') continue;

          // Check door open state
          if (cell.type === 'door') {
            if (cell.doorKind === 'light' && !isLightDoorOpen) continue;
            if (cell.doorKind === 'switch' && !isSwitchDoorOpen) continue;
          }

          visited.add(key);
          queue.push({ x: n.x, y: n.y, path: [...cur.path, n] });
        }
      }

      if (!foundPath || foundPath.length === 0) {
        playBouncyBoing(soundEnabled);
        return;
      }

      // Step along the found path
      setIsWalking(true);
      const fullPath = [...foundPath];

      let stepIdx = 0;
      const stepNext = () => {
        if (stepIdx >= fullPath.length) {
          setIsWalking(false);
          return;
        }

        const nextStep = fullPath[stepIdx];
        stepIdx++;
        setAnimalPos(nextStep);
        playJellyTap(soundEnabled);

        // Check if stepped on switch
        const steppedCell = cells.find((c) => c.x === nextStep.x && c.y === nextStep.y);
        if (steppedCell?.type === 'switch' && !steppedCell.isSwitchPressed) {
          setCells((prev) =>
            prev.map((c) =>
              c.x === nextStep.x && c.y === nextStep.y ? { ...c, isSwitchPressed: true } : c,
            ),
          );
          playBouncyBoing(soundEnabled);
          speakText('찰칵! 마법 스위치가 열렸어!', soundEnabled, {
            characterId: buddy,
            playIntroSFX: false,
          });
        }

        // Check if reached Goal
        if (nextStep.x === currentLevel.goal.x && nextStep.y === currentLevel.goal.y) {
          setIsCompleted(true);
          playCorrectFanfare(soundEnabled);
          playComboChime(10, soundEnabled);
          fireConfetti();
          fireStarExplosion();
          onCompleteQuiz(10);
          stopAllSpeech();
          speakText('우와! 별빛 문을 열고 친구를 구출했어! 대단해!', soundEnabled, {
            characterId: buddy,
          });

          scheduleGameTimeout(() => {
            setLevelIndex((idx) => idx + 1);
          }, 3200);
          return;
        }

        scheduleGameTimeout(stepNext, 180);
      };

      scheduleGameTimeout(stepNext, 50);
    },
    [
      isWalking,
      isCompleted,
      cells,
      animalPos,
      currentLevel,
      isLightDoorOpen,
      isSwitchDoorOpen,
      soundEnabled,
      handleRotateMirror,
      buddy,
      onCompleteQuiz,
      scheduleGameTimeout,
    ],
  );

  return (
    <div
      ref={stageRef}
      className="mirror-maze-stage relative flex flex-col justify-between w-full h-[var(--game-play-height,calc(100dvh-84px))] min-h-[var(--game-play-height,calc(100dvh-84px))] rounded-3xl overflow-hidden select-none bg-gradient-to-b from-[#1E1B4B] via-[#312E81] to-[#4338CA] border-3 border-[#6366F1] p-3 sm:p-5"
    >
      {/* Background Starry Nebula Backdrop */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-10 left-12 w-32 h-32 rounded-full bg-violet-600/30 blur-2xl" />
        <div className="absolute bottom-16 right-12 w-48 h-48 rounded-full bg-sky-500/25 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-amber-400/20 blur-2xl" />
      </div>

      <PixiStageOverlay ref={pixiRef} ambientKind="none" className="z-30" />

      {/* Top HUD: Guide & Progress */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        <PlayGuide
          buddy={buddy}
          soundEnabled={soundEnabled}
          title="거울과 별빛 미로"
          guide={GUIDE}
          happy={isCompleted}
        />
        <div className="pointer-events-none">
          <PlayProgress
            total={levels.length}
            done={(levelIndex % levels.length) + (isCompleted ? 1 : 0)}
            label="탐험 단계"
          />
        </div>
      </div>

      {/* Interactive Maze Board */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-2 sm:p-4">
        <div
          style={{
            gridTemplateColumns: `repeat(${currentLevel.gridWidth}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${currentLevel.gridHeight}, minmax(0, 1fr))`,
          }}
          className="relative grid gap-2 sm:gap-3.5 w-full max-w-[440px] sm:max-w-[500px] aspect-square p-3 sm:p-4 rounded-3xl bg-indigo-950/80 border-3 border-indigo-400/40 shadow-2xl backdrop-blur-md"
        >
          {/* Light Beam Raycast Layer */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox={`0 0 ${currentLevel.gridWidth} ${currentLevel.gridHeight}`}
            aria-hidden="true"
          >
            <defs>
              <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="0.18" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {beamSegments.map((seg, i) => (
              <line
                key={i}
                x1={seg.x1 + 0.5}
                y1={seg.y1 + 0.5}
                x2={seg.x2 + 0.5}
                y2={seg.y2 + 0.5}
                stroke="#FDE047"
                strokeWidth="0.14"
                strokeLinecap="round"
                filter="url(#laserGlow)"
                className="animate-pulse"
              />
            ))}
          </svg>

          {/* Grid Cells */}
          {Array.from({ length: currentLevel.gridHeight }).map((_, y) =>
            Array.from({ length: currentLevel.gridWidth }).map((__, x) => {
              const cell = cells.find((c) => c.x === x && c.y === y);
              const isAnimalHere = animalPos.x === x && animalPos.y === y;
              const isGoal = x === currentLevel.goal.x && y === currentLevel.goal.y;

              if (!cell || cell.type === 'wall') {
                return (
                  <div
                    key={`${x}-${y}`}
                    className="rounded-2xl bg-indigo-900/40 border-2 border-indigo-950/60 shadow-inner flex items-center justify-center opacity-60"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-700/50" />
                  </div>
                );
              }

              return (
                <button
                  key={`${x}-${y}`}
                  onClick={() => handleTileClick(x, y)}
                  type="button"
                  aria-label={`${x}, ${y} 위치 (${cell.type})`}
                  className={`relative rounded-2xl flex items-center justify-center transition-transform active:scale-95 shadow-md ${
                    cell.type === 'mirror'
                      ? 'bg-gradient-to-br from-sky-400 to-indigo-600 border-3 border-sky-200'
                      : cell.type === 'receiver'
                        ? isReceiverLit
                          ? 'bg-gradient-to-br from-amber-300 to-amber-500 border-3 border-white shadow-[0_0_16px_#fde047]'
                          : 'bg-indigo-900 border-2 border-indigo-500'
                        : cell.type === 'lantern'
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-3 border-amber-200'
                          : cell.type === 'switch'
                            ? cell.isSwitchPressed
                              ? 'bg-emerald-500 border-3 border-emerald-200 shadow-[0_0_12px_#34d399]'
                              : 'bg-emerald-800 border-3 border-emerald-400'
                            : cell.type === 'door'
                              ? (cell.doorKind === 'light' && isLightDoorOpen) ||
                                (cell.doorKind === 'switch' && isSwitchDoorOpen)
                                ? 'bg-indigo-800/40 border-2 border-dashed border-emerald-400'
                                : 'bg-rose-900/90 border-3 border-rose-400'
                              : isGoal
                                ? 'bg-gradient-to-br from-amber-300 via-pink-400 to-purple-500 border-3 border-white shadow-[0_0_16px_#f472b6]'
                                : 'bg-indigo-800/80 border-2 border-indigo-500/50 hover:border-indigo-400'
                  }`}
                >
                  {/* Mirror Artwork */}
                  {cell.type === 'mirror' && (
                    <motion.div
                      animate={{ rotate: cell.mirrorAngle || 0 }}
                      transition={JUICE_SPRING}
                      className="w-full h-full flex items-center justify-center pointer-events-none"
                    >
                      <span className="text-xl sm:text-2xl drop-shadow-md">🪞</span>
                    </motion.div>
                  )}

                  {/* Lantern (Light Source) */}
                  {cell.type === 'lantern' && (
                    <div className="flex flex-col items-center justify-center pointer-events-none text-white font-black text-xs">
                      <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-300" />
                    </div>
                  )}

                  {/* Crystal Receiver Target */}
                  {cell.type === 'receiver' && (
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      <Sparkles
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${
                          isReceiverLit
                            ? 'text-white fill-amber-200 animate-spin'
                            : 'text-indigo-400'
                        }`}
                      />
                    </div>
                  )}

                  {/* Stepping Switch Plate */}
                  {cell.type === 'switch' && (
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      <Footprints
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${
                          cell.isSwitchPressed ? 'text-white' : 'text-emerald-300'
                        }`}
                      />
                    </div>
                  )}

                  {/* Door / Barrier */}
                  {cell.type === 'door' && (
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      {(cell.doorKind === 'light' && isLightDoorOpen) ||
                      (cell.doorKind === 'switch' && isSwitchDoorOpen) ? (
                        <ShieldCheck className="w-5 h-5 text-emerald-300" />
                      ) : (
                        <span className="text-base sm:text-lg">🔒</span>
                      )}
                    </div>
                  )}

                  {/* Star Goal Portal */}
                  {isGoal && !isAnimalHere && (
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300 fill-amber-300 animate-bounce" />
                    </div>
                  )}

                  {/* Cheering Buddy Character Walking */}
                  <AnimatePresence>
                    {isAnimalHere && (
                      <motion.div
                        layoutId="buddy-avatar"
                        transition={JUICE_SPRING}
                        className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                      >
                        <div className="scale-75 sm:scale-90">
                          <CharacterAvatar
                            id={buddy}
                            size="sm"
                            mood={isCompleted ? 'dancing' : isWalking ? 'happy' : 'waving'}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            }),
          )}
        </div>
      </div>

      {/* Bottom Hint Banner */}
      <div className="relative z-30 flex items-center justify-center gap-2 pointer-events-none">
        <div className="px-4 py-1.5 rounded-full bg-indigo-950/90 border-2 border-indigo-400/50 shadow-md flex items-center gap-2">
          <Compass className="w-4 h-4 text-sky-300" />
          <span className="text-xs sm:text-sm font-black text-indigo-200">
            {isReceiverLit
              ? '별빛 문이 열렸어요! 친구를 눌러 목적지로 이동해 볼까?'
              : '거울을 톡 눌러 별빛을 크리스털로 보내 봐요!'}
          </span>
        </div>
      </div>
    </div>
  );
};
