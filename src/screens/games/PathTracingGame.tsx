import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Flag, Star } from 'lucide-react';
import { CharacterAvatar } from '../../components/CharacterAvatar';
import { DevelopmentShell, DiscoveryHint, DiscoveryNext, useDevelopmentRound } from '../../components/development/DevelopmentShell';
import { LandscapeArt } from '../../components/development/DevelopmentArt';
import { advanceTrace, createTracePath, type TracePoint } from '../../utils/pathTracing';
import { playCareSound } from '../../utils/soundEngine';
import type { ToddlerGameProps } from '../../hooks/useToddlerPlay';
import { JUICE_SPRING } from '../../utils/juice';
const GUIDE='친구의 별을 잡고 반짝이는 길을 따라 쭉 가 볼까?';
export function PathTracingGame(props: ToddlerGameProps) {
  const {round,completed,finish,next}=useDevelopmentRound(props,GUIDE);
  const path=useMemo(()=>createTracePath(round),[round]);
  const [step,setStep]=useState(0); const progress=useRef(0);
  const field=useRef<HTMLDivElement>(null); const canvas=useRef<HTMLCanvasElement>(null);
  const drag=useRef<{id:number;last:TracePoint;node:HTMLButtonElement}|null>(null);
  const lastSound=useRef(0); const reduced=useReducedMotion();
  const cancel=()=>{const d=drag.current;drag.current=null;if(d?.node.hasPointerCapture(d.id))d.node.releasePointerCapture(d.id);};
  useEffect(()=>{const hide=()=>{if(document.hidden)cancel();};window.addEventListener('blur',cancel);window.addEventListener('resize',cancel);document.addEventListener('visibilitychange',hide);return()=>{cancel();window.removeEventListener('blur',cancel);window.removeEventListener('resize',cancel);document.removeEventListener('visibilitychange',hide);};},[]);
  useEffect(()=>{
    const node=canvas.current!,ctx=node.getContext('2d'); if(!ctx)return;
    const draw=()=>{const rect=node.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);node.width=rect.width*dpr;node.height=rect.height*dpr;ctx.setTransform(node.width/600,0,0,node.height/400,0,0);ctx.lineWidth=21;ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowBlur=reduced?0:13;
      for(let i=1;i<=step;i++){ctx.strokeStyle=`hsl(${i*3.5+round*35} 80% 72%)`;ctx.shadowColor=ctx.strokeStyle;ctx.beginPath();ctx.moveTo(path[i-1].x,path[i-1].y);ctx.lineTo(path[i].x,path[i].y);ctx.stroke();}
    };draw();const observer=new ResizeObserver(draw);observer.observe(node);return()=>observer.disconnect();
  },[step,path,round,reduced]);
  const update=(value:number)=>{if(completed||value<=progress.current)return;progress.current=value;setStep(value);if(performance.now()-lastSound.current>220){playCareSound('bubble',props.soundEnabled);lastSound.current=performance.now();}if(value>=path.length-2)finish(`${props.childName}야, 끝까지 도착했어! 반짝이는 길을 만들었네!`);};
  const point=(x:number,y:number)=>{const r=field.current!.getBoundingClientRect();return{x:(x-r.left)/r.width*600,y:(y-r.top)/r.height*400};};
  return <DevelopmentShell {...props} title="씽씽! 별빛 길" guide={GUIDE} className="tracing-play">
    <div ref={field} className="discovery-scene trace-scene"><LandscapeArt /><svg viewBox="0 0 600 400" preserveAspectRatio="none" className="trace-road" aria-hidden="true"><polyline points={path.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke="#bdab98" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round"/><polyline points={path.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke="#fff0ce" strokeWidth="39" strokeLinecap="round" strokeLinejoin="round"/><polyline points={path.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke="#d2bc97" strokeWidth="3" strokeDasharray="2 16" strokeLinecap="round" /></svg>
      <canvas ref={canvas} className="trace-light" aria-hidden="true" />
      <span className={`trace-goal ${completed?'is-waving':''}`} style={{left:`${path.at(-1)!.x/6}%`,top:`${path.at(-1)!.y/4}%`}}><Flag fill="#e6b48b" /></span>
      <motion.button className={`trace-rider ${completed?'trace-finished':''}`} aria-label="별 길 따라가기" aria-description="별을 잡아 길을 따라 움직여요. 키보드 방향키로도 이동할 수 있어요." style={{left:`${path[step].x/6}%`,top:`${path[step].y/4}%`}} whileTap={reduced?undefined:{scale:1.1}} transition={JUICE_SPRING}
        onPointerDown={e=>{if(completed||!e.isPrimary||e.button!==0)return;drag.current={id:e.pointerId,last:point(e.clientX,e.clientY),node:e.currentTarget};e.currentTarget.setPointerCapture(e.pointerId);}}
        onPointerMove={e=>{const d=drag.current;if(!d||d.id!==e.pointerId)return;const p=point(e.clientX,e.clientY);update(advanceTrace(path,progress.current,d.last,p));d.last=p;}}
        onPointerUp={cancel} onPointerCancel={cancel} onLostPointerCapture={cancel} onKeyDown={e=>{if(['ArrowRight','ArrowUp',' '].includes(e.key)){e.preventDefault();update(Math.min(path.length-1,progress.current+5));}}}>
        <CharacterAvatar id={props.buddy} size="sm" mood="still" /><Star fill="#ffe89e" />
      </motion.button>
      <div className="trace-dots" role="progressbar" aria-label="길 따라가기 진행" aria-valuenow={step} aria-valuemin={0} aria-valuemax={path.length-1}>{[0,1,2,3,4].map(i=><Star key={i} fill={step/(path.length-1)>=i/4?'#efcb70':'#fff5df'} />)}</div>
    </div>
    {completed?<DiscoveryNext onNext={()=>{progress.current=0;setStep(0);next();}} />:<DiscoveryHint>별을 잡고 길 따라 쭉~</DiscoveryHint>}
  </DevelopmentShell>;
}
