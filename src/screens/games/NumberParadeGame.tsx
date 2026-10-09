import { useContext, useEffect, useId, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Heart, Sparkles, Star } from 'lucide-react';
import { GameCue } from '../../components/GameCue';
import { PlayHintsPausedContext } from '../../components/PlayFlowContext';
import { ToyArtwork } from '../../components/ToyArtwork';
import { type ToddlerGameProps } from '../../hooks/useToddlerPlay';
import { createNumberSpeaker, englishNumberWord, nextPlayNumber, numberWord, type NumberReading } from '../../utils/numberPlay';
import { JUICE_SPRING, emitJuice } from '../../utils/juice';
import { fireStarExplosion } from '../../utils/confetti';
import { playJellyTap, speakText, stopAllSpeech, stopPlaySounds } from '../../utils/soundEngine';
import './NumberParadeGame.css';

const GUIDE = '토끼를 누르면 하나 둘 셋, 곰을 누르면 일 이 삼! 숫자가 통통! 함께 눌러 볼까?';
const COLORS = ['#ee9fb9', '#88cbd3', '#f3bc6a', '#b1a3da', '#98c49a', '#eaa393'];
const MOTIONS = [
  { y: [0, -42, 0, -14, 0], rotate: [0, -5, 5, 0], scaleX: [1, 1.12, .93, 1], scaleY: [1, .86, 1.1, 1] },
  { y: [30, -20, 0], rotate: [-28, 13, -5, 0], scale: [.7, 1.12, 1] },
  { y: [0, -20, 0], rotate: [0, 13, -13, 7, 0], scale: [1, 1.08, 1] },
  { y: [24, -36, 0], rotate: [18, -10, 0], scaleX: [.8, 1.16, .96, 1], scaleY: [1.2, .86, 1.06, 1] },
  { y: [0, -38, 0], rotate: [-14, 14, -7, 0], scale: [.86, 1.16, .98, 1] },
  { y: [32, -10, 0], rotate: [26, -12, 5, 0], scaleX: [1.2, .85, 1], scaleY: [.8, 1.15, 1] },
];

