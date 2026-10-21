import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';
import type { CharacterId, AgeGroup } from '../../types';
import { CareFriend, PlayGuide, PlayProgress } from '../../components/ToddlerPlay';
import { ToyArtwork } from '../../components/ToyArtwork';
import { PixiStageOverlay, type PixiStageHandle } from '../../components/PixiStageOverlay';
import {
  speakText,
  stopAllSpeech,
  playCareSound,
  playSparkleChime,
  playCorrectFanfare,
  playBouncyBoing,
} from '../../utils/soundEngine';
import { useCareReactions } from '../../hooks/useCareReactions';
import { fireConfetti } from '../../utils/confetti';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import './BubbleBathGame.css';

interface BubbleBathGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup?: AgeGroup;
  childName?: string;
}

type BathStep = 'water' | 'soap' | 'duck' | 'rinse';

const STEP_ORDER: BathStep[] = ['water', 'soap', 'duck', 'rinse'];

const STEPS_INFO: Record<BathStep, { label: string; guide: string; emoji: string }> = {
  water: {
    label: '물 뿌리기',
    guide: '따뜻한 물로 시원하게 목욕해요! 샤워기를 눌러봐!',
    emoji: '🚿',
  },
  soap: {
    label: '비누 거품',
    guide: '비누 스펀지로 문질문질! 뽀글뽀글 거품이 가득!',
    emoji: '🧼',
  },
  duck: {
    label: '오리 놀이',
    guide: '꽥꽥 오리 친구와 첨벙첨벙 놀아볼까?',
    emoji: '🐤',
  },
  rinse: {
    label: '거품 씻기',
    guide: '물로 거품을 깨끗하게 쏴아아 씻어내요!',
    emoji: '🫧',
  },
};

// 6 foam cluster coordinates in CareFriend's 300x258 SVG coordinate system
const FOAM_SPOTS = [
  { x: 96, y: 74, r: 22 },
  { x: 150, y: 54, r: 26 },
  { x: 204, y: 74, r: 22 },
  { x: 88, y: 128, r: 20 },
  { x: 150, y: 118, r: 22 },
  { x: 212, y: 128, r: 20 },
];

