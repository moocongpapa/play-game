import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { CharacterAvatar } from './CharacterAvatar';
import type { CharacterId } from '../types';

/** Optional, muted scenery: neither playback nor download blocks navigation. */
export function BuddyVideo({ id, className = '' }: { id: CharacterId; className?: string }) {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setPlaying(false);
    setFailed(false);
  }, [id]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduceMotion || failed) return;
    let disposed = false;
    const play = () => { void video.play().catch((error: DOMException) => {
      // StrictMode and navigation may pause a pending play() without a media failure.
      if (!disposed && error.name !== 'AbortError') setFailed(true);
    }); };
    const visibility = () => document.hidden ? video.pause() : play();
    play();
    document.addEventListener('visibilitychange', visibility);
    return () => { disposed = true; video.pause(); document.removeEventListener('visibilitychange', visibility); };
  }, [id, reduceMotion, failed]);
  return <div className={`buddy-video ${className}`} aria-hidden="true">
    <CharacterAvatar id={id} mood="waving" className="!w-full !h-full" />
    {!reduceMotion && !failed && <video key={id} ref={videoRef} src={`/videos/${id}.mp4`} autoPlay muted loop playsInline preload="metadata" tabIndex={-1} onPlaying={() => setPlaying(true)} onError={() => setFailed(true)} style={{ opacity: playing ? 1 : 0 }} />}
  </div>;
}
