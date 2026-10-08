import { useRef, useState } from 'react';
import { DragMatch, DragPiece, DropSlot } from '../../components/DragMatch';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { DevelopmentShell, DiscoveryHint, DiscoveryNext, useDevelopmentRound } from '../../components/development/DevelopmentShell';
import { SeatArt } from '../../components/development/DevelopmentArt';
import { useGameTimeouts } from '../../hooks/useGameTimeouts';
import { playBouncyBoing, playCareSound, speakText } from '../../utils/soundEngine';
import type { ToddlerGameProps } from '../../hooks/useToddlerPlay';
const BEARS=[{id:'small',name:'아기 곰',size:64},{id:'medium',name:'엄마 곰',size:87},{id:'large',name:'아빠 곰',size:110}];
const GUIDE='작은 곰, 중간 곰, 커다란 곰! 크기가 꼭 맞는 자리를 찾아 줘.';
export function SizeOrderingGame(props:ToddlerGameProps){
  const {round,completed,finish,next}=useDevelopmentRound(props,GUIDE);const [seated,setSeated]=useState<string[]>([]);const seatedRef=useRef(new Set<string>());
  const [wobble,setWobble]=useState('');const {scheduleGameTimeout,clearGameTimeouts}=useGameTimeouts();
  const order=[2,0,1].map(i=>BEARS[(i+round)%3]);const hint=order.find(b=>!seated.includes(b.id));
  const drop=(id:string,target:string)=>{if(completed||seatedRef.current.has(id))return false;if(id!==target){setWobble(target);clearGameTimeouts();scheduleGameTimeout(()=>setWobble(''),750);playBouncyBoing(props.soundEnabled);speakText('어라, 자리가 조금 다르네! 다른 데도 앉아볼까?',props.soundEnabled,{characterId:props.buddy});return false;}
    seatedRef.current.add(id);setSeated([...seatedRef.current]);playCareSound('bubble',props.soundEnabled);if(seatedRef.current.size===3)finish('작은 곰부터 큰 곰까지! 모두 편안해. 고마워!');else speakText('딱 맞아! 편안해~',props.soundEnabled,{characterId:props.buddy});return true;};
  return <DevelopmentShell {...props} title="곰 세 마리의 자리" guide={GUIDE} className="ordering-play"><DragMatch canDrop={(id, target) => id === target} juicy resetKey={round} disabled={completed} onDrop={drop} hint={hint?{pieceId:hint.id,targetId:hint.id}:undefined}>
    <div className="bear-room"><div className="bear-window" aria-hidden="true"/><div className="bear-seats">{BEARS.map(bear=><DropSlot key={bear.id} id={bear.id} label={`${bear.name} ${['의자','방석','밥그릇'][round%3]}`} filled={seated.includes(bear.id)} className={`bear-seat ${wobble===bear.id?'seat-wobble':''}`}><span className="seat-size" style={{width:bear.size}}><SeatArt variant={round}/></span>{seated.includes(bear.id)&&<span className="seated-bear" style={{width:bear.size,height:bear.size}}><CharacterAvatar id="ggomi" size="sm" mood="happy"/></span>}</DropSlot>)}</div><span className="bear-order-line" aria-hidden="true"><i/><i/><i/></span></div>
    <div className="bear-family" aria-label="곰 가족">{order.map(bear=><DragPiece key={bear.id} id={bear.id} label={bear.name} disabled={seated.includes(bear.id)} className={`bear-piece ${seated.includes(bear.id)?'bear-seated':''}`}><span style={{width:bear.size,height:bear.size}}><CharacterAvatar id="ggomi" size="sm" mood="still"/></span><span className="bear-size-dots" aria-hidden="true">{Array.from({length:BEARS.indexOf(bear)+1},(_,i)=><i key={i}/>)}</span></DragPiece>)}</div>
  </DragMatch>{completed?<DiscoveryNext onNext={()=>{clearGameTimeouts();setWobble('');seatedRef.current.clear();setSeated([]);next();}}/>:<DiscoveryHint>작은 자리부터 커다란 자리까지</DiscoveryHint>}</DevelopmentShell>;
}