export function NumberParadeGame(props: ToddlerGameProps) {
  const paused = useContext(PlayHintsPausedContext);
  const reduced = useReducedMotion();
  const id = useId();
  const [view, setView] = useState({ value: 0, taps: 0, mode: 'native' as NumberReading });
  const count = useRef(-1);
  const latest = useRef(props);
  latest.current = props;
  const [speaker] = useState(() => createNumberSpeaker((request, callbacks) => {
    const p = latest.current;
    speakText(numberWord(request.value, request.mode), p.soundEnabled, {
      characterId: p.buddy, englishText: englishNumberWord(request.value), playIntroSFX: false, ...callbacks,
    });
  }));
  useEffect(() => {
    speaker.clear();
    if (!paused) speakText(GUIDE, props.soundEnabled, { characterId: props.buddy, playIntroSFX: false });
    return () => { speaker.clear(); stopAllSpeech(); stopPlaySounds(); };
  }, [speaker, props.buddy, props.soundEnabled, paused]);

  const tap = (mode: NumberReading) => {
    if (paused) return;
    const value = nextPlayNumber(count.current);
    count.current = value;
    setView(previous => ({ value, mode, taps: previous.taps + 1 }));
    playJellyTap(props.soundEnabled);
    speaker.push({ value, mode });
    emitJuice({ kind: 'snap' });
    if (value > 0 && value % 10 === 0) {
      fireStarExplosion();
      props.onCompleteQuiz(1);
    }
  };
  const color = COLORS[view.value % COLORS.length];
  const beads = view.value ? (view.value - 1) % 10 + 1 : 0;
  const milestone = view.taps > 0 && view.value > 0 && view.value % 10 === 0;
  return <div className="number-play" data-reading={view.mode}>
    <GameCue buddy={props.buddy} happy={milestone} disabled={!props.soundEnabled || paused}
      onReplay={() => speaker.push({ value: view.value, mode: view.mode })} />
    <div className="number-theater">
      <div className="number-cloud number-cloud-left" aria-hidden="true" />
      <div className="number-cloud number-cloud-right" aria-hidden="true" />
      <div className="number-rainbow" aria-hidden="true" />
      <div className="number-orbit" aria-hidden="true">{Array.from({ length: 6 }, (_, i) =>
        <span key={i} style={{ '--orbit-index': i, '--orbit-top': `${9 + i % 3 * 25}%`, color: COLORS[i] } as React.CSSProperties}>{i % 2 ? <Heart fill="currentColor" /> : <Star fill="currentColor" />}</span>)}</div>
      <output className="number-display" aria-label="현재 숫자" aria-live="polite" aria-atomic="true">
        <span className="sr-only">{view.value}, {numberWord(view.value, view.mode)}</span>
        <motion.div key={view.taps} className="number-performer" aria-hidden="true"
          animate={reduced || !view.taps ? { opacity: 1 } : MOTIONS[(view.taps - 1) % MOTIONS.length]}
          transition={{ duration: .7, ease: 'easeOut' }}>
          <svg viewBox="0 0 420 290" className="number-art">
            <defs><linearGradient id={`${id}-candy`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff2d5" /><stop offset=".35" stopColor={color} /><stop offset="1" stopColor={color} /></linearGradient></defs>
            <ellipse cx="210" cy="255" rx="145" ry="19" fill={color} opacity=".2" />
            <text x="210" y="217" textAnchor="middle" fontSize={view.value === 100 ? 164 : 210} fill={`url(#${id}-candy)`} stroke="#fffdf0" strokeWidth="10" paintOrder="stroke">{view.value}</text>
            <g className="number-smile" fill="#8c6976"><ellipse cx="197" cy="240" rx="3" ry="4" /><ellipse cx="223" cy="240" rx="3" ry="4" /><path d="M204 244 Q210 252 216 244" fill="none" stroke="#8c6976" strokeWidth="3" strokeLinecap="round" /></g>
          </svg>
        </motion.div>
      </output>
      {view.taps > 0 && !reduced && <div key={`burst-${view.taps}`} className="number-burst" aria-hidden="true">
        {Array.from({ length: milestone ? 18 : 12 }, (_, i) => {
          const angle = i / (milestone ? 18 : 12) * Math.PI * 2;
          return <motion.span key={i} style={{ color: COLORS[(i + view.taps) % COLORS.length] }}
            initial={{ x: 0, y: 0, scale: .2, opacity: 0 }} animate={{ x: Math.cos(angle) * (95 + i % 3 * 25), y: Math.sin(angle) * (95 + i % 3 * 25), scale: [0, 1.25, .6], opacity: [0, 1, 0], rotate: i % 2 ? 90 : -90 }} transition={{ duration: .9, ease: 'easeOut' }}>
            {i % 3 === 0 ? <Heart fill="currentColor" /> : <Star fill="currentColor" />}
          </motion.span>;
        })}
      </div>}
      <div className="number-beads" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} data-lit={i < beads} style={{ '--bead-color': COLORS[i % COLORS.length] } as React.CSSProperties} />)}</div>
      {milestone && <motion.span key={`party-${view.taps}`} className="number-party" aria-hidden="true" initial={reduced ? false : { scale: .4 }} animate={{ scale: 1 }} transition={JUICE_SPRING}><Sparkles /><Star fill="currentColor" /><Sparkles /></motion.span>}
    </div>
    <div className="number-controls" role="group" aria-label="숫자 읽기 버튼">
      {(['native', 'sino'] as const).map(mode => <motion.button key={mode} type="button" className={`number-button number-button-${mode}`} disabled={paused}
        aria-label={mode === 'native' ? '토끼와 하나 둘 셋 세기' : '곰과 영 일 이 삼 세기'} onClick={() => tap(mode)}
        whileTap={reduced ? undefined : { scaleX: 1.09, scaleY: .88 }} transition={JUICE_SPRING}>
        <ToyArtwork emoji={mode === 'native' ? '🐰' : '🐻'} />
        <span className="number-button-badge" aria-hidden="true">{mode === 'native' ? <span>☝️</span> : <span>123</span>}</span>
      </motion.button>)}
    </div>
  </div>;
}