export const BubbleBathGame: React.FC<BubbleBathGameProps> = ({
  buddy,
  onCompleteQuiz,
  soundEnabled,
}) => {
  useCareReactions(buddy, soundEnabled);
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const pixiRef = useRef<PixiStageHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [currentStep, setCurrentStep] = useState<BathStep>('water');
  const [stepProgress, setStepProgress] = useState(0); // 0 to 4 per step
  const [foamLevel, setFoamLevel] = useState(0); // 0 to 6 foam clusters
  const [quackedDucks, setQuackedDucks] = useState<number[]>([]);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [toolCursor, setToolCursor] = useState<{ x: number; y: number } | null>(null);

  const advancingRef = useRef(false);
  const lastSoundAtRef = useRef(0);
  const stepProgressRef = useRef(0);

  useEffect(() => {
    stopAllSpeech();
    speakText(STEPS_INFO[currentStep].guide, soundEnabled, { characterId: buddy });
    return () => {
      clearGameTimeouts();
      stopAllSpeech();
    };
  }, [currentStep, buddy, soundEnabled, clearGameTimeouts]);

  const advanceToNextStep = useCallback(
    (completedStep: BathStep) => {
      if (advancingRef.current) return;
      advancingRef.current = true;
      setToolCursor(null);
      setIsScrubbing(false);

      if (completedStep === 'water') {
        scheduleGameTimeout(() => {
          stepProgressRef.current = 0;
          setStepProgress(0);
          setCurrentStep('soap');
          advancingRef.current = false;
        }, 700);
      } else if (completedStep === 'soap') {
        setFoamLevel(6);
        scheduleGameTimeout(() => {
          stepProgressRef.current = 0;
          setStepProgress(0);
          setQuackedDucks([]);
          setCurrentStep('duck');
          advancingRef.current = false;
        }, 750);
      } else if (completedStep === 'duck') {
        scheduleGameTimeout(() => {
          stepProgressRef.current = 0;
          setStepProgress(0);
          setCurrentStep('rinse');
          advancingRef.current = false;
        }, 750);
      } else if (completedStep === 'rinse') {
        setFoamLevel(0);
        setIsFinished(true);
        playCorrectFanfare(soundEnabled);
        fireConfetti();

        const rect = stageRef.current?.getBoundingClientRect();
        if (rect) {
          pixiRef.current?.emitBurst({
            x: rect.width * 0.5,
            y: rect.height * 0.45,
            color: 0xffd166,
            secondaryColor: 0x38bdf8,
            count: 26,
            kind: 'star',
          });
        }

        onCompleteQuiz(10);
        stopAllSpeech();
        speakText('우와! 뽀송뽀송 깨끗해졌어요! 상쾌해!', soundEnabled, { characterId: buddy });

        scheduleGameTimeout(() => {
          setIsFinished(false);
          stepProgressRef.current = 0;
          setStepProgress(0);
          setQuackedDucks([]);
          setCurrentStep('water');
          advancingRef.current = false;
        }, 2700);
      }
    },
    [scheduleGameTimeout, soundEnabled, onCompleteQuiz, buddy]
  );

  // Apply progress pulse from scrubbing, spraying, or tapping
  const applyBathStroke = useCallback(
    (clientX?: number, clientY?: number) => {
      if (advancingRef.current || isFinished) return;

      const now = performance.now();
      const stageRect = stageRef.current?.getBoundingClientRect();
      const px =
        clientX !== undefined && stageRect
          ? clientX - stageRect.left
          : (stageRect?.width || 360) * 0.5;
      const py =
        clientY !== undefined && stageRect
          ? clientY - stageRect.top
          : (stageRect?.height || 480) * 0.44;

      if (clientX !== undefined && clientY !== undefined && stageRect) {
        setToolCursor({ x: px, y: py });
      }
      setIsScrubbing(true);

      // Throttle audio & step increments during continuous pointer drag
      if (now - lastSoundAtRef.current < 240) return;
      lastSoundAtRef.current = now;

      const nextProgress = Math.min(4, stepProgressRef.current + 1);
      stepProgressRef.current = nextProgress;
      setStepProgress(nextProgress);

      if (currentStep === 'water') {
        playCareSound('drink', soundEnabled);
        pixiRef.current?.emitWaterSpray(px, py);
      } else if (currentStep === 'soap') {
        playCareSound('bubble', soundEnabled);
        pixiRef.current?.emitBurst({
          x: px,
          y: py,
          color: 0xf472b6,
          secondaryColor: 0x38bdf8,
          count: 10,
          kind: 'bubble',
        });
        setFoamLevel((f) => Math.min(6, f + 2));
      } else if (currentStep === 'duck') {
        playBouncyBoing(soundEnabled);
        pixiRef.current?.emitBurst({
          x: px,
          y: py,
          color: 0xfacc15,
          secondaryColor: 0x38bdf8,
          count: 12,
          kind: 'bubble',
        });
      } else if (currentStep === 'rinse') {
        playSparkleChime(soundEnabled);
        pixiRef.current?.emitWaterSpray(px, py);
        setFoamLevel((f) => Math.max(0, f - 2));
      }

      if (nextProgress >= 4) {
        advanceToNextStep(currentStep);
      }
    },
    [currentStep, isFinished, soundEnabled, advanceToNextStep]
  );

  const handleDuckTap = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (advancingRef.current || isFinished) return;
    if (!quackedDucks.includes(index)) {
      setQuackedDucks((prev) => [...prev, index]);
    }
    applyBathStroke(e.clientX, e.clientY);
  };

  const stepIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div
      ref={stageRef}
      className="bath-stage"
      onPointerUp={() => {
        setToolCursor(null);
        setIsScrubbing(false);
      }}
      onPointerCancel={() => {
        setToolCursor(null);
        setIsScrubbing(false);
      }}
      aria-label="뽀글뽀글 거품 목욕 놀이"
    >
      <PixiStageOverlay ref={pixiRef} ambientKind="bath" />

      {/* Top Guide & Step Progress */}
      <div className="bath-top-bar">
        <PlayGuide
          buddy={buddy}
          soundEnabled={soundEnabled}
          title="뽀글뽀글 거품 목욕"
          guide={STEPS_INFO[currentStep].guide}
          happy={isFinished}
        />

        <div className="bath-step-badge">
          <span className="bath-step-badge-icon">
            <ToyArtwork emoji={STEPS_INFO[currentStep].emoji} />
          </span>
          <span>{STEPS_INFO[currentStep].label}</span>
        </div>

        <div className="bath-step-dots" aria-label={`4단계 중 ${stepIndex + 1}단계`}>
          {STEP_ORDER.map((step, i) => (
            <span
              key={step}
              className={`bath-step-dot ${
                i < stepIndex || isFinished
                  ? 'is-done'
                  : i === stepIndex
                  ? 'is-current'
                  : ''
              }`}
            />
          ))}
        </div>
      </div>

      {/* Central Bathtub & Interactive Scrubbing Scene */}
      <div className="bath-arena">
        <div
          className="bath-tub-scene"
          onPointerDown={(e) => applyBathStroke(e.clientX, e.clientY)}
          onPointerMove={(e) => {
            if (e.buttons > 0) applyBathStroke(e.clientX, e.clientY);
          }}
          role="button"
          tabIndex={0}
          aria-label={`${STEPS_INFO[currentStep].label} 문질문질 하기`}
        >
          {/* Character inside Bathtub */}
          <div className={`bath-friend-wrap ${isScrubbing ? 'is-active-scrub' : ''}`}>
            <CareFriend
              buddy={buddy}
              mouth={isFinished ? 'smile' : isScrubbing ? 'open' : 'rest'}
              smilingEyes={isFinished || isScrubbing}
              blush="#ff6b8b"
            >
              {/* Custom SVG Soap Foam Clusters in 300x258 space */}
              {FOAM_SPOTS.slice(0, foamLevel).map((spot, i) => (
                <g key={i} className="bath-foam-cluster">
                  <circle
                    cx={spot.x}
                    cy={spot.y}
                    r={spot.r}
                    fill="#ffffff"
                    fillOpacity="0.92"
                    stroke="#bae6fd"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx={spot.x - spot.r * 0.45}
                    cy={spot.y + 6}
                    r={spot.r * 0.68}
                    fill="#f0f9ff"
                    stroke="#bae6fd"
                    strokeWidth="2"
                  />
                  <circle
                    cx={spot.x + spot.r * 0.48}
                    cy={spot.y + 4}
                    r={spot.r * 0.64}
                    fill="#ffffff"
                    stroke="#bae6fd"
                    strokeWidth="2"
                  />
                  <circle
                    cx={spot.x - 5}
                    cy={spot.y - 6}
                    r={spot.r * 0.24}
                    fill="#ffffff"
                  />
                </g>
              ))}
            </CareFriend>
          </div>

          {/* Interactive Rubber Ducks */}
          <div className="bath-duck-fleet">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                type="button"
                className={`bath-duck-btn ${quackedDucks.includes(idx) ? 'is-quacked' : ''}`}
                onClick={(e) => handleDuckTap(idx, e)}
                aria-label={`오리 친구 ${idx + 1}번 첨벙첨벙`}
              >
                <ToyArtwork emoji={idx === 1 ? '🫧' : '🐤'} />
              </button>
            ))}
          </div>

          {/* Custom SVG Porcelain Bathtub */}
          <svg viewBox="0 0 320 120" className="bath-porcelain-svg" aria-hidden="true">
            {/* Water surface wave */}
            <path
              d="M 28 32 Q 95 20 160 32 T 292 32 L 280 96 H 40 Z"
              fill="#38bdf8"
              fillOpacity="0.78"
            />
            {/* Tub Rim & Body */}
            <path
              d="M 22 30 H 298 L 280 94 Q 272 110 248 110 H 72 Q 48 110 40 94 Z"
              fill="#ffffff"
              stroke="#94a3b8"
              strokeWidth="4"
            />
            <rect
              x="12"
              y="20"
              width="296"
              height="16"
              rx="8"
              fill="#f8fafc"
              stroke="#94a3b8"
              strokeWidth="3.5"
            />
            {/* Claw feet */}
            <ellipse cx="68" cy="112" rx="14" ry="6" fill="#fbbf24" stroke="#b45309" strokeWidth="2.5" />
            <ellipse cx="252" cy="112" rx="14" ry="6" fill="#fbbf24" stroke="#b45309" strokeWidth="2.5" />
          </svg>

          {isFinished && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.3, opacity: 1 }}
              className="absolute -top-6 text-pink-500 z-30"
            >
              <Heart size={46} fill="currentColor" />
            </motion.span>
          )}
        </div>

        <PlayProgress
          total={4}
          done={isFinished ? 4 : stepProgress}
          label={`${STEPS_INFO[currentStep].label} 진행도`}
        />
      </div>

      {/* Floating Tool following pointer */}
      {toolCursor && (
        <div
          className="bath-floating-tool"
          style={{ left: `${toolCursor.x}px`, top: `${toolCursor.y}px` }}
          aria-hidden="true"
        >
          <ToyArtwork emoji={STEPS_INFO[currentStep].emoji} />
        </div>
      )}

      {/* Bottom Interactive Tool Dock */}
      <footer className="bath-controls" aria-label="목욕 도구 선택">
        {STEP_ORDER.map((step) => {
          const info = STEPS_INFO[step];
          const isActive = currentStep === step;
          return (
            <button
              key={step}
              type="button"
              className={`bath-tool-btn ${isActive ? 'is-active' : ''}`}
              onClick={() => {
                if (step !== currentStep && !advancingRef.current && !isFinished) {
                  setCurrentStep(step);
                  setStepProgress(0);
                } else {
                  applyBathStroke();
                }
              }}
              aria-label={info.label}
            >
              <span className="bath-tool-icon-svg">
                <ToyArtwork emoji={info.emoji} />
              </span>
              <span>{info.label}</span>
            </button>
          );
        })}
      </footer>
    </div>
  );
};
