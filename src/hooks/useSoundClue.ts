import { useCallback, useEffect, useRef, useState } from 'react';
import type { CharacterId } from '../types';
import { playAnimalSound, speakText, stopAnimalSound } from '../utils/soundEngine';

export function useSoundClue(soundEnabled: boolean, buddy: CharacterId) {
  const [status, setStatus] = useState<'idle' | 'playing' | 'fallback'>('idle');
  const request = useRef(0);
  useEffect(() => {
    if (!soundEnabled) { request.current += 1; stopAnimalSound(); setStatus('idle'); }
    return () => { request.current += 1; stopAnimalSound(); };
  }, [soundEnabled]);

  const playClue = useCallback((key: string, soundText: string) => {
    const current = ++request.current;
    setStatus(soundEnabled ? 'playing' : 'idle');
    void playAnimalSound(key, soundEnabled).then(result => {
      if (current !== request.current) return;
      setStatus(result === 'unavailable' ? 'fallback' : 'idle');
      if (result === 'cancelled') return;
      // A spoken clue remains available for vehicles and failed/blocked recordings.
      speakText(result === 'ended' ? '누구 소리일까요?' : `${soundText} 누구 소리일까요?`, soundEnabled, { characterId: buddy });
    });
  }, [soundEnabled, buddy]);

  return { playClue, status };
}
