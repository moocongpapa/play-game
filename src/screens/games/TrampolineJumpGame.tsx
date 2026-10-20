import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
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
} from '../../utils/soundEngine';
import { fireStarExplosion, fireConfetti } from '../../utils/confetti';
import './TrampolineJumpGame.css';

interface TrampolineJumpGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup?: AgeGroup;
  childName?: string;
}

interface SkyCollectible {
  id: number;
  emoji: string;
  xNorm: number; // -0.38 to +0.38 relative to arena center
  heightPx: number; // 75 to 235 px above trampoline mat
  phase: number;
  collected: boolean;
}

const SKY_EMOJIS = ['⭐', '🍓', '🍎', '🎈', '🍭', '🌈', '🍊'];

export const TrampolineJumpGame: React.FC<TrampolineJumpGameProps> = ({
  buddy,
  onCompleteQuiz,
  soundEnabled,
  ageGroup = 'sprout',
}) => {
  const pixiRef = useRef<PixiStageHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);

  const targetStars = ageGroup === 'baby' ? 5 : ageGroup === 'sprout' ? 7 : 9;

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [jumperMood, setJumperMood] = useState<'still' | 'happy' | 'waving' | 'excited'>('happy');
  const [collectibles, setCollectibles] = useState<SkyCollectible[]>([]);
  const [renderPose, setRenderPose] = useState({
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    matBend: 0,
  });

  // Mutable 60fps physics state
  const physRef = useRef({
    x: 0,
    targetX: 0,
    y: 0, // >= 0 means above mat
    vy: 6.5,
    combo: 1,
    queuedBoost: false,
    flipping: false,
    flipProgress: 0,
    matBend: 0,
    score: 0,
  });

  const collectiblesRef = useRef<SkyCollectible[]>([]);

  const createSkyWave = useCallback(() => {
    const now = Date.now();
    const list: SkyCollectible[] = Array.from({ length: 5 }, (_, i) => ({
      id: now + i,
      emoji: SKY_EMOJIS[Math.floor(Math.random() * SKY_EMOJIS.length)],
      xNorm: -0.32 + (i / 4) * 0.64 + (Math.random() - 0.5) * 0.08,
      heightPx: 85 + (i % 3) * 58 + Math.random() * 22,
      phase: i * 1.2,
      collected: false,
    }));
    collectiblesRef.current = list;
    setCollectibles(list);
  }, []);

  // Trigger jump boost and steer toward pointer X
  const triggerBoostAndSteer = useCallback(
    (clientX?: number) => {
      const p = physRef.current;
      const arena = arenaRef.current?.getBoundingClientRect();
      if (clientX !== undefined && arena && arena.width > 0) {
        const relX = clientX - (arena.left + arena.width / 2);
        const maxOffset = Math.min(140, arena.width * 0.36);
        p.targetX = Math.max(-maxOffset, Math.min(maxOffset, relX));
      }

      p.queuedBoost = true;
      // If near the mat or descending slowly, give an immediate upward impulse!
      if (p.y < 38 || p.vy < 0) {
        const nextCombo = Math.min(3, p.combo + 1);
        p.combo = nextCombo;
        p.vy = nextCombo === 1 ? 9.2 : nextCombo === 2 ? 11.4 : 13.5;
        p.matBend = 26;
        p.queuedBoost = false;
        if (nextCombo === 3) {
          p.flipping = true;
          p.flipProgress = 0;
        }
        setCombo(nextCombo);
        setJumperMood(nextCombo === 3 ? 'excited' : 'waving');
        playBouncyBoing(soundEnabled);

        const stageRect = stageRef.current?.getBoundingClientRect();
        if (stageRect) {
          pixiRef.current?.emitBounceWave(
            stageRect.width * 0.5 + p.x,
            stageRect.height - 95,
            nextCombo * 0.7
          );
        }
      }
    },
    [soundEnabled]
  );

  useEffect(() => {
    createSkyWave();
    stopAllSpeech();
    speakText('화면을 톡톡! 트램펄린에서 신나게 뛰어볼까?', soundEnabled, { characterId: buddy });

    let frameId = 0;
    let lastTime = performance.now();

    const stepPhysics = (now: number) => {
      const dt = Math.min(2.2, (now - lastTime) / 16.667);
      lastTime = now;

      const p = physRef.current;
      const arenaRect = arenaRef.current?.getBoundingClientRect();
      const arenaWidth = arenaRect?.width || 360;

      // Smooth horizontal steering toward targetX
      p.x += (p.targetX - p.x) * 0.14 * dt;

      // Vertical kinematics
      const gravity = 0.34;
      p.y += p.vy * dt;
      p.vy -= gravity * dt;

      // Elastic mat spring relaxation
      if (p.matBend > 0.2) {
        p.matBend *= Math.pow(0.82, dt);
      } else {
        p.matBend = 0;
      }

      // Flip rotation during tier 3 jump
      if (p.flipping) {
        p.flipProgress = Math.min(1, p.flipProgress + 0.032 * dt);
        if (p.flipProgress >= 1) {
          p.flipping = false;
          p.flipProgress = 0;
        }
      }

      // Bounce on trampoline mat
      if (p.y <= 0 && p.vy < 0) {
        p.y = 0;
        if (p.queuedBoost) {
          p.combo = Math.min(3, p.combo + 1);
          p.queuedBoost = false;
        } else {
          p.combo = Math.max(1, p.combo - 1);
        }

        const bounceVy = p.combo === 1 ? 8.0 : p.combo === 2 ? 10.6 : 13.0;
        p.vy = bounceVy;
        p.matBend = 14 + p.combo * 5;
        if (p.combo === 3) {
          p.flipping = true;
          p.flipProgress = 0;
        }
        setCombo(p.combo);
        setJumperMood(p.combo >= 2 ? 'waving' : 'happy');
        playBouncyBoing(soundEnabled);

        const stageRect = stageRef.current?.getBoundingClientRect();
        if (stageRect) {
          pixiRef.current?.emitBounceWave(
            stageRect.width * 0.5 + p.x,
            stageRect.height - 95,
            p.combo * 0.6
          );
        }
      }

      // Bounding-circle collision check with sky collectibles
      let hitCount = 0;
      const updated = collectiblesRef.current.map((item) => {
        if (item.collected) return item;
        const itemX = item.xNorm * arenaWidth;
        const dx = p.x - itemX;
        const dy = p.y + 40 - item.heightPx;
        const distSq = dx * dx + dy * dy;
        if (distSq < 62 * 62) {
          hitCount++;
          const stageRect = stageRef.current?.getBoundingClientRect();
          if (stageRect) {
            pixiRef.current?.emitBurst({
              x: stageRect.width * 0.5 + itemX,
              y: stageRect.height - 130 - item.heightPx,
              color: 0xffd166,
              secondaryColor: 0x38bdf8,
              count: 16,
              kind: 'star',
            });
          }
          return { ...item, collected: true };
        }
        return item;
      });

      if (hitCount > 0) {
        collectiblesRef.current = updated;
        setCollectibles(updated);
        playSparkleChime(soundEnabled);

        p.score += hitCount;
        setScore(p.score);

        if (p.score > 0 && p.score % targetStars === 0) {
          playCorrectFanfare(soundEnabled);
          fireStarExplosion();
          fireConfetti();
          onCompleteQuiz(10);
          stopAllSpeech();
          speakText('별을 가득 모았어요! 최고야!', soundEnabled, { characterId: buddy });
        }

        // Respawn fresh sky treats when all are collected
        if (updated.every((it) => it.collected)) {
          createSkyWave();
        }
      }

      // Squash & stretch based on vertical velocity and mat contact
      const stretch =
        p.matBend > 4
          ? { sx: 1.14, sy: 0.86 }
          : p.vy > 3
          ? { sx: 0.94, sy: 1.08 }
          : { sx: 1, sy: 1 };

      setRenderPose({
        x: p.x,
        y: -p.y,
        rotation: p.flipping ? p.flipProgress * 360 : (p.targetX - p.x) * 0.12,
        scaleX: stretch.sx,
        scaleY: stretch.sy,
        matBend: p.matBend,
      });

      frameId = requestAnimationFrame(stepPhysics);
    };

    frameId = requestAnimationFrame(stepPhysics);
    return () => {
      cancelAnimationFrame(frameId);
      stopAllSpeech();
    };
  }, [buddy, soundEnabled, targetStars, onCompleteQuiz, createSkyWave]);

  return (
    <div
      ref={stageRef}
      className="trampoline-stage"
      onPointerDown={(e) => triggerBoostAndSteer(e.clientX)}
      onPointerMove={(e) => {
        if (e.buttons > 0) triggerBoostAndSteer(e.clientX);
      }}
      role="application"
      aria-label="통통 트램펄린 점프 놀이"
    >
      <PixiStageOverlay ref={pixiRef} ambientKind="sky" />

      {/* Top Guide & Score Bar */}
      <div className="trampoline-top-bar">
        <PlayGuide
          buddy={buddy}
          soundEnabled={soundEnabled}
          title="통통 트램펄린"
          guide="화면을 톡톡! 트램펄린에서 신나게 뛰어볼까?"
          happy={combo === 3}
        />

        <div className="trampoline-score-pill">
          <span className="trampoline-score-icon">
            <ToyArtwork emoji="⭐" />
          </span>
          <span>모은 별:</span>
          <b>{score}</b>
        </div>

        <div className="trampoline-combo-badge">
          <span>{combo === 1 ? '1단 폴짝!' : combo === 2 ? '2단 슈웅!' : '3단 회전 점프!'}</span>
        </div>
      </div>

      {/* Main Physics Arena */}
      <div ref={arenaRef} className="trampoline-arena">
        {/* Floating Sky Collectibles (Custom Vector Art) */}
        {collectibles.map((item) =>
          item.collected ? null : (
            <button
              key={item.id}
              type="button"
              className="trampoline-sky-item"
              style={{
                left: `${50 + item.xNorm * 100}%`,
                bottom: `${110 + item.heightPx}px`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                triggerBoostAndSteer(e.clientX);
              }}
              aria-label="하늘 별 향해 점프하기"
            >
              <ToyArtwork emoji={item.emoji} />
            </button>
          )
        )}

        {/* Jumping Buddy */}
        <div
          className="trampoline-jumper-node"
          style={{
            transform: `translate3d(calc(-50% + ${renderPose.x}px), ${renderPose.y}px, 0) rotate(${renderPose.rotation}deg) scale(${renderPose.scaleX}, ${renderPose.scaleY})`,
          }}
        >
          <CharacterAvatar id={buddy} size="lg" mood={jumperMood} />
        </div>

        {/* Elastic SVG Trampoline */}
        <div className="trampoline-svg-wrap" aria-hidden="true">
          <svg viewBox="0 0 280 90" className="trampoline-svg">
            {/* Back Frame Rim */}
            <ellipse
              cx="140"
              cy="26"
              rx="118"
              ry="14"
              fill="#be185d"
              stroke="#831843"
              strokeWidth="3"
            />
            {/* Steel Legs */}
            <path
              d="M42 32 L32 82 M140 38 V85 M238 32 L248 82"
              stroke="#475569"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path
              d="M42 32 L32 82 M140 38 V85 M238 32 L248 82"
              stroke="#94a3b8"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Dynamic Elastic Mat Curve */}
            <path
              d={`M 24 24 Q 140 ${24 + renderPose.matBend * 1.45} 256 24 Q 140 ${
                38 + renderPose.matBend * 1.7
              } 24 24 Z`}
              fill="#f43f5e"
              stroke="#fda4af"
              strokeWidth="3"
            />
            {/* Center Bounce Target Ring */}
            <ellipse
              cx="140"
              cy={26 + renderPose.matBend * 0.72}
              rx="52"
              ry="6"
              fill="none"
              stroke="#fef08a"
              strokeWidth="3"
              strokeDasharray="8 6"
            />
          </svg>
        </div>

        <PlayProgress
          total={targetStars}
          done={score % targetStars}
          label="모은 별 진행도"
        />
      </div>

      {/* Bottom Interactive Boost Button */}
      <button
        type="button"
        className="trampoline-boost-btn"
        onClick={(e) => {
          e.stopPropagation();
          triggerBoostAndSteer();
        }}
        aria-label="점프 파워 업"
      >
        <Sparkles size={20} className="text-pink-500" />
        <span>톡톡 누르거나 좌우로 움직여 별을 모아봐!</span>
      </button>
    </div>
  );
};
