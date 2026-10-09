import { useContext, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { PlayProgress } from '../../components/ToddlerPlay';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { JourneyFrame, JourneyFinale, JourneyToy } from '../../components/PlayJourney';
import { usePlayJourney, type JourneyStep } from '../../hooks/usePlayJourney';
import { type ToddlerGameProps } from '../../hooks/useToddlerPlay';
import { CHARACTERS } from '../../data/characters';
import { HIDE_FRIENDS } from '../../data/toddlerPlay';
import { shuffle } from '../../utils/roundDeck';
import { playBouncyBoing, speakText } from '../../utils/soundEngine';
import type { CharacterId } from '../../types';
import { useGentleHelp } from '../../hooks/useGentleHelp';
import { PlayHintsPausedContext } from '../../components/PlayFlowContext';
import { GentleHint } from '../../components/GentleHint';

const STEPS: JourneyStep[] = [
  { id: 'forest', label: '숲속에 누가 숨었지?', picture: '🌳', guide: '친구들이 어디 숨었지? 살짝 보이는 친구를 찾아 콕 눌러 봐!' },
  { id: 'playground', label: '놀이터에서도 까꿍!', picture: '🛝', guide: '친구들이 놀이터로 놀러 갔대! 살짝 보이는 귀와 꼬리를 찾아 줘.' },
  { id: 'clouds', label: '구름 위에서도 까꿍!', picture: '☁️', guide: '이번에는 몽실몽실 구름 뒤에 숨었네! 모두 찾아서 함께 인사하자!' },
];
export function HidingCover({ kind }: { kind: number }) {
  return <svg viewBox="0 0 180 130" aria-hidden="true" className="hiding-cover">
    {kind === 0 ? <g stroke="#759773" strokeWidth="2.5"><path d="M8 114 Q-1 76 32 71 Q18 39 54 43 Q74 3 100 40 Q136 15 143 53 Q179 46 173 80 Q191 99 168 117Z" fill="#9fbe8e" /><path d="M37 111 Q35 73 64 64 M86 112 Q96 65 122 59 M126 112 Q127 86 157 80" fill="none" stroke="#c2d5a7" strokeWidth="5" /><circle cx="54" cy="86" r="5" fill="#f4ddae" /><circle cx="144" cy="74" r="5" fill="#e6bccb" /></g> :
    kind === 1 ? <g stroke="#bc9168" strokeWidth="3" strokeLinejoin="round"><path d="M25 46 H155 L145 122 H35Z" fill="#dcba89" /><path d="M25 46 L8 25 H143 L155 46Z" fill="#f0d4a2" /><path d="M83 47 V120 M92 47 V120" stroke="#f9e9ca" strokeWidth="5" /><path d="M60 86 Q90 102 120 86" fill="none" /></g> :
    kind === 2 ? <g stroke="#b6ced4" strokeWidth="2.5"><path d="M24 113 Q-3 104 10 79 Q5 47 40 49 Q43 12 83 30 Q108 3 136 39 Q176 25 173 67 Q196 102 157 115Z" fill="#f4fcf6" /><path d="M29 96 Q81 120 150 94" stroke="#dfeded" strokeWidth="5" fill="none" /></g> :
    <g stroke="#a78865" strokeWidth="3"><path d="M31 24 Q89 5 150 24 L158 120 H23Z" fill="#c6a582" /><ellipse cx="91" cy="25" rx="60" ry="17" fill="#e2c6a0" /><ellipse cx="91" cy="25" rx="36" ry="10" fill="none" /><path d="M44 52 L42 109 M131 52 L137 109 M69 62 L69 91" fill="none" /><path d="M115 73 Q131 55 143 65 Q134 86 115 73" fill="#a6bb82" /></g>}
  </svg>;
}
export function PeekabooHideGame(props: ToddlerGameProps) {
  const journey = usePlayJourney(props, STEPS);
  const [collection, setCollection] = useState<{ cycle: number; friends: CharacterId[] }>({ cycle: 0, friends: [] });
  const friends = collection.cycle === journey.cycle ? collection.friends : [];
  const collect = (friend: CharacterId) => setCollection(old => ({ cycle: journey.cycle, friends: [...new Set([...(old.cycle === journey.cycle ? old.friends : []), friend])] }));
  return <JourneyFrame props={props} journey={journey} className="peekaboo-play">
    {journey.phase === 'finished' ? <JourneyFinale props={props} journey={journey}>
      {friends.filter(friend => friend !== props.buddy).map(friend => <JourneyToy key={friend} props={props} label={`${CHARACTERS[friend].name}와 인사하기`} voice={`까꿍! ${CHARACTERS[friend].name} 여기 있었지!`}><CharacterAvatar id={friend} size="lg" mood="happy"/></JourneyToy>)}
    </JourneyFinale> : <>
      <div className="journey-keepsakes" aria-label="찾은 친구들">{friends.map(friend => <span key={friend}><CharacterAvatar id={friend} size="sm" mood="happy"/></span>)}</div>
      <HideScene key={journey.key} props={props} round={journey.cycle * 3 + journey.step} theme={journey.step} completed={journey.locked} finish={journey.complete} onFound={collect}/>
    </>}
  </JourneyFrame>;
}
function HideScene({ props, round, theme, completed, finish, onFound }: { props: ToddlerGameProps; round: number; theme: number; completed: boolean; finish: (text: string) => void; onFound: (friend: CharacterId) => void }) {
  const reduced = useReducedMotion();
  const paused = useContext(PlayHintsPausedContext);
  const help = useGentleHelp(round, completed || paused);
  useEffect(() => {
    if (help.level === 3) speakText('살랑살랑, 저기 친구가 보여! 콕 눌러 볼까?', props.soundEnabled, { characterId: props.buddy, playIntroSFX: false });
  }, [help.level]);
  const [friends] = useState(() => { const others = HIDE_FRIENDS.filter(id => id !== props.buddy); return shuffle([props.buddy, others[round * 2 % others.length], others[(round * 2 + 1) % others.length]]); });
  const [found, setFound] = useState<number[]>([]);
  const foundRef = useRef(new Set<number>());
  const reveal = (index: number) => {
    if (completed || foundRef.current.has(index)) return;
    foundRef.current.add(index);
    onFound(friends[index]);
    help.progress();
    setFound([...foundRef.current]);
    playBouncyBoing(props.soundEnabled);
    if (foundRef.current.size === 3) finish('까꿍! 여기 숨은 친구들을 모두 찾았어! 정말 반가워!');
    else speakText(`까꿍! ${CHARACTERS[friends[index]].name} 여기 있었지!`, props.soundEnabled, { characterId: props.buddy, playIntroSFX: false });
  };
  return <>
    <div className={`peekaboo-garden peek-theme-${['forest', 'playground', 'clouds'][theme]}`}>
      {theme === 1 && <svg viewBox="0 0 600 420" className="trace-theme-art" aria-hidden="true"><g stroke="#ae9271" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"><path d="M30 200 L60 45 H210 L240 200 M70 52 L48 168 M204 52 L225 168" fill="none"/><path d="M100 50 V154 M169 50 V154" stroke="#d8b16a"/><path d="M95 155 Q136 167 175 155" stroke="#c78f93" strokeWidth="17"/><path d="M440 75 V203 M472 75 V203 M440 115 H472 M440 155 H472 M440 190 H472" fill="none"/><path d="M456 76 H499 Q502 181 577 194" stroke="#d7a1ba" strokeWidth="22" fill="none"/></g></svg>}
      <div className="garden-tree tree-left" aria-hidden="true" /><div className="garden-tree tree-right" aria-hidden="true" />
      <span className="garden-path" aria-hidden="true" />
      {friends.map((friend, index) => <button key={`${round}-${index}`} type="button" data-help={help.level > 0 && index === friends.findIndex((_, i) => !found.includes(i))} className={`hideout hideout-${index} ${found.includes(index) ? 'is-found' : ''}`} disabled={completed || found.includes(index)} aria-label={found.includes(index) ? `${CHARACTERS[friend].name} 찾았어요` : `숨은 친구 ${index + 1} 찾기`} onClick={() => reveal(index)}>
        <motion.span className="hiding-friend" animate={reduced ? { y: found.includes(index) ? -35 : 22 } : found.includes(index) ? { y: -35, scale: [1, 1.12, 1] } : { y: [25, 19, 25], rotate: [-3, 3, -3] }} transition={{ duration: found.includes(index) ? .55 : 2.4, repeat: found.includes(index) ? 0 : Infinity, delay: index * .3 }}><CharacterAvatar id={friend} size="xl" mood={found.includes(index) ? 'dancing' : 'still'} /></motion.span>
        <motion.span className="hiding-place" animate={{ y: found.includes(index) ? 32 : 0, opacity: found.includes(index) ? .6 : 1 }}><HidingCover kind={theme === 2 ? 2 : theme === 1 ? [1, 0, 1][index] : [0, 3, 0][index]} /></motion.span>
        {found.includes(index) && <span className="peekaboo-word">까꿍!</span>}
        {index === friends.findIndex((_, i) => !found.includes(i)) && <GentleHint level={help.level >= 3 ? 3 : 0} text="여기 콕!" />}
      </button>)}
      <span className="garden-flower flower-one" aria-hidden="true">✿</span><span className="garden-flower flower-two" aria-hidden="true">✿</span>
    </div>
    <PlayProgress total={3} done={found.length} label="찾은 친구" />
  </>;
}
