import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Gamepad2, Heart, LoaderCircle, Pause, Play, RotateCcw, Smartphone, Sparkles, Tv, Volume2, VolumeX, X } from 'lucide-react';
import type { CharacterId } from '../types';
import { CHARACTER_LIST, CHARACTERS } from '../data/characters';
import { getCharacterVideoPresentation } from './characterVideoPresentation';
import { CharacterAvatar } from './CharacterAvatar';
import { playBubblePop, stopAllSpeech, stopPlaySounds, setBGMDucked, speakText, resumeAfterVideoPlayback } from '../utils/soundEngine';
import './CharacterCharmVideoModal.css';

interface CharacterCharmVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCharacterId: CharacterId;
  soundEnabled: boolean;
}

export function CharacterCharmVideoModal({ isOpen, ...props }: CharacterCharmVideoModalProps) {
  return isOpen ? <VideoTheater key={props.initialCharacterId} {...props} /> : null;
}

function VideoTheater({ onClose, initialCharacterId, soundEnabled }: Omit<CharacterCharmVideoModalProps, 'isOpen'>) {
  const [activeCharacterId, setActiveCharacterId] = useState<CharacterId>(initialCharacterId);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const presentation = getCharacterVideoPresentation(activeCharacterId, orientation);
  const dialog = useRef<HTMLDialogElement>(null);
  const [opener] = useState(() => document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const video = useRef<HTMLVideoElement>(null);
  const playRequest = useRef(0);
  const mounted = useRef(false);
  const heartId = useRef(0);
  const reduced = useReducedMotion();
  const playback = useRef({ time: 0, shouldPlay: !reduced });
  const restoringPosition = useRef(true);
  const activeVideo = useRef<HTMLVideoElement | null>(null);
  const audioRestored = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(!reduced);
  const [slow, setSlow] = useState(false);
  const [failed, setFailed] = useState(false);
  const [localMute, setLocalMute] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hearts, setHearts] = useState<number[]>([]);
  const [videoEnded, setVideoEnded] = useState(false);
  const [filmAspect, setFilmAspect] = useState(presentation.aspectRatio);
  const buddy = CHARACTERS[activeCharacterId];

  const releaseMedia = (element: HTMLVideoElement | null) => {
    if (!element) return;
    element.pause();
    if (element.hasAttribute('src')) {
      element.removeAttribute('src');
      element.load();
    }
  };

  const restoreGameAudio = () => {
    if (audioRestored.current) return;
    audioRestored.current = true;
    playRequest.current += 1;
    releaseMedia(activeVideo.current);
    resumeAfterVideoPlayback();
  };

  const closeTheater = () => { restoreGameAudio(); onClose(); };

  async function requestPlay(restart = false) {
    const element = video.current;
    if (!element) return;
    const request = ++playRequest.current;
    setSlow(false);
    setBusy(true);
    setVideoEnded(false);
    playback.current.shouldPlay = true;
    if (failed || slow) { element.load(); setFailed(false); }
    if (restart) {
      playback.current.time = 0;
      if (element.readyState > 0) element.currentTime = 0;
    }
    try {
      await element.play();
    } catch {
      if (mounted.current && request === playRequest.current) {
        setPlaying(false);
        setBusy(false);
      }
    }
  }

  const pause = () => {
    playback.current.shouldPlay = false;
    playRequest.current += 1;
    video.current?.pause();
    setBusy(false);
  };

  const handleEnded = () => {
    if (!mounted.current || audioRestored.current) return;
    playback.current.shouldPlay = false;
    setPlaying(false);
    setVideoEnded(true);
    speakText('이제 나랑 신나게 놀자!', soundEnabled && !localMute, { characterId: activeCharacterId });
  };

  useEffect(() => {
    const modal = dialog.current!;
    mounted.current = true;
    audioRestored.current = false;
    modal.showModal();
    stopAllSpeech();
    stopPlaySounds();
    setBGMDucked('video', true);
    const hide = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', hide);
    return () => {
      mounted.current = false;
      playRequest.current += 1;
      restoreGameAudio();
      modal.close();
      queueMicrotask(() => { if (opener?.isConnected) opener.focus({ preventScroll: true }); });
      document.removeEventListener('visibilitychange', hide);
    };
  }, []);

  useEffect(() => {
    const element = video.current!;
    activeVideo.current = element;
    element.setAttribute('src', presentation.videoUrl);
    element.load();
    restoringPosition.current = false;
    setFilmAspect(presentation.aspectRatio);
    setFailed(false);
    setSlow(false);
    setPlaying(false);
    setProgress(0);
    setBusy(playback.current.shouldPlay);
    if (playback.current.shouldPlay) void requestPlay();
    return () => {
      playRequest.current += 1;
      releaseMedia(element);
    };
  }, [presentation.videoUrl]);

  useEffect(() => {
    if (!busy) { setSlow(false); return; }
    const timeout = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(timeout);
  }, [busy]);

  useEffect(() => {
    if (!hearts.length) return;
    const timeout = window.setTimeout(() => setHearts([]), 1400);
    return () => window.clearTimeout(timeout);
  }, [hearts]);

  const cheer = () => {
    playBubblePop(soundEnabled && !localMute);
    setHearts(current => [...current.slice(-4), ++heartId.current]);
  };

  const handleScreenClick = () => {
    cheer();
    if (videoEnded) return;
    if (playing) pause();
    else void requestPlay();
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !video.current || !video.current.duration) return;
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = ratio * video.current.duration;
    video.current.currentTime = targetTime;
    setProgress(ratio);
    if (!playing) void requestPlay();
  };

  const jumpToBonusScene = () => {
    if (!video.current) return;
    video.current.currentTime = 30;
    setProgress(30 / (video.current.duration || 38));
    playBubblePop(soundEnabled && !localMute);
    void requestPlay();
  };

  const toggleOrientation = () => {
    setOrientation(prev => (prev === 'portrait' ? 'landscape' : 'portrait'));
    playBubblePop(soundEnabled && !localMute);
  };

  const status = failed ? '영상을 다시 불러올 수 있어요.' : slow ? '준비하고 있어요. 친구와 먼저 인사해요!' : busy ? '영상을 준비하고 있어요.' : playing ? '영상 재생 중' : '재생 버튼을 눌러요.';

  return <dialog ref={dialog} className="character-theater" aria-label={`${buddy.name}의 작은 영화관`}
    data-film-format={filmAspect < 1 ? 'portrait' : 'landscape'}
    style={{ '--film-aspect': filmAspect } as CSSProperties}
    onCancel={event => { event.preventDefault(); closeTheater(); }}>
    <div className="theater-landscape" aria-hidden="true" />
    <header className="theater-header">
      <button
        type="button"
        className={`theater-back-play-button ${videoEnded ? 'pulse-attention' : ''}`}
        onClick={closeTheater}
        aria-label={`${buddy.name}랑 놀러가기`}
      >
        👈 {buddy.name}랑 놀자!
      </button>

      {/* In-Theater Character Switcher */}
      <div className="theater-char-switcher" role="tablist" aria-label="다른 친구 영상 보기">
        {CHARACTER_LIST.map((char) => (
          <button
            key={char.id}
            type="button"
            role="tab"
            aria-selected={char.id === activeCharacterId}
            className={`theater-char-pill ${char.id === activeCharacterId ? 'is-active' : ''}`}
            onClick={() => {
              if (char.id !== activeCharacterId) {
                playBubblePop(soundEnabled && !localMute);
                setActiveCharacterId(char.id);
              }
            }}
            aria-label={`${char.name} 영상`}
          >
            <CharacterAvatar id={char.id} size="sm" mood="still" />
            <span className="theater-char-pill-name">{char.name}</span>
          </button>
        ))}
      </div>

      <button className="theater-button theater-close" onClick={closeTheater} aria-label="영상 닫고 돌아가기" autoFocus><X /></button>
    </header>

    <div className="theater-body">
      <div className="theater-film-column">
        <div className="theater-screen" aria-busy={busy} onClick={handleScreenClick}>
          <video key={presentation.videoUrl} ref={video} src={presentation.videoUrl}
            poster={presentation.posterUrl} preload="metadata" playsInline muted={!soundEnabled || localMute}
            onLoadedMetadata={event => {
              const element = event.currentTarget;
              if (element.videoWidth > 0 && element.videoHeight > 0) setFilmAspect(element.videoWidth / element.videoHeight);
              if (Number.isFinite(element.duration) && playback.current.time > 0) {
                element.currentTime = Math.min(playback.current.time, element.duration);
              }
              restoringPosition.current = false;
            }}
            onPlaying={() => { setPlaying(true); setBusy(false); setFailed(false); setVideoEnded(false); }}
            onPause={() => setPlaying(false)} onWaiting={() => setBusy(true)}
            onEnded={handleEnded}
            onError={() => { setFailed(true); setPlaying(false); setBusy(false); }}
            onTimeUpdate={event => {
              if (restoringPosition.current) return;
              const v = event.currentTarget;
              playback.current.time = v.currentTime;
              setProgress(v.duration > 0 ? v.currentTime / v.duration : 0);
            }} />
          {videoEnded ? (
            <div className="theater-ended-overlay">
              <button
                type="button"
                className="theater-ended-play-btn"
                onClick={(e) => { e.stopPropagation(); closeTheater(); }}
                aria-label={`${buddy.name}랑 놀러가기`}
                autoFocus
              >
                <Gamepad2 aria-hidden="true" />
              </button>
              <button
                type="button"
                className="theater-ended-replay-btn"
                onClick={(e) => { e.stopPropagation(); void requestPlay(true); }}
                aria-label="영상 다시 보기"
              >
                <RotateCcw aria-hidden="true" />
              </button>
            </div>
          ) : (!playing || slow || failed) ? (
            <button
              className="theater-big-play"
              onClick={(e) => { e.stopPropagation(); void requestPlay(); }}
              aria-label={failed || slow ? '영상 다시 불러와 재생하기' : '영상 재생하기'}
            >
              {failed || slow ? <RotateCcw /> : <Play fill="currentColor" />}
            </button>
          ) : null}
          {busy && !slow && !videoEnded && <LoaderCircle className="theater-loading" aria-hidden="true" />}
        </div>

        {/* Interactive Scrub Progress Bar */}
        <div
          className="theater-progress cursor-pointer"
          role="slider"
          aria-label="재생 위치 탐색"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          onClick={handleProgressClick}
        >
          <span style={{ width: `${progress * 100}%` }} />
        </div>

        <div className="theater-controls">
          <button className="theater-button" onClick={() => void requestPlay(true)} aria-label="처음부터 다시 보기"><RotateCcw /></button>
          <button className="theater-button theater-primary" onClick={() => playing ? pause() : void requestPlay()} aria-label={playing ? '영상 잠깐 멈추기' : '영상 재생하기'}>{playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</button>

          {/* Orientation Toggle Button */}
          {presentation.hasLandscape && (
            <button
              type="button"
              className="theater-button theater-aspect-toggle"
              onClick={toggleOrientation}
              aria-label={orientation === 'portrait' ? '가로 화면으로 보기' : '세로 화면으로 보기'}
              title={orientation === 'portrait' ? '가로 화면으로 보기' : '세로 화면으로 보기'}
            >
              {orientation === 'portrait' ? <Tv /> : <Smartphone />}
            </button>
          )}

          {/* Bonus Scene Jump Button (when watching portrait 38s video) */}
          {!presentation.isLandscape && (
            <button
              type="button"
              className="theater-bonus-jump-btn"
              onClick={jumpToBonusScene}
              aria-label="30초 댄스 파티 바로보기"
              title="30초 댄스 파티 바로보기"
            >
              <Sparkles size={16} />
              <span>댄스타임!</span>
            </button>
          )}

          <button className="theater-button" disabled={!soundEnabled} onClick={() => setLocalMute(value => !value)} aria-label={!soundEnabled ? '앱 소리가 꺼져 있어요' : localMute ? '영상 소리 켜기' : '영상 소리 끄기'} aria-pressed={soundEnabled && !localMute}>{soundEnabled && !localMute ? <Volume2 /> : <VolumeX />}</button>

          <button className="theater-friend" onClick={cheer} aria-label={`${buddy.name}에게 하트 보내기`}>
            <CharacterAvatar id={activeCharacterId} mood={hearts.length && !reduced ? 'happy' : 'still'} />
            <span className="theater-heart-badge" aria-hidden="true"><Heart fill="currentColor" /></span>
            <span className="theater-hearts" aria-hidden="true">{hearts.map((key, i) => <motion.span key={key}
              initial={{ opacity: 1, y: 0, scale: .8 }} animate={reduced ? { opacity: 0 } : { y: -90, opacity: 0, scale: 1.3 }} transition={{ duration: 1.3 }} style={{ left: `${25 + i * 12}%` }}><Heart fill="currentColor" /></motion.span>)}</span>
          </button>
        </div>
        <p className="sr-only" role="status">{status}</p>
      </div>
    </div>
  </dialog>;
}
