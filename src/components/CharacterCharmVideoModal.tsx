import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Heart, LoaderCircle, Pause, Play, RotateCcw, Volume2, VolumeX, X } from 'lucide-react';
import type { CharacterId } from '../types';
import { CHARACTERS } from '../data/characters';
import { CHARACTER_VIDEOS } from '../data/characterVideoData';
import { CharacterAvatar } from './CharacterAvatar';
import { playBubblePop, stopAllSpeech, stopPlaySounds, setBGMDucked, speakText } from '../utils/soundEngine';
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

function VideoTheater({ onClose, initialCharacterId: id, soundEnabled }: Omit<CharacterCharmVideoModalProps, 'isOpen'>) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [opener] = useState(() => document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const video = useRef<HTMLVideoElement>(null);
  const playRequest = useRef(0);
  const mounted = useRef(false);
  const heartId = useRef(0);
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(!reduced);
  const [slow, setSlow] = useState(false);
  const [failed, setFailed] = useState(false);
  const [localMute, setLocalMute] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hearts, setHearts] = useState<number[]>([]);
  const [videoEnded, setVideoEnded] = useState(false);
  const buddy = CHARACTERS[id];

  async function requestPlay(restart = false) {
    const element = video.current;
    if (!element) return;
    const request = ++playRequest.current;
    setSlow(false);
    setBusy(true);
    setVideoEnded(false);
    if (failed || slow) { element.load(); setFailed(false); }
    if (restart) element.currentTime = 0;
    try {
      await element.play();
    } catch {
      // Autoplay can be blocked. Keep the sharp poster and a large play target.
      if (mounted.current && request === playRequest.current) {
        setPlaying(false);
        setBusy(false);
      }
    }
  }

  const pause = () => { playRequest.current += 1; video.current?.pause(); setBusy(false); };

  const handleEnded = () => {
    setPlaying(false);
    setVideoEnded(true);
    speakText('이제 나랑 신나게 놀자!', soundEnabled, { characterId: id });
  };

  useEffect(() => {
    const element = video.current!;
    const modal = dialog.current!;
    mounted.current = true;
    modal.showModal();
    stopAllSpeech();
    stopPlaySounds();
    // Silence the playground music without changing the parent's music preference.
    setBGMDucked('video', true);
    if (!reduced) void requestPlay();
    const hide = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', hide);
    return () => {
      mounted.current = false;
      playRequest.current += 1;
      element.pause();
      modal.close();
      queueMicrotask(() => { if (opener?.isConnected) opener.focus({ preventScroll: true }); });
      setBGMDucked('video', false);
      document.removeEventListener('visibilitychange', hide);
    };
    // This component is remounted for each film; opening is the only autoplay attempt.
  }, []);

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
    playBubblePop(soundEnabled);
    setHearts(current => [...current.slice(-4), ++heartId.current]);
  };

  const handleScreenClick = () => {
    cheer();
    if (videoEnded) return;
    if (playing) pause();
    else void requestPlay();
  };

  const status = failed ? '영상을 다시 불러올 수 있어요.' : slow ? '준비하고 있어요. 친구와 먼저 인사해요!' : busy ? '영상을 준비하고 있어요.' : playing ? '영상 재생 중' : '재생 버튼을 눌러요.';

  return <dialog ref={dialog} className="character-theater" aria-label={`${buddy.name}의 작은 영화관`}
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="theater-landscape" aria-hidden="true" />
    <header className="theater-header">
      <button
        type="button"
        className={`theater-back-play-button ${videoEnded ? 'pulse-attention' : ''}`}
        onClick={onClose}
        aria-label={`${buddy.name}랑 놀러가기`}
      >
        👈 {buddy.name}랑 놀자!
      </button>
      <button className="theater-button theater-close" onClick={onClose} aria-label="영상 닫고 돌아가기" autoFocus><X /></button>
    </header>
    <div className="theater-body">
      <div className="theater-film-column">
        <div className="theater-screen" aria-busy={busy} onClick={handleScreenClick}>
          <video ref={video} src={CHARACTER_VIDEOS[id].videoUrl || `/videos/${id}.mp4`}
            poster={`/videos/posters/${id}.jpg`} preload="metadata" playsInline muted={!soundEnabled || localMute}
            onPlaying={() => { setPlaying(true); setBusy(false); setFailed(false); setVideoEnded(false); }}
            onPause={() => setPlaying(false)} onWaiting={() => setBusy(true)}
            onEnded={handleEnded}
            onError={() => { setFailed(true); setPlaying(false); setBusy(false); }}
            onTimeUpdate={event => { const v = event.currentTarget; setProgress(v.duration > 0 ? v.currentTime / v.duration : 0); }} />
          {videoEnded ? (
            <div className="theater-ended-overlay">
              <button
                type="button"
                className="theater-ended-play-btn"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                autoFocus
              >
                🎮 {buddy.name}랑 놀자!
              </button>
              <button
                type="button"
                className="theater-ended-replay-btn"
                onClick={(e) => { e.stopPropagation(); void requestPlay(true); }}
              >
                <RotateCcw size={18} /> 다시 보기
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
        <div className="theater-progress" aria-hidden="true"><span style={{ width: `${progress * 100}%` }} /></div>
        <div className="theater-controls">
          <button className="theater-button" onClick={() => void requestPlay(true)} aria-label="처음부터 다시 보기"><RotateCcw /></button>
          <button className="theater-button theater-primary" onClick={() => playing ? pause() : void requestPlay()} aria-label={playing ? '영상 잠깐 멈추기' : '영상 재생하기'}>{playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</button>
          <button className="theater-button" disabled={!soundEnabled} onClick={() => setLocalMute(value => !value)} aria-label={!soundEnabled ? '앱 소리가 꺼져 있어요' : localMute ? '영상 소리 켜기' : '영상 소리 끄기'} aria-pressed={soundEnabled && !localMute}>{soundEnabled && !localMute ? <Volume2 /> : <VolumeX />}</button>
        </div>
        <p className="sr-only" role="status">{status}</p>
      </div>
      <button className="theater-friend" onClick={cheer} aria-label={`${buddy.name}에게 하트 보내기`}>
        <CharacterAvatar id={id} mood={hearts.length && !reduced ? 'happy' : 'still'} />
        <span className="theater-heart-badge" aria-hidden="true"><Heart fill="currentColor" /></span>
        <span className="theater-hearts" aria-hidden="true">{hearts.map((key, i) => <motion.span key={key}
          initial={{ opacity: 1, y: 0, scale: .8 }} animate={reduced ? { opacity: 0 } : { y: -90, opacity: 0, scale: 1.3 }} transition={{ duration: 1.3 }} style={{ left: `${25 + i * 12}%` }}><Heart fill="currentColor" /></motion.span>)}</span>
      </button>
    </div>
  </dialog>;
}

