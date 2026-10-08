import { useRef } from 'react';
import { Heart } from 'lucide-react';
import { DragMatch, DragPiece, DropSlot } from '../../components/DragMatch';
import { DevelopmentShell, DiscoveryHint, DiscoveryNext, useDevelopmentRound } from '../../components/development/DevelopmentShell';
import { WingArt, LandscapeArt } from '../../components/development/DevelopmentArt';
import { playBouncyBoing, speakText } from '../../utils/soundEngine';
import type { ToddlerGameProps } from '../../hooks/useToddlerPlay';
const GUIDE='한쪽 날개가 비었네? 같은 무늬의 날개를 잡아서 쏙 붙여 줘!';
export function SymmetryPuzzleGame(props:ToddlerGameProps){
  const {round,completed,finish,next}=useDevelopmentRound(props,GUIDE); const placed=useRef(false);
  const pattern=round%6;const choices=[0,1,2].map(i=>Math.floor(pattern/3)*3+(pattern+round+i+1)%3);
  const drop=(id:string)=>{if(placed.current)return false;if(Number(id)!==pattern){playBouncyBoing(props.soundEnabled);speakText('왼쪽 날개의 무늬도 살펴봐!',props.soundEnabled,{characterId:props.buddy});return false;}placed.current=true;finish('날개가 꼭 닮았네! 팔랑팔랑, 고마워!');return true;};
  return <DevelopmentShell {...props} title="반쪽 날개, 쏙!" guide={GUIDE} className="symmetry-play"><DragMatch canDrop={id => id === String(pattern)} juicy resetKey={round} disabled={completed} onDrop={drop} hint={{pieceId:String(pattern),targetId:'wing'}}>
    <div className="discovery-scene symmetry-scene"><LandscapeArt/><div className={`symmetry-friend ${completed?'wing-flight':''}`}><div className="symmetry-left"><WingArt pattern={pattern} side="left"/></div><DropSlot id="wing" label="오른쪽 날개" className="symmetry-right" filled={completed}><WingArt pattern={pattern} silhouette={!completed}/></DropSlot><span className="butterfly-body"><i/><i/><b>⌣</b></span>{completed&&<><span className="snap-ring"/><div className="wing-hearts">{[0,1,2].map(i=><Heart key={i} fill="currentColor" style={{'--i':i} as React.CSSProperties}/>)}</div></>}</div></div>
    <div className="wing-choices" aria-label="날개 조각">{choices.map(p=><DragPiece key={p} id={String(p)} label={`${['동그라미','하트','별'][p%3]} 무늬 날개`} className="wing-choice"><WingArt pattern={p}/></DragPiece>)}</div>
  </DragMatch>{completed?<DiscoveryNext onNext={()=>{placed.current=false;next();}}/>:<DiscoveryHint>무늬가 꼭 닮은 날개를 찾아요</DiscoveryHint>}</DevelopmentShell>;
}
