import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplets, Hand } from 'lucide-react';
import type { CharacterId, AgeGroup } from '../../types';
import { PlayGuide, PlayProgress } from '../../components/ToddlerPlay';
import { PixiStageOverlay, type PixiStageHandle } from '../../components/PixiStageOverlay';
import {
  speakText,
  isSpeechBusy,
  stopAllSpeech,
  playCorrectFanfare,
  playCelebrationFanfare,
  playBalloonPop,
  playBouncyBoing,
  playStarGain,
  playRisingStepChime,
} from '../../utils/soundEngine';
import { fireConfetti, fireStarExplosion } from '../../utils/confetti';
import { emitJuice } from '../../utils/juice';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import { useGameActivity } from '../../hooks/useGameActivity';
import { RoundContinuation } from '../../components/RoundContinuation';
import './CreativePlay.css';
import { usePlayMemory } from '../../components/PlayMemoryContext';

interface SplashColorGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup?: AgeGroup;
  childName?: string;
}

interface SplashRound {
  id: 'car' | 'rocket' | 'train';
  title: string;
  badge: string;
  emoji: string;
  guideText: string;
  completedVoice: string;
}

const SPLASH_ROUNDS: SplashRound[] = [
  {
    id: 'car',
    title: '부릉부릉 무지개 자동차',
    badge: '🚗 자동차 물풍선 색칠',
    emoji: '🚗',
    guideText: '하얀 자동차 칸이나 물풍선을 톡 눌러 물감을 팡팡 터뜨려 색칠해 봐!',
    completedVoice: '부릉부릉~! 알록달록 멋진 무지개 자동차가 출발해요!',
  },
  {
    id: 'rocket',
    title: '슈웅 반짝 우주 로켓',
    badge: '🚀 우주 로켓 물풍선 색칠',
    emoji: '🚀',
    guideText: '이번엔 우주 로켓이야! 칸을 톡톡 눌러 물풍선 물감으로 멋지게 색칠해 줄래?',
    completedVoice: '쓰리 투 원 발사! 무지개 우주 로켓이 하늘 높이 날아가요!',
  },
  {
    id: 'train',
    title: '칙칙폭폭 무지개 기차',
    badge: '🚂 무지개 기차 색칠',
    emoji: '🚂',
    guideText: '마지막은 칙칙폭폭 기차야! 물풍선을 팡팡 터뜨려 기차를 알록달록 꾸며 봐!',
    completedVoice: '칙칙폭폭 뿌우~! 무지개 기차가 신나게 달립니다! 최고야!',
  },
];

const BALLOON_PALETTE = [
  { id: 0, name: '빨강 물풍선', hex: '#F43F5E', num: 0xF43F5E },
  { id: 1, name: '노랑 물풍선', hex: '#FACC15', num: 0xFACC15 },
  { id: 2, name: '하늘 물풍선', hex: '#38BDF8', num: 0x38BDF8 },
  { id: 3, name: '초록 물풍선', hex: '#4ADE80', num: 0x4ADE80 },
  { id: 4, name: '보라 물풍선', hex: '#A855F7', num: 0xA855F7 },
];

