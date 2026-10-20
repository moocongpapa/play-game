import { useCallback, useEffect, useRef, useState } from 'react';
import { emitWindGust } from '../utils/juice';
import { playWindChime } from '../utils/soundEngine';

/**
 * Pure breath/wind detector over FFT frequency byte bins (0..255).
 * Blowing into a microphone concentrates energy in low-to-mid bins (indices 1..18).
 */
export function detectBlowEnergy(bins: ArrayLike<number>, threshold = 68): number {
  const len = Math.min(bins.length, 20);
  if (len < 4) return 0;
  let sum = 0;
  let count = 0;
  for (let i = 1; i < len; i++) {
    sum += bins[i];
    count++;
  }
  const avg = sum / count;
  if (avg < threshold) return 0;
  return Math.min(1.8, Math.max(0.45, (avg - threshold) / 75 + 0.55));
}

export function useBlowSensor(soundEnabled = true, onBlow?: (intensity: number) => void) {
  const [micActive, setMicActive] = useState(false);
  const [blowing, setBlowing] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const blowVisualTimerRef = useRef<number | null>(null);
  const lastBlowRef = useRef(0);
  const callbackRef = useRef(onBlow);
  callbackRef.current = onBlow;

  const stopMic = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (ctxRef.current && ctxRef.current.state !== 'closed') {
      void ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
    setMicActive(false);
  }, []);

  const triggerGust = useCallback(
    (intensity = 1.1) => {
      const now = performance.now();
      if (now - lastBlowRef.current < 340) return;
      lastBlowRef.current = now;
      setBlowing(true);
      if (blowVisualTimerRef.current !== null) {
        window.clearTimeout(blowVisualTimerRef.current);
      }
      blowVisualTimerRef.current = window.setTimeout(() => setBlowing(false), 680);
      emitWindGust(intensity);
      playWindChime(soundEnabled);
      callbackRef.current?.(intensity);
    },
    [soundEnabled]
  );

  const toggleOrBlow = useCallback(async () => {
    // Always trigger an immediate satisfying wind gust on tap
    triggerGust(1.15);

    if (micActive) {
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      const bins = new Uint8Array(analyser.frequencyBinCount);
      setMicActive(true);

      timerRef.current = window.setInterval(() => {
        if (document.hidden) return;
        analyser.getByteFrequencyData(bins);
        const energy = detectBlowEnergy(bins);
        if (energy > 0) {
          triggerGust(energy);
        }
      }, 65);
    } catch {
      // Permission denied or no mic available: tap-to-blow still works 100%!
      setMicActive(false);
    }
  }, [micActive, triggerGust]);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) stopMic();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      if (blowVisualTimerRef.current !== null) {
        window.clearTimeout(blowVisualTimerRef.current);
      }
      stopMic();
    };
  }, [stopMic]);

  return {
    micActive,
    blowing,
    triggerGust,
    toggleOrBlow,
    stopMic,
  };
}
