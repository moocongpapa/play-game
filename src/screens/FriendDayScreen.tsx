import { Fragment, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { CHARACTERS } from '../data/characters';
import { FRIEND_DAY } from '../data/friendDay';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { GameArtwork } from '../components/GameArtwork';
import { GameStage } from '../components/GameStage';
import { PlayResultScene } from '../components/PlayResultScene';
import { DayContinuationContext } from '../components/PlayFlowContext';
import { RoundContinuation } from '../components/RoundContinuation';
import { speakText, stopAllSpeech, stopPlaySounds } from '../utils/soundEngine';
import { stopCelebrations } from '../utils/confetti';
import type { ToddlerGameProps } from '../hooks/useToddlerPlay';
import type { GameId } from '../types';

const GAME_LOADERS = [
  () => import('./games/FeedingGame').then(m => ({ default: m.FeedingGame })),
  () => import('./games/ToothBrushGame').then(m => ({ default: m.ToothBrushGame })),
  () => import('./games/PeekabooHideGame').then(m => ({ default: m.PeekabooHideGame })),
  () => import('./games/AnimalXylophoneGame').then(m => ({ default: m.AnimalXylophoneGame })),
];
const GAMES = GAME_LOADERS.map(load => lazy(load));

export function FriendDayScreen({ onCompleteGame, onGoHome: _onGoHome, ...props }: Omit<ToddlerGameProps, 'onCompleteQuiz'> & {
  onCompleteGame: (gameId: GameId) => void; onGoHome: () => void;
}) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const completedStep = useRef(false);
  const heading = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const finished = step === FRIEND_DAY.length;
  const scene = FRIEND_DAY[step];
  useEffect(() => {
    // Prepare just the next activity while the child plays the current one.
    // Navigation still uses Suspense if loading fails or has not finished yet.
    const nextIndex = finished ? 0 : (step + 1) % GAME_LOADERS.length;
    void GAME_LOADERS[nextIndex]().catch(() => {});
  }, [step]);
  useEffect(() => {
    const { buddy, soundEnabled } = latest.current;
    if (finished) speakText('냠냠 먹고, 치카치카, 까꿍, 음악회까지! 너랑 함께해서 행복했어!', soundEnabled, { characterId: buddy });
    heading.current?.scrollIntoView({ block: 'start' });
    return () => { stopAllSpeech(); stopPlaySounds(); };
  }, [step, finished]);
  const next = () => {
    if (!finished && !completedStep.current) return;
    completedStep.current = false;
    stopAllSpeech(); stopPlaySounds(); stopCelebrations();
    setDone(false); setStep(value => value === FRIEND_DAY.length ? 0 : value + 1);
  };
  const Game = GAMES[step];
  return <DayContinuationContext.Provider value={{ onNext: next }}><div className={`friend-day ${!finished ? 'day-playing' : ''}`}>
    <div ref={heading} className="sr-only"><p className="eyebrow">작은 이야기 여행</p><h1>{CHARACTERS[props.buddy].name}의 하루</h1><p>{finished ? '함께 만든 하루, 참 즐거웠어!' : scene.title}</p></div>
    <div className="day-path" aria-label="친구의 하루 순서">{FRIEND_DAY.map((item, index) => <Fragment key={item.gameId}>
      {index > 0 && <ArrowRight aria-hidden="true" />}<div aria-current={!finished && index === step ? 'step' : undefined} aria-label={`${item.title}${index < step || (index === step && done) ? ' 완료' : ''}`}><GameArtwork gameId={item.gameId} buddy={props.buddy} />{(index < step || (index === step && done)) && <Check className="day-check" />}</div>
    </Fragment>)}</div>
    {finished ? <div className="day-finale"><PlayResultScene kind="dance" buddy={props.buddy} friends={[props.buddy]} caption="우리 함께 만든 멋진 하루!" /><RoundContinuation onNext={next} /></div>
    :
      <GameStage gameId={scene.gameId} buddy={props.buddy} soundEnabled={props.soundEnabled}>
        <Suspense fallback={<div className="game-loading"><CharacterAvatar id={props.buddy} mood="waving" /><span className="sr-only">다음 놀이를 꺼내고 있어!</span></div>}>
          <Game key={step} {...props} onCompleteQuiz={() => {
            if (completedStep.current) return;
            completedStep.current = true; setDone(true); onCompleteGame(scene.gameId);
          }} />
        </Suspense>
      </GameStage>
    }
  </div></DayContinuationContext.Provider>;
}
