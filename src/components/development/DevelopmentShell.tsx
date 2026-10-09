import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MotionConfig } from 'motion/react';
import { GameCue } from '../GameCue';
import { RoundContinuation } from '../RoundContinuation';
import type { ToddlerGameProps } from '../../hooks/useToddlerPlay';
import { playCorrectFanfare, speakText, stopAllSpeech, stopPlaySounds } from '../../utils/soundEngine';
import { fireStarExplosion } from '../../utils/confetti';
import './DevelopmentPlay.css';

export function useDevelopmentRound(props: ToddlerGameProps, guide: string, quiet = false) {
  const [round, setRound] = useState(0);
  const [completed, setCompleted] = useState(false);
  const finished = useRef(false);
  const latest = useRef({ props, guide, quiet });
  latest.current = { props, guide, quiet };
  useEffect(() => {
    const { props: p, guide: text, quiet: calm } = latest.current;
    speakText(text, p.soundEnabled, { characterId: p.buddy, rate: calm ? .8 : undefined });
    return () => { stopAllSpeech(); stopPlaySounds(); };
  }, [round, props.buddy]);
  const finish = (praise: string) => {
    if (finished.current) return;
    finished.current = true;
    setCompleted(true);
    if (!document.hidden) {
      if (!quiet) { playCorrectFanfare(props.soundEnabled); fireStarExplosion(); }
      speakText(praise, props.soundEnabled, { characterId: props.buddy, rate: quiet ? .8 : undefined });
    }
    props.onCompleteQuiz(1);
  };
  return { round, completed, finish, next: () => { finished.current = false; setCompleted(false); setRound(n => n + 1); } };
}

export function DevelopmentShell({ children, title, guide, buddy, soundEnabled, className = '' }: ToddlerGameProps & { children: ReactNode; title: string; guide: string; className?: string }) {
  return <MotionConfig reducedMotion="user"><div className={`development-play ${className}`}>
    <h2 className="sr-only">{title}</h2><GameCue buddy={buddy} disabled={!soundEnabled} onReplay={() => speakText(guide, soundEnabled, { characterId: buddy })} />
    {children}
  </div></MotionConfig>;
}
export function DiscoveryHint({ children }: { children: ReactNode }) { return <span className="sr-only">{children}</span>; }
export function DiscoveryNext({ onNext, quiet = false }: { onNext: () => void; quiet?: boolean }) {
  return <RoundContinuation onNext={onNext} delayMs={quiet ? 3200 : 1600} label={quiet ? '포근한 꿈을 꾸어요…' : '다음 놀잇감도 만나 볼까?'} />;
}