export const SplashColorGame: React.FC<SplashColorGameProps> = ({
  buddy,
  onCompleteQuiz,
  soundEnabled,
}) => {
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const { paused, isBlocked } = useGameActivity();
  const latest = useRef({ soundEnabled, onCompleteQuiz });
  latest.current = { soundEnabled, onCompleteQuiz };
  const [completed, setCompleted] = useState(false);
  const { rememberColor, rememberRide } = usePlayMemory();
  const pixiRef = useRef<PixiStageHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const roundDoneRef = useRef(false);

  const [round, setRound] = useState(0);
  const totalRounds = 3;
  const currentRoundData = SPLASH_ROUNDS[round] || SPLASH_ROUNDS[0];

  const [selectedBalloon, setSelectedBalloon] = useState(BALLOON_PALETTE[0]);
  const [zones, setZones] = useState<Array<string | null>>([null, null, null, null, null]);
  const zonesRef = useRef<Array<string | null>>([null, null, null, null, null]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [splatBadges, setSplatBadges] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  const setupRound = useCallback(() => {
    roundDoneRef.current = false;
    setCompleted(false);
    zonesRef.current = [null, null, null, null, null];
    setZones([null, null, null, null, null]);
    setSplatBadges([]);
    setIsCompleted(false);
    setSelectedBalloon(BALLOON_PALETTE[0]);

  }, []);

  useEffect(() => {
    setupRound();
  }, [round, setupRound]);

  useEffect(() => {
    const data = SPLASH_ROUNDS[round] || SPLASH_ROUNDS[0];
    if (!isBlocked() && !isSpeechBusy()) speakText(data.guideText, soundEnabled, { characterId: buddy });
  }, [round, soundEnabled, buddy, isBlocked]);

  useEffect(() => {
    return () => {
      clearGameTimeouts();
      stopAllSpeech();
    };
  }, [clearGameTimeouts]);

  const finishVehicleRound = useCallback(
    (data: SplashRound, currentRound: number, colors: string[]) => {
      if (isBlocked() || roundDoneRef.current) return;
      roundDoneRef.current = true;
      setIsCompleted(true);

      playCorrectFanfare(soundEnabled);
      playBouncyBoing(soundEnabled);

      // The existing train remains a train; only the matching saved ride kinds are shared.
      if (data.id === 'car' || data.id === 'rocket') rememberRide({ kind: data.id, colors });
      const result = data.id === 'car' ? '알록달록 자동차, 부릉부릉!' : data.id === 'rocket' ? '무지개 로켓, 슈웅!' : '알록달록 기차, 칙칙폭폭!';
      speakText(result, soundEnabled, { characterId: buddy, englishText: data.id === 'car' ? 'Your colorful car! Vroom vroom!' : data.id === 'rocket' ? 'Your rainbow rocket! Whoosh!' : 'Your colorful train! Choo choo!' });

      fireStarExplosion();
      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        pixiRef.current?.emitBurst({
          x: rect.width / 2,
          y: rect.height / 2,
          color: 0x38BDF8,
          count: 34,
          kind: 'star',
        });
      }

      scheduleGameTimeout(() => {
        if (currentRound + 1 < totalRounds) {
          playStarGain(latest.current.soundEnabled);
          setRound((r) => r + 1);
        } else {
          playCelebrationFanfare(latest.current.soundEnabled);
          fireConfetti();
          setCompleted(true);
          latest.current.onCompleteQuiz(3);
        }
      }, 700);
    },
    [buddy, isBlocked, rememberRide, scheduleGameTimeout, soundEnabled]
  );

  const handleSplatZone = useCallback(
    (zoneIdx: number, balloonOverride = selectedBalloon, e?: React.MouseEvent<SVGElement | HTMLElement>) => {
      if (e) e.stopPropagation();
      if (isBlocked() || roundDoneRef.current) return;

      playBalloonPop(soundEnabled);

      if (e) {
        emitJuice({ kind: 'pop', x: e.clientX, y: e.clientY });
        if (stageRef.current) {
          const rect = stageRef.current.getBoundingClientRect();
          pixiRef.current?.emitBurst({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            color: balloonOverride.num,
            count: 20,
            kind: 'water',
          });
        }
      }

      const splatId = Date.now() + Math.floor(Math.random() * 1000);
      setSplatBadges((prev) => [
        ...prev.slice(-4),
        {
          id: splatId,
          x: (zoneIdx * 17) % 50 - 25,
          y: (zoneIdx * 13) % 30 - 15,
          color: balloonOverride.hex,
        },
      ]);

      const empty = zonesRef.current.findIndex(zone => zone === null);
      const target = zonesRef.current[zoneIdx] && empty !== -1 ? empty : zoneIdx;
      const next = [...zonesRef.current];
      next[target] = balloonOverride.hex;
      zonesRef.current = next;
      setZones(next);
      rememberColor({ hex: balloonOverride.hex, label: balloonOverride.name.replace(' 물풍선', '') });
      const painted = next.filter(Boolean).length;
      playRisingStepChime(painted, 5, soundEnabled);
      setSelectedBalloon(BALLOON_PALETTE[(balloonOverride.id + 1) % BALLOON_PALETTE.length]);
      if (painted === 5) finishVehicleRound(currentRoundData, round, next.filter((color): color is string => !!color));
    },
    [currentRoundData, finishVehicleRound, isBlocked, rememberColor, round, selectedBalloon, soundEnabled]
  );

  const handleThrowNextBalloon = useCallback((balloon = selectedBalloon, e?: React.MouseEvent<HTMLElement | SVGElement>) => {
    e?.stopPropagation();
    if (isBlocked() || roundDoneRef.current) return;
    const empty = zonesRef.current.findIndex(zone => zone === null);
    if (empty !== -1) handleSplatZone(empty, balloon, e);
  }, [handleSplatZone, isBlocked, selectedBalloon]);

  const coloredCount = zones.filter(Boolean).length;

  return (
    <div
      ref={stageRef}
      data-paused={paused}
      className="splash-color-stage creative-play relative flex flex-col justify-between w-full h-[var(--game-play-height,calc(100dvh-84px))] min-h-[var(--game-play-height,calc(100dvh-84px))] rounded-3xl overflow-hidden select-none bg-gradient-to-b from-[#ECFEFF] via-[#E0F2FE] to-[#FEF9C3] border-3 border-[#0EA5E9] p-3 sm:p-5"
    >
      <PixiStageOverlay ref={pixiRef} className="z-20 pointer-events-none" />

      <div className="creative-play-header">
        <PlayGuide buddy={buddy} title="물풍선 색칠" guide={currentRoundData.guideText} soundEnabled={soundEnabled} happy={isCompleted} />
        <div className="creative-pictorial-guide" aria-hidden="true">
          <Droplets />
          <span>{currentRoundData.emoji}</span>
        </div>
        <PlayProgress total={totalRounds} done={completed ? totalRounds : round} label={`${round + 1}/${totalRounds}`} />
      </div>

      {/* Center Tap-to-Splat Coloring Canvas */}
      <div className="creative-play-body">
        <motion.div
          animate={
            isCompleted
              ? {
                  x: [0, 14, -10, 0],
                  y: [0, -10, 0],
                  scale: [1, 1.07, 1],
                }
              : {}
          }
          transition={{ duration: 0.65 }}
          className="creative-play-art bg-white/90 rounded-3xl border-4 border-[#38BDF8] shadow-xl p-2"
          role="button" tabIndex={0} aria-label="그림에 물풍선 던지기" onClick={e => handleThrowNextBalloon(selectedBalloon, e)}
          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleThrowNextBalloon(); } }}
        >
          {coloredCount === 0 && <Hand className="creative-gesture" aria-hidden="true" />}
          <svg viewBox="0 0 360 250" className="w-full h-full overflow-visible">
            {currentRoundData.id === 'car' && (
              /* Round 1: Cute Rainbow Car with 5 Tap Zones */
              <g>
                {/* Zone 0: Car Roof & Cabin */}
                <path
                  d="M95,120 L125,62 L235,62 L265,120 Z"
                  fill={zones[0] || '#F8FAFC'}
                  stroke="#1E293B"
                  strokeWidth="5"
                  strokeLinejoin="round"
                  className="cursor-pointer splash-zone-uncolored"
                  onClick={(e) => handleSplatZone(0, selectedBalloon, e)}
                />
                {/* Zone 1: Car Main Body */}
                <rect
                  x="48"
                  y="118"
                  width="264"
                  height="68"
                  rx="28"
                  fill={zones[1] || '#F8FAFC'}
                  stroke="#1E293B"
                  strokeWidth="5"
                  className="cursor-pointer splash-zone-uncolored"
                  onClick={(e) => handleSplatZone(1, selectedBalloon, e)}
                />
                {/* Zone 2: Front Bumper & Headlight */}
                <circle
                  cx="296"
                  cy="146"
                  r="18"
                  fill={zones[2] || '#FEF9C3'}
                  stroke="#1E293B"
                  strokeWidth="4.5"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(2, selectedBalloon, e)}
                />
                {/* Zone 3: Left Wheel */}
                <circle
                  cx="112"
                  cy="188"
                  r="32"
                  fill={zones[3] || '#E2E8F0'}
                  stroke="#1E293B"
                  strokeWidth="6"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(3, selectedBalloon, e)}
                />
                <circle cx="112" cy="188" r="12" fill="#FFFFFF" pointerEvents="none" />
                {/* Zone 4: Right Wheel */}
                <circle
                  cx="248"
                  cy="188"
                  r="32"
                  fill={zones[4] || '#E2E8F0'}
                  stroke="#1E293B"
                  strokeWidth="6"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(4, selectedBalloon, e)}
                />
                <circle cx="248" cy="188" r="12" fill="#FFFFFF" pointerEvents="none" />
              </g>
            )}

            {currentRoundData.id === 'rocket' && (
              /* Round 2: Space Rocket with 5 Tap Zones */
              <g>
                {/* Zone 0: Rocket Nose Cone */}
                <path
                  d="M180,22 L228,84 L132,84 Z"
                  fill={zones[0] || '#F8FAFC'}
                  stroke="#1E293B"
                  strokeWidth="5"
                  strokeLinejoin="round"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(0, selectedBalloon, e)}
                />
                {/* Zone 1: Rocket Main Fuselage */}
                <rect
                  x="132"
                  y="84"
                  width="96"
                  height="96"
                  rx="16"
                  fill={zones[1] || '#F8FAFC'}
                  stroke="#1E293B"
                  strokeWidth="5"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(1, selectedBalloon, e)}
                />
                {/* Zone 2: Porthole Window */}
                <circle
                  cx="180"
                  cy="130"
                  r="26"
                  fill={zones[2] || '#E0F2FE'}
                  stroke="#1E293B"
                  strokeWidth="5"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(2, selectedBalloon, e)}
                />
                {/* Zone 3: Left Wing Fin */}
                <path
                  d="M132,132 L84,186 L132,176 Z"
                  fill={zones[3] || '#F8FAFC'}
                  stroke="#1E293B"
                  strokeWidth="5"
                  strokeLinejoin="round"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(3, selectedBalloon, e)}
                />
                {/* Zone 4: Right Wing Fin & Booster Flame */}
                <path
                  d="M228,132 L276,186 L228,176 Z"
                  fill={zones[4] || '#F8FAFC'}
                  stroke="#1E293B"
                  strokeWidth="5"
                  strokeLinejoin="round"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(4, selectedBalloon, e)}
                />
                <path
                  d="M154,182 L180,228 L206,182 Z"
                  fill={zones[4] || '#FEF08A'}
                  stroke="#EA580C"
                  strokeWidth="4"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(4, selectedBalloon, e)}
                />
              </g>
            )}

            {currentRoundData.id === 'train' && (
              /* Round 3: Choo-Choo Train with 5 Tap Zones */
              <g>
                {/* Zone 0: Smokestack Chimney */}
                <rect
                  x="84"
                  y="48"
                  width="38"
                  height="56"
                  rx="8"
                  fill={zones[0] || '#F8FAFC'}
                  stroke="#1E293B"
                  strokeWidth="5"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(0, selectedBalloon, e)}
                />
                {/* Zone 1: Engine Boiler */}
                <rect
                  x="64"
                  y="102"
                  width="136"
                  height="76"
                  rx="18"
                  fill={zones[1] || '#F8FAFC'}
                  stroke="#1E293B"
                  strokeWidth="5"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(1, selectedBalloon, e)}
                />
                {/* Zone 2: Conductor Cabin */}
                <rect
                  x="196"
                  y="66"
                  width="98"
                  height="112"
                  rx="16"
                  fill={zones[2] || '#F8FAFC'}
                  stroke="#1E293B"
                  strokeWidth="5"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(2, selectedBalloon, e)}
                />
                {/* Zone 3: Front Wheels */}
                <circle
                  cx="116"
                  cy="192"
                  r="28"
                  fill={zones[3] || '#E2E8F0'}
                  stroke="#1E293B"
                  strokeWidth="5.5"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(3, selectedBalloon, e)}
                />
                {/* Zone 4: Rear Big Wheel */}
                <circle
                  cx="244"
                  cy="192"
                  r="32"
                  fill={zones[4] || '#E2E8F0'}
                  stroke="#1E293B"
                  strokeWidth="5.5"
                  className="cursor-pointer"
                  onClick={(e) => handleSplatZone(4, selectedBalloon, e)}
                />
              </g>
            )}
          </svg>

          {/* A quick pictorial splash follows each touch. */}
          <AnimatePresence>
            {splatBadges.map((sb) => (
              <motion.div
                key={sb.id}
                style={{
                  left: `${50 + sb.x}%`,
                  top: `${50 + sb.y}%`,
                  backgroundColor: sb.color,
                }}
                initial={{ opacity: 1, scale: 0.6, y: 0 }}
                animate={{ opacity: 0, scale: 1.3, y: -38 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 px-3 py-0.5 rounded-full text-white font-black text-xs sm:text-sm border-2 border-white shadow-md"
              >
                <Droplets className="creative-splash-drop" aria-hidden="true" />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <div className="creative-tool-shelf" aria-label="물풍선 색상">
          {BALLOON_PALETTE.map(b => <motion.button key={b.id} type="button" whileTap={{ scale: .9 }} className="creative-tool" disabled={isCompleted} aria-label={`${b.name} 던지기`} aria-pressed={selectedBalloon.id === b.id} style={{ backgroundColor: b.hex }} onClick={e => {
            if (isBlocked() || roundDoneRef.current) return;
            handleThrowNextBalloon(b, e);
          }}><span className="creative-tool-icon" aria-hidden="true">💧</span></motion.button>)}
          <motion.button type="button" whileTap={{ scale: .92 }} className="creative-tool creative-action-tool" disabled={isCompleted} aria-label="다음 곳에 물풍선 던지기" onClick={e => handleThrowNextBalloon(selectedBalloon, e)}><Droplets /></motion.button>
        </div>
      </div>
      {completed && <RoundContinuation delayMs={700} onNext={() => setRound(0)} />}
    </div>
  );
};
