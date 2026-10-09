import { Fragment, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Sun } from 'lucide-react';
import { CookieHouseIcon } from '../components/CookieHouseIcon';
import { CHARACTERS } from '../data/characters';
import { FRIEND_DAY } from '../data/friendDay';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { GameArtwork } from '../components/GameArtwork';
import { GameStage } from '../components/GameStage';
import { PlayResultScene } from '../components/PlayResultScene';
import { DayContinuationContext } from '../components/PlayFlowContext';
import { speakText, stopAllSpeech, stopPlaySounds } from '../utils/soundEngine';
import { stopCelebrations } from '../utils/confetti';
import type { ToddlerGameProps } from '../hooks/useToddlerPlay';
import type { GameId } from '../types';

const GAMES = [
  lazy(() => import('./games/FeedingGame').then(m => ({ default: m.FeedingGame }))),
  lazy(() => import('./games/ToothBrushGame').then(m => ({ default: m.ToothBrushGame }))),
  lazy(() => import('./games/PeekabooHideGame').then(m => ({ default: m.PeekabooHideGame }))),
  lazy(() => import('./games/AnimalXylophoneGame').then(m => ({ default: m.AnimalXylophoneGame }))),
];

export function FriendDayScreen({ onCompleteGame, onGoHome, ...props }: Omit<ToddlerGameProps, 'onCompleteQuiz'> & {
  onCompleteGame: (gameId: GameId) => void; onGoHome: () => void;
}) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const completedStep = useRef(false);
  const heading = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const finished = step === FRIEND_DAY.length;
  const scene = FRIEND_DAY[step];
  useEffect(() => {
    const { buddy, soundEnabled } = latest.current;
    if (!started) speakText(`${CHARACTERS[buddy].name}랑 하루를 함께 보내자! 먼저 맛있는 아침을 먹자!`, soundEnabled, { characterId: buddy });
    else if (finished) speakText('냠냠 먹고, 치카치카, 까꿍, 음악회까지! 너랑 함께해서 행복했어!', soundEnabled, { characterId: buddy });
    heading.current?.scrollIntoView({ block: 'start' });
    return () => { stopAllSpeech(); stopPlaySounds(); };
  }, [started, step, finished]);
  const next = () => {
    if (!completedStep.current) return;
    completedStep.current = false;
    stopAllSpeech(); stopPlaySounds(); stopCelebrations();
    setDone(false); setStep(value => value + 1);
  };
  const Game = GAMES[step];
  return <div className={`friend-day ${started && !finished ? 'day-playing' : ''}`}>
    <div ref={heading} className="day-heading"><p className="eyebrow">작은 이야기 여행</p><h1>{CHARACTERS[props.buddy].name}의 하루</h1><p>{finished ? '함께 만든 하루, 참 즐거웠어!' : started ? scene.title : '먹고 · 씻고 · 찾고 · 함께 노래해요'}</p></div>
    <div className="day-path" aria-label="친구의 하루 순서">{FRIEND_DAY.map((item, index) => <Fragment key={item.gameId}>
      {index > 0 && <ArrowRight aria-hidden="true" />}<div aria-current={started && !finished && index === step ? 'step' : undefined} aria-label={`${item.title}${index < step || (index === step && done) ? ' 완료' : ''}`}><GameArtwork gameId={item.gameId} buddy={props.buddy} />{(index < step || (index === step && done)) && <Check className="day-check" />}</div>
    </Fragment>)}</div>
    {!started ? <div className="day-intro"><CharacterAvatar id={props.buddy} size="2xl" mood="waving" /><div className="day-next"><p>우리 같이 아침 먹으러 갈까?</p><button onClick={() => { stopAllSpeech(); setStarted(true); }} aria-label="친구의 하루 아침 먹기 시작"><GameArtwork gameId="feeding" buddy={props.buddy} /><span><ArrowRight /> 냠냠 먹으러!</span></button></div></div>
    : finished ? <div className="day-finale"><PlayResultScene kind="dance" buddy={props.buddy} friends={[props.buddy]} caption="우리 함께 만든 멋진 하루!" /><p>오늘도 함께 놀아 줘서 고마워!</p><button className="day-home" onClick={onGoHome}><CookieHouseIcon className="size-9" /> 다른 놀이 고르기</button></div>
    : <DayContinuationContext.Provider value={{ onNext: next, label: scene.next, picture: step + 1 < FRIEND_DAY.length ? <GameArtwork gameId={FRIEND_DAY[step + 1].gameId} buddy={props.buddy} /> : <Sun /> }}>
      <GameStage gameId={scene.gameId} buddy={props.buddy} soundEnabled={props.soundEnabled}>
        <Suspense fallback={<div className="game-loading"><CharacterAvatar id={props.buddy} mood="waving" /><p>다음 놀이를 꺼내고 있어!</p></div>}>
          <Game key={step} {...props} onCompleteQuiz={() => {
            if (completedStep.current) return;
            completedStep.current = true; setDone(true); onCompleteGame(scene.gameId);
          }} />
        </Suspense>
      </GameStage>
    </DayContinuationContext.Provider>}
  </div>;
}
