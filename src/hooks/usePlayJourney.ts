import { useContext, useEffect, useRef, useState } from 'react';
import { DayContinuationContext, PlayHintsPausedContext } from '../components/PlayFlowContext';
import { createJourneyTransition } from '../utils/journeyTransition';
import { isSpeechBusy, playCareSound, playCorrectFanfare, speakText, stopAllSpeech, stopPlaySounds } from '../utils/soundEngine';
import { fireStarExplosion } from '../utils/confetti';
import type { ToddlerGameProps } from './useToddlerPlay';

export interface JourneyStep { id: string; label: string; picture: string; guide: string }
export interface PlayJourney {
  step: number; cycle: number; phase: 'playing' | 'celebrating' | 'finished';
  steps: readonly JourneyStep[]; current: JourneyStep; key: string; locked: boolean;
  complete: (praise: string) => void; restart: () => void;
}

/** One reward per whole story; intermediate scenes never finish a Friend Day activity. */
export function usePlayJourney(props: ToddlerGameProps, steps: readonly JourneyStep[]): PlayJourney {
  const day = useContext(DayContinuationContext);
  const paused = useContext(PlayHintsPausedContext);
  const [step, setStep] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<PlayJourney['phase']>('playing');
  const claimed = useRef(false);
  const live = useRef(true);
  const praise = useRef('');
  const transitionRef = useRef<ReturnType<typeof createJourneyTransition> | null>(null);
  const key = `${cycle}:${step}`;
  const currentKey = useRef(key);
  currentKey.current = key;
  const latest = useRef({ props, day, paused });
  latest.current = { props, day, paused };
  const complete = (text: string) => {
    if (claimed.current || !live.current || currentKey.current !== key) return;
    claimed.current = true;
    praise.current = text;
    const last = step === steps.length - 1;
    setPhase(last ? 'finished' : 'celebrating');
    if (!document.hidden) {
      if (last) { playCorrectFanfare(props.soundEnabled); fireStarExplosion(); }
      else playCareSound('bubble', props.soundEnabled);
    }
    if (last) props.onCompleteQuiz(1);
  };
  useEffect(() => {
    live.current = true;
    return () => { live.current = false; stopAllSpeech(); stopPlaySounds(); };
  }, [props.buddy]);
  useEffect(() => {
    const p = latest.current.props;
    speakText(steps[step].guide, p.soundEnabled, { characterId: p.buddy, playIntroSFX: false });
  }, [step, cycle, props.buddy, steps]);
  useEffect(() => {
    if (phase === 'playing') return;
    let praised = false;
    const voice = createJourneyTransition(() => {
      praised = true;
      const p = latest.current.props;
      speakText(praise.current, p.soundEnabled, { characterId: p.buddy, playIntroSFX: false });
    }, 0, () => !document.hidden && !latest.current.paused && !isSpeechBusy(), window);
    const transition = createJourneyTransition(() => {
      if (!live.current) return;
      if (phase === 'finished') {
        if (latest.current.day) { latest.current.day.onNext(); return; }
        setStep(0); setCycle(value => value + 1);
      } else setStep(value => value + 1);
      claimed.current = false;
      setPhase('playing');
    }, (phase === 'finished' ? 1800 : 1000) / (day ? 4 : 1), () => {
      if (document.hidden || latest.current.paused) return false;
      // Friend Day keeps a brief celebration, then the next screen owns speech.
      // Long praise or a pending voice download must not extend its 250/450 ms gap.
      return !!latest.current.day || (praised && !isSpeechBusy());
    }, window);
    transitionRef.current = transition;
    const pointers = new Set<number>();
    let focused = true;
    const sync = () => {
      if (document.hidden || !focused) { transition.pause(); voice.pause(); return; }
      voice.resume();
      if (pointers.size) transition.pause(); else transition.resume();
    };
    const down = (event: PointerEvent) => { pointers.add(event.pointerId); transition.pause(); };
    const up = (event: PointerEvent) => { pointers.delete(event.pointerId); sync(); };
    const activity = () => { if (!pointers.size) sync(); };
    const visibility = () => { if (document.hidden) pointers.clear(); sync(); };
    const blur = () => { focused = false; pointers.clear(); sync(); };
    const focus = () => { focused = true; sync(); };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', blur); window.addEventListener('focus', focus);
    if (phase === 'finished') {
      document.addEventListener('pointerdown', down, true);
      document.addEventListener('pointerup', up, true);
      document.addEventListener('pointercancel', up, true);
      document.addEventListener('keydown', activity, true);
    }
    sync();
    return () => {
      transition.dispose(); voice.dispose(); transitionRef.current = null;
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('blur', blur); window.removeEventListener('focus', focus);
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('pointerup', up, true);
      document.removeEventListener('pointercancel', up, true);
      document.removeEventListener('keydown', activity, true);
    };
  }, [phase, cycle, step]);
  return { step, cycle, phase, steps, current: steps[step], key, locked: phase !== 'playing', complete,
    restart: () => { if (phase === 'finished') transitionRef.current?.advance(); } };
}
