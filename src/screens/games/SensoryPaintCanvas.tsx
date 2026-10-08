import { useEffect, useRef, useState } from 'react';
import { Droplets, Eraser, Sparkles, Check, Rainbow, Hand } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { DevelopmentShell, DiscoveryHint, useDevelopmentRound } from '../../components/development/DevelopmentShell';
import { createSensoryPaint, type SensoryMode } from '../../utils/sensoryPaint';
import { playCareSound } from '../../utils/soundEngine';
import type { ToddlerGameProps } from '../../hooks/useToddlerPlay';
const GUIDE='손가락으로 쓱쓱! 물감이 몽실몽실 퍼져. 반짝이 모래도 내려 볼까?';
const COLORS=[-1,335,38,155,210,275];
export function SensoryPaintCanvas(props:ToddlerGameProps){
  useDevelopmentRound(props,GUIDE,true);const [mode,setMode]=useState<SensoryMode>('water'),[hue,setHue]=useState(-1);const [painted,setPainted]=useState(false);const reduced=useReducedMotion();
  const canvas=useRef<HTMLCanvasElement>(null);const clear=useRef(()=>{});
  const settings=useRef({mode,hue,sound:props.soundEnabled,reduced});settings.current={mode,hue,sound:props.soundEnabled,reduced};
  const complete=useRef(props.onCompleteQuiz);complete.current=props.onCompleteQuiz;
  useEffect(()=>{
    const node=canvas.current!,ctx=node.getContext('2d');if(!ctx)return;
    const pool=createSensoryPaint();
    const pointers=new Map<number,{x:number;y:number;at:number}>();let width=1,height=1,frame=0,last=0,lastSound=-Infinity,strokes=0,awarded=false;
    const sprites=COLORS.slice(1).map(color=>{const sprite=document.createElement('canvas');sprite.width=sprite.height=80;const c=sprite.getContext('2d')!;const gradient=c.createRadialGradient(40,40,0,40,40,40);gradient.addColorStop(0,`hsla(${color},95%,80%,.8)`);gradient.addColorStop(.45,`hsla(${color},85%,68%,.35)`);gradient.addColorStop(1,`hsla(${color},85%,68%,0)`);c.fillStyle=gradient;c.fillRect(0,0,80,80);return sprite;});
    const draw=(now:number)=>{frame=0;if(settings.current.reduced){for(const p of pool.particles)p.age=Math.max(.08,p.age);}else pool.step(last?Math.min(.05,(now-last)/1000):0);last=now;ctx.clearRect(0,0,width,height);ctx.globalCompositeOperation='lighter';
      for(const p of pool.particles){ctx.globalAlpha=Math.min(1,p.age/.08)*(1-p.age/p.life)*(settings.current.reduced ? .55 : 1);if(p.mode==='water'){const color=COLORS.slice(1).indexOf(p.hue);ctx.drawImage(sprites[Math.max(0,color)],p.x-p.size,p.y-p.size,p.size*2,p.size*2);}else{ctx.fillStyle=`hsl(${p.hue} 85% 78%)`;ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?p.size*.35:p.size;const x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();}}
      ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';if(pool.particles.length&&!document.hidden&&!settings.current.reduced)frame=requestAnimationFrame(draw);
    };
    const start=()=>{if(!frame&&!document.hidden){last=performance.now();frame=requestAnimationFrame(draw);}};
    const cancel=()=>{for(const id of pointers.keys())if(node.hasPointerCapture(id))node.releasePointerCapture(id);pointers.clear();cancelAnimationFrame(frame);frame=0;};
    const size=()=>{cancel();const r=node.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);width=r.width;height=r.height;node.width=Math.round(width*dpr);node.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);pool.resize(width,height);start();};
    const locate=(e:PointerEvent)=>{const r=node.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
    const pour=(x:number,y:number,dx=0,dy=0)=>{const s=settings.current;const color=s.hue<0?COLORS[1+Math.floor((performance.now()/170)%5)]:s.hue;pool.pour(x,y,dx,dy,color,s.mode);start();if(performance.now()-lastSound>190){playCareSound('bubble',s.sound);lastSound=performance.now();}};
    const down=(e:PointerEvent)=>{if(e.button!==0||pointers.size>=5)return;setPainted(true);const p=locate(e);pointers.set(e.pointerId,{...p,at:e.timeStamp});node.setPointerCapture(e.pointerId);pour(p.x,p.y);strokes++;if(strokes>=8&&!awarded){awarded=true;complete.current(1);}};
    const move=(e:PointerEvent)=>{const from=pointers.get(e.pointerId);if(!from||e.timeStamp-from.at<16)return;const p=locate(e);const dx=p.x-from.x,dy=p.y-from.y,steps=Math.min(10,Math.max(1,Math.ceil(Math.hypot(dx,dy)/9)));for(let i=1;i<=steps;i++)pour(from.x+dx*i/steps,from.y+dy*i/steps,dx/steps,dy/steps);pointers.set(e.pointerId,{...p,at:e.timeStamp});};
    const up=(e:PointerEvent)=>{pointers.delete(e.pointerId);if(node.hasPointerCapture(e.pointerId))node.releasePointerCapture(e.pointerId);};
    const visibility=()=>{if(document.hidden)cancel();else start();};
    const keyboard=(e:KeyboardEvent)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setPainted(true);pour(width*(.25+Math.random()*.5),height*.35,20,0);}};
    clear.current=()=>{pool.clear();ctx.clearRect(0,0,width,height);};
    const observer=new ResizeObserver(size);observer.observe(node);size();
    node.addEventListener('pointerdown',down);node.addEventListener('pointermove',move);node.addEventListener('pointerup',up);node.addEventListener('pointercancel',up);node.addEventListener('lostpointercapture',up);node.addEventListener('keydown',keyboard);window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',visibility);
    return()=>{cancel();pool.clear();observer.disconnect();node.removeEventListener('pointerdown',down);node.removeEventListener('pointermove',move);node.removeEventListener('pointerup',up);node.removeEventListener('pointercancel',up);node.removeEventListener('lostpointercapture',up);node.removeEventListener('keydown',keyboard);window.removeEventListener('blur',cancel);document.removeEventListener('visibilitychange',visibility);clear.current=()=>{};};
  },[]);
  return <DevelopmentShell {...props} title="몽실몽실 마법 물감" guide={GUIDE} className="sensory-play"><div className="sensory-tools"><button aria-label="무지개 물감" aria-pressed={mode==='water'} onClick={()=>setMode('water')}><Droplets/><span>물감</span></button><button aria-label="별가루 모래" aria-pressed={mode==='sand'} onClick={()=>setMode('sand')}><Sparkles/><span>모래</span></button><button aria-label="그림 지우기" onClick={()=>clear.current()}><Eraser/></button></div><div className="sensory-pool"><canvas ref={canvas} data-juice-surface tabIndex={0} role="application" aria-label="마법 물감 놀이판" aria-description="한 손가락 또는 여러 손가락으로 문질러요. Enter나 Space로도 물감을 뿌릴 수 있어요."/>{!painted&&<span className="sensory-drag-guide" aria-hidden="true"><Hand/><i/><i/><i/></span>}<span className="sensory-watermark" aria-hidden="true"><Sparkles/></span></div><div className="sensory-palette" aria-label="물감 색상">{COLORS.map((color,i)=><button key={color} aria-label={['무지개색','분홍색','노란색','초록색','파란색','보라색'][i]} aria-pressed={hue===color} style={{'--paint':color<0?'conic-gradient(#efa8c5,#f0d385,#9bd6bd,#96cce8,#c3a5dc,#efa8c5)':`hsl(${color} 65% 75%)`} as React.CSSProperties} onClick={()=>setHue(color)}>{color<0?<Rainbow/>:hue===color?<Check/>:<span/>}</button>)}</div><DiscoveryHint>쓱쓱 문질러 마음껏 그려요</DiscoveryHint></DevelopmentShell>;
}
