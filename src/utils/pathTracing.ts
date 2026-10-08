export interface TracePoint { x: number; y: number }
export function createTracePath(variant: number): TracePoint[] {
  const controls: TracePoint[][] = [
    [{x:85,y:310},{x:55,y:50},{x:390,y:365},{x:510,y:85}],
    [{x:75,y:310},{x:140,y:90},{x:280,y:300},{x:390,y:95},{x:520,y:110}],
    [{x:75,y:285},{x:145,y:80},{x:310,y:80},{x:450,y:290},{x:520,y:125}],
  ];
  const p = controls[variant % controls.length];
  if (variant % 3 === 0) return Array.from({length:101},(_,i)=>{const t=i/100,s=1-t;return {x:s*s*s*p[0].x+3*s*s*t*p[1].x+3*s*t*t*p[2].x+t*t*t*p[3].x,y:s*s*s*p[0].y+3*s*s*t*p[1].y+3*s*t*t*p[2].y+t*t*t*p[3].y};});
  const result: TracePoint[] = [];
  for (let i=0;i<p.length-1;i++) for(let j=0;j<25;j++){const t=j/25;result.push({x:p[i].x+(p[i+1].x-p[i].x)*t,y:p[i].y+(p[i+1].y-p[i].y)*t});}
  result.push(p.at(-1)!); return result;
}
/** Only nearby, consecutive path samples can advance. A jump to the finish cannot skip a bend. */
export function advanceTrace(path: TracePoint[], progress: number, from: TracePoint, to: TracePoint, tolerance = 42): number {
  let next = progress;
  const steps = Math.min(180, Math.max(1, Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)/6)));
  for(let n=1;n<=steps;n++) {
    const finger={x:from.x+(to.x-from.x)*n/steps,y:from.y+(to.y-from.y)*n/steps};
    let nearest=next, distance=Infinity;
    for(let i=next;i<=Math.min(path.length-1,next+7);i++){const d=Math.hypot(path[i].x-finger.x,path[i].y-finger.y);if(d<distance){distance=d;nearest=i;}}
    if(distance<=tolerance) next=nearest;
  }
  return next;
}
