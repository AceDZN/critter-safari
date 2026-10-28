import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=process.env.CRITTER_HEADING_OUT||'work/heading/browser';
const base=process.env.CRITTER_HEADING_URL||'http://localhost:4232/?level=4';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:false,args:['--mute-audio'],executablePath:process.env.CRITTER_BROWSER_PATH});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,recordVideo:{dir:`${out}/video`,size:{width:1440,height:900}}});
const page=await context.newPage(),errors=[],httpErrors=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()})});
let frame;
const state=async()=>JSON.parse(await frame.evaluate(()=>window.render_game_to_text()));
async function monitor(duration){return frame.evaluate(duration=>new Promise(resolve=>{
 const last=new Map(),result={frames:0,moving:0,minBodyDot:1,minHeadingDot:1,backward:0,sideways:0,worst:null,modes:{}};const start=performance.now();
 function sample(){
  const s=JSON.parse(window.render_game_to_text());result.frames++;
  for(const r of s.art.rigs){
   if(!r.bodyForward)continue;
   const previous=last.get(r.id),actor=s.creatures.find(a=>a.id===r.id);last.set(r.id,r.position);
   if(!previous||actor.mode==='caught'||actor.mode==='rescued'||s.mode!=='playing'||s.planning)continue;
   const dx=r.position.x-previous.x,dz=r.position.z-previous.z,d=Math.hypot(dx,dz);if(d<.0001)continue;
   const bodyDot=(r.bodyForward.x*dx+r.bodyForward.z*dz)/d,headingDot=(Math.sin(r.headingYaw)*dx+Math.cos(r.headingYaw)*dz)/d;
   result.moving++;result.modes[actor.mode]=(result.modes[actor.mode]||0)+1;if(bodyDot<result.minBodyDot){result.minBodyDot=bodyDot;result.worst={id:r.id,mode:actor.mode,bodyDot,headingDot,dx,dz,headingYaw:r.headingYaw,modelYaw:r.modelYaw}};
   result.minHeadingDot=Math.min(result.minHeadingDot,headingDot);if(bodyDot<0)result.backward++;if(bodyDot<Math.SQRT1_2)result.sideways++;
  }
  if(performance.now()-start>=duration)resolve(result);else requestAnimationFrame(sample);
 }requestAnimationFrame(sample);
}),duration)}
try{
 console.log('Opening actual game:',base);await page.goto(base);frame=page.frames().find(f=>f.url().includes('/play/critter-safari/'))||page.mainFrame();
 await frame.waitForFunction(()=>typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:120000});await frame.evaluate(()=>document.fonts.ready);
 if((await state()).mode==='paused')await frame.locator('#resume-btn').click();
 const patrolVariant=(await state()).variant;await page.screenshot({path:`${out}/01-patrol.png`});console.log('Sampling ordinary requestAnimationFrame patrol, without advanceTime');
 const patrolPromise=monitor(16000);
 for(let i=0;i<3;i++){await new Promise(r=>setTimeout(r,4000));await page.screenshot({path:`${out}/0${i+2}-patrol.png`})}
 const patrol=await patrolPromise;assert.ok(patrol.moving>60,JSON.stringify(patrol));assert.ok(patrol.minBodyDot>.98,JSON.stringify(patrol));assert.ok(patrol.minHeadingDot>.9999,JSON.stringify(patrol));assert.equal(patrol.backward,0);assert.equal(patrol.sideways,0);
 const tool=await frame.locator('#leaf-tool').boundingBox();await page.mouse.click(tool.x+tool.width/2,tool.y+tool.height/2);
 const canvas=await frame.locator('#game').boundingBox(),p=await frame.evaluate(()=>window.worldToScreen({x:0,z:1.5}));await page.mouse.click(canvas.x+p.x,canvas.y+p.y);
 assert.ok((await state()).events.some(e=>e.type==='bait'));console.log('Sampling real-clock food approach');const approach=await monitor(6000);assert.ok(approach.moving>15);assert.ok(approach.modes.lured>0,JSON.stringify(approach));assert.ok(approach.minBodyDot>.98,JSON.stringify(approach));assert.ok(approach.minHeadingDot>.9999,JSON.stringify(approach));await page.screenshot({path:`${out}/05-lure.png`});
 await frame.locator('#pause-btn').click();const paused=await state();await new Promise(r=>setTimeout(r,400));const later=await state();assert.deepEqual(later.art.rigs.map(r=>[r.id,r.position,r.headingYaw]),paused.art.rigs.map(r=>[r.id,r.position,r.headingYaw]));await frame.locator('#resume-btn').click();
 await frame.evaluate(()=>window.advanceTime(0));const manual=await frame.evaluate(()=>{let prev=JSON.parse(window.render_game_to_text()),moving=0,minBodyDot=1;for(let i=0;i<120;i++){window.advanceTime(1000/60);const next=JSON.parse(window.render_game_to_text());for(const r of next.art.rigs){if(!r.bodyForward)continue;const old=prev.art.rigs.find(v=>v.id===r.id),dx=r.position.x-old.position.x,dz=r.position.z-old.position.z,d=Math.hypot(dx,dz);if(d>.0001){moving++;minBodyDot=Math.min(minBodyDot,(dx*r.bodyForward.x+dz*r.bodyForward.z)/d)}}prev=next}return{moving,minBodyDot}});assert.ok(manual.moving>40);assert.ok(manual.minBodyDot>.98,JSON.stringify(manual));

 // An actual deer capture centers the model in the trap. That teleport must not
 // be mistaken for a new travel direction on the first caught frame.
 await page.addInitScript(()=>{if(window===window.top&&document.querySelector('iframe'))return;const timer=setInterval(()=>{if(typeof window.advanceTime==='function'){window.advanceTime(0);clearInterval(timer)}},1)});
 const captureUrl=new URL(base);captureUrl.searchParams.set('level','3');await page.goto(captureUrl.href);
 frame=page.frames().find(f=>f.url().includes('/play/critter-safari/'))||page.mainFrame();await frame.waitForFunction(()=>typeof window.render_game_to_text==='function'&&JSON.parse(window.render_game_to_text()).ready,null,{timeout:120000});await frame.evaluate(()=>window.advanceTime(0));
 const captureInitial=await state();assert.equal(captureInitial.elapsedSeconds,0);
 const plans=JSON.parse(await fs.readFile('docs/verification/campaign-physical-plans.json','utf8')),plan=plans.find(p=>p.level===3&&p.variant===captureInitial.variant),stage=plan.stages[0];
 assert.equal(captureInitial.creatures.find(a=>a.id===stage.id).archetype,'deer');
 for(const action of stage.actions){await frame.locator(`#${action.tool}-tool`).click();const c=await frame.locator('#game').boundingBox(),p=await frame.evaluate(p=>window.worldToScreen(p),{x:action.point.x+.003,z:action.point.z+.003});await page.mouse.click(c.x+p.x,c.y+p.y);await frame.evaluate(()=>window.advanceTime(0))}
 let previous=await state(),caught;
 for(let i=0;i<1200;i++){await frame.evaluate(()=>window.advanceTime(1000/60));const next=await state();if(next.mode==='caught'){caught=next;break}previous=next}
 assert.ok(caught);assert.equal(caught.captureId,stage.id);assert.equal(caught.correct,true);
 const beforeHeading=previous.art.rigs.find(r=>r.id===stage.id).headingYaw,caughtRig=caught.art.rigs.find(r=>r.id===stage.id);assert.equal(caughtRig.headingYaw,beforeHeading,'First capture-centering frame keeps the last travel facing');
 await frame.evaluate(()=>window.advanceTime(1000));const held=(await state()).art.rigs.find(r=>r.id===stage.id);assert.equal(held.headingYaw,caughtRig.headingYaw);assert.equal(held.mixerTime,caughtRig.mixerTime);await page.screenshot({path:`${out}/06-deer-capture.png`});
 await frame.locator('#capture-btn').click();await frame.waitForFunction(()=>JSON.parse(window.render_game_to_text()).ready);await frame.evaluate(()=>window.advanceTime(1000/60));assert.equal((await state()).contract,4);
 const capture={level:3,id:stage.id,variant:captureInitial.variant,correct:true,firstCaptureHeadingPreserved:true,caughtGaitFrozen:true,nextLevel:4};
 assert.deepEqual(errors,[]);assert.deepEqual(httpErrors,[]);await fs.writeFile(`${out}/results.json`,JSON.stringify({url:base,variant:patrolVariant,patrol,approach,manual,capture,pausedPreserved:true,errors,httpErrors},null,2));console.log('Actual deer facing follows real-clock patrol, food approach, pause/resume and fixed-frame updates.');
}catch(e){await page.screenshot({path:`${out}/failure.png`}).catch(()=>{});await fs.writeFile(`${out}/failure.json`,JSON.stringify({state:await state().catch(()=>null),errors,httpErrors,error:String(e)},null,2));throw e}
finally{await browser.close()}
