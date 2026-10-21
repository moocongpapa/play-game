import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, RotateCcw } from 'lucide-react';
import type { CharacterId, AgeGroup } from '../../types';
import { CareFriend, PlayGuide } from '../../components/ToddlerPlay';
import { ToyArtwork } from '../../components/ToyArtwork';
import { PixiStageOverlay, type PixiStageHandle } from '../../components/PixiStageOverlay';
import {
  speakText,
  stopAllSpeech,
  playCareSound,
  playCareReaction,
  playCorrectFanfare,
  playWrongBoing,
  playBouncyBoing,
} from '../../utils/soundEngine';
import { useCareReactions } from '../../hooks/useCareReactions';
import { fireConfetti } from '../../utils/confetti';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import './FruitMunchGame.css';

interface FruitMunchGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup?: AgeGroup;
  childName?: string;
}

interface FruitDefinition {
  id: string;
  name: string;
  emoji: string;
  color: number;
  secondaryColor: number;
  word: string;
  motion: 'crunch' | 'yum';
}

const FRUIT_LIST: FruitDefinition[] = [
  { id: 'strawberry', name: '딸기', emoji: '🍓', color: 0xff5c8a, secondaryColor: 0xffccd5, word: '새콤달콤!', motion: 'yum' },
  { id: 'apple', name: '사과', emoji: '🍎', color: 0xef4444, secondaryColor: 0xfef08a, word: '아삭아삭!', motion: 'crunch' },
  { id: 'banana', name: '바나나', emoji: '🍌', color: 0xfacc15, secondaryColor: 0xfef9c3, word: '달콤해!', motion: 'yum' },
  { id: 'watermelon', name: '수박', emoji: '🍉', color: 0xf43f5e, secondaryColor: 0x4ade80, word: '시원해!', motion: 'crunch' },
  { id: 'grapes', name: '포도', emoji: '🍇', color: 0xa855f7, secondaryColor: 0xe9d5ff, word: '톡톡 달콤!', motion: 'yum' },
  { id: 'orange', name: '오렌지', emoji: '🍊', color: 0xf97316, secondaryColor: 0xfed7aa, word: '상큼해!', motion: 'yum' },
  { id: 'peach', name: '복숭아', emoji: '🍑', color: 0xfb7185, secondaryColor: 0xfce7f3, word: '말랑달콤!', motion: 'yum' },
];

