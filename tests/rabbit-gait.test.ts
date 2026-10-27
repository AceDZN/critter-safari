import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const data=JSON.parse(readFileSync(new URL('../public/models/rabbit-gaits.json',import.meta.url),'utf8')) as {
 sourceSHA256:string;
 gaits:Array<{name:string;nominalSpeed:number;clip:{duration:number;tracks:Array<{type:string;times:number[];values:number[]}>}}>;
};
test('the authored rabbit motion belongs to the exact acquired weighted model',()=>{
 const hash=createHash('sha256').update(readFileSync(new URL('../public/models/rabbit.glb',import.meta.url))).digest('hex');
 assert.equal(data.sourceSHA256,hash);
 assert.equal(data.gaits.length,2);
 assert.ok(data.gaits.some(g=>/walk/.test(g.name))&&data.gaits.some(g=>/trot/.test(g.name)));
});
test('both rabbit cycles have normalized rotations and a continuous loop seam',()=>{
 for(const gait of data.gaits){
  assert.ok(gait.clip.duration>0&&gait.nominalSpeed>0);
  for(const track of gait.clip.tracks){
   assert.equal(track.times[0],0);
   assert.ok(Math.abs(track.times.at(-1)!-gait.clip.duration)<1e-6);
   for(let i=1;i<track.times.length;i++)assert.ok(track.times[i]>track.times[i-1]);
   if(track.type==='quaternion'){
    assert.equal(track.values.length,track.times.length*4);
    for(let i=0;i<track.values.length;i+=4)assert.ok(Math.abs(Math.hypot(...track.values.slice(i,i+4))-1)<1e-4);
    const first=track.values.slice(0,4),last=track.values.slice(-4);
    assert.ok(Math.abs(first.reduce((sum,v,i)=>sum+v*last[i],0))>1-1e-6,`${gait.name} must not snap when looping`);
   }else{
    const components=track.values.length/track.times.length;
    for(let i=0;i<components;i++)assert.ok(Math.abs(track.values[i]-track.values[track.values.length-components+i])<1e-5);
   }
  }
 }
});
