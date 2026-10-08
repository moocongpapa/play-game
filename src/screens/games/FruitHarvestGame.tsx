import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { DragMatch, DragPiece, DropSlot } from '../../components/DragMatch';
import { ToyArtwork } from '../../components/ToyArtwork';
import { DevelopmentShell, DiscoveryHint, DiscoveryNext, useDevelopmentRound } from '../../components/development/DevelopmentShell';
import { BasketArt, LandscapeArt } from '../../components/development/DevelopmentArt';
import type { ToddlerGameProps } from '../../hooks/useToddlerPlay';
import { playCareSound, speakText } from '../../utils/soundEngine';
const GUIDE='과일을 잡아 톡! 같은 과일 그림이 있는 바구니에 쏙 담아 줘.';
const FRUITS=[{id:'apple',name:'사과',emoji:'🍎',color:'#e9aaaa'},{id:'orange',name:'오렌지',emoji:'🍊',color:'#e9c48a'},{id:'peach',name:'복숭아',emoji:'🍑',color:'#e0b1c2'}];
export function FruitHarvestGame(props:ToddlerGameProps){
  const {round,completed,finish,next}=useDevelopmentRound(props,GUIDE);
  const [picked,setPicked]=useState<string[]>([]);const pickedRef=useRef(new Set<string>());
  const amount=props.ageGroup==='baby'?3:6;
  const fruits=Array.from({length:amount},(_,i)=>({...FRUITS[(i+round)%3],key:`fruit-${i}`}));
  const hint=fruits.find(f=>!picked.includes(f.key));
  const drop=(id:string,target:string)=>{
    const fruit=fruits.find(f=>f.key===id);if(!fruit||pickedRef.current.has(id)||completed)return false;
    if(fruit.id!==target){speakText('바구니의 과일 그림을 찾아볼까?',props.soundEnabled,{characterId:props.buddy});return false;}
    pickedRef.current.add(id);setPicked([...pickedRef.current]);playCareSound('bubble',props.soundEnabled);
    if(pickedRef.current.size===fruits.length)finish('바구니에 과일이 한가득! 우리 함께 나눠 먹자!');
    else speakText(`${fruit.name}, 쏙! 맛있겠네!`,props.soundEnabled,{characterId:props.buddy});
    return true;
  };
  return <DevelopmentShell {...props} title="톡! 쏙! 과일 수확" guide={GUIDE} className="harvest-play"><DragMatch canDrop={(id, target) => fruits.find(fruit => fruit.key === id)?.id === target} juicy resetKey={round} disabled={completed} onDrop={drop} hint={hint?{pieceId:hint.key,targetId:hint.id}:undefined}>
    <div className="discovery-scene harvest-scene"><LandscapeArt orchard />{fruits.map((fruit,i)=><DragPiece key={fruit.key} id={fruit.key} label={fruit.name} disabled={picked.includes(fruit.key)} className={`harvest-fruit ${picked.includes(fruit.key)?'fruit-picked':''}`} style={{left:`${[23,48,74,31,57,78][i]}%`,top:`${[25,18,27,51,48,55][i]}%`,'--sway-delay':`${i*-.47}s`} as React.CSSProperties}><span className="fruit-stem" /><ToyArtwork emoji={fruit.emoji}/></DragPiece>)}</div>
    <div className="harvest-baskets">{FRUITS.map(fruit=>{const count=fruits.filter(f=>f.id===fruit.id&&picked.includes(f.key)).length;return <DropSlot key={fruit.id} id={fruit.id} label={`${fruit.name} 바구니`} className="harvest-basket" filled={fruits.filter(f=>f.id===fruit.id).every(f=>picked.includes(f.key))}><motion.span key={`${round}-${count}`} className="basket-weight" animate={count?{scaleY:[1,.83,1.07,1],scaleX:[1,1.08,.96,1]}:undefined} transition={{duration:.5}}><BasketArt color={fruit.color}/><span className="basket-fruit-picture"><ToyArtwork emoji={fruit.emoji}/></span>{count>0&&<span className="harvest-inside">{Array.from({length:count},(_,i)=><ToyArtwork key={i} emoji={fruit.emoji}/>)}</span>}</motion.span></DropSlot>;})}</div>
  </DragMatch>{completed?<DiscoveryNext onNext={()=>{pickedRef.current.clear();setPicked([]);next();}}/>:<DiscoveryHint>같은 과일 바구니로 쏙!</DiscoveryHint>}</DevelopmentShell>;
}
