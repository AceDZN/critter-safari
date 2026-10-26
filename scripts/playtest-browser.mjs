import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:process.env.CRITTER_HEADLESS==='1',...(process.env.CRITTER_BROWSER_PATH?{executablePath:process.env.CRITTER_BROWSER_PATH}:{})});
const page=await browser.newPage({viewport:{width:1672,height:941},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const out='docs/actual-captures';await fs.mkdir(out,{recursive:true});
const state=async()=>JSON.parse(await page.evaluate(()=>window.render_game_to_text()));
const advance=async(ms)=>page.evaluate(ms=>window.advanceTime(ms),ms);
async function save(name){await page.screenshot({path:`${out}/${name}.png`});await fs.writeFile(`${out}/${name}.json`,JSON.stringify(await state(),null,2))}
console.log('browser-ready');
page.on('requestfailed',r=>console.log('failed',r.url(),r.failure()?.errorText));page.on('response',r=>{if(r.status()>=400)console.log('http-error',r.status(),r.url())});
console.log('navigating');
await page.goto('http://127.0.0.1:4232',{waitUntil:'domcontentloaded',timeout:120000});console.log('dom-loaded');
await page.waitForFunction(()=>typeof window.render_game_to_text==='function',null,{timeout:120000});
await page.locator('#start-btn').click();await save('01-journal');await page.locator('#resume-btn').click();await advance(0);await save('02-first-view');
async function move(point){for(let count=0;count<130;count++){const s=await state(),p=s.player,dx=point.x-p.x,dz=point.z-p.z,len=Math.hypot(dx,dz);if(len<.13)return;const f=(-dx*Math.sin(p.yaw)-dz*Math.cos(p.yaw))/len,side=(dx*Math.cos(p.yaw)-dz*Math.sin(p.yaw))/len;const codes=[];if(Math.abs(f)>.29)codes.push(f>0?'KeyW':'KeyS');if(Math.abs(side)>.29)codes.push(side>0?'KeyD':'KeyA');for(const key of codes)await page.keyboard.down(key);await advance(Math.min(90,len/2.7*1000));for(const key of codes)await page.keyboard.up(key);}throw Error('Unreachable waypoint '+JSON.stringify(point))}
let pitch=-.3;
async function aim(point){const s=await state(),dx=point.x-s.player.x,dz=point.z-s.player.z;const yaw=Math.atan2(-dx,-dz);let dyaw=yaw-s.player.yaw;dyaw=Math.atan2(Math.sin(dyaw),Math.cos(dyaw));const targetPitch=-Math.atan2(1.25,Math.hypot(dx,dz));const mx=-dyaw/.004,my=-(targetPitch-pitch)/.004;await page.mouse.move(836,470);await page.mouse.down();await page.mouse.move(836+mx,470+my,{steps:12});await page.mouse.up();pitch=targetPitch;}
const plans=[{id:'moss',diet:'leaf',via:[[-2.5,3]],offset:[-1.8,0]},{id:'pip',diet:'berry',via:[[2.8,3]],offset:[1.6,-1.2]},{id:'tumble',diet:'leaf',via:[[3.4,3],[3.4,0]],offset:[1.8,0]},{id:'reed',diet:'leaf',via:[[-2,3],[-2,-1.5]],offset:[0,-2]},{id:'brin',diet:'berry',via:[[4,4],[4,-1]],offset:[0,-2]}];
async function capture(plan,name){const s0=await state(),sign=s0.variant?-1:1;for(const [x,z] of plan.via)await move({x:x*sign,z});let s=await state();const actor=s.creatures.find(a=>a.id===plan.id);const point={x:actor.x+plan.offset[0]*sign,z:actor.z+plan.offset[1]};await aim(point);await page.keyboard.press('KeyE');s=await state();if(!s.trap)throw Error('No trap '+JSON.stringify(s));if(s.baitType!==plan.diet)await page.keyboard.press('KeyQ');await page.mouse.click(836,470);
 await save(name+'-lure');let saw=false;for(let i=0;i<140;i++){await advance(50);s=await state();const a=s.creatures.find(a=>a.id===plan.id);if(a.mode==='lured'||a.mode==='eating')saw=true;const nearest=[...s.creatures].sort((a,b)=>Math.hypot(a.x-s.trap.x,a.z-s.trap.z)-Math.hypot(b.x-s.trap.x,b.z-s.trap.z))[0];if(saw&&nearest.id===plan.id&&Math.hypot(a.x-s.trap.x,a.z-s.trap.z)<.75){await page.keyboard.press('Space');s=await state();if(s.captureId!==plan.id)throw Error('Wrong physical catch '+JSON.stringify(s));await save(name+'-capture');return s;}}throw Error('Lure failed '+name+' '+JSON.stringify(s))}
// Recoverable mistake through normal capture and release, before any correct progression.
let wrong=await capture(plans[1],'03-wrong');if(wrong.correct)throw Error('Wrong-catch fixture advanced');await page.locator('#capture-btn').click();await save('04-released');
for(let level=0;level<5;level++){const result=await capture(plans[level],`contract-${level+1}`);if(!result.correct)throw Error('Semantic rejection '+level);await page.locator('#capture-btn').click();if(level<4){pitch=-.3;await page.locator('#resume-btn').click();}}
if((await state()).mode!=='complete')throw Error('No completion');await save('05-complete');
await page.locator('#restart-btn').click();await page.locator('#start-btn').click();await page.locator('#resume-btn').click();await page.keyboard.press('KeyH');const before=(await state()).creatures;await advance(4000);if(JSON.stringify((await state()).creatures)!==JSON.stringify(before))throw Error('Help did not pause');await save('06-help');await page.locator('#resume-btn').click();await page.keyboard.press('KeyP');await page.locator('#mute-btn').click();await page.locator('#motion-btn').click();await save('07-settings');
await page.goto('http://127.0.0.1:4232',{waitUntil:'domcontentloaded',timeout:120000});await page.locator('#start-btn').click();await page.locator('#resume-btn').click();
const frames=await page.evaluate(()=>new Promise(resolve=>{const times=[];let last=performance.now();function sample(now){times.push(now-last);last=now;if(times.length<90)requestAnimationFrame(sample);else resolve(times.slice(10))}requestAnimationFrame(sample)}));
const sorted=[...frames].sort((a,b)=>a-b);const performanceSample={viewport:[1672,941],frames:frames.length,medianFrameMs:sorted[Math.floor(sorted.length*.5)],p95FrameMs:sorted[Math.floor(sorted.length*.95)],render:(await state()).render};await page.keyboard.press('KeyP');
await fs.writeFile('work/browser-performance.json',JSON.stringify(performanceSample,null,2));
await fs.writeFile('work/browser-results.json',JSON.stringify({errors,completion:true,wrongRecovery:true,helpPause:true,settings:await state()},null,2));
await browser.close();console.log('Browser desktop sequence passed',JSON.stringify(errors));if(errors.length)process.exitCode=1;
