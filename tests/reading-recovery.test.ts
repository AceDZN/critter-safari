import test from 'node:test';
import assert from 'node:assert/strict';
import {SafariSimulation} from '../src/simulation';
test('reading or settings during capture preserves the held animal and returns to the recovery action',()=>{
 const sim=new SafariSimulation();
 assert.equal(sim.place({x:0,z:0}),true);
 assert.equal(sim.toss({x:0,z:0},'berry'),true);
 for(let i=0;i<600&&sim.mode==='playing';i++)sim.update(1/60);
 assert.equal(sim.mode,'caught');assert.equal(sim.captureId,'pip');assert.equal(sim.correct,false);
 const before=JSON.stringify(sim.actors);
 for(const panel of ['notes','help','paused'] as const){sim.open(panel);sim.update(.05);assert.equal(sim.mode,panel);assert.equal(JSON.stringify(sim.actors),before);assert.equal(sim.captureId,'pip')}
 sim.resume();assert.equal(sim.mode,'caught');assert.equal(sim.attempts,1);
 sim.release();assert.equal(sim.mode,'playing');assert.equal(sim.trap,null);assert.equal(sim.captureId,null);
});
