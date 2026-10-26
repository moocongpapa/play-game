import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Droplets, RotateCw, Heart, Star } from 'lucide-react';
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
  playCareSound,
  playJellyTap,
  playStarGain,
  playRisingStepChime,
} from '../../utils/soundEngine';
import { fireConfetti, fireStarExplosion } from '../../utils/confetti';
import { emitJuice } from '../../utils/juice';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';

interface PipeConnectGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup?: AgeGroup;
  childName?: string;
}

// Direction bits: 0 = Top, 1 = Right, 2 = Bottom, 3 = Left
type Direction = 0 | 1 | 2 | 3;
type PipeShape = 'straight' | 'elbow' | 'cross' | 'source' | 'sink' | 'empty';

interface PipeCell {
  r: number;
  c: number;
  shape: PipeShape;
  rotation: number; // 0, 90, 180, 270 degrees
  connections: Direction[];
  isLocked?: boolean;
  isWaterFilled?: boolean;
}

const GUIDE = '목마른 친구에게 물이 닿을 수 있도록 파이프를 톡톡 돌려 물길을 연결해 볼까?';

// Helper to get connected directions given shape and rotation
function getConnectionsForShape(shape: PipeShape, rotation: number): Direction[] {
  const rotSteps = (rotation / 90) % 4;
  let base: Direction[] = [];

  switch (shape) {
    case 'straight':
      base = [0, 2]; // Top & Bottom
      break;
    case 'elbow':
      base = [0, 1]; // Top & Right
      break;
    case 'cross':
      base = [0, 1, 2, 3];
      break;
    case 'source':
      base = [1]; // Right
      break;
    case 'sink':
      base = [0]; // Top
      break;
    default:
      base = [];
  }

  return base.map((d) => ((d + rotSteps) % 4) as Direction);
}

// Opposite direction helper
function getOppositeDir(dir: Direction): Direction {
  return ((dir + 2) % 4) as Direction;
}

// Direction offsets [dr, dc]
const DIR_OFFSET: Record<Direction, [number, number]> = {
  0: [-1, 0], // Top
  1: [0, 1],  // Right
  2: [1, 0],  // Bottom
  3: [0, -1], // Left
};

