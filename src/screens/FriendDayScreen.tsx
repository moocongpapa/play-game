import { Fragment, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type LazyExoticComponent } from 'react';
import { ArrowRight, Check, Heart, Home, Moon } from 'lucide-react';
import { availableFriendStories, type FriendStory } from '../data/friendDay';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { GameArtwork } from '../components/GameArtwork';
import { GameStage } from '../components/GameStage';
import { PlayResultScene } from '../components/PlayResultScene';
import { DayContinuationContext } from '../components/PlayFlowContext';
import { RoundContinuation } from '../components/RoundContinuation';
import { CakeKeepsake } from '../components/PlayKeepsakeArtwork';
import { CareFriend } from '../components/ToddlerPlay';
import { usePlayMemory } from '../components/PlayMemoryContext';
import { speakText, stopAllSpeech, stopPlaySounds, playJellyTap } from '../utils/soundEngine';
import { stopCelebrations } from '../utils/confetti';
import type { ToddlerGameProps } from '../hooks/useToddlerPlay';
import type { GameId } from '../types';
import './FriendDayScreen.css';

const LOADERS = {
  fruit_harvest: () => import('./games/FruitHarvestGame').then(m => ({ default: m.FruitHarvestGame })),
  counting_food: () => import('./games/GgulgguliCountingGame').then(m => ({ default: m.GgulgguliCountingGame })),
  cake_deco: () => import('./games/CakeDecoGame').then(m => ({ default: m.CakeDecoGame })),
  feeding: () => import('./games/FeedingGame').then(m => ({ default: m.FeedingGame })),
  tooth_brush: () => import('./games/ToothBrushGame').then(m => ({ default: m.ToothBrushGame })),
  animal_xylophone: () => import('./games/AnimalXylophoneGame').then(m => ({ default: m.AnimalXylophoneGame })),
  goodnight_sleep: () => import('./games/GoodNightSleepGame').then(m => ({ default: m.GoodNightSleepGame })),
};
type StoryGameId = keyof typeof LOADERS;
const GAMES = Object.fromEntries(Object.entries(LOADERS).map(([id, load]) => [id, lazy<ComponentType<ToddlerGameProps>>(load)])) as Record<StoryGameId, LazyExoticComponent<ComponentType<ToddlerGameProps>>>;

type Props = Omit<ToddlerGameProps, 'onCompleteQuiz'> & {
  onCompleteGame: (gameId: GameId) => void; onGoHome: () => void;
  microphoneEnabled?: boolean; disabledGames?: GameId[];
  onActivityChange?: (id: GameId | null) => void;
};

export function FriendDayScreen({ disabledGames = [], ...props }: Props) {
  const [storyId, setStoryId] = useState<FriendStory['id'] | null>(null);
  const disabledKey = disabledGames.join(',');
  const stories = useMemo(() => availableFriendStories(props.ageGroup, disabledGames), [props.ageGroup, disabledKey]);
  const story = stories.find(item => item.id === storyId);
  useEffect(() => () => props.onActivityChange?.(null), [props.onActivityChange]);
  if (story) return <StoryAdventure key={story.id} {...props} story={story} stories={stories} onStoryChange={setStoryId}/>;
  return <section className="story-picker" aria-label="그림으로 이야기 고르기">
    <h1 className="sr-only">어떤 이야기를 함께 만들까?</h1>
    <div className="story-picker-buddy"><CharacterAvatar id={props.buddy} mood="waving" size="md"/></div>
    {stories.map(item => <button type="button" key={item.id} className={`story-choice story-${item.theme}`}
      aria-label={`${item.title} 시작`} onClick={() => { stopAllSpeech(); playJellyTap(props.soundEnabled); setStoryId(item.id); }}>
      <span className="story-choice-picture" aria-hidden="true">{item.picture}</span>
      <span className="story-choice-scenes">{item.steps.map(step => <GameArtwork key={step.gameId} gameId={step.gameId} buddy={props.buddy}/>)}</span>
      <ArrowRight aria-hidden="true"/>
    </button>)}
    {stories.length === 0 && <button type="button" className="story-empty-home" aria-label="다른 놀이 고르기" onClick={props.onGoHome}><Home/></button>}
  </section>;
}

