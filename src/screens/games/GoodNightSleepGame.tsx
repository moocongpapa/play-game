import { useEffect, useState } from 'react';
import { Lamp, Moon, Star } from 'lucide-react';
import { CareFriend } from '../../components/ToddlerPlay';
import { ToyArtwork } from '../../components/ToyArtwork';
import { DragMatch, DragPiece, DropSlot } from '../../components/DragMatch';
import { PullToy } from '../../components/development/PullToy';
import { DevelopmentShell, DiscoveryHint, DiscoveryNext, useDevelopmentRound } from '../../components/development/DevelopmentShell';
import { usePageVisible, type ToddlerGameProps } from '../../hooks/useToddlerPlay';
import { playCareSound, playSleepBreath, speakText } from '../../utils/soundEngine';
const GUIDE='인형을 꼭 안겨 주고, 이불을 올려 덮어 줘. 전등 줄도 살짝 당겨 볼까?';
export function GoodNightSleepGame(props:ToddlerGameProps){
  const {round,completed,finish,next}=useDevelopmentRound(props,GUIDE,true);
  const [dark,setDark]=useState(false),[hugged,setHugged]=useState(false),[covered,setCovered]=useState(false),[blanketPull,setBlanketPull]=useState(0);
  const visible=usePageVisible();
  useEffect(()=>{if(dark&&hugged&&covered)finish(`포근하다. 고마워. 좋은 꿈 꾸자, ${props.childName}야.`);},[dark,hugged,covered]);
  useEffect(()=>{if(!completed||!visible)return;const timer=window.setInterval(()=>playSleepBreath(props.soundEnabled),3300);return()=>window.clearInterval(timer);},[completed,visible,props.soundEnabled]);
  const praise=(text:string)=>{playCareSound('bubble',props.soundEnabled);speakText(text,props.soundEnabled,{characterId:props.buddy,rate:.8});};
  return <DevelopmentShell {...props} title="포근하게, 코~ 자자" guide={GUIDE} className="sleep-play"><DragMatch juicy resetKey={round} disabled={completed} onDrop={id=>{if(id!=='teddy'||hugged)return false;setHugged(true);praise('인형을 꼭 안으니 마음이 포근해.');return true;}} hint={!hugged?{pieceId:'teddy',targetId:'hug'}:undefined}>
    <div className={`sleep-room ${dark?'room-dark':''} ${completed?'room-asleep':''}`}>
      <div className="sleep-window" aria-hidden="true"><Moon fill="#f1e0a2"/>{[0,1,2].map(i=><Star key={i}/>)}</div>
      <PullToy className="bedside-lamp" disabled={completed} label={dark?'전등 줄 당겨 불 켜기':'전등 줄 당겨 불 끄기'} distance={60} onPull={()=>{setDark(!dark);praise(dark?'은은한 불빛이 켜졌네.':'불을 끄니 눈이 스르르 감겨.');}}><Lamp fill="#e9cb99"/><span className="lamp-cord"><i/></span></PullToy>
      <div className="sleep-bed"><div className="sleep-pillow"/><div className="sleep-friend"><CareFriend buddy={props.buddy} mouth="rest" sleeping={completed} faceLabel={completed?'잠든 얼굴':'졸린 얼굴'}>{!completed&&<ellipse className="sleep-yawn" cx="150" cy="171" rx="13" ry="20" fill="#a1657a"/>}</CareFriend><DropSlot id="hug" label="친구의 품" className="sleep-hug" filled={hugged}>{hugged?<ToyArtwork emoji="🧸"/>:<span className="hug-outline"><ToyArtwork emoji="🧸"/></span>}</DropSlot></div>
        <div className="sleep-blanket" style={{top:`${covered?51:75-blanketPull*24}%`}}><span aria-hidden="true">{[0,1,2,3,4].map(i=><Star key={i} fill="currentColor"/>)}</span><PullToy className="blanket-handle" direction={-1} distance={80} label="이불을 위로 올려 덮기" disabled={covered} onProgress={setBlanketPull} onPull={()=>{setCovered(true);praise('이불이 보들보들, 따뜻해.');}}><span className="blanket-grip"/></PullToy></div>
        {completed&&<div className="sleep-dreams" aria-label="새근새근 잠든 친구"><span>Zzz</span><Star/><Moon/><Star/></div>}
      </div>
      {!hugged&&<DragPiece id="teddy" label="잠자리 인형" className="sleep-teddy"><ToyArtwork emoji="🧸"/></DragPiece>}
      <div className="sleep-steps" aria-label="잠자리 준비 상태">{[hugged,covered,dark].map((done,i)=><span key={i} data-done={done}>{i===0?<ToyArtwork emoji="🧸"/>:i===1?<span className="tiny-blanket"/>:<Lamp/>}</span>)}</div>
    </div>
  </DragMatch>{completed?<DiscoveryNext quiet onNext={()=>{setDark(false);setHugged(false);setCovered(false);setBlanketPull(0);next();}}/>:<DiscoveryHint>인형 꼭, 이불 쏙, 불은 살짝</DiscoveryHint>}</DevelopmentShell>;
}
