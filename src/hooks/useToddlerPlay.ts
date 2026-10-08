import { useEffect, useRef, useState } from 'react';
import type { AgeGroup, CharacterId } from '../types';
import { playCorrectFanfare, speakText, stopAllSpeech, stopPlaySounds } from '../utils/soundEngine';
import { fireStarExplosion } from '../utils/confetti';

export interface ToddlerGameProps {
  buddy: CharacterId; soundEnabled: boolean; ageGroup: AgeGroup; childName: string;
  onCompleteQuiz: (starsEarned: number) => void;
}

/** All five games share the existing Gemini → browser voice fallback and mute preferences. */
export function useToddlerPlay(props: ToddlerGameProps, guide: string) {
  const [round, setRound] = useState(0);
  const [completed, setCompleted] = useState(false);
  const finished = useRef(false);
  const latest = useRef({ props, guide });
  latest.current = { props, guide };
  useEffect(() => {
    const { props, guide } = latest.current;
    speakText(guide, props.soundEnabled, { characterId: props.buddy });
    return () => { stopAllSpeech(); stopPlaySounds(); };
  }, [round, props.buddy]);
  const finish = (praise: string) => {
    if (finished.current) return;
    finished.current = true;
    setCompleted(true);
    if (!document.hidden) {
      playCorrectFanfare(props.soundEnabled);
      fireStarExplosion();
      speakText(praise, props.soundEnabled, { characterId: props.buddy });
    }
    props.onCompleteQuiz(1);
  };
  const next = () => {
    finished.current = false;
    setCompleted(false);
    setRound(value => value + 1);
  };
  return { round, completed, finish, next };
}

export function usePageVisible() {
  const [visible, setVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const sync = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);
  return visible;
}
