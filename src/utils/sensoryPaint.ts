export type SensoryMode = 'water' | 'sand';
export interface PaintParticle { x:number;y:number;vx:number;vy:number;age:number;life:number;size:number;hue:number;mode:SensoryMode }
export const MAX_PAINT_PARTICLES=650;
/** Bounded curl-flow advection for water; gravity, friction and floor bounce for star sand. */
export function createSensoryPaint(random=Math.random){
  const particles:PaintParticle[]=[];let width=1,height=1,time=0;
  return {particles,
    resize(w:number,h:number){const nextW=Math.max(1,w),nextH=Math.max(1,h);for(const p of particles){p.x=p.x/width*nextW;p.y=p.y/height*nextH;}width=nextW;height=nextH;},
    pour(x:number,y:number,dx:number,dy:number,hue:number,mode:SensoryMode){
      if(![x,y,dx,dy,hue].every(Number.isFinite))return;
      const count=mode==='sand'?12:7;
      if(particles.length+count>MAX_PAINT_PARTICLES)particles.splice(0,particles.length+count-MAX_PAINT_PARTICLES);
      for(let i=0;i<count;i++){const a=random()*Math.PI*2;particles.push({x:Math.max(0,Math.min(width,x+Math.cos(a)*5)),y:Math.max(0,Math.min(height,y+Math.sin(a)*5)),vx:Math.cos(a)*20+Math.max(-160,Math.min(160,dx*4)),vy:Math.sin(a)*20+Math.max(-160,Math.min(160,dy*4)),age:0,life:mode==='water'?2.3+random()*1.4:5+random()*2,size:mode==='water'?12+random()*15:2+random()*3,hue,mode});}
    },
    step(elapsed:number){const dt=Math.max(0,Math.min(.05,elapsed));time+=dt;for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.age+=dt;if(p.age>=p.life){particles.splice(i,1);continue;}
      if(p.mode==='water'){p.vx+=(Math.sin(p.y*.025+time)*22-p.vx*.7)*dt;p.vy+=(Math.cos(p.x*.022-time)*22-p.vy*.7)*dt;p.size+=dt*5;}
      else {p.vy+=160*dt;p.vx*=Math.exp(-dt*1.5);}
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(p.x<0||p.x>width){p.x=Math.max(0,Math.min(width,p.x));p.vx*=-.45;}
      if(p.y>height-p.size&&p.mode==='sand'){p.y=Math.max(0,height-p.size);p.vy=-Math.abs(p.vy)*.27;}
      if(p.y<0){p.y=0;p.vy=Math.abs(p.vy);}
    }},
    clear(){particles.length=0;},
  };
}
