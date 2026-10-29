import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, RotateCcw, X } from 'lucide-react';
import type { CharacterId } from '../types';
import { CHARACTERS } from '../data/characters';
import { CharacterAvatar } from './CharacterAvatar';
import { areSoundEffectsEnabled, getAudioContext, playCareSound, speakText, stopAllSpeech } from '../utils/soundEngine';
import { createEchoRecording, type EchoRecordingPhase } from '../utils/echoRecording';
import { playEchoBuffer, type EchoVoiceFilter } from '../utils/echoPlayback';
import { PlayHintsPausedContext } from './PlayFlowContext';
import './FunnyEchoToy.css';

interface FunnyEchoToyProps {
  isOpen: boolean;
  onClose: () => void;
  buddy: CharacterId;
  soundEnabled: boolean;
  childName?: string;
}

export const FunnyEchoToy: React.FC<FunnyEchoToyProps> = ({
  isOpen,
  onClose,
  buddy,
  soundEnabled,
}) => {
  const paused = useContext(PlayHintsPausedContext);
  const [recordingPhase, setRecordingPhase] = useState<EchoRecordingPhase>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<EchoVoiceFilter>('chipmunk');
  const [recordProgress, setRecordProgress] = useState(0);
  const isRecording = recordingPhase === 'recording';
  const preparing = recordingPhase === 'requesting' || recordingPhase === 'decoding';
  const mounted = useRef(false);
  const latest = useRef({ isOpen, paused, soundEnabled, buddy, selectedFilter });
  latest.current = { isOpen, paused, soundEnabled, buddy, selectedFilter };
  const recordedBufferRef = useRef<AudioBuffer | null>(null);
  const activePlaybackRef = useRef<ReturnType<typeof playEchoBuffer>>(null);
  const playEchoRef = useRef<(buffer: AudioBuffer | null, filter: EchoVoiceFilter) => void>(() => {});
  const character = CHARACTERS[buddy] || CHARACTERS.ggomi;
  const canContinue = useCallback(() => mounted.current && latest.current.isOpen && !latest.current.paused && !document.hidden, []);

  const stopPlayback = useCallback(() => {
    activePlaybackRef.current?.stop();
    activePlaybackRef.current = null;
    if (mounted.current) setIsPlaying(false);
  }, []);

  const [recording] = useState(() => createEchoRecording<AudioBuffer>({
    requestStream: () => navigator.mediaDevices.getUserMedia({ audio: true }),
    createRecorder: stream => new MediaRecorder(stream),
    decode: async blob => getAudioContext().decodeAudioData(await blob.arrayBuffer()),
    canContinue,
    onPhase: phase => { if (mounted.current) setRecordingPhase(phase); },
    onProgress: progress => { if (mounted.current) setRecordProgress(progress); },
    onReady: buffer => {
      if (!canContinue()) return;
      recordedBufferRef.current = buffer;
      setHasRecording(true);
      playEchoRef.current(buffer, latest.current.selectedFilter);
    },
    onError: () => {
      if (!canContinue()) return;
      const current = latest.current;
      speakText(`${CHARACTERS[current.buddy].name}에게 말해주면 목소리를 마법으로 바꿔줄게! 마이크를 켜줘~`, current.soundEnabled, { characterId: current.buddy });
    },
    setInterval: (callback, delay) => window.setInterval(callback, delay),
    clearInterval: id => window.clearInterval(id),
  }));

  const cancelSession = useCallback(() => {
    recording.cancel();
    stopPlayback();
  }, [recording, stopPlayback]);

  useEffect(() => {
    mounted.current = true;
    const onVisibility = () => { if (document.hidden) cancelSession(); };
    const onPageHide = () => cancelSession();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      mounted.current = false;
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      cancelSession();
    };
  }, [cancelSession]);

  useEffect(() => { if (!isOpen || paused) cancelSession(); }, [isOpen, paused, cancelSession]);
  useEffect(() => { if (!soundEnabled) stopPlayback(); }, [soundEnabled, stopPlayback]);

  const handleStartRecord = async () => {
    if (!canContinue()) return;
    if (recording.phase === 'recording') { recording.finish(); return; }
    if (recording.phase !== 'idle') return;
    stopPlayback();
    stopAllSpeech();
    setRecordProgress(0);
    if (await recording.start() && canContinue()) playCareSound('bubble', latest.current.soundEnabled);
  };

  const playEcho = (buffer: AudioBuffer | null, filter: EchoVoiceFilter) => {
    if (!canContinue() || !areSoundEffectsEnabled(latest.current.soundEnabled)) return;
    const targetBuffer = buffer || recordedBufferRef.current;
    if (!targetBuffer) {
      speakText('안녕! 나는 따라쟁이 앵무새야!', latest.current.soundEnabled, { characterId: latest.current.buddy });
      return;
    }
    stopPlayback();
    try {
      const playback = playEchoBuffer(targetBuffer, filter, () => {
        activePlaybackRef.current = null;
        if (mounted.current) setIsPlaying(false);
      });
      activePlaybackRef.current = playback;
      setIsPlaying(playback !== null);
    } catch { stopPlayback(); }
  };
  playEchoRef.current = playEcho;

  if (!isOpen) return null;

  return (
    <div className="funny-echo-backdrop" role="dialog" aria-modal="true" aria-label="앵무새 요술 마이크">
      <div className="funny-echo-card">
        <button
          type="button"
          className="echo-close-btn"
          onClick={() => {
            cancelSession();
            stopAllSpeech();
            onClose();
          }}
          aria-label="닫기"
        >
          <X size={24} />
        </button>

        <div className="echo-header">
          <span className="echo-badge">🎙️ 앵무새 요술 마이크</span>
          <h2>{character.name}와 마법 목소리!</h2>
          <p className="echo-guide">
            {isRecording
              ? '듣고 있어요... 마음껏 소리쳐봐! 👂'
              : isPlaying
              ? '우와! 신기한 목소리가 나와요! 😆'
              : '마이크를 누르고 3초 동안 말해봐!'}
          </p>
        </div>

        {/* Character Stage with Lip Sync / Dance */}
        <div className={`echo-stage ${isPlaying ? 'is-dancing' : ''}`}>
          <div className="echo-avatar-wrap">
            <CharacterAvatar
              id={buddy}
              size="2xl"
              mood={isPlaying ? 'dancing' : isRecording ? 'thinking' : 'happy'}
              expression={isPlaying ? 'excited' : isRecording ? 'curious' : 'happy'}
            />
            {isPlaying && <span className="echo-dj-headphones" aria-hidden="true">🎧</span>}
          </div>

          {/* Sound wave visualizer bars */}
          <div className={`echo-sound-waves ${isRecording || isPlaying ? 'waves-active' : ''}`}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <span key={i} className="wave-bar" style={{ animationDelay: `${i * 120}ms` }} />
            ))}
          </div>
        </div>

        {/* Filter selection buttons */}
        <div className="echo-filters-row" aria-label="목소리 변신 선택">
          <button
            type="button"
            className={`filter-btn ${selectedFilter === 'chipmunk' ? 'active' : ''}`}
            onClick={() => {
              if (!canContinue()) return;
              setSelectedFilter('chipmunk');
              playCareSound('bubble', soundEnabled);
              if (hasRecording && recording.phase === 'idle') playEcho(null, 'chipmunk');
            }}
          >
            <span className="filter-emoji">🐥</span>
            <span className="filter-label">다람쥐 삐약이</span>
          </button>

          <button
            type="button"
            className={`filter-btn ${selectedFilter === 'bear' ? 'active' : ''}`}
            onClick={() => {
              if (!canContinue()) return;
              setSelectedFilter('bear');
              playCareSound('bubble', soundEnabled);
              if (hasRecording && recording.phase === 'idle') playEcho(null, 'bear');
            }}
          >
            <span className="filter-emoji">🐻</span>
            <span className="filter-label">거인 곰돌이</span>
          </button>

          <button
            type="button"
            className={`filter-btn ${selectedFilter === 'robot' ? 'active' : ''}`}
            onClick={() => {
              if (!canContinue()) return;
              setSelectedFilter('robot');
              playCareSound('bubble', soundEnabled);
              if (hasRecording && recording.phase === 'idle') playEcho(null, 'robot');
            }}
          >
            <span className="filter-emoji">🤖</span>
            <span className="filter-label">삐리삐리 로봇</span>
          </button>
        </div>

        {/* Main Action Buttons */}
        <div className="echo-actions">
          <button
            type="button"
            className={`echo-record-btn ${isRecording ? 'is-recording' : ''}`}
            onClick={handleStartRecord}
            disabled={preparing || paused}
            aria-busy={preparing}
            aria-label={preparing ? '마이크 준비 중' : isRecording ? '녹음 끝내기' : '말하기 녹음 시작'}
          >
            <span className="echo-btn-icon">
              {isRecording ? <MicOff size={36} /> : <Mic size={36} />}
            </span>
            <span className="echo-btn-text">
              {preparing ? '잠깐만 기다려줘~' : isRecording ? '듣는 중...' : '마이크 콕 누르고 말하기!'}
            </span>
            {isRecording && (
              <div
                className="echo-progress-ring"
                style={{ width: `${recordProgress}%` }}
                aria-hidden="true"
              />
            )}
          </button>

          {hasRecording && (
            <button
              type="button"
              className="echo-replay-btn"
              disabled={recordingPhase !== 'idle' || isPlaying || paused || !soundEnabled}
              onClick={() => playEcho(null, selectedFilter)}
              aria-label="다시 듣기"
            >
              <RotateCcw size={22} />
              <span>다시 듣기</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
