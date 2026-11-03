import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Paintbrush, Hand } from 'lucide-react';
import type { CharacterId, AgeGroup } from '../../types';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { PlayGuide, PlayProgress } from '../../components/ToddlerPlay';
import { PixiStageOverlay, type PixiStageHandle } from '../../components/PixiStageOverlay';
import {
  speakText,
  isSpeechBusy,
  stopAllSpeech,
  playSparkleChime,
  playCorrectFanfare,
  playCelebrationFanfare,
  playBouncyBoing,
  playJellyTap,
  playStarGain,
  playRisingStepChime,
  playCareSound,
} from '../../utils/soundEngine';
import { fireConfetti, fireStarExplosion } from '../../utils/confetti';
import { emitJuice } from '../../utils/juice';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import { useGameActivity } from '../../hooks/useGameActivity';
import { RoundContinuation } from '../../components/RoundContinuation';
import './CreativePlay.css';
import { usePlayMemory } from '../../components/PlayMemoryContext';

interface BeautySalonGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup?: AgeGroup;
  childName?: string;
}

interface SalonRound {
  id: 'nails' | 'facepaint' | 'butterfly';
  title: string;
  badge: string;
  emoji: string;
  guideText: string;
  completedVoice: string;
}

const SALON_ROUNDS: SalonRound[] = [
  {
    id: 'nails',
    title: '반짝반짝 무지개 네일아트',
    badge: '💅 보석 네일아트 색칠',
    emoji: '💅',
    guideText: '예쁜 매니큐어 색깔을 골라 손톱 5개를 톡톡 칠하고 반짝이 보석을 붙여 볼까?',
    completedVoice: '우와! 손톱이 반짝반짝 보석처럼 빛나요! 정말 예쁘다!',
  },
  {
    id: 'facepaint',
    title: '야옹이 수염 & 하트 페이스페인팅',
    badge: '🐱 귀여운 페이스페인팅',
    emoji: '🐱',
    guideText: '이번엔 친구 얼굴에 고양이 수염과 하트 볼터치를 톡톡 그려 볼까?',
    completedVoice: '야옹~! 귀여운 고양이 수염이랑 하트 볼터치가 생겼어! 까르르!',
  },
  {
    id: 'butterfly',
    title: '무지개 나비 요정 메이크업',
    badge: '🦋 나비 요정 메이크업',
    emoji: '🦋',
    guideText: '마지막은 알록달록 나비 요정 분장이야! 얼굴에 반짝이 날개와 왕관을 칠해 봐!',
    completedVoice: '짜잔! 화려한 무지개 나비 요정으로 변신 완료! 최고의 뷰티 디자이너야!',
  },
];

const POLISH_COLORS = [
  { id: 'pink', label: '핑크', hex: '#EC4899', num: 0xEC4899, gem: '💖' },
  { id: 'purple', label: '보라', hex: '#A855F7', num: 0xA855F7, gem: '💎' },
  { id: 'sky', label: '하늘', hex: '#38BDF8', num: 0x38BDF8, gem: '⭐' },
  { id: 'gold', label: '노랑', hex: '#FACC15', num: 0xFACC15, gem: '👑' },
  { id: 'mint', label: '민트', hex: '#4ADE80', num: 0x4ADE80, gem: '🌸' },
];

const NAIL_POSITIONS = [
  { id: 0, x: 58, y: 122, rot: -18, label: '엄지 손톱' },
  { id: 1, x: 102, y: 66, rot: -7, label: '검지 손톱' },
  { id: 2, x: 155, y: 52, rot: 0, label: '중지 손톱' },
  { id: 3, x: 208, y: 68, rot: 8, label: '약지 손톱' },
  { id: 4, x: 250, y: 108, rot: 18, label: '새끼 손톱' },
];

const FACE_ZONES = [
  { id: 0, x: 110, y: 42, label: '이마 별 왕관' },
  { id: 1, x: 58, y: 118, label: '왼쪽 볼 하트와 수염' },
  { id: 2, x: 162, y: 118, label: '오른쪽 볼 하트와 수염' },
  { id: 3, x: 110, y: 104, label: '코 끝 반짝이' },
  { id: 4, x: 110, y: 164, label: '턱 리본 보석' },
];

