import { RoundContinuation } from '../../components/RoundContinuation';
import { pickNextRound } from '../../utils/roundDeck';
import type { CharacterId } from '../../types';
import { CHARACTERS } from '../../data/characters';
import { ToyArtwork } from '../../components/ToyArtwork';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JellyButton } from '../../components/JellyButton';
import { speakText, stopAllSpeech, setBGMDucked, playCorrectFanfare, playWrongBoing } from '../../utils/soundEngine';
import { getDifficultyConfig, getAgeGroupLabel } from '../../utils/ageEngine';
import { RHYTHM_ITEMS_BY_AGE } from '../../data/gameData';
import { AgeGroup, RhythmItem } from '../../types';
import { Volume2, RefreshCw, Timer, Sparkles } from 'lucide-react';

interface RhythmGameProps {
  buddy: CharacterId;
  onCompleteQuiz: (starsEarned: number) => void;
  soundEnabled: boolean;
  ageGroup: AgeGroup;
  childName: string;
}

export const RhythmGame: React.FC<RhythmGameProps> = ({
  onCompleteQuiz,
  buddy,
  soundEnabled,
  ageGroup,
  childName,
}) => {
  const friend = CHARACTERS[buddy];
  useEffect(() => {
    setBGMDucked('rhythm', true);
    return () => setBGMDucked('rhythm', false);
  }, []);
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();

  const diffConfig = getDifficultyConfig(ageGroup);
  const itemPool = RHYTHM_ITEMS_BY_AGE[ageGroup] || RHYTHM_ITEMS_BY_AGE.sprout;

  const [targetItem, setTargetItem] = useState<RhythmItem>(itemPool[0]);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [activeButtonIdx, setActiveButtonIdx] = useState<number | null>(null);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // 타이머 상태
  const [timeLeft, setTimeLeft] = useState<number>(diffConfig.timeLimit);
  const [timeOut, setTimeOut] = useState(false);
  const gameTimerRef = useRef<number | null>(null);

  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;
  useEffect(() => {
    if (!soundEnabled) void audioCtxRef.current?.suspend();
  }, [soundEnabled]);

  // Web Audio Context 간이 생성
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = (frequency: number, duration = 0.4) => {
    if (!soundRef.current) return;
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = frequency;

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Web Audio error:', e);
    }
  };

  const sequenceRef = useRef(0);
  const playSequence = async (item: RhythmItem) => {
    const sequence = ++sequenceRef.current;
    setIsPlayingSequence(true);
    setUserSequence([]);
    
    // 리듬 소리가 연주되기 전 가이드
    speakText(`${friend.name}의 연주 리듬을 귀기울여 잘 들어보아요!`, soundEnabled, { characterId: buddy, playIntroSFX: false });
    await new Promise<void>((resolve) => window.setTimeout(resolve, 1500));
    if (!isMountedRef.current || sequence !== sequenceRef.current) return;
    stopAllSpeech();

    for (let i = 0; i < item.notes.length; i++) {
      if (!isMountedRef.current || sequence !== sequenceRef.current) return;
      const note = item.notes[i];
      setActiveButtonIdx(i);
      playTone(note, 0.4);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 600));
      if (!isMountedRef.current || sequence !== sequenceRef.current) return;
      setActiveButtonIdx(null);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 150));
    }
    
    if (!isMountedRef.current || sequence !== sequenceRef.current) return;
    setIsPlayingSequence(false);
    speakText(`이제 똑같이 톡톡 터치해볼까요?`, soundEnabled, { characterId: buddy, playIntroSFX: false });
  };

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      sequenceRef.current += 1;
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const generateRound = () => {
    clearGameTimeouts();
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);

    setIsCompleted(false);
    setTimeOut(false);
    setTimeLeft(diffConfig.timeLimit);
    setUserSequence([]);
    setActiveButtonIdx(null);

    const target = pickNextRound(itemPool, `RhythmGame:${ageGroup}`);
    if (!target) return;
    setTargetItem(target);

    playSequence(target);

    // 시간제한 타이머 구동
    if (diffConfig.timeLimit > 0) {
      gameTimerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (gameTimerRef.current) clearInterval(gameTimerRef.current);
            setTimeOut(true);
            speakText(`시간 초과! 다시 연주를 들어보아요!`, soundEnabled, { characterId: buddy });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  useEffect(() => {
    generateRound();
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [ageGroup]);

  const handleTapButton = (note: number, index: number) => {
    if (isPlayingSequence || isCompleted || timeOut) return;

    playTone(note, 0.3);
    const nextExpectedIdx = userSequence.length;
    const expectedNote = targetItem.notes[nextExpectedIdx];

    if (note === expectedNote) {
      const newSeq = [...userSequence, note];
      setUserSequence(newSeq);

      // 리듬 완성 체크
      if (newSeq.length === targetItem.notes.length) {
        if (gameTimerRef.current) clearInterval(gameTimerRef.current);

        setIsCompleted(true);
        playCorrectFanfare(soundEnabled);
        speakText(`참 잘했어요! 음악대장 정답이에요!`, soundEnabled, { characterId: buddy });
        onCompleteQuiz(diffConfig.starsPerCorrect);
      }
    } else {
      // 틀렸을 경우 시퀀스 초기화 및 재연주 안내
      playWrongBoing(soundEnabled);
      speakText(`에구구, 리듬이 달라졌어요! ${friend.name}의 연주를 다시 듣고 따라해보아요!`, soundEnabled, { characterId: buddy });
      setUserSequence([]);
      setIsPlayingSequence(true);
      scheduleGameTimeout(() => {
        playSequence(targetItem);
      }, 1800);
    }
  };

  if (!targetItem) return null;

  return (
    <div className="game-board flex flex-col items-center justify-between w-full max-w-2xl mx-auto">
      {/* Top Banner */}
      <div className="game-prompt w-full bg-gradient-to-r from-[#FFE0B2] to-[#FFF3E0] p-3.5 sm:p-4 rounded-3xl border-3 border-[#FFA726] shadow-sm flex items-center gap-3 sm:gap-4">
        <CharacterAvatar id={buddy} size="md" mood={isCompleted ? 'excited' : 'happy'} className="!w-16 !h-16 sm:!w-24 sm:!h-24 shrink-0" />
        <div className="flex-1 min-w-0 break-keep">
          <div className="inline-flex items-center gap-1 bg-white/80 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-black text-[#E65100] mb-1">
            <span>{friend.badge} {getAgeGroupLabel(ageGroup)} &bull; 리듬 놀이</span>
          </div>
          <h2 className="text-base sm:text-2xl font-black text-[#4A3E3D] leading-snug break-keep">
            {friend.name}의 리듬: &ldquo;<span className="text-[#E65100] underline">{targetItem.name}</span>&rdquo;
          </h2>
        </div>
        <button
          aria-label="놀이 안내 다시 듣기"
          onClick={() => playSequence(targetItem)}
          className="p-2.5 sm:p-3 bg-white rounded-full border-2 border-[#FFA726] shadow-xs text-[#E65100] cursor-pointer shrink-0"
          title="소리 리듬 다시 듣기"
        >
          <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Timer display */}
      {diffConfig.timeLimit > 0 && !isCompleted && (
        <div className="w-full mt-3 px-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-rose-500 mb-1">
            <Timer className="w-4 h-4 animate-pulse" />
            <span>시간제한: {timeLeft}초</span>
          </div>
          <div className="w-full bg-rose-100 h-3 rounded-full overflow-hidden border border-rose-200">
            <div
              className="bg-rose-500 h-full transition-all duration-1000"
              style={{ width: `${(timeLeft / diffConfig.timeLimit) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Play Mode Status Info */}
      <div className="my-3 flex flex-col items-center justify-center p-3.5 bg-white rounded-3xl border-3 border-dashed border-[#FFA726] text-center w-full">
        {isPlayingSequence ? (
          <div className="flex items-center gap-2 text-base font-black text-[#E65100] animate-pulse">
            <Volume2 className="w-5 h-5" /> 👂 {friend.name}의 악기 연주를 귀기울여 듣고 있어요!
          </div>
        ) : isCompleted ? (
          <div className="flex items-center gap-2 text-base font-black text-emerald-600 animate-bounce">
            <Sparkles className="w-5 h-5" /> 🏆 축하해요! 리듬 연주가 완벽하게 끝났어요!
          </div>
        ) : (
          <div className="text-base font-black text-[#6D4C41]">
            👇 {childName} 차례예요! 순서대로 톡톡 터치하세요! ({userSequence.length} / {targetItem.notes.length})
          </div>
        )}
      </div>

      {/* Rhythm Buttons Track Area */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 my-4 sm:my-6 w-full flex-wrap max-w-full">
        {targetItem.notes.map((note, index) => {
          const color = targetItem.colors[index] || '#FF9800';
          const emoji = targetItem.emojis[index] || '🎵';
          const isActive = activeButtonIdx === index;
          
          // 사용자가 입력한 현재 단계와 맞는지 하이라이팅
          const isTapped = index < userSequence.length;

          return (
            <motion.button
              key={index}
              animate={isActive ? { scale: 1.25, filter: 'brightness(1.2)' } : { scale: 1 }}
              aria-label={`${index + 1}번 악기`}
              disabled={isPlayingSequence || isCompleted || timeOut}
              onClick={() => handleTapButton(note, index)}
              style={{ backgroundColor: color }}
              className={`rhythm-key w-18 h-18 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center text-4xl sm:text-5xl shadow-lg border-4 transition-all cursor-pointer ${
                isActive ? 'border-white ring-4 ring-amber-400' : 'border-slate-100'
              } ${isTapped ? 'opacity-50' : 'opacity-100'} ${isPlayingSequence ? 'cursor-wait' : ''}`}
            >
              <span><ToyArtwork emoji={emoji} /></span>
            </motion.button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 w-full">
        {isCompleted || timeOut ? (
          <RoundContinuation onNext={generateRound} />
        ) : (
          <JellyButton soundEnabled={soundEnabled} variant="white" size="md" onClick={() => playSequence(targetItem)} className="!px-4">
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" /> 리듬 다시 듣기
          </JellyButton>
        )}
      </div>
    </div>
  );
};
