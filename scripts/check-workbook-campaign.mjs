import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.CRITTER_APP_ORIGIN||'http://localhost:4117', version=process.env.CRITTER_RELEASE_VERSION||'2026-10-28';
const label=base.includes('localhost')?'local':'production',out=`work/campaign/workbook-${label}`;await fs.mkdir(out,{recursive:true});
const plans=JSON.parse(await fs.readFile('docs/verification/campaign-physical-plans.json','utf8'));
const browser=await chromium.launch({headless:false,args:['--mute-audio'],...(process.env.CRITTER_BROWSER_PATH?{executablePath:process.env.CRITTER_BROWSER_PATH}:{})});
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,hasTouch:true});
await context.addInitScript(()=>{
 if(window===window.top){window.workbookMessages=[];addEventListener('message',e=>{if(e.origin===location.origin&&e.source===document.querySelector('iframe[title="ספארי היצורים"]')?.contentWindow&&e.data?.source==='workbook-game'&&e.data?.slug==='critter-safari')window.workbookMessages.push(e.data)})}
 else if(location.pathname.startsWith('/play/critter-safari/')){const timer=setInterval(()=>{if(typeof window.advanceTime==='function'){window.advanceTime(0);clearInterval(timer)}},1)}
});
const page=await context.newPage(),errors=[],failed=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()})});
let frame;const state=async()=>JSON.parse(await frame.evaluate(()=>window.render_game_to_text())),step=ms=>frame.evaluate(ms=>window.advanceTime(ms),ms);
async function loaded(level){await page.waitForFunction(()=>window.workbookMessages.some(m=>m.type==='level-start'),null,{timeout:60000});frame=page.frames().find(f=>f.url().includes('/play/critter-safari/'));assert.ok(frame);assert.ok(frame.url().includes(`/play/critter-safari/${version}/index.html?level=${level}`));await frame.waitForFunction(()=>JSON.parse(window.render_game_to_text()).ready,null,{timeout:60000});await step(0);assert.equal((await state()).contract,level);assert.equal(await page.getByText('המשחק לא נטען',{exact:true}).count(),0);assert.equal(await frame.locator('select,[data-grade]').count(),0);}
async function drop(action,touch){const b=await frame.locator(`#${action.tool}-tool`).boundingBox(),c=await frame.locator('#game').boundingBox(),p=await frame.evaluate(p=>window.worldToScreen(p),action.point);assert.ok(b);if(touch){await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);await page.touchscreen.tap(c.x+p.x,c.y+p.y)}else{await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(c.x+p.x,c.y+p.y,{steps:10});await page.mouse.up()}await step(0);}
async function captureLevel(level,touch=false){
 const initial=await state(),plan=plans.find(p=>p.level===level&&p.variant===initial.variant);
 assert.ok(plan);
 for(const [index,stage] of plan.stages.entries()){
  for(const action of stage.actions)await drop(action,touch);
  assert.ok((await state()).trap);
  for(let i=0;i<200&&(await state()).mode==='playing';i++)await step(75);
  assert.equal((await state()).captureId,stage.id);
  assert.equal((await state()).correct,true);
  if(index<plan.stages.length-1){
   assert.equal((await page.evaluate(()=>window.workbookMessages)).filter(m=>m.type==='level-complete').length,0);
   await frame.locator('#capture-btn').click();await step(0);
  }
 }
 await page.waitForFunction(()=>window.workbookMessages.some(m=>m.type==='level-complete'));
 const messages=await page.evaluate(()=>window.workbookMessages);
 assert.deepEqual(messages.map(m=>m.type),['ready','level-start','level-complete']);
 assert.equal(messages[2].level,level);assert.equal((await state()).levelCleared,true);
 return {level,variant:initial.variant,captures:plan.stages.map(s=>s.id),messages};
}
try{
 await page.goto(base);const consent=page.getByRole('button',{name:/חיוניות בלבד/});await consent.waitFor({state:'visible',timeout:8000}).then(()=>consent.click()).catch(()=>{});
 await page.locator('a[href="/critter-safari"]').first().click();await page.waitForURL(base+'/critter-safari');await page.locator('#level-50').waitFor({state:'visible'});assert.equal(await page.locator('li[id^="level-"]').count(),50);assert.ok((await page.locator('body').innerText()).includes('50'));
 const lessons=await page.locator('a[href^="https://english.workbook.co.il/grade-"]').evaluateAll(els=>[...new Set(els.map(e=>e.href).filter(u=>new URL(u).pathname.split('/').filter(Boolean).length===3))]);assert.equal(lessons.length,11);assert.ok(lessons.some(u=>u.includes('grade-9/')));await page.screenshot({path:`${out}/catalog.png`,fullPage:true});
 await page.locator('#level-50 a[href="/critter-safari/play?level=50"]').click();await loaded(50);assert.equal((await state()).art.models,6);const desktop=await captureLevel(50);assert.deepEqual((await state()).campaign.completed,[50]);assert.equal((await state()).campaign.highestUnlocked,1);await page.screenshot({path:`${out}/final-lesson.png`});
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/critter-safari/play?level=39');await loaded(39);assert.equal(await page.getByText('סובבו את הטלפון לרוחב',{exact:true}).count(),0);assert.equal(await frame.locator('#animal-facts li').count(),6);await page.screenshot({path:`${out}/phone-playing.png`});const phone=await captureLevel(39,true);assert.ok((await state()).campaign.completed.includes(39));await page.screenshot({path:`${out}/phone-capture.png`});
 const gameFailures=failed.filter(f=>f.url.startsWith(base+'/play/critter-safari/'));assert.deepEqual(gameFailures,[]);assert.deepEqual(errors,[]);await fs.writeFile(`${out}/results.json`,JSON.stringify({base,version,catalogLevels:50,lessons,desktop,phone,errors,gameFailures,nonGameHttpFailures:failed.filter(f=>!gameFailures.includes(f))},null,2));await fs.rm(`${out}/failure.json`,{force:true});await fs.rm(`${out}/failure.png`,{force:true});console.log(`Workbook ${label}:50 catalog levels,11 lessons, real final3rescues and phone2rescues passed.`);
}catch(error){await page.screenshot({path:`${out}/failure.png`,fullPage:true});await fs.writeFile(`${out}/failure.json`,JSON.stringify({page:page.url(),state:await state().catch(()=>null),errors,failed},null,2));throw error}
finally{await browser.close()}
