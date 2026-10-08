import { useRef, useState } from 'react';
import { Cloud, Moon, Sun, Flower2, Wind, Check, CloudRain } from 'lucide-react';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { PullToy } from '../../components/development/PullToy';
import { LandscapeArt } from '../../components/development/DevelopmentArt';
import { DevelopmentShell, DiscoveryHint, DiscoveryNext, useDevelopmentRound } from '../../components/development/DevelopmentShell';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import { playCareSound, speakText } from '../../utils/soundEngine';
import type { ToddlerGameProps } from '../../hooks/useToddlerPlay';
const GUIDE='해님을 아래로 끌면 밤이 돼! 구름과 꽃, 풍차도 톡톡 만져 봐.';
export function DayNightWeatherGame(props:ToddlerGameProps){
  const {completed,finish,next}=useDevelopmentRound(props,GUIDE);const [night,setNight]=useState(false);const [pull,setPull]=useState(0);
  const [cloud,setCloud]=useState(0);const [raining,setRaining]=useState(false);const [bloom,setBloom]=useState(0);const [spin,setSpin]=useState(0);
  const seen=useRef(new Set<string>());const [seenKeys,setSeenKeys]=useState<string[]>([]);const {scheduleGameTimeout,clearGameTimeouts}=useGameTimeouts();
  const mark=(key:string)=>{if(completed)return;seen.current.add(key);setSeenKeys([...seen.current]);if(seen.current.size===4)finish('해님 달님, 비와 꽃! 네가 세상을 움직였네!');};
  const mix=night?1-pull:pull;
  const rain=()=>{const n=cloud+1;setCloud(n);playCareSound('bubble',props.soundEnabled);if(n%3===0){clearGameTimeouts();setRaining(true);speakText('토독토독, 비가 온다! 개구리 우산을 펼치자!',props.soundEnabled,{characterId:props.buddy});scheduleGameTimeout(()=>setRaining(false),6500);mark('rain');}};
  return <DevelopmentShell {...props} title="내가 만드는 하늘" guide={GUIDE} className="weather-play"><div className="discovery-scene weather-scene" style={{'--night':mix} as React.CSSProperties}>
    <div className="weather-dusk" style={{opacity:Math.sin(mix*Math.PI)*.8}}/><div className="weather-dark" style={{opacity:mix}}/>
    <LandscapeArt/><div className="weather-stars" style={{opacity:mix}} aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{left:`${9+(i*37)%85}%`,top:`${5+(i*19)%50}%`,animationDelay:`${i*-.4}s`}}/>)}</div>
    <PullToy className="sky-orb" label={night?'달님을 내려 아침 만들기':'해님을 내려 밤 만들기'} onProgress={setPull} onPull={()=>{setNight(!night);playCareSound('bubble',props.soundEnabled);speakText(night?'좋은 아침! 해님이 왔네!':'밤이 되었네. 달님 안녕!',props.soundEnabled,{characterId:props.buddy});mark('sky');}}>{night?<Moon fill="#f6e4a3"/>:<Sun fill="#efd184"/>}</PullToy>
    <button className="weather-cloud" aria-label="구름을 톡톡 눌러 비 내리기" onClick={rain}><span key={cloud} className="cloud-puff" style={{scale:1+(cloud%3)*.12}}><Cloud fill="#fff8e9"/>{raining&&<CloudRain/>}</span></button>
    {raining&&<div className="weather-rain" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{left:`${(i*17)%100}%`,animationDelay:`${i*-.13}s`}}/>)}</div>}
    <div className="weather-buddy"><CharacterAvatar id={props.buddy} size="xl" mood={raining?'happy':'still'}/>{raining&&<svg viewBox="0 0 180 160" className="frog-umbrella" aria-hidden="true"><path d="M90 40 V142 Q90 158 74 148" stroke="#83a184" strokeWidth="6" fill="none"/><path d="M12 77 Q15 14 90 15 Q165 16 169 77 Q143 64 116 77 Q90 64 64 77 Q37 63 12 77" fill="#a4cd9c" stroke="#739b77" strokeWidth="3"/><g fill="#cde2b6" stroke="#739b77" strokeWidth="2"><circle cx="58" cy="22" r="19"/><circle cx="121" cy="22" r="19"/></g><g fill="#576859"><circle cx="58" cy="22" r="5"/><circle cx="121" cy="22" r="5"/></g><path d="M75 49 Q90 62 105 49" fill="none" stroke="#678570" strokeWidth="4"/></svg>}</div>
    <button className="weather-windmill" aria-label="풍차 돌리기" onClick={()=>{setSpin(n=>n+1);mark('wind');playCareSound('bubble',props.soundEnabled);}}><span className="mill-house"/><span key={spin} className={spin?'mill-blades is-spinning':'mill-blades'}>{[0,1,2,3].map(i=><i key={i} style={{rotate:`${i*90}deg`}}/>)}</span></button>
    <button className="weather-flowers" aria-label="꽃과 풀잎 간질이기" onClick={()=>{setBloom(n=>n+1);mark('flower');playCareSound('bubble',props.soundEnabled);}}><span key={bloom} className={bloom?'flowers-bouncing':''}><Flower2 fill="#eab5c1"/><Flower2 fill="#f0d18c"/><span className="tickle-grass"/></span></button>
    <div className="weather-discoveries" aria-label="발견한 날씨 놀이">{[{id:'sky',icon:Sun},{id:'rain',icon:CloudRain},{id:'wind',icon:Wind},{id:'flower',icon:Flower2}].map(({id,icon:Icon})=><span key={id} data-done={seenKeys.includes(id)}><Icon/>{seenKeys.includes(id)&&<Check/>}</span>)}</div>
  </div>{completed?<DiscoveryNext onNext={()=>{seen.current.clear();setSeenKeys([]);next();}}/>:<DiscoveryHint>해님은 쭉, 구름은 톡톡톡!</DiscoveryHint>}</DevelopmentShell>;
}