interface FlyingFruitState {
  id: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export const FruitMunchGame: React.FC<FruitMunchGameProps> = ({
  buddy,
  onCompleteQuiz,
  soundEnabled,
  ageGroup = 'sprout',
}) => {
  useCareReactions(buddy, soundEnabled);
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const pixiRef = useRef<PixiStageHandle>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const maxTarget = ageGroup === 'baby' ? 3 : ageGroup === 'sprout' ? 5 : 6;
  const minTarget = ageGroup === 'baby' ? 1 : 2;
  const optionCount = ageGroup === 'baby' ? 2 : ageGroup === 'sprout' ? 3 : 4;

  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<'eating' | 'answering' | 'celebrating'>('eating');
  const [currentFruit, setCurrentFruit] = useState<FruitDefinition>(FRUIT_LIST[0]);
  const [targetCount, setTargetCount] = useState(3);
  const [eatenCount, setEatenCount] = useState(0);
  const [isChewing, setIsChewing] = useState(false);
  const [reactionWord, setReactionWord] = useState<string | null>(null);
  const [wrongChoice, setWrongChoice] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [options, setOptions] = useState<number[]>([]);

  const [mouthState, setMouthState] = useState<'rest' | 'open' | 'chew' | 'smile'>('rest');
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [flyingFruit, setFlyingFruit] = useState<FlyingFruitState | null>(null);
  const isFeedingRef = useRef(false);

  const cancelFlight = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startNewRound = useCallback(() => {
    clearGameTimeouts();
    cancelFlight();
    const count = Math.floor(Math.random() * (maxTarget - minTarget + 1)) + minTarget;
    const fruit = FRUIT_LIST[Math.floor(Math.random() * FRUIT_LIST.length)];

    setTargetCount(count);
    setCurrentFruit(fruit);
    setEatenCount(0);
    setPhase('eating');
    setIsChewing(false);
    setReactionWord(null);
    setMouthState('rest');
    setGaze({ x: 0, y: 0 });
    setWrongChoice(null);
    setSelectedAnswer(null);
    setFlyingFruit(null);
    isFeedingRef.current = false;

    const choices = new Set<number>([count]);
    while (choices.size < optionCount) {
      const candidate = Math.floor(Math.random() * (maxTarget + 1)) + 1;
      choices.add(candidate);
    }
    setOptions(Array.from(choices).sort((a, b) => a - b));

    stopAllSpeech();
    speakText('맛있는 과일을 냠냠! 몇 개 먹었는지 잘 세어 봐!', soundEnabled, { characterId: buddy });
  }, [clearGameTimeouts, cancelFlight, maxTarget, minTarget, optionCount, buddy, soundEnabled]);

  useEffect(() => {
    startNewRound();
    return () => {
      clearGameTimeouts();
      cancelFlight();
      stopAllSpeech();
    };
  }, [round, startNewRound, clearGameTimeouts, cancelFlight]);

  // Launch a fruit along a true parabolic arc into the character's mouth
  const launchFruitToMouth = useCallback(
    (customOffsetX?: number) => {
      if (isFeedingRef.current || phase !== 'eating' || eatenCount >= targetCount) return;
      isFeedingRef.current = true;

      const offsetX =
        customOffsetX !== undefined
          ? customOffsetX
          : (eatenCount % 2 === 0 ? -1 : 1) * (65 + (eatenCount % 3) * 28);
      const startY = 125;
      const targetX = 0;
      const targetY = -12;
      const durationMs = 540;
      const startedAt = performance.now();

      setMouthState('open');
      playBouncyBoing(soundEnabled);

      const stepFlight = (now: number) => {
        const t = Math.min(1, (now - startedAt) / durationMs);
        // Parabolic arc with high apex
        const arcLift = -115 * 4 * t * (1 - t);
        const curX = offsetX * (1 - t) + targetX * t;
        const curY = startY * (1 - t) + targetY * t + arcLift;
        const scale = t < 0.7 ? 1 + 0.25 * Math.sin(t * Math.PI) : 1.15 - (t - 0.7) * 2.1;
        const rotation = (offsetX >= 0 ? 1 : -1) * t * 340;

        setFlyingFruit({
          id: startedAt,
          startX: offsetX,
          startY,
          x: curX,
          y: curY,
          scale: Math.max(0.35, scale),
          rotation,
        });

        // Real-time eye gaze tracking
        setGaze({
          x: Math.max(-6, Math.min(6, curX / 18)),
          y: Math.max(-4, Math.min(4, curY / 24)),
        });

        if (t < 1) {
          rafRef.current = requestAnimationFrame(stepFlight);
        } else {
          rafRef.current = null;
          setFlyingFruit(null);
          setGaze({ x: 0, y: 0 });
          setMouthState('chew');
          setIsChewing(true);
          setReactionWord(currentFruit.word);

          // Emit juicy WebGL particle splash at character mouth
          const rect = arenaRef.current?.getBoundingClientRect();
          if (rect) {
            pixiRef.current?.emitBurst({
              x: rect.width * 0.5,
              y: rect.height * 0.44,
              color: currentFruit.color,
              secondaryColor: currentFruit.secondaryColor,
              count: 20,
              kind: 'juice',
            });
          }

          playCareSound('chew', soundEnabled);
          playCareReaction(currentFruit.motion === 'crunch' ? 'chew' : 'yum', soundEnabled, buddy);

          const nextEaten = eatenCount + 1;
          setEatenCount(nextEaten);
          if (nextEaten >= targetCount) {
            scheduleGameTimeout(() => {
              setIsChewing(false);
              setReactionWord(null);
              setMouthState('smile');
              setPhase('answering');
              isFeedingRef.current = false;
              stopAllSpeech();
              speakText('과일을 모두 몇 개 먹었을까요?', soundEnabled, { characterId: buddy });
            }, 1150);
          } else {
            scheduleGameTimeout(() => {
              setIsChewing(false);
              setReactionWord(null);
              setMouthState('rest');
              isFeedingRef.current = false;
            }, 760);
          }
        }
      };

      rafRef.current = requestAnimationFrame(stepFlight);
    },
    [phase, eatenCount, targetCount, soundEnabled, currentFruit, buddy, scheduleGameTimeout]
  );

  // Automatic pacing if child watches without tapping
  useEffect(() => {
    if (phase !== 'eating' || eatenCount >= targetCount || isChewing || flyingFruit) return;
    const timer = setTimeout(() => {
      launchFruitToMouth();
    }, 1250);
    return () => clearTimeout(timer);
  }, [phase, eatenCount, targetCount, isChewing, flyingFruit, launchFruitToMouth]);

  // Replay eating animation if child wants to count again
  const handleReplayEating = () => {
    if (phase !== 'answering') return;
    clearGameTimeouts();
    cancelFlight();
    setEatenCount(0);
    setWrongChoice(null);
    setPhase('eating');
    setMouthState('rest');
    isFeedingRef.current = false;
    stopAllSpeech();
    speakText('맛있는 과일을 냠냠! 몇 개 먹었는지 잘 세어 봐!', soundEnabled, { characterId: buddy });
  };

  const handleSelectAnswer = (choice: number) => {
    if (phase !== 'answering') return;

    if (choice === targetCount) {
      setSelectedAnswer(choice);
      setPhase('celebrating');
      setMouthState('smile');
      playCorrectFanfare(soundEnabled);
      fireConfetti();

      const rect = arenaRef.current?.getBoundingClientRect();
      if (rect) {
        pixiRef.current?.emitBurst({
          x: rect.width * 0.5,
          y: rect.height * 0.4,
          color: 0xffd166,
          secondaryColor: currentFruit.color,
          count: 28,
          kind: 'star',
        });
      }

      onCompleteQuiz(10);
      stopAllSpeech();
      speakText(`우와! 정답이에요! ${targetCount}개 먹었지!`, soundEnabled, { characterId: buddy });

      scheduleGameTimeout(() => {
        setRound((prev) => prev + 1);
      }, 2400);
    } else {
      setWrongChoice(choice);
      playWrongBoing(soundEnabled);
      stopAllSpeech();
      speakText('어라? 다시 한 번 잘 세어볼까?', soundEnabled, { characterId: buddy });

      scheduleGameTimeout(() => {
        setWrongChoice(null);
      }, 950);
    }
  };

  const guideText =
    phase === 'answering'
      ? '과일을 모두 몇 개 먹었을까요?'
      : '맛있는 과일을 냠냠! 몇 개 먹었는지 잘 세어 봐!';

  return (
    <div className="fruit-munch-stage" ref={arenaRef} aria-label="과일 냠냠 몇 개 놀이">
      <PixiStageOverlay ref={pixiRef} ambientKind="picnic" />

      {/* Top Guide & Replay Controls */}
      <div className="fruit-munch-top-bar">
        <PlayGuide
          buddy={buddy}
          soundEnabled={soundEnabled}
          title="과일 냠냠 몇 개?"
          guide={guideText}
          happy={phase === 'celebrating'}
        />

        <div className="fruit-munch-status-pill">
          <span className="fruit-munch-status-icon">
            <ToyArtwork emoji={currentFruit.emoji} />
          </span>
          <span>
            {phase === 'answering'
              ? '몇 개 먹었을까?'
              : `${currentFruit.name} ${eatenCount}개 냠냠!`}
          </span>
        </div>

        {phase === 'answering' && (
          <button
            type="button"
            className="fruit-munch-replay-btn"
            onClick={handleReplayEating}
            aria-label="과일 먹는 모습 다시 보기"
          >
            <RotateCcw size={16} />
            <span>다시 세어보기</span>
          </button>
        )}
      </div>

      {/* Central Character & Parabolic Fruit Arena */}
      <div className="fruit-munch-arena">
        <div
          className={`munch-buddy-stage ${flyingFruit ? 'is-anticipating' : ''} ${
            isChewing ? 'is-chewing' : ''
          } ${phase === 'celebrating' ? 'is-celebrating' : ''}`}
          onClick={() => launchFruitToMouth()}
          role="button"
          tabIndex={0}
          aria-label={`${currentFruit.name} 먹여주기`}
        >
          <AnimatePresence>
            {reactionWord && (
              <motion.span
                key={`word-${eatenCount}`}
                className="munch-reaction-badge"
                initial={{ scale: 0.5, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.7, opacity: 0 }}
              >
                {reactionWord}
              </motion.span>
            )}
          </AnimatePresence>

          {phase === 'answering' && (
            <div className="munch-question-bubble">몇 개 먹었을까요?</div>
          )}

          <CareFriend
            buddy={buddy}
            gaze={gaze}
            mouth={mouthState}
            smilingEyes={phase === 'celebrating'}
            blush={isChewing || phase === 'celebrating' ? '#ff6b8b' : undefined}
          />

          {phase === 'celebrating' && (
            <motion.span
              initial={{ scale: 0, opacity: 0, y: 10 }}
              animate={{ scale: 1.25, opacity: 1, y: -14 }}
              className="absolute -top-4 text-pink-500"
            >
              <Heart size={42} fill="currentColor" />
            </motion.span>
          )}

          {flyingFruit && (
            <div
              className="munch-flying-fruit"
              style={{
                transform: `translate3d(${flyingFruit.x}px, ${flyingFruit.y}px, 0) scale(${flyingFruit.scale}) rotate(${flyingFruit.rotation}deg)`,
              }}
            >
              <ToyArtwork emoji={currentFruit.emoji} />
            </div>
          )}
        </div>

        {/* Picnic Table Progress Tracker */}
        <div className="munch-picnic-cloth" aria-label={`먹은 과일 ${eatenCount}개`}>
          {Array.from({ length: targetCount }, (_, i) => {
            const filled = i < eatenCount;
            return (
              <span
                key={i}
                className={`munch-eaten-slot ${filled ? 'is-filled' : ''}`}
              >
                {filled && <ToyArtwork emoji={currentFruit.emoji} />}
              </span>
            );
          })}
        </div>
      </div>

      {/* Bottom Interactive Fruit Tray OR Number Choices */}
      {phase === 'eating' ? (
        <div className="munch-fruit-tray" aria-label="과일 접시">
          {Array.from({ length: targetCount }, (_, i) => {
            const alreadyEaten = i < eatenCount;
            const offset = (i - (targetCount - 1) / 2) * 58;
            return (
              <button
                key={i}
                type="button"
                className={`munch-tray-fruit-btn ${alreadyEaten ? 'is-eaten' : ''}`}
                disabled={alreadyEaten}
                onClick={() => launchFruitToMouth(offset)}
                aria-label={`${currentFruit.name} ${i + 1}번 입으로 쏙 주기`}
              >
                <ToyArtwork emoji={currentFruit.emoji} />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="fruit-munch-choices" aria-label="먹은 과일 개수 고르기">
          {options.map((num) => {
            const isCorrect = phase === 'celebrating' && num === selectedAnswer;
            const isWrong = wrongChoice === num;
            return (
              <button
                key={num}
                type="button"
                className={`fruit-choice-btn ${isCorrect ? 'is-correct' : ''} ${
                  isWrong ? 'is-wrong' : ''
                }`}
                onClick={() => handleSelectAnswer(num)}
                disabled={phase === 'celebrating'}
                aria-label={`${num}개`}
              >
                <span className="fruit-choice-number">{num}</span>
                <div className="fruit-choice-mini-fruits" aria-hidden="true">
                  {Array.from({ length: num }, (_, i) => (
                    <ToyArtwork key={i} emoji={currentFruit.emoji} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
