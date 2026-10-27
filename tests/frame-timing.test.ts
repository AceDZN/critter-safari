import test from 'node:test';
import assert from 'node:assert/strict';
import {SafariSimulation,distance} from '../src/simulation';

test('slow rendered frames preserve wall-clock simulation time instead of running in slow motion',()=>{
 const slow=new SafariSimulation(),fast=new SafariSimulation();
 for(let i=0;i<120;i++)slow.advance(.1); // 10 rendered frames per second for 12 seconds.
 for(let i=0;i<720;i++)fast.update(1/60);
 assert.ok(Math.abs(slow.time-12)<1e-8);
 assert.ok(Math.abs(fast.time-slow.time)<1e-8);
 for(let i=0;i<slow.actors.length;i++){
  assert.ok(Math.abs(slow.actors[i].x-fast.actors[i].x)<1e-8);
  assert.ok(Math.abs(slow.actors[i].z-fast.actors[i].z)<1e-8);
 }
 slow.open('paused');const before=slow.time;slow.advance(2);assert.equal(slow.time,before);
});

test('unbaited patrols keep taking full walking legs after thirty seconds',()=>{
 const sim=new SafariSimulation();
 const travelled=sim.actors.map(()=>0);
 const moving=sim.actors.map(()=>0);
 for(let frame=0;frame<1800;frame++){
  const before=sim.actors.map(a=>({x:a.x,z:a.z}));sim.update(1/60);
  if(frame>=1500)sim.actors.forEach((a,i)=>{
   const d=distance(a,before[i]);travelled[i]+=d;if(d>.00001)moving[i]++;
  });
 }
 sim.actors.forEach((a,i)=>{
  assert.ok(travelled[i]/5 > a.spec.usualSpeed*.85,`${a.spec.name} keeps its individual pace, instead of converging to0.2`);
  assert.ok(moving[i]/300 > .85,`${a.spec.name} walks continuously rather than freezing its gait between tiny steps`);
 });
});
