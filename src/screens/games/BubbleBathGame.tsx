import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart } from 'lucide-react';
import type { CharacterId, AgeGroup } from '../../types';
import { CareFriend } from '../../components/ToddlerPlay';
import {
  speakText,
  stopAllSpeech,
  playCareSound,
  playSparkleChime,
  playCorrectFanfare,
  playBouncyBoing,
} from '../../utils/soundEngine';
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

const STEPS_INFO: Record<BathStep, { label: string; guide: string; icon: string }> = {
  water: { label: '물 뿌리기', guide: '따뜻한 물로 시원하게 목욕해요! 샤워기를 눌러봐!', icon: '🚿' },
  soap: { label: '비누 거품', guide: '비누 스펀지로 문질문질! 뽀글뽀글 거품이 가득!', icon: '🧼' },
  duck: { label: '오리 놀이', guide: '꽥꽥 오리 친구와 첨벙첨벙 놀아볼까?', icon: '🐤' },
  rinse: { label: '거품 씻기', guide: '물로 거품을 깨끗하게 쏴아아 씻어내요!', icon: '✨' },
};

export const BubbleBathGame: React.FC<BubbleBathGameProps> = ({
  buddy,
  onCompleteQuiz,
  soundEnabled,
}) => {
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();

  const [currentStep, setCurrentStep] = useState<BathStep>('water');
  const [bubbleCount, setBubbleCount] = useState(0);
  const [hasFoamHat, setHasFoamHat] = useState(false);
  const [isSplashing, setIsSplashing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [activeEffect, setActiveEffect] = useState<string | null>(null);

  const busyRef = useRef(false);

  // Guide speech on step transition
  useEffect(() => {
    stopAllSpeech();
    speakText(STEPS_INFO[currentStep].guide, soundEnabled, { characterId: buddy });

    return () => {
      clearGameTimeouts();
      stopAllSpeech();
    };
  }, [currentStep, buddy, soundEnabled, clearGameTimeouts]);

  // Handle Step Action
  const handlePerformAction = useCallback((step: BathStep) => {
    if (busyRef.current || isFinished) return;
    busyRef.current = true;

    if (step === 'water') {
      setActiveEffect('🚿 물줄기 쏴아아~');
      playCareSound('drink', soundEnabled);
      setIsSplashing(true);

      scheduleGameTimeout(() => {
        setIsSplashing(false);
        setActiveEffect(null);
        busyRef.current = false;
        setCurrentStep('soap');
      }, 1600);
    } else if (step === 'soap') {
      setActiveEffect('🧼 거품 문질문질!');
      playCareSound('bubble', soundEnabled);
      setBubbleCount(8);
      setHasFoamHat(true);
      setIsSplashing(true);

      scheduleGameTimeout(() => {
        setIsSplashing(false);
        setActiveEffect(null);
        busyRef.current = false;
        setCurrentStep('duck');
      }, 1600);
    } else if (step === 'duck') {
      setActiveEffect('🐤 꽥꽥 첨벙첨벙!');
      playBouncyBoing(soundEnabled);
      setIsSplashing(true);

      scheduleGameTimeout(() => {
        setIsSplashing(false);
        setActiveEffect(null);
        busyRef.current = false;
        setCurrentStep('rinse');
      }, 1600);
    } else if (step === 'rinse') {
      setActiveEffect('✨ 뽀드득 뽀송뽀송!');
      playSparkleChime(soundEnabled);
      setBubbleCount(0);
      setHasFoamHat(false);
      setIsSplashing(true);

      scheduleGameTimeout(() => {
        setIsSplashing(false);
        setActiveEffect(null);
        setIsFinished(true);
        playCorrectFanfare(soundEnabled);
        fireConfetti();
        onCompleteQuiz(10);
        stopAllSpeech();
        speakText('우와! 뽀송뽀송 깨끗해졌어요! 상쾌해!', soundEnabled, { characterId: buddy });

        scheduleGameTimeout(() => {
          setIsFinished(false);
          setCurrentStep('water');
          busyRef.current = false;
        }, 2800);
      }, 1600);
    }
  }, [isFinished, soundEnabled, scheduleGameTimeout, onCompleteQuiz, buddy]);

  return (
    <div className="bath-stage" aria-label="뽀글뽀글 거품 목욕 놀이">
      {/* Header */}
      <header className="bath-header">
        <div className="bath-step-pill">
          <span>{STEPS_INFO[currentStep].icon}</span>
          <span>{STEPS_INFO[currentStep].label}</span>
        </div>
        <div className="bath-progress-pill">
          <span>목욕 중:</span>
          <b>{currentStep === 'water' ? '1/4' : currentStep === 'soap' ? '2/4' : currentStep === 'duck' ? '3/4' : '4/4'}</b>
        </div>
      </header>

      {/* Bathtub Arena */}
      <main className="bath-arena">
        {activeEffect && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 bg-white/90 border-2 border-sky-400 px-4 py-2 rounded-full font-bold text-sky-800 shadow-md text-base z-30"
          >
            {activeEffect}
          </motion.div>
        )}

        <div className="bathtub-container">
          {/* Care Friend sitting in the tub */}
          <div className={`bath-friend ${isSplashing ? 'is-splashing' : ''}`}>
            {hasFoamHat && <div className="foam-hat" aria-label="거품 모자">🫧👑</div>}
            <CareFriend
              buddy={buddy}
              mouth={isFinished ? 'chew' : isSplashing ? 'open' : 'rest'}
              blush="#ff6b8b"
            />
          </div>

          {/* Bathtub Body */}
          <div className="bathtub-body" aria-hidden="true">
            <div className="tub-water">
              {/* Foam Bubbles inside water */}
              {Array.from({ length: bubbleCount }).map((_, i) => (
                <span
                  key={i}
                  className="tub-bubble-item"
                  style={{
                    left: `${10 + (i * 11) % 80}%`,
                    top: `${4 + (i * 7) % 20}px`,
                  }}
                >
                  🫧
                </span>
              ))}
            </div>
          </div>

          {/* Rubber Duck in the tub */}
          <button
            type="button"
            className="rubber-duck"
            onClick={() => handlePerformAction('duck')}
            aria-label="러버덕 오리 장난감 누르기"
          >
            🐤
          </button>

          {isFinished && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.3, opacity: 1 }}
              className="absolute -top-10 text-pink-500 z-30"
            >
              <Heart size={48} fill="currentColor" />
            </motion.div>
          )}
        </div>
      </main>

      {/* Action Buttons at bottom */}
      <footer className="bath-controls" aria-label="목욕 도구 선택">
        {(['water', 'soap', 'duck', 'rinse'] as BathStep[]).map((step) => {
          const info = STEPS_INFO[step];
          const isActive = currentStep === step;

          return (
            <button
              key={step}
              type="button"
              className={`bath-tool-btn ${isActive ? 'is-active' : ''}`}
              onClick={() => handlePerformAction(step)}
              aria-label={info.label}
            >
              <span className="bath-tool-icon">{info.icon}</span>
              <span>{info.label}</span>
            </button>
          );
        })}
      </footer>
    </div>
  );
};
