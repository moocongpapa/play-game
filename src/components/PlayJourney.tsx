import { useContext, useState, type ReactNode } from 'react';
import { motion, MotionConfig, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, Flag, Flower2, Sparkles, Volume2, TreeDeciduous, Cloud, Utensils, Rainbow } from 'lucide-react';
import { CharacterAvatar } from './CharacterAvatar';
import { DayContinuationContext, PlayHintsPausedContext } from './PlayFlowContext';
import { ToyArtwork } from './ToyArtwork';
import { LandscapeArt, SeatArt, WingArt } from './development/DevelopmentArt';
import { CareObjectArt, type CareObjectKind } from './development/CareRoutine';
import { CHARACTERS } from '../data/characters';
import { isSpeechBusy, playCareSound, speakText } from '../utils/soundEngine';
import { JUICE_SPRING } from '../utils/juice';
import type { PlayJourney } from '../hooks/usePlayJourney';
import type { ToddlerGameProps } from '../hooks/useToddlerPlay';
import './development/DevelopmentPlay.css';
import './PlayJourney.css';

export function JourneyPicture({ picture }: { picture: string }) {
  if (['paste', 'drink', 'rinse', 'wipe', 'blanket', 'teeth'].includes(picture)) return <CareObjectArt kind={picture as CareObjectKind} />;
  if (picture === 'wing') return <WingArt pattern={0} />;
  if (picture === 'chair' || picture === 'bowl') return <SeatArt variant={picture === 'chair' ? 0 : 2} />;
  if (picture === 'flower' || picture === '🌸') return <Flower2 fill="#e9c6d4" color="#aa8694" strokeWidth={1.5}/>;
  if (picture === '🌈') return <Rainbow color="#b796bb" strokeWidth={1.8}/>;
  if (picture === '🍽️') return <Utensils color="#baa177"/>;
  if (picture === '🌳') return <TreeDeciduous fill="#b9d0a2" color="#91aa80"/>;
  if (picture === '☁️') return <Cloud fill="#eaf3ee" color="#a5bfc4"/>;
  if (picture === '🛝') return <svg viewBox="0 0 100 90" aria-hidden="true"><path d="M13 80 V20 H49 V80 M14 42 H49 M14 63 H49" fill="none" stroke="#b7977f" strokeWidth="7" strokeLinejoin="round"/><path d="M41 19 H59 Q60 70 90 76" fill="none" stroke="#d9a2b7" strokeWidth="12" strokeLinecap="round"/></svg>;
  if (picture === 'path') return <Flag />;
  return <ToyArtwork emoji={picture} />;
}

export function JourneyFrame({ props, journey, className = '', children }: {
  props: ToddlerGameProps; journey: PlayJourney; className?: string; children: ReactNode;
}) {
  const paused = useContext(PlayHintsPausedContext);
  return <MotionConfig reducedMotion="user"><PlayHintsPausedContext.Provider value={paused || journey.locked}>
    <div className={`development-play play-journey ${className}`} data-journey-phase={journey.phase}>
      <div className="discovery-guide"><CharacterAvatar id={props.buddy} size="sm" mood={journey.locked ? 'happy' : 'still'} />
        <h2>{journey.phase === 'finished' ? '우리 함께 해냈어!' : journey.current.label}</h2>
        <button type="button" aria-label="놀이 안내 다시 듣기" disabled={!props.soundEnabled || paused || journey.locked} onClick={() => speakText(journey.current.guide, props.soundEnabled, { characterId: props.buddy })}><Volume2 /></button>
      </div>
      <ol className="journey-path" aria-label="이야기 진행">
        {journey.steps.map((step, i) => <li key={step.id} aria-label={step.label} aria-current={i === journey.step ? 'step' : undefined}
          data-done={i < journey.step || (i === journey.step && journey.locked)}>
          <JourneyPicture picture={step.picture} /><Check className="journey-check" aria-hidden="true" />
        </li>)}
      </ol>
      {children}
      {journey.phase === 'celebrating' && <div className="journey-cheer" role="status"><Sparkles aria-hidden="true" /><span className="sr-only">잘했어! 다음 장면으로 이어져요.</span><ArrowRight aria-hidden="true" /></div>}
    </div>
  </PlayHintsPausedContext.Provider></MotionConfig>;
}

/** Finale objects stay playable; taps extend the quiet interval before the next story. */
export function JourneyToy({ props, label, voice, children, className = '' }: {
  props: ToddlerGameProps; label: string; voice: string; children: ReactNode; className?: string;
}) {
  const [tap, setTap] = useState(0);
  const reduced = useReducedMotion();
  return <motion.button type="button" className={`journey-toy ${className}`} aria-label={label}
    whileTap={reduced ? undefined : { scaleX: 1.08, scaleY: .91 }} transition={JUICE_SPRING}
    onClick={() => { setTap(n => n + 1); playCareSound('bubble', props.soundEnabled); if (!isSpeechBusy()) speakText(voice, props.soundEnabled, { characterId: props.buddy, playIntroSFX: false }); }}>
    <motion.span key={tap} className="journey-toy-art" animate={!reduced && tap ? { y: [0, -18, 0], rotate: [0, -7, 7, 0] } : undefined} transition={{ duration: .65 }}>
      {children}
    </motion.span>
    {tap > 0 && <span key={`spark-${tap}`} className="journey-toy-spark" aria-hidden="true"><Sparkles /></span>}
  </motion.button>;
}

export function JourneyFinale({ props, journey, scene = 'garden', children }: {
  props: ToddlerGameProps; journey: PlayJourney; scene?: 'garden' | 'picnic' | 'mirror' | 'bedroom'; children: ReactNode;
}) {
  const day = useContext(DayContinuationContext);
  return <section className={`journey-finale finale-${scene}`} aria-label="완성한 이야기 놀이터">
    {scene === 'garden' && <LandscapeArt />}
    <div className="journey-collection">{children}</div>
    <JourneyToy props={props} className="journey-companion" label={`${CHARACTERS[props.buddy].name}와 기뻐하기`} voice="우리 함께 해냈어! 너랑 노니까 정말 즐거워!">
      <CharacterAvatar id={props.buddy} size="xl" mood="happy" />
    </JourneyToy>
    <button type="button" className="journey-next" aria-label={day ? '다음 하루 놀이로' : '새 이야기 시작'} onClick={journey.restart}>
      {day ? day.picture : <Flag aria-hidden="true" />}<ArrowRight aria-hidden="true" />
    </button>
  </section>;
}
