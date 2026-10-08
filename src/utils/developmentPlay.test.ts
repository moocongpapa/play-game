import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceTrace, createTracePath } from './pathTracing';
import { createSensoryPaint, MAX_PAINT_PARTICLES } from './sensoryPaint';
import { GAME_CATALOG, availableGameIds } from '../data/gameCatalog';

test('all eight developmental activities are discoverable in the toddler menu',()=>{
  const ids=['path_tracing','fruit_harvest','symmetry_puzzle','size_ordering','day_night_weather','goodnight_sleep','emotion_face','sensory_paint'] as const;
  for(const id of ids){assert.ok(availableGameIds('sprout').includes(id));assert.ok(GAME_CATALOG[id].category);}
});
test('tracing accepts a continuous finger stroke with small deviations on every route',()=>{
  for(let variant=0;variant<3;variant++){
    const path=createTracePath(variant);let progress=0;let previous=path[0];
    for(let i=1;i<path.length;i++){const point={x:path[i].x+5,y:path[i].y-6};progress=advanceTrace(path,progress,previous,point);previous=point;}
    assert.ok(progress>=path.length-2);
  }
});
test('touching the finish or jumping across a bend cannot complete an untraced route',()=>{
  for(let variant=0;variant<3;variant++){
    const path=createTracePath(variant),end=path.at(-1)!;
    let progress=advanceTrace(path,0,path[0],end);
    for(let i=0;i<20;i++)progress=advanceTrace(path,progress,end,end);
    assert.ok(progress<path.length-10);
    assert.equal(advanceTrace(path,0,{x:-300,y:-300},{x:-350,y:-300}),0);
  }
});
test('multitouch paint is bounded, finite, resizable, and drains after fingers leave',()=>{
  const pool=createSensoryPaint(()=>.5);pool.resize(390,460);
  for(let frame=0;frame<150;frame++){for(let finger=0;finger<5;finger++)pool.pour(40+finger*65,frame*2,4,3,210,frame%2?'water':'sand');pool.step(1/60);}
  assert.ok(pool.particles.length<=MAX_PAINT_PARTICLES);
  pool.resize(768,650);
  assert.ok(pool.particles.every(p=>[p.x,p.y,p.vx,p.vy].every(Number.isFinite)));
  for(let i=0;i<180;i++)pool.step(.05);
  assert.equal(pool.particles.length,0);
  pool.pour(NaN,20,0,0,210,'water');assert.equal(pool.particles.length,0);
  pool.pour(20,20,0,0,210,'sand');pool.clear();assert.equal(pool.particles.length,0);
});
test('star sand bounces inside the floor; a resumed frame cannot simulate a huge time jump',()=>{
  const pool=createSensoryPaint(()=>.5);pool.resize(300,200);pool.pour(150,195,0,50,38,'sand');
  pool.step(60);assert.ok(pool.particles.every(p=>p.age===.05&&p.y<=200));
  for(let i=0;i<50;i++)pool.step(.033);
  assert.ok(pool.particles.every(p=>p.y<=200&&p.x>=0&&p.x<=300));
});