export const BeautySalonGame: React.FC<BeautySalonGameProps> = ({
  buddy,
  onCompleteQuiz,
  soundEnabled,
}) => {
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const { paused, isBlocked } = useGameActivity();
  const latest = useRef({ soundEnabled, onCompleteQuiz });
  latest.current = { soundEnabled, onCompleteQuiz };
  const [completed, setCompleted] = useState(false);
  const { rememberColor } = usePlayMemory();
  const pixiRef = useRef<PixiStageHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const roundDoneRef = useRef(false);

  const [round, setRound] = useState(0);
  const totalRounds = 3;
  const currentSalon = SALON_ROUNDS[round] || SALON_ROUNDS[0];

  const [selectedBrush, setSelectedBrush] = useState(POLISH_COLORS[0]);
  const zonesRef = useRef<Array<{ hex: string; gem: string } | null>>([null, null, null, null, null]);
  const [zoneColors, setZoneColors] = useState<Array<{ hex: string; gem: string } | null>>([
    null,
    null,
    null,
    null,
    null,
  ]);
  const [isDone, setIsDone] = useState(false);

  const setupRound = useCallback((roundIdx: number) => {
    roundDoneRef.current = false;
    setCompleted(false);
    zonesRef.current = [null, null, null, null, null];
    setZoneColors([null, null, null, null, null]);
    setIsDone(false);
    setSelectedBrush(POLISH_COLORS[roundIdx % POLISH_COLORS.length]);

  }, []);

  useEffect(() => {
    setupRound(round);
  }, [round, setupRound]);

  useEffect(() => {
    const salon = SALON_ROUNDS[round] || SALON_ROUNDS[0];
    if (!isBlocked() && !isSpeechBusy()) speakText(salon.guideText, soundEnabled, { characterId: buddy });
  }, [round, soundEnabled, buddy, isBlocked]);

  useEffect(() => {
    return () => {
      clearGameTimeouts();
      stopAllSpeech();
    };
  }, [clearGameTimeouts]);

  const finishRound = useCallback(
    (salon: SalonRound, currentRound: number, color: typeof POLISH_COLORS[number]) => {
      if (isBlocked() || roundDoneRef.current) return;
      roundDoneRef.current = true;
      setIsDone(true);

      playCorrectFanfare(soundEnabled);
      playCareSound('giggle', soundEnabled);

      const detail = salon.id === 'nails' ? '손톱' : salon.id === 'facepaint' ? '고양이 수염' : '나비 날개';
      speakText(`${color.label} 빛깔 ${detail}이 반짝여!`, soundEnabled, { characterId: buddy, englishText: salon.id === 'nails' ? 'Your colorful nails are sparkling!' : salon.id === 'facepaint' ? 'Your kitty whiskers are ready! Meow!' : 'Your butterfly wings are sparkling!' });

      fireStarExplosion();
      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        pixiRef.current?.emitBurst({
          x: rect.width / 2,
          y: rect.height / 2,
          color: 0xEC4899,
          count: 32,
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
    [buddy, isBlocked, scheduleGameTimeout, soundEnabled]
  );

  const handlePaintZone = useCallback(
    (idx: number, brushOverride = selectedBrush, e?: React.MouseEvent<HTMLElement | SVGElement>) => {
      if (e) e.stopPropagation();
      if (isBlocked() || roundDoneRef.current) return;

      playJellyTap(soundEnabled);
      playBouncyBoing(soundEnabled);
      if (e) {
        emitJuice({ kind: 'pop', x: e.clientX, y: e.clientY });
        if (stageRef.current) {
          const rect = stageRef.current.getBoundingClientRect();
          pixiRef.current?.emitBurst({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            color: brushOverride.num,
            count: 14,
            kind: 'star',
          });
        }
      }

      const empty = zonesRef.current.findIndex(zone => zone === null);
      const target = zonesRef.current[idx] && empty !== -1 ? empty : idx;
      const next = [...zonesRef.current];
      next[target] = { hex: brushOverride.hex, gem: brushOverride.gem };
      zonesRef.current = next;
      setZoneColors(next);
      rememberColor({ hex: brushOverride.hex, label: brushOverride.label });
      const painted = next.filter(Boolean).length;
      playRisingStepChime(painted, 5, soundEnabled);
      if (painted === 5) finishRound(currentSalon, round, brushOverride);
    },
    [currentSalon, finishRound, isBlocked, rememberColor, round, selectedBrush, soundEnabled]
  );

  const handleQuickPaintNext = useCallback((e?: React.MouseEvent<HTMLElement | SVGElement>) => {
    e?.stopPropagation();
    if (isBlocked() || roundDoneRef.current) return;
    const empty = zonesRef.current.findIndex(zone => zone === null);
    if (empty !== -1) handlePaintZone(empty, selectedBrush, e);
  }, [handlePaintZone, isBlocked, selectedBrush]);

  const paintedCount = zoneColors.filter(Boolean).length;

  return (
    <div
      ref={stageRef}
      data-paused={paused}
      className="beauty-salon-stage creative-play relative flex flex-col justify-between w-full h-[var(--game-play-height,calc(100dvh-84px))] min-h-[var(--game-play-height,calc(100dvh-84px))] rounded-3xl overflow-hidden select-none bg-gradient-to-b from-[#FAF5FF] via-[#FDF2F8] to-[#FCE7F3] border-3 border-[#D946EF] p-3 sm:p-5"
    >
      <PixiStageOverlay ref={pixiRef} className="z-20 pointer-events-none" />

      <div className="creative-play-header">
        <PlayGuide buddy={buddy} title="반짝이 분장 놀이" guide={currentSalon.guideText} soundEnabled={soundEnabled} happy={isDone} />
        <div className="creative-pictorial-guide" aria-hidden="true">
          <Paintbrush />
          <span>{currentSalon.emoji}</span>
        </div>
        <PlayProgress total={totalRounds} done={completed ? totalRounds : round} label={`${round + 1}/${totalRounds}`} />
      </div>

      {/* Center Salon Mirror / Nail Cushion Stage */}
      <div className="creative-play-body">
        {currentSalon.id === 'nails' ? (
          /* Round 1: Big Cute Hand & 5 Paintable Fingernails */
          <div className="creative-play-art"
            role="button" tabIndex={0} aria-label="손톱에 색칠하기" onClick={handleQuickPaintNext}
            onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleQuickPaintNext(); } }}>
            {paintedCount === 0 && <Hand className="creative-gesture" aria-hidden="true" />}
            <svg viewBox="0 0 310 240" className="w-full h-full overflow-visible drop-shadow-xl">
              {/* Velvet Heart Cushion */}
              <ellipse cx="155" cy="185" rx="135" ry="44" fill="#FBCFE8" stroke="#EC4899" strokeWidth="4" />
              {/* Cute Chubby Hand Fingers & Palm */}
              {NAIL_POSITIONS.map((nail) => {
                const painted = zoneColors[nail.id];
                return (
                  <g
                    key={nail.id}
                    transform={`translate(${nail.x}, ${nail.y}) rotate(${nail.rot})`}
                    className="cursor-pointer"
                    onClick={(e) => handlePaintZone(nail.id, selectedBrush, e)}
                  >
                    {/* Finger */}
                    <rect
                      x="-22"
                      y="0"
                      width="44"
                      height="95"
                      rx="22"
                      fill="#FDE68A"
                      stroke="#D97706"
                      strokeWidth="3.5"
                    />
                    {/* Paintable Fingernail Plate */}
                    <rect
                      x="-18"
                      y="-18"
                      width="36"
                      height="44"
                      rx="18"
                      fill={painted ? painted.hex : '#FFF1F2'}
                      stroke={painted ? '#FFFFFF' : '#EC4899'}
                      strokeWidth="3.5"
                      strokeDasharray={painted ? undefined : '5 4'}
                      className={!painted ? 'salon-zone-pulse' : ''}
                    />
                    {/* Gloss Shine on Nail */}
                    <ellipse cx="-6" cy="-4" rx="4" ry="9" fill="#FFFFFF" opacity="0.65" />
                    {/* Gem Sticker on Painted Nail */}
                    {painted && (
                      <text x="0" y="6" textAnchor="middle" dominantBaseline="central" fontSize="18">
                        {painted.gem}
                      </text>
                    )}
                  </g>
                );
              })}
              {/* Palm Base */}
              <ellipse cx="155" cy="192" rx="92" ry="40" fill="#FDE68A" stroke="#D97706" strokeWidth="3.5" />
            </svg>
          </div>
        ) : (
          /* Round 2 & 3: Lighted Vanity Mirror with Buddy Face-Painting Zones */
          <div className="creative-play-art creative-mirror-art rounded-full bg-gradient-to-b from-[#FFF1F2] to-[#FCE7F3] border-[8px] border-[#FACC15] shadow-[0_12px_32px_rgba(217,70,239,0.28)]"
            role="button" tabIndex={0} aria-label="친구 얼굴 꾸미기" onClick={handleQuickPaintNext}
            onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleQuickPaintNext(); } }}>
            {paintedCount === 0 && <Hand className="creative-gesture" aria-hidden="true" />}
            {/* Large Buddy Avatar inside Mirror */}
            <div className="creative-mirror-avatar flex items-center justify-center pointer-events-none">
              <CharacterAvatar
                id={buddy}
                size="xl"
                mood={isDone ? 'dancing' : paintedCount > 0 ? 'excited' : 'happy'}
                interactive={false}
              />
            </div>

            {/* Interactive SVG Face-Paint & Butterfly Mask Overlay */}
            <svg viewBox="0 0 220 220" className="absolute inset-0 w-full h-full overflow-visible">
              {/* Zone 0: Forehead Crown / Butterfly Crest */}
              <g
                className="cursor-pointer"
                onClick={(e) => handlePaintZone(0, selectedBrush, e)}
              >
                {zoneColors[0] ? (
                  <g>
                    <polygon
                      points="82,48 94,22 110,38 126,22 138,48"
                      fill={zoneColors[0].hex}
                      stroke="#FFFFFF"
                      strokeWidth="3"
                    />
                    <text x="110" y="38" textAnchor="middle" fontSize="20">
                      {zoneColors[0].gem}
                    </text>
                  </g>
                ) : (
                  <circle
                    cx={FACE_ZONES[0].x}
                    cy={FACE_ZONES[0].y}
                    r="18"
                    fill="rgba(255,255,255,0.65)"
                    stroke="#EC4899"
                    strokeWidth="3"
                    strokeDasharray="5 4"
                    className="salon-zone-pulse"
                  />
                )}
              </g>

              {/* Zone 1: Left Cheek Whiskers / Butterfly Wing */}
              <g
                className="cursor-pointer"
                onClick={(e) => handlePaintZone(1, selectedBrush, e)}
              >
                {zoneColors[1] ? (
                  currentSalon.id === 'butterfly' ? (
                    <path
                      d="M90,96 C42,60 22,102 52,130 C30,148 56,172 90,136 Z"
                      fill={zoneColors[1].hex}
                      fillOpacity="0.78"
                      stroke="#FFFFFF"
                      strokeWidth="3"
                    />
                  ) : (
                    <g>
                      <circle cx="62" cy="118" r="14" fill={zoneColors[1].hex} opacity="0.75" />
                      <path
                        d="M26,108 L54,114 M22,120 L52,120 M26,132 L54,126"
                        stroke={zoneColors[1].hex}
                        strokeWidth="4.5"
                        strokeLinecap="round"
                      />
                    </g>
                  )
                ) : (
                  <circle
                    cx={FACE_ZONES[1].x}
                    cy={FACE_ZONES[1].y}
                    r="18"
                    fill="rgba(255,255,255,0.65)"
                    stroke="#EC4899"
                    strokeWidth="3"
                    strokeDasharray="5 4"
                    className="salon-zone-pulse"
                  />
                )}
              </g>

              {/* Zone 2: Right Cheek Whiskers / Butterfly Wing */}
              <g
                className="cursor-pointer"
                onClick={(e) => handlePaintZone(2, selectedBrush, e)}
              >
                {zoneColors[2] ? (
                  currentSalon.id === 'butterfly' ? (
                    <path
                      d="M130,96 C178,60 198,102 168,130 C190,148 164,172 130,136 Z"
                      fill={zoneColors[2].hex}
                      fillOpacity="0.78"
                      stroke="#FFFFFF"
                      strokeWidth="3"
                    />
                  ) : (
                    <g>
                      <circle cx="158" cy="118" r="14" fill={zoneColors[2].hex} opacity="0.75" />
                      <path
                        d="M194,108 L166,114 M198,120 L168,120 M194,132 L166,126"
                        stroke={zoneColors[2].hex}
                        strokeWidth="4.5"
                        strokeLinecap="round"
                      />
                    </g>
                  )
                ) : (
                  <circle
                    cx={FACE_ZONES[2].x}
                    cy={FACE_ZONES[2].y}
                    r="18"
                    fill="rgba(255,255,255,0.65)"
                    stroke="#EC4899"
                    strokeWidth="3"
                    strokeDasharray="5 4"
                    className="salon-zone-pulse"
                  />
                )}
              </g>

              {/* Zone 3: Cute Painted Nose */}
              <g
                className="cursor-pointer"
                onClick={(e) => handlePaintZone(3, selectedBrush, e)}
              >
                {zoneColors[3] ? (
                  <g>
                    <circle cx="110" cy="104" r="11" fill={zoneColors[3].hex} stroke="#FFFFFF" strokeWidth="2.5" />
                    <circle cx="107" cy="101" r="3.5" fill="#FFFFFF" />
                  </g>
                ) : (
                  <circle
                    cx={FACE_ZONES[3].x}
                    cy={FACE_ZONES[3].y}
                    r="15"
                    fill="rgba(255,255,255,0.65)"
                    stroke="#EC4899"
                    strokeWidth="3"
                    strokeDasharray="5 4"
                    className="salon-zone-pulse"
                  />
                )}
              </g>

              {/* Zone 4: Chin Bow / Gem Stamp */}
              <g
                className="cursor-pointer"
                onClick={(e) => handlePaintZone(4, selectedBrush, e)}
              >
                {zoneColors[4] ? (
                  <text x="110" y="170" textAnchor="middle" dominantBaseline="central" fontSize="28">
                    {zoneColors[4].gem}
                  </text>
                ) : (
                  <circle
                    cx={FACE_ZONES[4].x}
                    cy={FACE_ZONES[4].y}
                    r="16"
                    fill="rgba(255,255,255,0.65)"
                    stroke="#EC4899"
                    strokeWidth="3"
                    strokeDasharray="5 4"
                    className="salon-zone-pulse"
                  />
                )}
              </g>
            </svg>
          </div>
        )}

        <div className="creative-tool-shelf" aria-label="색깔 붓">
          {POLISH_COLORS.map(c => <button key={c.id} type="button" className="creative-tool" disabled={isDone} aria-label={`${c.label} 브러시로 칠하기`} aria-pressed={selectedBrush.id === c.id} style={{ backgroundColor: c.hex }} onClick={e => {
            if (isBlocked() || roundDoneRef.current) return;
            setSelectedBrush(c);
            const empty = zonesRef.current.findIndex(zone => zone === null);
            if (empty !== -1) handlePaintZone(empty, c, e);
          }}><span aria-hidden="true">{c.gem}</span></button>)}
          <motion.button type="button" whileTap={{ scale: .92 }} className="creative-tool creative-action-tool" disabled={isDone} aria-label="다음 곳에 색칠하기" onClick={handleQuickPaintNext}><Paintbrush /></motion.button>
        </div>
      </div>
      {completed && <RoundContinuation delayMs={700} onNext={() => setRound(0)} />}
    </div>
  );
};
