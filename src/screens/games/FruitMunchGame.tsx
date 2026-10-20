import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart } from 'lucide-react';
import type { CharacterId, AgeGroup } from '../../types';
import { CareFriend } from '../../components/ToddlerPlay';
import { ToyArtwork } from '../../components/ToyArtwork';
import {
  speakText,
  stopAllSpeech,
  playCareSound,
  playCorrectFanfare,
  playWrongBoing,
  playBouncyBoing,
} from '../../utils/soundEngine';
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
}

const FRUIT_LIST: FruitDefinition[] = [
  { id: 'strawberry', name: '딸기', emoji: '🍓' },
  { id: 'apple', name: '사과', emoji: '🍎' },
  { id: 'banana', name: '바나나', emoji: '🍌' },
  { id: 'watermelon', name: '수박', emoji: '🍉' },
  { id: 'grape', name: '포도', emoji: '🍇' },
  { id: 'orange', name: '오렌지', emoji: '🍊' },
  { id: 'peach', name: '복숭아', emoji: '🍑' },
];

export const FruitMunchGame: React.FC<FruitMunchGameProps> = ({
  buddy,
  onCompleteQuiz,
  soundEnabled,
  ageGroup = 'sprout',
}) => {
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();

  // Difficulty settings by age group
  const maxTarget = ageGroup === 'baby' ? 3 : ageGroup === 'sprout' ? 4 : 5;
  const minTarget = ageGroup === 'baby' ? 1 : 2;
  const optionCount = ageGroup === 'baby' ? 2 : ageGroup === 'sprout' ? 3 : 4;

  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<'eating' | 'answering' | 'celebrating'>('eating');
  const [currentFruit, setCurrentFruit] = useState<FruitDefinition>(FRUIT_LIST[0]);
  const [targetCount, setTargetCount] = useState(2);
  const [eatenCount, setEatenCount] = useState(0);
  const [isChewing, setIsChewing] = useState(false);
  const [wrongChoice, setWrongChoice] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [options, setOptions] = useState<number[]>([]);

  // Mouth and gaze state for CareFriend
  const [mouthState, setMouthState] = useState<'rest' | 'open' | 'chew'>('rest');
  const [gaze, setGaze] = useState({ x: 0, y: 0 });

  // Floating fruit being fed
  const [flyingFruit, setFlyingFruit] = useState<{ id: number; x: number; y: number } | null>(null);
  const isFeedingRef = useRef(false);

  // Initialize a new round
  const startNewRound = useCallback(() => {
    clearGameTimeouts();
    const count = Math.floor(Math.random() * (maxTarget - minTarget + 1)) + minTarget;
    const fruit = FRUIT_LIST[Math.floor(Math.random() * FRUIT_LIST.length)];

    setTargetCount(count);
    setCurrentFruit(fruit);
    setEatenCount(0);
    setPhase('eating');
    setIsChewing(false);
    setMouthState('rest');
    setWrongChoice(null);
    setSelectedAnswer(null);
    setFlyingFruit(null);
    isFeedingRef.current = false;

    // Generate options
    const choices = new Set<number>([count]);
    while (choices.size < optionCount) {
      const candidate = Math.floor(Math.random() * (maxTarget + 1)) + 1;
      choices.add(candidate);
    }
    setOptions(Array.from(choices).sort((a, b) => a - b));

    stopAllSpeech();
    speakText('맛있는 과일을 냠냠! 몇 개 먹었는지 잘 세어 봐!', soundEnabled, { characterId: buddy });
  }, [clearGameTimeouts, maxTarget, minTarget, optionCount, buddy, soundEnabled]);

  useEffect(() => {
    startNewRound();
    return () => {
      clearGameTimeouts();
      stopAllSpeech();
    };
  }, [round, startNewRound, clearGameTimeouts]);

  // Feed one fruit
  const feedFruit = useCallback(() => {
    if (isFeedingRef.current || phase !== 'eating' || eatenCount >= targetCount) return;
    isFeedingRef.current = true;

    // Fruit spawns from a random side and jumps into buddy's mouth
    const spawnX = Math.random() > 0.5 ? 40 : -40;
    setFlyingFruit({ id: Date.now(), x: spawnX, y: 60 });
    setGaze({ x: spawnX > 0 ? 4 : -4, y: 3 });
    setMouthState('open');
    playBouncyBoing(soundEnabled);

    scheduleGameTimeout(() => {
      // Arrived at mouth: Chomp!
      setFlyingFruit(null);
      setMouthState('chew');
      setIsChewing(true);
      playCareSound('chew', soundEnabled);
      setEatenCount((prev) => {
        const next = prev + 1;
        if (next >= targetCount) {
          // Finished eating all fruits! Transition to question
          scheduleGameTimeout(() => {
            setIsChewing(false);
            setMouthState('rest');
            setPhase('answering');
            isFeedingRef.current = false;
            stopAllSpeech();
            speakText('과일을 모두 몇 개 먹었을까요?', soundEnabled, { characterId: buddy });
          }, 1200);
        } else {
          scheduleGameTimeout(() => {
            setIsChewing(false);
            setMouthState('rest');
            isFeedingRef.current = false;
          }, 800);
        }
        return next;
      });
    }, 600);
  }, [phase, eatenCount, targetCount, soundEnabled, scheduleGameTimeout, buddy]);

  // Automatic feeding pacing if child doesn't tap
  useEffect(() => {
    if (phase !== 'eating' || eatenCount >= targetCount || isChewing || flyingFruit) return;

    const timer = setTimeout(() => {
      feedFruit();
    }, 1500);

    return () => clearTimeout(timer);
  }, [phase, eatenCount, targetCount, isChewing, flyingFruit, feedFruit]);

  // Handle child's answer selection
  const handleSelectAnswer = (choice: number) => {
    if (phase !== 'answering') return;

    if (choice === targetCount) {
      // Correct!
      setSelectedAnswer(choice);
      setPhase('celebrating');
      playCorrectFanfare(soundEnabled);
      fireConfetti();
      onCompleteQuiz(10);
      stopAllSpeech();
      speakText(`우와! 정답이에요! ${targetCount}개 먹었지!`, soundEnabled, { characterId: buddy });

      scheduleGameTimeout(() => {
        setRound((prev) => prev + 1);
      }, 2400);
    } else {
      // Wrong
      setWrongChoice(choice);
      playWrongBoing(soundEnabled);
      stopAllSpeech();
      speakText('어라? 다시 한 번 잘 세어볼까?', soundEnabled, { characterId: buddy });

      scheduleGameTimeout(() => {
        setWrongChoice(null);
      }, 1000);
    }
  };

  return (
    <div className="fruit-munch-stage" aria-label="과일 냠냠 몇 개 놀이">
      {/* Header Info */}
      <header className="fruit-munch-header">
        <div className="fruit-munch-prompt-pill">
          <span>{currentFruit.emoji}</span>
          <span>{phase === 'answering' ? '과일을 몇 개 먹었을까?' : `${currentFruit.name} 냠냠 먹는 중!`}</span>
        </div>
        <div className="fruit-munch-counter-pill">
          <span>먹은 과일:</span>
          <b>{eatenCount}</b>
          <span>/</span>
          <span>{targetCount}</span>
        </div>
      </header>

      {/* Main Arena */}
      <main className="fruit-munch-arena">
        {/* Buddy Character */}
        <div
          className={`munch-friend-container ${isChewing ? 'is-eating' : ''} ${phase === 'celebrating' ? 'is-celebrating' : ''}`}
          onClick={feedFruit}
          role="button"
          tabIndex={0}
          aria-label={`${buddy} 캐릭터에게 과일 주기`}
        >
          {phase === 'answering' && (
            <div className="munch-speech-bubble">
              몇 개 먹었을까요?
            </div>
          )}

          <CareFriend
            buddy={buddy}
            gaze={gaze}
            mouth={mouthState}
            blush={isChewing || phase === 'celebrating' ? '#ff6b8b' : undefined}
          />

          {/* Belly Bubble */}
          <div className="belly-bubble" aria-label={`먹은 과일 수: ${eatenCount}개`}>
            <span>{currentFruit.emoji}</span>
            <span>{eatenCount}개 쏙!</span>
          </div>

          {phase === 'celebrating' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              className="absolute -top-6 text-pink-500"
            >
              <Heart size={44} fill="currentColor" />
            </motion.div>
          )}
        </div>

        {/* Flying Fruit Animation */}
        <AnimatePresence>
          {flyingFruit && (
            <motion.div
              key={flyingFruit.id}
              className="floating-fruit"
              initial={{ x: flyingFruit.x * 3, y: flyingFruit.y * 2, scale: 0.6, rotate: 0 }}
              animate={{ x: 0, y: -20, scale: [0.9, 1.2, 0.4], rotate: 360 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            >
              <span className="floating-fruit-emoji">{currentFruit.emoji}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap to Feed Prompt during eating */}
        {phase === 'eating' && eatenCount < targetCount && !isChewing && !flyingFruit && (
          <button
            type="button"
            className="feed-action-prompt mt-4"
            onClick={feedFruit}
            aria-label={`${currentFruit.name} 냠냠 먹이기`}
          >
            <Sparkles size={20} className="text-orange-500" />
            <span>터치해서 {currentFruit.name} 먹여주기!</span>
          </button>
        )}
      </main>

      {/* Answer Choices */}
      <footer className="fruit-munch-choices" aria-label="정답 선택지">
        {phase === 'answering' || phase === 'celebrating' ? (
          options.map((num) => {
            const isCorrect = phase === 'celebrating' && num === selectedAnswer;
            const isWrong = wrongChoice === num;

            return (
              <button
                key={num}
                type="button"
                className={`fruit-choice-btn ${isCorrect ? 'is-correct' : ''} ${isWrong ? 'is-wrong' : ''}`}
                onClick={() => handleSelectAnswer(num)}
                disabled={phase === 'celebrating'}
                aria-label={`${num}개`}
              >
                <span className="fruit-choice-number">{num}</span>
                <div className="fruit-choice-mini-fruits" aria-hidden="true">
                  {Array.from({ length: num }).map((_, i) => (
                    <ToyArtwork key={i} emoji={currentFruit.emoji} />
                  ))}
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-center text-amber-800/80 font-bold py-3 text-sm">
            과일을 맛있게 냠냠 먹고 있어요! 몇 개 먹는지 눈을 크게 뜨고 봐요!
          </div>
        )}
      </footer>
    </div>
  );
};
