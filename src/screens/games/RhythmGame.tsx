import { GameCue } from '../../components/GameCue';
import { useRoundTimer } from '../../hooks/useRoundTimer';
import { RoundContinuation } from '../../components/RoundContinuation';
import { pickNextRound } from '../../utils/roundDeck';
import type { CharacterId } from '../../types';
import { CHARACTERS } from '../../data/characters';
import { ToyArtwork } from '../../components/ToyArtwork';
import { createRhythmPlayback } from '../../utils/rhythmPlayback';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

import { JellyButton } from '../../components/JellyButton';
import { speakText, stopAllSpeech, setBGMDucked, playRhythmTone, stopPlaySounds, playCorrectFanfare, playWrongBoing } from '../../utils/soundEngine';
import { getDifficultyConfig } from '../../utils/ageEngine';
import { RHYTHM_ITEMS_BY_AGE } from '../../data/gameData';
import { AgeGroup, RhythmItem } from '../../types';
import { Volume2, RefreshCw, Timer, Sparkles, Hand } from 'lucide-react';

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

  const diffConfig = getDifficultyConfig(ageGroup);
  const itemPool = RHYTHM_ITEMS_BY_AGE[ageGroup] || RHYTHM_ITEMS_BY_AGE.sprout;

  const [targetItem, setTargetItem] = useState<RhythmItem>(itemPool[0]);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [activeButtonIdx, setActiveButtonIdx] = useState<number | null>(null);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // 타이머 상태
  const { timeLeft, timeOut, startRoundTimer, stopRoundTimer } = useRoundTimer(diffConfig.timeLimit, () => {
    speakText(`시간 초과! 다시 연주를 들어보아요!`, soundEnabled, { characterId: buddy });
  }, isPlayingSequence);

  const resumeDemo = useRef(false);
  const latest = useRef({ soundEnabled, buddy });
  latest.current = { soundEnabled, buddy };
  const [playback] = useState(() => createRhythmPlayback({
    clock: window,
    isVisible: () => !document.hidden,
    onNote: (note, index) => { setActiveButtonIdx(index); playRhythmTone(note, latest.current.soundEnabled); },
    onRest: () => setActiveButtonIdx(null),
    onFinish: () => {
      setIsPlayingSequence(false);
      setActiveButtonIdx(null);
      speakText('이제 똑같이 톡톡 터치해볼까요?', latest.current.soundEnabled, { characterId: latest.current.buddy, playIntroSFX: false });
    },
    onCancel: () => { if (document.hidden) resumeDemo.current = true; setIsPlayingSequence(false); setActiveButtonIdx(null); stopPlaySounds(); },
  }));
  const playSequence = (item: RhythmItem, guide = `${friend.name}의 연주 리듬을 귀기울여 잘 들어보아요!`) => {
    if (playback.isPlaying()) return;
    if (document.hidden) { resumeDemo.current = true; return; }
    setIsPlayingSequence(true);
    setUserSequence([]);
    playback.start(item.notes, callbacks => {
      speakText(guide, latest.current.soundEnabled, { characterId: latest.current.buddy, playIntroSFX: false, ...callbacks });
    });
  };
  const replay = useRef(() => playSequence(targetItem));
  replay.current = () => { if (!isCompleted && !timeOut) playSequence(targetItem); };
  useEffect(() => {
    const visibility = () => {
      if (document.hidden) {
        resumeDemo.current ||= playback.isPlaying();
        playback.cancel();
        stopAllSpeech();
      } else if (resumeDemo.current) {
        resumeDemo.current = false;
        replay.current();
      }
    };
    document.addEventListener('visibilitychange', visibility);
    return () => { playback.cancel(); stopAllSpeech(); document.removeEventListener('visibilitychange', visibility); };
  }, [playback]);

  const generateRound = () => {
    playback.cancel();
    stopRoundTimer();

    setIsCompleted(false);
    setUserSequence([]);
    setActiveButtonIdx(null);

    const target = pickNextRound(itemPool, `RhythmGame:${ageGroup}`);
    if (!target) return;
    setTargetItem(target);

    playSequence(target);

    startRoundTimer();
  };

  useEffect(() => {
    generateRound();
    return () => {
      stopRoundTimer();
      playback.cancel();
    };
  }, [ageGroup]);

  const handleTapButton = (note: number, index: number) => {
    if (isPlayingSequence || isCompleted || timeOut) return;

    playRhythmTone(note, soundEnabled, .3);
    const nextExpectedIdx = userSequence.length;
    const expectedNote = targetItem.notes[nextExpectedIdx];

    if (note === expectedNote) {
      const newSeq = [...userSequence, note];
      setUserSequence(newSeq);

      // 리듬 완성 체크
      if (newSeq.length === targetItem.notes.length) {
        stopRoundTimer();

        setIsCompleted(true);
        playCorrectFanfare(soundEnabled);
        speakText(`참 잘했어요! 음악대장 정답이에요!`, soundEnabled, { characterId: buddy });
        onCompleteQuiz(diffConfig.starsPerCorrect);
      }
    } else {
      // 틀렸을 경우 시퀀스 초기화 및 재연주 안내
      playWrongBoing(soundEnabled);
      playSequence(targetItem, `에구구, 리듬이 달라졌어요! ${friend.name}의 연주를 다시 듣고 따라해보아요!`);
    }
  };

  if (!targetItem) return null;

  return (
    <div className="game-board flex flex-col items-center justify-between w-full max-w-2xl mx-auto">
      {/* Top Banner */}
      <GameCue buddy={buddy} onReplay={() => playSequence(targetItem)} />

      {/* Timer display */}
      {diffConfig.timeLimit > 0 && !isCompleted && (
        <div className="w-full mt-3 px-2">
          <div className="sr-only">
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

      {/* Picture cue follows the lit instruments: listen, tap, then celebrate. */}
      <div className="visual-prompt" role="status">
        {isPlayingSequence ? (
          <><Volume2 className="w-9 h-9" aria-hidden="true" /><span className="sr-only">친구의 악기 연주를 듣고 있어요</span></>
        ) : isCompleted ? (
          <><Sparkles className="w-9 h-9" aria-hidden="true" /><span className="sr-only">축하해요! 리듬 연주를 마쳤어요</span></>
        ) : (
          <><Hand className="w-9 h-9" aria-hidden="true" /><span className="sr-only">{childName} 차례예요! 순서대로 톡톡 터치하세요. {userSequence.length} / {targetItem.notes.length}</span></>
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
            <RefreshCw className="w-6 h-6" aria-hidden="true" /><span className="sr-only">리듬 다시 듣기</span>
          </JellyButton>
        )}
      </div>
    </div>
  );
};
