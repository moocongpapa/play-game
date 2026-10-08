import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Music2 } from 'lucide-react';
import { PlayGuide, PlayHint, PlayShell } from '../../components/ToddlerPlay';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { ToyArtwork } from '../../components/ToyArtwork';
import { useToddlerPlay, type ToddlerGameProps } from '../../hooks/useToddlerPlay';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import { XYLOPHONE_KEYS } from '../../data/toddlerPlay';
import { playXylophoneNote, setBGMDucked, speakText, stopAllSpeech, stopPlaySounds } from '../../utils/soundEngine';
import { fireStarExplosion } from '../../utils/confetti';

const GUIDE = '동물 친구들을 콕콕 눌러 봐! 도레미, 네가 만드는 노래야!';
export function AnimalXylophoneGame(props: ToddlerGameProps) {
  useToddlerPlay(props, GUIDE);
  const { scheduleGameTimeout } = useGameTimeouts();
  const [active, setActive] = useState<number[]>([]);
  const [notes, setNotes] = useState<{ id: number; key: number }[]>([]);
  const [celebrating, setCelebrating] = useState(false);
  const sequence = useRef(0);
  const lastStrike = useRef(new Map<number, number>());
  const releaseMusic = useRef<ReturnType<typeof setTimeout> | null>(null);
  const praiseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const praiseDue = useRef(false);
  const latest = useRef(props);
  latest.current = props;
  const clearAudio = () => {
    if (releaseMusic.current) clearTimeout(releaseMusic.current);
    if (praiseTimer.current) clearTimeout(praiseTimer.current);
    stopPlaySounds();
    setBGMDucked('instrument', false);
  };
  useEffect(() => {
    const hide = () => { if (document.hidden) clearAudio(); };
    document.addEventListener('visibilitychange', hide);
    return () => { clearAudio(); document.removeEventListener('visibilitychange', hide); };
  }, []);
  useEffect(() => { if (!props.soundEnabled) clearAudio(); }, [props.soundEnabled]);
  const strike = (index: number) => {
    const now = performance.now();
    if (now - (lastStrike.current.get(index) ?? -100) < 65) return;
    lastStrike.current.set(index, now);
    const id = ++sequence.current;
    if (releaseMusic.current) clearTimeout(releaseMusic.current);
    if (praiseTimer.current) clearTimeout(praiseTimer.current);
    stopAllSpeech();
    setBGMDucked('instrument', props.soundEnabled);
    playXylophoneNote(XYLOPHONE_KEYS[index].frequency, props.soundEnabled, index);
    releaseMusic.current = setTimeout(() => setBGMDucked('instrument', false), 1000);
    setActive(current => [...new Set([...current, index])]);
    setNotes(current => [...current.slice(-11), { id, key: index }]);
    scheduleGameTimeout(() => {
      if (lastStrike.current.get(index) === now) setActive(current => current.filter(key => key !== index));
    }, 260);
    scheduleGameTimeout(() => setNotes(current => current.filter(note => note.id !== id)), 1100);
    if (id % 12 === 0) {
      props.onCompleteQuiz(1);
      fireStarExplosion();
      setCelebrating(true);
      praiseDue.current = true;
      scheduleGameTimeout(() => setCelebrating(false), 1600);
    }
    // Compliments wait for a gap so rapid playing stays musical instead of queuing speech.
    if (praiseDue.current) praiseTimer.current = setTimeout(() => {
      praiseDue.current = false;
      speakText('반짝반짝, 멋진 노래야! 한 번 더 들려줘!', latest.current.soundEnabled, { characterId: latest.current.buddy });
    }, 1300);
  };
  return <PlayShell className="xylophone-play">
    <PlayGuide {...props} title="내가 만드는 동물 음악회" guide={GUIDE} happy={celebrating} />
    <div className="music-theater">
      <span className="theater-garland" aria-hidden="true" />
      <div className="music-friend"><CharacterAvatar id={props.buddy} size="xl" mood={notes.length ? 'dancing' : 'happy'} /></div>
      <div className="floating-notes" aria-hidden="true">{notes.map(note => <motion.span key={note.id} style={{ left: `${12 + note.key * 10}%`, color: XYLOPHONE_KEYS[note.key].color }} initial={{ y: 0, opacity: 1, rotate: -12 }} animate={{ y: -130, opacity: 0, rotate: 18 }} transition={{ duration: 1 }}><Music2 /></motion.span>)}</div>
      <div className="animal-xylophone" aria-label="동물 실로폰">
        {XYLOPHONE_KEYS.map((key, index) => <motion.button key={key.note} type="button" aria-label={`${key.name} ${key.note} 연주`} className={`animal-key ${active.includes(index) ? 'key-playing' : ''}`} style={{ '--key-color': key.color, '--key-order': index } as React.CSSProperties}
          animate={{ y: active.includes(index) ? 7 : 0 }}
          onPointerDown={event => { if (event.button !== 0) return; event.preventDefault(); strike(index); }}
          onClick={event => { if (event.detail === 0) strike(index); }}>
          <span className="key-pin" /><motion.span className="key-animal" animate={{ y: active.includes(index) ? -12 : 0 }}><ToyArtwork emoji={key.animal} /></motion.span><span className="key-note">{index === 7 ? '도♪' : key.note}</span><span className="key-pin" />
        </motion.button>)}
      </div>
    </div>
    <PlayHint>콕콕! 마음대로 연주해요</PlayHint>
  </PlayShell>;
}