export const PipeConnectGame: React.FC<PipeConnectGameProps> = ({
  buddy,
  onCompleteQuiz,
  soundEnabled,
  ageGroup = 'sprout',
}) => {
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const pixiRef = useRef<PixiStageHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [round, setRound] = useState(0);
  const totalRounds = 3;

  // Grid size
  const gridSize = ageGroup === 'baby' ? 3 : ageGroup === 'sprout' ? 4 : 4;

  const [grid, setGrid] = useState<PipeCell[][]>([]);
  const [isWaterFlowing, setIsWaterFlowing] = useState(false);
  const [isRoundWon, setIsRoundWon] = useState(false);

  // Initialize a puzzle board for a given round
  const setupPuzzle = useCallback(() => {
    setIsWaterFlowing(false);
    setIsRoundWon(false);

    const size = gridSize;
    const newGrid: PipeCell[][] = [];

    for (let r = 0; r < size; r++) {
      const row: PipeCell[] = [];
      for (let c = 0; c < size; c++) {
        // Default empty cell
        row.push({
          r,
          c,
          shape: 'empty',
          rotation: 0,
          connections: [],
        });
      }
      newGrid.push(row);
    }

    // Source at (0, 0)
    newGrid[0][0] = {
      r: 0,
      c: 0,
      shape: 'source',
      rotation: 0,
      connections: [1], // right
      isLocked: true,
      isWaterFilled: true,
    };

    // Sink at (size-1, size-1)
    newGrid[size - 1][size - 1] = {
      r: size - 1,
      c: size - 1,
      shape: 'sink',
      rotation: 0,
      connections: [0], // top
      isLocked: true,
    };

    if (size === 3) {
      // 3x3 layout: path goes (0,0) -> (0,1) -> (1,1) -> (1,2) -> (2,2)
      // (0,1) elbow connects Left & Bottom
      newGrid[0][1] = {
        r: 0,
        c: 1,
        shape: 'elbow',
        rotation: round === 0 ? 90 : 180, // initially misaligned
        connections: getConnectionsForShape('elbow', round === 0 ? 90 : 180),
      };
      // (1,1) elbow connects Top & Right
      newGrid[1][1] = {
        r: 1,
        c: 1,
        shape: 'elbow',
        rotation: 0,
        connections: getConnectionsForShape('elbow', 0),
      };
      // (1,2) elbow connects Left & Bottom
      newGrid[1][2] = {
        r: 1,
        c: 2,
        shape: 'elbow',
        rotation: round === 0 ? 270 : 0, // initially misaligned
        connections: getConnectionsForShape('elbow', round === 0 ? 270 : 0),
      };
    } else {
      // 4x4 layout:
      // (0,1) straight horizontal [1, 3]
      newGrid[0][1] = {
        r: 0,
        c: 1,
        shape: 'straight',
        rotation: (round % 2) * 90,
        connections: getConnectionsForShape('straight', (round % 2) * 90),
      };
      // (0,2) elbow [3, 2] (left to bottom)
      newGrid[0][2] = {
        r: 0,
        c: 2,
        shape: 'elbow',
        rotation: 90,
        connections: getConnectionsForShape('elbow', 90),
      };
      // (1,2) straight vertical [0, 2]
      newGrid[1][2] = {
        r: 1,
        c: 2,
        shape: 'straight',
        rotation: (round % 2 === 0 ? 90 : 0),
        connections: getConnectionsForShape('straight', round % 2 === 0 ? 90 : 0),
      };
      // (2,2) elbow [0, 1] (top to right)
      newGrid[2][2] = {
        r: 2,
        c: 2,
        shape: 'elbow',
        rotation: 180,
        connections: getConnectionsForShape('elbow', 180),
      };
      // (2,3) elbow [2, 3] (left to bottom, leads into sink at 3,3)
      newGrid[2][3] = {
        r: 2,
        c: 3,
        shape: 'elbow',
        rotation: (round % 2 === 0 ? 0 : 90),
        connections: getConnectionsForShape('elbow', round % 2 === 0 ? 0 : 90),
      };
    }

    setGrid(newGrid);
  }, [gridSize, round]);

  useEffect(() => {
    setupPuzzle();
  }, [setupPuzzle]);

  // Initial speech guide
  useEffect(() => {
    speakText(GUIDE, soundEnabled, { characterId: buddy });
    return () => {
      stopAllSpeech();
      clearGameTimeouts();
    };
  }, [buddy, soundEnabled, clearGameTimeouts]);

  // Pathfinding to evaluate connected pipes & check win condition
  const evaluateConnections = useCallback((currentGrid: PipeCell[][]) => {
    const size = currentGrid.length;
    if (size === 0) return;

    // Reset filled state
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        currentGrid[r][c].isWaterFilled = false;
      }
    }

    // BFS starting at (0, 0)
    const queue: Array<[number, number]> = [[0, 0]];
    const visited = new Set<string>();
    visited.add('0,0');
    currentGrid[0][0].isWaterFilled = true;

    let reachedSink = false;

    while (queue.length > 0) {
      const [cr, cc] = queue.shift()!;
      const currentCell = currentGrid[cr][cc];

      for (const dir of currentCell.connections) {
        const [dr, dc] = DIR_OFFSET[dir];
        const nr = cr + dr;
        const nc = cc + dc;

        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          const neighbor = currentGrid[nr][nc];
          if (neighbor.shape === 'empty') continue;

          const requiredOpposite = getOppositeDir(dir);
          if (neighbor.connections.includes(requiredOpposite)) {
            const key = `${nr},${nc}`;
            if (!visited.has(key)) {
              visited.add(key);
              neighbor.isWaterFilled = true;
              queue.push([nr, nc]);

              if (nr === size - 1 && nc === size - 1) {
                reachedSink = true;
              }
            }
          }
        }
      }
    }

    setGrid([...currentGrid]);

    if (visited.size > 1 && !reachedSink) {
      playRisingStepChime(visited.size - 1, Math.max(2, size * 2 - 2), soundEnabled);
    }

    if (reachedSink && !isRoundWon) {
      setIsRoundWon(true);
      setIsWaterFlowing(true);
      playSparkleChime(soundEnabled);
      playCareSound('drink', soundEnabled);

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        pixiRef.current?.emitWaterSpray(rect.right - 80, rect.bottom - 80);
        emitJuice({ kind: 'success', x: rect.right - 80, y: rect.bottom - 80, climax: true });
      }

      speakText('우와! 시원한 물이 콸콸! 친구가 정말 시원하고 기뻐해요!', soundEnabled, { characterId: buddy, playIntroSFX: false });

      scheduleGameTimeout(() => {
        playCorrectFanfare(soundEnabled);
        fireStarExplosion();

        if (round + 1 >= totalRounds) {
          playCelebrationFanfare(soundEnabled);
          fireConfetti();
          scheduleGameTimeout(() => {
            onCompleteQuiz(3);
          }, 2400);
        } else {
          setRound((r) => r + 1);
          playStarGain(soundEnabled);
        }
      }, 2000);
    }
  }, [isRoundWon, soundEnabled, round, totalRounds, scheduleGameTimeout, onCompleteQuiz]);

  // Rotate a pipe
  const handleRotateCell = (r: number, c: number) => {
    if (isRoundWon) return;
    const cell = grid[r]?.[c];
    if (!cell || cell.isLocked || cell.shape === 'empty') return;

    playJellyTap(soundEnabled);
    playCareSound('bubble', soundEnabled);

    const nextRotation = (cell.rotation + 90) % 360;
    const nextConnections = getConnectionsForShape(cell.shape, nextRotation);

    const updatedGrid = grid.map((row, ri) =>
      row.map((col, ci) => {
        if (ri === r && ci === c) {
          return {
            ...col,
            rotation: nextRotation,
            connections: nextConnections,
          };
        }
        return col;
      }),
    );

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      emitJuice({ kind: 'pop', x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }

    evaluateConnections(updatedGrid);
  };

  return (
    <div
      ref={containerRef}
      className="pipe-connect-stage relative flex flex-col justify-between w-full h-full select-none overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 50% 20%, #38bdf8 0%, #0284c7 60%, #0369a1 100%)',
      }}
    >
      <PixiStageOverlay ref={pixiRef} ambientKind="sky" />

      {/* Top Header */}
      <header className="relative z-10 flex flex-wrap items-center justify-between p-3 gap-2">
        <PlayGuide
          buddy={buddy}
          soundEnabled={soundEnabled}
          title="시원한 물길 연결"
          guide={GUIDE}
          happy={isRoundWon}
        />
        <PlayProgress total={totalRounds} done={round + 1} label="완성 물길" />
      </header>

      {/* Center Pipe Board */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-2 min-h-0">
        <div className="relative flex flex-col items-center p-4 bg-sky-950/70 border-4 border-sky-400/50 rounded-3xl shadow-2xl backdrop-blur-md">
          {/* Top Source Fountain Label */}
          <div className="flex items-center gap-2 mb-3 text-white text-xs font-bold">
            <span className="text-xl">⛲</span>
            <span className="text-sky-200">맑은 샘물</span>
            <span className="text-sky-300">➡️</span>
            <span className="text-amber-200">목마른 친구</span>
            <span className="text-xl">💧</span>
          </div>

          {/* Grid Container */}
          <div
            className="grid gap-2.5 p-2 bg-sky-900/60 rounded-2xl border-2 border-sky-300/30 shadow-inner"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const isClickable = !cell.isLocked && cell.shape !== 'empty';

                return (
                  <motion.button
                    key={`${r}-${c}`}
                    whileHover={isClickable ? { scale: 1.05 } : undefined}
                    whileTap={isClickable ? { scale: 0.95 } : undefined}
                    disabled={!isClickable || isRoundWon}
                    onClick={() => handleRotateCell(r, c)}
                    className={`relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl transition-all border-2 ${
                      cell.shape === 'empty'
                        ? 'bg-sky-950/40 border-dashed border-sky-600/30'
                        : cell.isWaterFilled
                        ? 'bg-sky-400/90 border-white shadow-lg shadow-sky-400/50'
                        : 'bg-sky-800/80 border-sky-400/50 hover:border-sky-300'
                    }`}
                  >
                    {/* Source Icon */}
                    {cell.shape === 'source' && (
                      <div className="relative flex flex-col items-center justify-center text-3xl">
                        <span className="animate-bounce">⛲</span>
                        <span className="absolute -bottom-1 -right-1 text-sm">➡️</span>
                      </div>
                    )}

                    {/* Sink Icon */}
                    {cell.shape === 'sink' && (
                      <div className="relative flex flex-col items-center justify-center text-3xl">
                        <span>{isWaterFlowing ? '💧' : '🥣'}</span>
                        <div className="absolute -top-3 scale-75">
                          <CharacterAvatar id={buddy} mood={isWaterFlowing ? 'excited' : 'happy'} size="sm" />
                        </div>
                      </div>
                    )}

                    {/* Pipe Graphics for Straight and Elbow */}
                    {(cell.shape === 'straight' || cell.shape === 'elbow' || cell.shape === 'cross') && (
                      <div
                        className="relative w-full h-full flex items-center justify-center pointer-events-none transition-transform duration-300"
                        style={{
                          transform: `rotate(${cell.rotation}deg)`,
                        }}
                      >
                        {cell.shape === 'straight' && (
                          <div
                            className={`w-5 h-full rounded-full transition-colors ${
                              cell.isWaterFilled ? 'bg-white shadow-md' : 'bg-sky-300/60'
                            }`}
                          />
                        )}

                        {cell.shape === 'elbow' && (
                          <svg viewBox="0 0 100 100" className="w-full h-full p-1.5">
                            <path
                              d="M 50,0 L 50,50 L 100,50"
                              fill="none"
                              stroke={cell.isWaterFilled ? '#ffffff' : '#7dd3fc'}
                              strokeWidth="20"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={cell.isWaterFilled ? 'drop-shadow-md' : ''}
                            />
                          </svg>
                        )}

                        {/* Rotate Icon indicator for interactable pipes */}
                        {isClickable && !cell.isWaterFilled && (
                          <RotateCw className="absolute w-3.5 h-3.5 text-sky-200/60 pointer-events-none" />
                        )}
                      </div>
                    )}
                  </motion.button>
                );
              }),
            )}
          </div>

          {/* Hint / Instruction Pill */}
          <div className="mt-3 text-center">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-sky-900/80 rounded-full text-white text-xs font-bold border border-sky-400/40">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>파이프를 톡 눌러서 회전시켜 물길을 이어봐요!</span>
            </span>
          </div>
        </div>
      </main>

      {/* Bottom celebration dialog on round won */}
      <AnimatePresence>
        {isRoundWon && (
          <motion.footer
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="relative z-20 p-3 bg-sky-950/90 backdrop-blur-md border-t border-sky-400/40 text-center flex items-center justify-center gap-2"
          >
            <Droplets className="w-6 h-6 text-sky-300 animate-bounce" />
            <span className="text-white text-sm font-black">
              우와! 시원한 물이 콸콸! 친구가 시원하게 목을 축였어요!
            </span>
            <Sparkles className="w-6 h-6 text-amber-300 animate-spin" />
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  );
};