function StoryAdventure({ story, stories, onStoryChange, onCompleteGame, onActivityChange, microphoneEnabled = false, ...props }: Props & {
  story: FriendStory; stories: FriendStory[]; onStoryChange: (id: FriendStory['id']) => void;
}) {
  const [step, setStep] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [done, setDone] = useState(false);
  const completedStep = useRef(false);
  const enteredStep = useRef('');
  const latest = useRef(props);
  latest.current = props;
  const { memory, rememberVisit } = usePlayMemory();
  const finished = step >= story.steps.length;
  const scene = story.steps[step];
  useEffect(() => { onActivityChange?.(scene?.gameId ?? (story.id === 'bedtime' ? 'goodnight_sleep' : null)); }, [scene, story.id, onActivityChange]);
  useEffect(() => {
    if (finished) {
      speakText(story.closing, latest.current.soundEnabled, { characterId: latest.current.buddy, playIntroSFX: false });
    } else {
      const visitKey = `${cycle}:${step}`;
      if (enteredStep.current !== visitKey) { enteredStep.current = visitKey; rememberVisit(scene.gameId, latest.current.buddy); }
      const nextScene = story.steps[step + 1];
      if (nextScene) void LOADERS[nextScene.gameId as StoryGameId]().catch(() => {});
    }
    return () => { stopAllSpeech(); stopPlaySounds(); };
  }, [step, cycle, story, finished, rememberVisit]);
  const next = useCallback(() => {
    if (!completedStep.current) return;
    completedStep.current = false;
    stopAllSpeech(); stopPlaySounds(); stopCelebrations();
    setDone(false); setStep(value => value + 1);
  }, []);
  const nextStory = () => {
    const index = stories.findIndex(item => item.id === story.id);
    const nextId = stories[(index + 1) % stories.length].id;
    if (nextId === story.id) { completedStep.current = false; setStep(0); setDone(false); setCycle(value => value + 1); }
    else onStoryChange(nextId);
  };
  const Game = scene && GAMES[scene.gameId as StoryGameId];
  return <div className={`friend-day connected-story story-${story.theme} ${!finished ? 'day-playing' : ''}`}>
    <h1 className="sr-only">{story.title}</h1>
    <div className="day-path" aria-label={`${story.title} 순서`}>{story.steps.map((item, index) => <Fragment key={item.gameId}>
      {index > 0 && <ArrowRight aria-hidden="true"/>}<div aria-current={!finished && index === step ? 'step' : undefined}
        aria-label={`${item.title}${index < step || (index === step && done) ? ' 완료' : ''}`}>
        <GameArtwork gameId={item.gameId} buddy={props.buddy}/>{(index < step || (index === step && done)) && <Check className="day-check"/>}
      </div>
    </Fragment>)}</div>
    {finished ? <div className="day-finale">
      {story.id === 'bedtime' ? <div className="story-sleep-finale" aria-label="포근한 잠자리 완성"><Moon aria-hidden="true"/><CareFriend buddy={props.buddy} sleeping mouth="rest"/></div>
        : <PlayResultScene kind={story.id === 'picnic' ? 'picnic' : 'dance'} buddy={props.buddy} caption={story.closing}/>}
      {story.id === 'birthday' && memory.latestCake && <span className="story-cake"><CakeKeepsake cake={memory.latestCake}/></span>}
      <Heart className="story-finale-heart" aria-hidden="true"/>
      <RoundContinuation onNext={nextStory} delayMs={1100}/>
    </div> : <DayContinuationContext.Provider value={{ onNext: next }}>
      <GameStage gameId={scene.gameId} buddy={props.buddy} soundEnabled={props.soundEnabled} microphoneEnabled={microphoneEnabled}>
        <Suspense fallback={<div className="game-loading"><CharacterAvatar id={props.buddy} mood="waving"/><span className="sr-only">다음 놀이를 꺼내고 있어!</span></div>}>
          <Game key={`${cycle}:${step}`} {...props} onCompleteQuiz={() => {
            if (completedStep.current) return;
            completedStep.current = true; setDone(true); onCompleteGame(scene.gameId);
          }}/>
        </Suspense>
      </GameStage>
    </DayContinuationContext.Provider>}
  </div>;
}
