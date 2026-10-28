import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Play, RotateCcw, Volume2, X } from 'lucide-react';
import type { CharacterId } from '../types';
import { CHARACTERS } from '../data/characters';
import { CharacterAvatar } from './CharacterAvatar';
import { getAudioContext, playCareSound, speakText, stopAllSpeech } from '../utils/soundEngine';
import './FunnyEchoToy.css';

interface FunnyEchoToyProps {
  isOpen: boolean;
  onClose: () => void;
  buddy: CharacterId;
  soundEnabled: boolean;
  childName?: string;
}

type VoiceFilter = 'chipmunk' | 'bear' | 'robot';

export const FunnyEchoToy: React.FC<FunnyEchoToyProps> = ({
  isOpen,
  onClose,
  buddy,
  soundEnabled,
  childName = '유하',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<VoiceFilter>('chipmunk');
  const [recordProgress, setRecordProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedBufferRef = useRef<AudioBuffer | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const activeLfoRef = useRef<OscillatorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const character = CHARACTERS[buddy] || CHARACTERS.ggomi;

  const stopRecordingTracks = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const stopPlayback = () => {
    if (activeLfoRef.current) {
      try {
        activeLfoRef.current.stop();
      } catch {
        /* Already ended */
      }
      activeLfoRef.current = null;
    }
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch {
        /* Already ended */
      }
      activeSourceRef.current = null;
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopPlayback();
      stopRecordingTracks();
    }
    return () => {
      stopPlayback();
      stopRecordingTracks();
    };
  }, [isOpen]);

  const handleStartRecord = async () => {
    if (isRecording) {
      handleStopRecord();
      return;
    }

    stopPlayback();
    stopAllSpeech();
    audioChunksRef.current = [];
    setRecordProgress(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!isOpenRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stopRecordingTracks();
        if (!isOpenRef.current) return;

        try {
          const arrayBuffer = await audioBlob.arrayBuffer();
          const ctx = getAudioContext();
          const decoded = await ctx.decodeAudioData(arrayBuffer);
          if (!isOpenRef.current) return;
          recordedBufferRef.current = decoded;
          setHasRecording(true);
          setIsRecording(false);
          // Automatically play back in selected filter for instant surprise!
          playEcho(decoded, selectedFilter);
        } catch (e) {
          console.warn('Audio decoding fallback', e);
          setIsRecording(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      playCareSound('bubble', soundEnabled);

      let elapsed = 0;
      const duration = 2800; // 2.8 seconds recording
      const interval = 100;
      timerRef.current = setInterval(() => {
        elapsed += interval;
        setRecordProgress(Math.min(100, (elapsed / duration) * 100));
        if (elapsed >= duration) {
          handleStopRecord();
        }
      }, interval);
    } catch (err) {
      console.warn('Microphone permission or error:', err);
      // Fallback: If microphone unavailable, give a friendly prompt
      speakText(`${character.name}에게 말해주면 목소리를 마법으로 바꿔줄게! 마이크를 켜줘~`, soundEnabled, {
        characterId: buddy,
      });
      setIsRecording(false);
    }
  };

  const handleStopRecord = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const playEcho = (buffer: AudioBuffer | null, filter: VoiceFilter) => {
    const targetBuffer = buffer || recordedBufferRef.current;
    if (!targetBuffer) {
      // If no recording yet, speak playful sample
      speakText('안녕! 나는 따라쟁이 앵무새야!', soundEnabled, { characterId: buddy });
      return;
    }

    stopPlayback();
    setIsPlaying(true);

    try {
      const ctx = getAudioContext();
      const source = ctx.createBufferSource();
      source.buffer = targetBuffer;

      if (filter === 'chipmunk') {
        source.playbackRate.value = 1.62; // High-pitched fast chipmunk
      } else if (filter === 'bear') {
        source.playbackRate.value = 0.72; // Deep slow giant bear
      } else {
        source.playbackRate.value = 1.05; // Robot modulated
      }

      if (filter === 'robot') {
        // Metallic robot oscillator vibrato
        const tremolo = ctx.createGain();
        const lfo = ctx.createOscillator();
        activeLfoRef.current = lfo;
        lfo.type = 'square';
        lfo.frequency.value = 45; // 45Hz metallic robotic ring-modulation
        lfo.connect(tremolo.gain);
        source.connect(tremolo);
        tremolo.connect(ctx.destination);
        lfo.start();
        source.onended = () => {
          try {
            lfo.stop();
          } catch {
            /* ignore */
          }
          if (activeLfoRef.current === lfo) activeLfoRef.current = null;
          setIsPlaying(false);
        };
      } else {
        source.connect(ctx.destination);
        source.onended = () => {
          setIsPlaying(false);
        };
      }

      activeSourceRef.current = source;
      source.start(0);
    } catch (e) {
      console.warn('Playback error', e);
      setIsPlaying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="funny-echo-backdrop" role="dialog" aria-modal="true" aria-label="앵무새 요술 마이크">
      <div className="funny-echo-card">
        <button
          type="button"
          className="echo-close-btn"
          onClick={() => {
            stopPlayback();
            stopRecordingTracks();
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
              setSelectedFilter('chipmunk');
              playCareSound('bubble', soundEnabled);
              if (hasRecording && !isRecording) playEcho(null, 'chipmunk');
            }}
          >
            <span className="filter-emoji">🐥</span>
            <span className="filter-label">다람쥐 삐약이</span>
          </button>

          <button
            type="button"
            className={`filter-btn ${selectedFilter === 'bear' ? 'active' : ''}`}
            onClick={() => {
              setSelectedFilter('bear');
              playCareSound('bubble', soundEnabled);
              if (hasRecording && !isRecording) playEcho(null, 'bear');
            }}
          >
            <span className="filter-emoji">🐻</span>
            <span className="filter-label">거인 곰돌이</span>
          </button>

          <button
            type="button"
            className={`filter-btn ${selectedFilter === 'robot' ? 'active' : ''}`}
            onClick={() => {
              setSelectedFilter('robot');
              playCareSound('bubble', soundEnabled);
              if (hasRecording && !isRecording) playEcho(null, 'robot');
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
            aria-label={isRecording ? '녹음 끝내기' : '말하기 녹음 시작'}
          >
            <span className="echo-btn-icon">
              {isRecording ? <MicOff size={36} /> : <Mic size={36} />}
            </span>
            <span className="echo-btn-text">
              {isRecording ? '듣는 중...' : '마이크 콕 누르고 말하기!'}
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
              disabled={isRecording || isPlaying}
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
