import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const out=process.env.CRITTER_CAMPAIGN_OUT||'work/campaign/browser';await fs.mkdir(out,{recursive:true});
const plans=JSON.parse(await fs.readFile('docs/verification/campaign-physical-plans.json','utf8'));
const buildHash=createHash('sha256').update(await fs.readFile('dist/index.html')).digest('hex');
const dist=path.resolve('dist'),prefix='/play/critter-safari/campaign/';
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.glb':'model/gltf-binary','.mp3':'audio/mpeg','.ttf':'font/ttf','.svg':'image/svg+xml','.txt':'text/plain'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/'){res.setHeader('Content-Type','text/html');res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><style>body{margin:0}header{height:44px;background:#172b21;color:#f7efd9;font:14px/44px Arial;padding-inline:16px}iframe{display:block;border:0;width:100vw;height:calc(100svh - 44px)}</style><header>Workbook · Critter Safari · campaign verification</header><script>window.messages=[];addEventListener('message',e=>{if(e.origin===location.origin&&e.source===document.querySelector('iframe')?.contentWindow)messages.push(e.data)})</script><iframe title="Critter Safari" allow="fullscreen; autoplay" src="${prefix}index.html${url.search}"></iframe>`);return;}
 if(!url.pathname.startsWith(prefix)){res.writeHead(404);res.end();return;}
 const file=path.resolve(dist,decodeURIComponent(url.pathname.slice(prefix.length)));
 if(!file.startsWith(dist+path.sep)){res.writeHead(404);res.end();return;}
 try{res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file))}catch{res.writeHead(404);res.end()}
});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:process.env.CRITTER_HEADLESS==='1',args:['--mute-audio'],...(process.env.CRITTER_BROWSER_PATH?{executablePath:process.env.CRITTER_BROWSER_PATH}:{})});
const errors=[],httpErrors=[],checks=[];
function observe(page){page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)httpErrors.push({status:r.status(),url:r.url()})})}
const context=await browser.newContext({viewport:{width:1672,height:985},deviceScaleFactor:1});await context.addInitScript(()=>{if(window===window.top)return;const t=setInterval(()=>{if(typeof window.advanceTime==='function'){window.advanceTime(0);clearInterval(t)}},1)});const page=await context.newPage();observe(page);
let frame;
const state=async()=>JSON.parse(await frame.evaluate(()=>window.render_game_to_text()));
const step=ms=>frame.evaluate(ms=>window.advanceTime(ms),ms);
async function ready(){await page.waitForFunction(()=>window.messages.some(m=>m.type==='ready'),null,{timeout:120000});frame=page.frames().find(f=>f.url().includes(prefix));await frame.waitForFunction(()=>JSON.parse(window.render_game_to_text()).ready,null,{timeout:120000});await step(0)}
async function drop(tool,point,touch=false){
 const b=await frame.locator(`#${tool}-tool`).boundingBox();assert.ok(b,`${tool} visible`);
 const c=await frame.locator('#game').boundingBox(),p=await frame.evaluate(p=>window.worldToScreen(p),point);
 if(touch){await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);await page.touchscreen.tap(c.x+p.x,c.y+p.y)}
 else{await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(c.x+p.x,c.y+p.y,{steps:10});await page.mouse.up()}
 await step(0);
}
async function save(name){await page.screenshot({path:`${out}/${name}.png`});await fs.writeFile(`${out}/${name}.json`,JSON.stringify(await state(),null,2))}
try{
 await page.goto(base);await ready();assert.equal((await state()).campaign.highestUnlocked,1);
 await frame.locator('#progress').click();assert.equal(await frame.locator('[data-level]').count(),50);assert.equal(await frame.locator('[data-level]:disabled').count(),49);assert.equal((await state()).mode,'levels');await save('01-fresh-map');await frame.locator('#resume-btn').click();
 const selected=new Set([1,5,11,17,21,26,31,36,39,40,46,49,50]);
 for(let level=1;level<=50;level++){
  await frame.waitForFunction(()=>JSON.parse(window.render_game_to_text()).ready,null,{timeout:120000});await step(0);
  const initial=await state();assert.equal(initial.contract,level);const plan=plans.find(p=>p.level===level&&p.variant===initial.variant);assert.ok(plan);
  if(selected.has(level))await save(`level-${String(level).padStart(2,'0')}-start`);
  for(let index=0;index<plan.stages.length;index++){
   const stage=plan.stages[index];assert.equal((await state()).objective,index+1);
   for(const action of stage.actions)await drop(action.tool,action.point);
   assert.ok((await state()).trap,`level${level} trap placed through normal drag`);
   await step(150);if(selected.has(level)&&index===0)await save(`level-${String(level).padStart(2,'0')}-lure`);
   for(let i=0;i<200&&(await state()).mode==='playing';i++)await step(75);
   const caught=await state();assert.equal(caught.captureId,stage.id,`level${level}/stage${index+1}`);assert.equal(caught.correct,true);
   assert.equal(caught.levelCleared,index===plan.stages.length-1);
   if(caught.levelCleared)await page.waitForFunction(n=>window.messages.filter(m=>m.type==='level-complete').length===n,level);
   const completed=await page.evaluate(()=>window.messages.filter(m=>m.type==='level-complete'));
   assert.equal(completed.length,level-1+(caught.levelCleared?1:0),'host completion waits for final objective');
   if(index>0){for(const id of caught.rescuedIds)assert.ok(await frame.locator(`[data-creature="${id}"]`).innerText().then(t=>t.includes('rescued')))}
   if(caught.levelCleared)assert.equal(caught.campaign.completed.length,level);
   if(selected.has(level)&&index===plan.stages.length-1)await save(`level-${String(level).padStart(2,'0')}-capture`);
   await frame.locator('#capture-btn').click();
   if(level===39&&index===0)await save('level-39-rescued-reference');
  }
  checks.push({level,variant:initial.variant,rescues:plan.stages.map(s=>s.id),highestUnlocked:(await state()).campaign.highestUnlocked});console.log(`Browser earned level${level}/50`);
 }
 assert.equal((await state()).mode,'complete');assert.equal((await state()).campaign.completed.length,50);await save('50-complete');
 const messages=await page.evaluate(()=>window.messages);await fs.writeFile(`${out}/earned-results.json`,JSON.stringify({checks,messages,errors,httpErrors,state:await state()},null,2));assert.equal(messages.filter(m=>m.type==='ready').length,1);assert.equal(messages.filter(m=>m.type==='level-start').length,50);assert.equal(messages.filter(m=>m.type==='level-complete').length,50);
 await frame.locator('#finish-map').click();assert.equal(await frame.locator('.level-stop.done').count(),50);await save('51-earned-map');await frame.locator('[data-level="2"]').click();await frame.waitForFunction(()=>JSON.parse(window.render_game_to_text()).ready);await step(0);assert.equal((await state()).contract,2);
 await frame.locator('#pause-btn').click();await frame.locator('#restart-btn').click();await frame.waitForFunction(()=>JSON.parse(window.render_game_to_text()).ready);assert.equal((await state()).contract,2);assert.equal((await state()).campaign.completed.length,50);
 await page.reload();await ready();assert.equal((await state()).contract,2);assert.equal((await state()).campaign.completed.length,50);
 // Capture the actual final-build poster through ordinary unlocked replay and tool gestures.
 await frame.locator('#progress').click();await frame.locator('[data-level="26"]').click();await frame.waitForFunction(()=>JSON.parse(window.render_game_to_text()).ready);await page.setViewportSize({width:1600,height:944});await step(0);
 const posterState=await state(), sign=posterState.variant?-1:1;
 const bowlCandidates=[{x:3.5*sign,z:.3},{x:4.3*sign,z:1.5},{x:-3.5*sign,z:.3}];const bowlPoint=bowlCandidates.find(p=>posterState.obstacles.every(o=>Math.hypot(o.x-p.x,o.z-p.z)>o.r+.4));assert.ok(bowlPoint);
 await drop('feeder',bowlPoint);await drop('berry',bowlPoint);const hush=posterState.creatures.find(c=>c.id==='hush');await drop('calm',{x:hush.x,z:hush.z});
 const posterPlan=plans.find(p=>p.level===26&&p.variant===posterState.variant);for(const action of posterPlan.stages[0].actions)await drop(action.tool,action.point);await step(200);
 assert.ok((await state()).feeder.remaining>0);assert.ok((await state()).calm.remaining>0);
 await frame.locator('#app').screenshot({path:'workbook/poster.jpg',type:'jpeg',quality:90});await frame.locator('#app').screenshot({path:`${out}/poster.png`});
 // A separate fresh browser context practices the final lesson without forging49 earlier completions.
 const lesson=await browser.newContext({viewport:{width:1672,height:985},deviceScaleFactor:1});await lesson.addInitScript(()=>{if(window===window.top)return;const t=setInterval(()=>{if(typeof window.advanceTime==='function'){window.advanceTime(0);clearInterval(t)}},1)});const lessonPage=await lesson.newPage();observe(lessonPage);
 await page.close();
 await lessonPage.bringToFront();await lessonPage.goto(base+'/?level=50');await lessonPage.waitForFunction(()=>window.messages.some(m=>m.type==='ready'),null,{timeout:120000});const lessonFrame=lessonPage.frames().find(f=>f.url().includes(prefix));
 await lessonPage.bringToFront();if(JSON.parse(await lessonFrame.evaluate(()=>window.render_game_to_text())).mode==='paused')await lessonFrame.locator('#resume-btn').click();await lessonFrame.evaluate(()=>window.advanceTime(0));const initialLesson=JSON.parse(await lessonFrame.evaluate(()=>window.render_game_to_text()));const lp=plans.find(p=>p.level===50&&p.variant===initialLesson.variant);
 for(const stage of lp.stages){assert.equal(JSON.parse(await lessonFrame.evaluate(()=>window.render_game_to_text())).mode,'playing');for(const action of stage.actions){const b=await lessonFrame.locator(`#${action.tool}-tool`).boundingBox(),c=await lessonFrame.locator('#game').boundingBox(),p=await lessonFrame.evaluate(p=>window.worldToScreen(p),action.point);await lessonPage.mouse.move(b.x+b.width/2,b.y+b.height/2);await lessonPage.mouse.down();await lessonPage.mouse.move(c.x+p.x,c.y+p.y,{steps:10});await lessonPage.mouse.up();await lessonFrame.evaluate(()=>window.advanceTime(0));}
  for(let i=0;i<200;i++){const s=JSON.parse(await lessonFrame.evaluate(()=>window.render_game_to_text()));if(s.mode==='caught'){assert.equal(s.captureId,stage.id);break}await lessonFrame.evaluate(()=>window.advanceTime(75));}
  const finalStage=JSON.parse(await lessonFrame.evaluate(()=>window.render_game_to_text()));await fs.writeFile(`${out}/direct-step-${finalStage.objective}.json`,JSON.stringify(finalStage,null,2));await lessonPage.screenshot({path:`${out}/direct-step-${finalStage.objective}.png`});assert.equal(finalStage.mode,'caught');assert.equal(finalStage.captureId,stage.id);await lessonFrame.locator('#capture-btn').click();}
 const directFinal=JSON.parse(await lessonFrame.evaluate(()=>window.render_game_to_text()));assert.equal(directFinal.mode,'complete');assert.deepEqual(directFinal.campaign.completed,[50]);assert.equal(directFinal.campaign.highestUnlocked,1);assert.doesNotMatch(await lessonFrame.locator('#modal-body').innerText(),/כל ?50 ?השלבים הושלמו/);await lessonPage.screenshot({path:`${out}/52-direct-final.png`});
 await lessonPage.close();await lesson.close();
 assert.equal(createHash('sha256').update(await fs.readFile('dist/index.html')).digest('hex'),buildHash,'one frozen built bundle throughout the campaign');assert.deepEqual(errors,[]);assert.deepEqual(httpErrors,[]);await fs.writeFile(`${out}/results.json`,JSON.stringify({fiftyEarned:true,buildHash,checks,messages,replay:true,retryPreserves:true,reloadResumes:true,directFinal:{completed:directFinal.campaign.completed,highestUnlocked:1},errors,httpErrors},null,2));console.log('Fifty-level earned campaign,63captures, bridge, replay, retry, reload and direct-final checks passed');
}catch(error){if(!page.isClosed()){await page.screenshot({path:`${out}/failure.png`});await fs.writeFile(`${out}/failure.json`,JSON.stringify({state:await state().catch(()=>null),errors,httpErrors},null,2))}throw error}
finally{await browser.close();await new Promise(r=>server.close(r))}
