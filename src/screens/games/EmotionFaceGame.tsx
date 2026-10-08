import { useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import { CareFriend } from '../../components/ToddlerPlay';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { DevelopmentShell, DiscoveryHint, useDevelopmentRound } from '../../components/development/DevelopmentShell';
import { FaceEyes, FaceMouth, type EyePart, type MouthPart } from '../../components/development/DevelopmentArt';
import { playCareSound, speakText } from '../../utils/soundEngine';
import { emitJuice } from '../../utils/juice';
import type { ToddlerGameProps } from '../../hooks/useToddlerPlay';
const GUIDE='눈과 입을 골라 친구의 마음 얼굴을 만들어 봐. 어떤 마음이든 괜찮아!';
const EYES:EyePart[]=['smile','sparkle','tear','wide'], MOUTHS:MouthPart[]=['smile','laugh','sad','wow'];
const EYE_NAMES=['웃는 눈','반짝이는 눈','눈물 맺힌 눈','동그란 눈'], MOUTH_NAMES=['미소 짓는 입','활짝 웃는 입','삐죽한 입','놀란 입'];
export function EmotionFaceGame(props:ToddlerGameProps){
  useDevelopmentRound(props,GUIDE,true);
  const [eyes,setEyes]=useState<EyePart|null>(null),[mouth,setMouth]=useState<MouthPart|null>(null),[reaction,setReaction]=useState(0);
  const explored=useRef(new Set<string>());const face=useRef<{eyes:EyePart|null;mouth:MouthPart|null}>({eyes:null,mouth:null});
  const emotion=eyes==='tear'||mouth==='sad'?'sad':mouth==='wow'||eyes==='wide'?'surprise':mouth==='laugh'?'excited':'happy';
  const choose=(part:'eyes'|'mouth',value:EyePart|MouthPart)=>{
    if(part==='eyes'){setEyes(value as EyePart);face.current.eyes=value as EyePart;}else{setMouth(value as MouthPart);face.current.mouth=value as MouthPart;}
    playCareSound('bubble',props.soundEnabled);const e=face.current.eyes,m=face.current.mouth;if(!e||!m)return;
    setReaction(n=>n+1);emitJuice({kind:'snap'});
    const key=`${e}-${m}`;if(!explored.current.has(key)){explored.current.add(key);props.onCompleteQuiz(1);}
    const text=e==='tear'&&['smile','laugh'].includes(m)?'울다가 웃을 수도 있어. 어떤 마음이든 괜찮아!':e==='tear'||m==='sad'?'슬픈 마음도 괜찮아. 내가 옆에 있어 줄게.':m==='wow'||e==='wide'?'우와! 깜짝 놀랐어!':m==='laugh'?'까르르! 난 지금 정말 신나! 같이 웃자!':'방긋! 너랑 함께라서 기뻐!';
    speakText(text,props.soundEnabled,{characterId:props.buddy});
  };
  return <DevelopmentShell {...props} title="나의 마음 거울" guide={GUIDE} className="face-play"><div className="emotion-mirror"><div key={reaction} className={`emotion-portrait emotion-${emotion} ${eyes&&mouth?'face-reacts':''}`}><CareFriend buddy={props.buddy} mouth="rest" hideExpression><FaceEyes kind={eyes||'smile'}/><FaceMouth kind={mouth||'smile'}/></CareFriend>{eyes&&mouth&&emotion==='sad'&&<span className="comfort-tissue" aria-hidden="true"><i/></span>}{eyes&&mouth&&<Heart className="mirror-heart" fill="currentColor"/>}</div><span className="mirror-companion"><CharacterAvatar id={props.buddy} size="sm" mood={emotion==='sad'?'waving':emotion==='excited'?'dancing':'happy'}/></span></div>
    <div className="face-parts" aria-label="눈 모양 고르기">{EYES.map((e,i)=><button key={e} aria-label={EYE_NAMES[i]} aria-pressed={eyes===e} onClick={()=>choose('eyes',e)}><svg viewBox="74 84 153 63" aria-hidden="true"><FaceEyes kind={e}/></svg></button>)}</div>
    <div className="face-parts" aria-label="입 모양 고르기">{MOUTHS.map((m,i)=><button key={m} aria-label={MOUTH_NAMES[i]} aria-pressed={mouth===m} onClick={()=>choose('mouth',m)}><svg viewBox="100 143 100 65" aria-hidden="true"><FaceMouth kind={m}/></svg></button>)}</div>
    <DiscoveryHint>눈도 콕! 입도 콕! 어떤 마음일까?</DiscoveryHint>
  </DevelopmentShell>;
}
