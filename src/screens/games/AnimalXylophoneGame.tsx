import { useContext, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Music2, Play } from 'lucide-react';
import { PlayGuide, PlayHint, PlayShell } from '../../components/ToddlerPlay';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { ToyArtwork } from '../../components/ToyArtwork';
import { useToddlerPlay, type ToddlerGameProps } from '../../hooks/useToddlerPlay';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import { XYLOPHONE_KEYS } from '../../data/toddlerPlay';
import { playXylophoneNote, setBGMDucked, speakText, stopAllSpeech, stopPlaySounds } from '../../utils/soundEngine';
import { fireStarExplosion } from '../../utils/confetti';

import { DayContinuationContext } from '../../components/PlayFlowContext';
import { RoundContinuation } from '../../components/RoundContinuation';
import { useGentleHelp } from '../../hooks/useGentleHelp';
import { GentleHint } from '../../components/GentleHint';
import { makeMelodyEcho, type MelodyNote } from '../../utils/melody';

const GUIDE = '동물 친구들을 콕콕 눌러 봐! 도레미, 네가 만드는 노래야!';
export function AnimalXylophoneGame(props: ToddlerGameProps) {
  useToddlerPlay(props, GUIDE);
  const { scheduleGameTimeout, clearGameTimeouts } = useGameTimeouts();
  const day = useContext(DayContinuationContext);
  const [active, setActive] = useState<number[]>([]);
  const [notes, setNotes] = useState<{ id: number; key: number }[]>([]);
  const [celebrating, setCelebrating] = useState(false);
  const [echoing, setEchoing] = useState(false);
  const [ready, setReady] = useState(false);
  const [concertDone, setConcertDone] = useState(false);
  const concertAwarded = useRef(false);
  const help = useGentleHelp('music', echoing || concertDone);
  const history = useRef<MelodyNote[]>([]);
  const sequence = useRef(0);
  const visuals = useRef(0);
  const lastStrike = useRef(new Map<number, number>());
  const activeStrikes = useRef(new Map<number, number>());
  const releaseMusic = useRef<ReturnType<typeof setTimeout> | null>(null);
  const echoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const echoTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const echoDue = useRef(false);
  const latest = useRef(props);
  latest.current = props;
  const clearAudio = () => {
    if (releaseMusic.current) clearTimeout(releaseMusic.current);
    if (echoTimer.current) clearTimeout(echoTimer.current);
    echoTimers.current.forEach(clearTimeout); echoTimers.current = [];
    stopPlaySounds(); setBGMDucked('instrument', false);
  };
  useEffect(() => {
    const hide = () => {
      if (document.hidden) { clearAudio(); clearGameTimeouts(); setEchoing(false); setActive([]); setNotes([]); setCelebrating(false); echoDue.current = false; if (day && concertAwarded.current) setConcertDone(true); }
    };
    document.addEventListener('visibilitychange', hide);
    return () => { clearAudio(); document.removeEventListener('visibilitychange', hide); };
  }, [clearGameTimeouts]);
  useEffect(() => { if (!props.soundEnabled) { clearAudio(); setEchoing(false); setActive([]); echoDue.current = false; if (day && concertAwarded.current) setConcertDone(true); } }, [props.soundEnabled]);
  const showNote = (index: number) => {
    const id = ++visuals.current;
    activeStrikes.current.set(index, id);
    setBGMDucked('instrument', latest.current.soundEnabled);
    playXylophoneNote(XYLOPHONE_KEYS[index].frequency, latest.current.soundEnabled, index);
    if (releaseMusic.current) clearTimeout(releaseMusic.current);
    releaseMusic.current = setTimeout(() => setBGMDucked('instrument', false), 1000);
    setActive(current => [...new Set([...current, index])]);
    setNotes(current => [...current.slice(-11), { id, key: index }]);
    scheduleGameTimeout(() => {
      if (activeStrikes.current.get(index) === id) setActive(current => current.filter(key => key !== index));
    }, 260);
    scheduleGameTimeout(() => setNotes(current => current.filter(note => note.id !== id)), 1100);
  };
  const echo = () => {
    if (document.hidden) return;
    const melody = makeMelodyEcho(history.current);
    if (melody.length < 3) return;
    clearAudio(); stopAllSpeech(); setActive([]); setEchoing(true); echoDue.current = false;
    melody.forEach(note => { echoTimers.current.push(setTimeout(() => showNote(note.key), 250 + note.at)); });
    echoTimers.current.push(setTimeout(() => {
      setEchoing(false); setCelebrating(false);
      speakText('네 노래를 따라 해 봤어! 우리 멋진 음악회야!', latest.current.soundEnabled, { characterId: latest.current.buddy, playIntroSFX: false });
      if (day && concertAwarded.current) setConcertDone(true);
    }, melody[melody.length - 1].at + 1000));
  };
  const strike = (index: number) => {
    const now = performance.now();
    if (now - (lastStrike.current.get(index) ?? -100) < 65) return;
    lastStrike.current.set(index, now);
    // A new touch always takes the instrument back immediately, including mid-echo.
    if (echoing) { clearAudio(); setEchoing(false); setActive([]); }
    if (echoTimer.current) clearTimeout(echoTimer.current);
    stopAllSpeech(); help.progress(); showNote(index);
    history.current = [...history.current.slice(-11), { key: index, at: now }];
    setReady(history.current.length >= 3);
    sequence.current++;
    if (sequence.current % 12 === 0) {
      if (!day || !concertAwarded.current) props.onCompleteQuiz(1);
      concertAwarded.current = true;
      if (!day) setConcertDone(true);
      fireStarExplosion(); setCelebrating(true); echoDue.current = true;
    }
    if (day && concertAwarded.current) echoDue.current = true;
    // A short gap lets the child finish their phrase before their friend answers.
    if (echoDue.current) echoTimer.current = setTimeout(echo, 1100);
  };
  return <PlayShell className="xylophone-play">
    <PlayGuide {...props} title="내가 만드는 동물 음악회" guide={GUIDE} happy={celebrating || echoing} />
    <div className="music-theater" data-echo={echoing}>
      {echoing && <span className="echo-caption" role="status">네 노래를 따라 해!</span>}
      <span className="theater-garland" aria-hidden="true" />
      <div className="music-friend"><CharacterAvatar id={props.buddy} size="xl" mood={notes.length || echoing ? 'dancing' : 'happy'} /></div>
      <div className="floating-notes" aria-hidden="true">{notes.map(note => <motion.span key={note.id} style={{ left: `${12 + note.key * 10}%`, color: XYLOPHONE_KEYS[note.key].color }} initial={{ y: 0, opacity: 1, rotate: -12 }} animate={{ y: -130, opacity: 0, rotate: 18 }} transition={{ duration: 1 }}><Music2 /></motion.span>)}</div>
      <div className="animal-xylophone" aria-label="동물 실로폰">
        {XYLOPHONE_KEYS.map((key, index) => <motion.button key={key.note} type="button" aria-label={`${key.name} ${key.note} 연주`} data-help={help.level > 0 && index === 0} className={`animal-key ${active.includes(index) ? 'key-playing' : ''}`} style={{ '--key-color': key.color, '--key-order': index } as React.CSSProperties}
          animate={{ y: active.includes(index) ? 7 : 0 }}
          onPointerDown={event => { if (event.button !== 0) return; event.preventDefault(); strike(index); }}
          onClick={event => { if (event.detail === 0) strike(index); }}>
          {index === 0 && <GentleHint level={help.level >= 3 ? 3 : 0} text="콕콕" />}<span className="key-pin" /><motion.span className="key-animal" animate={{ y: active.includes(index) ? -12 : 0 }}><ToyArtwork emoji={key.animal} /></motion.span><span className="key-note">{index === 7 ? '도♪' : key.note}</span><span className="key-pin" />
        </motion.button>)}
      </div>
    </div>
    {ready && <button className="melody-echo" aria-label="친구가 내 노래 따라 연주하기" onClick={echo}><Music2 /><span>내 노래 따라 해!</span><Play size={20} /></button>}
    {day && concertDone ? <RoundContinuation onNext={() => {}} /> : <PlayHint>콕콕! 마음대로 연주해요</PlayHint>}
  </PlayShell>;
}
