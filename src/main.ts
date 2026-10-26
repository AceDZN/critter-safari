import * as THREE from 'three';
import { SafariSimulation, distance } from './simulation';
import { CONTRACTS, GLOSSARY, type Archetype } from './content';
import { createGarden, loadCritter, TRIPO_ASSETS_READY, type CritterVisual } from './world-art';
import './style.css';
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const game=new SafariSimulation(Math.random()<.5?0:1),canvas=$<HTMLCanvasElement>('game');
let renderer:THREE.WebGLRenderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'})}catch{$('modal-body').innerHTML='<h2>צריך WebGL כדי להיכנס לגינה</h2><p>נסו דפדפן עם האצת חומרה פעילה.</p>';throw new Error('WebGL unavailable')}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.32;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xc5d4a3);scene.fog=new THREE.Fog(0xc5d4a3,12,35);
const camera=new THREE.PerspectiveCamera(64,1,.04,65);camera.rotation.order='YXZ';
scene.add(new THREE.HemisphereLight(0xf6f5c7,0x496344,2.3));
const sun=new THREE.DirectionalLight(0xffedb0,3.5);sun.position.set(-7,12,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:1,far:32});sun.shadow.normalBias=.04;scene.add(sun);sun.target.position.set(0,0,0);scene.add(sun.target);
let garden=createGarden(scene,false,game.variant),shownLevel=-1;
const actorViews=new Map<string,{root:THREE.Group;body:THREE.Object3D;tag:THREE.Sprite;visual:CritterVisual|null}>();
const mat=(color:number)=>new THREE.MeshStandardMaterial({color,roughness:.8});const brass=mat(0xb59a58),wood=mat(0x60452d),green=mat(0x799155);
function mesh(geometry:THREE.BufferGeometry,material:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function diagnosticCreature(kind:Archetype){const root=new THREE.Group();const body=mesh(new THREE.SphereGeometry(1,16,12),green,root,0,.42,0);body.scale.set(kind==='shellback'?.66:.42,kind==='hopper'?.27:.43,kind==='shellback'?.57:.42);
 if(kind==='shellback'){const shell=mesh(new THREE.IcosahedronGeometry(.59,1),mat(0x8b8859),root,0,.59,-.07);shell.scale.set(1,.65,1)}
 if(kind==='puffling'){for(let j=0;j<9;j++){const a=j/9*Math.PI*2;const leaf=mesh(new THREE.SphereGeometry(.2,8,5),mat(j%2?0x72934d:0x9da657),root,Math.sin(a)*.28,.65,Math.cos(a)*.28);leaf.scale.set(.6,1,.35);leaf.rotation.z=a}}
 for(const side of[-1,1]){const eye=mesh(new THREE.SphereGeometry(.115,12,8),mat(0xeee7c8),root,side*.17,.55,.33);mesh(new THREE.SphereGeometry(.067,10,8),mat(0x1d2f22),eye,0,0,.08);mesh(new THREE.SphereGeometry(.018,6,5),new THREE.MeshBasicMaterial({color:0xffffff}),eye,-.019,.026,.137);
 const leg=mesh(new THREE.CylinderGeometry(.047,.063,kind==='hopper'?.65:.18,6),wood,root,side*.25,kind==='hopper'?.25:.09,0);if(kind==='hopper')leg.rotation.z=side*.3;}
 return root;
}
function label(name:string){const c=document.createElement('canvas');c.width=256;c.height=72;const ctx=c.getContext('2d')!;ctx.fillStyle='#243e28d9';ctx.beginPath();ctx.roundRect(26,5,204,57,14);ctx.fill();ctx.font='30px Georgia';ctx.textAlign='center';ctx.fillStyle='#fff4d8';ctx.fillText(name,128,43);const texture=new THREE.CanvasTexture(c);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:true,sizeAttenuation:false}));sprite.scale.set(.14,.04,1);sprite.position.y=1.22;return sprite}
async function buildActors(){const version=game.level;for(const v of actorViews.values())scene.remove(v.root);actorViews.clear();for(const a of game.actors){const root=new THREE.Group();const body=diagnosticCreature(a.spec.archetype);root.add(body);const tag=label(a.spec.name);root.add(tag);root.scale.setScalar(Math.sqrt(a.spec.size));scene.add(root);actorViews.set(a.spec.id,{root,body,tag,visual:null});}
 for(const a of game.actors){try{const visual=await loadCritter(a.spec.archetype);if(version!==game.level)return;const view=actorViews.get(a.spec.id)!;if(visual){view.root.remove(view.body);view.root.add(visual.root);view.body=visual.root;view.visual=visual}}catch(err){console.error('Critter asset failed',err);$('asset-status').textContent='Tripo model could not load — art requirement remains open.'}}
}
const trapRoot=new THREE.Group();scene.add(trapRoot);
const ring=mesh(new THREE.TorusGeometry(1.06,.055,8,64),brass,trapRoot,0,.07,0);ring.rotation.x=Math.PI/2;
for(let i=0;i<3;i++){const a=i/3*Math.PI*2;mesh(new THREE.CylinderGeometry(.035,.06,.42,7),wood,trapRoot,Math.sin(a)*.97,.22,Math.cos(a)*.97)}
const bubbleMat=new THREE.MeshPhysicalMaterial({color:0xb9e6dc,transparent:true,opacity:.19,roughness:.05,metalness:.17,clearcoat:1,side:THREE.DoubleSide,depthWrite:false});
const bubble=mesh(new THREE.SphereGeometry(1.09,40,24),bubbleMat,trapRoot,0,.87,0);bubble.scale.y=.9;
const bubbleEdge=mesh(new THREE.TorusGeometry(1.07,.012,5,64),new THREE.MeshBasicMaterial({color:0xe7ffe4,transparent:true,opacity:.7}),trapRoot,0,.88,0);bubbleEdge.rotation.x=Math.PI/2;
const pulseRing=mesh(new THREE.TorusGeometry(1,.025,6,64),new THREE.MeshBasicMaterial({color:0xe0fbe3,transparent:true,opacity:.7}),trapRoot,0,.08,0);pulseRing.rotation.x=Math.PI/2;
const aimMark=mesh(new THREE.TorusGeometry(.23,.012,5,32),new THREE.MeshBasicMaterial({color:0xf5e9b8,transparent:true,opacity:.75}),scene,0,.03,0);aimMark.rotation.x=Math.PI/2;
const baitViews:THREE.Group[]=[];
const gadget=new THREE.Group();camera.add(gadget);scene.add(camera);gadget.scale.setScalar(.8);gadget.position.set(.34,-.34,-.75);gadget.rotation.set(-.12,-.2,.14);
const barrel=mesh(new THREE.CylinderGeometry(.115,.14,.49,12),brass,gadget);barrel.rotation.x=Math.PI/2;const grip=mesh(new THREE.BoxGeometry(.18,.24,.18),wood,gadget,0,-.1,.16);grip.rotation.x=-.2;mesh(new THREE.SphereGeometry(.105,16,12),new THREE.MeshPhysicalMaterial({color:0xb7dcd5,metalness:.15,roughness:.1,transparent:true,opacity:.7}),gadget,0,0,-.22);
for(const z of[-.12,.1]){const band=mesh(new THREE.TorusGeometry(.13,.025,6,16),wood,gadget,0,0,z)}
let needsRender=true;
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,muted=false,pitch=-.3,recoil=0,lastMode='',lastInstruction='',lastMessage='',lastStamp=performance.now();
let audio:AudioContext|null=null;function sound(type:'bait'|'pulse'|'success'|'miss'|'step'){if(muted)return;audio??=new AudioContext();audio.resume();const now=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.type=type==='step'?'triangle':'sine';const f=type==='success'?620:type==='miss'?190:type==='pulse'?330:type==='bait'?480:95;o.frequency.setValueAtTime(f,now);o.frequency.exponentialRampToValueAtTime(type==='success'?1050:f*.55,now+.18);g.gain.setValueAtTime(type==='step'?.022:.07,now);g.gain.exponentialRampToValueAtTime(.001,now+.22);o.start();o.stop(now+.23)}
const keys=new Set<string>(),touchKeys=new Set<string>();
function input(){const has=(s:string)=>keys.has(s)||touchKeys.has(s);return{forward:+has('KeyW')-+has('KeyS'),strafe:+has('KeyD')-+has('KeyA'),turn:+has('ArrowRight')-+has('ArrowLeft')}}
function aimPoint(){const dir=new THREE.Vector3(0,0,-1).applyEuler(new THREE.Euler(pitch,game.player.yaw,0,'YXZ'));const t=1.25/Math.max(.16,-dir.y);const len=Math.min(5.2,t);return{x:game.player.x+dir.x*len,z:game.player.z+dir.z*len}}
function place(){game.place(aimPoint());sound('step');sync()}
function toss(){if(game.toss(aimPoint())){recoil=.065;sound('bait')}sync()}
function pulse(){const captured=game.pulse();recoil=.09;sound(captured?(game.correct?'success':'miss'):'pulse');sync()}
function swap(){game.diet=game.diet==='leaf'?'berry':'leaf';sync()}
function resume(){game.mode='playing';keys.clear();lastStamp=performance.now();sync()}
function modalAction(id:string,fn:()=>void){$(id).onclick=fn}
function modalHTML(){const c=game.contract;
 if(game.mode==='intro')return `<div class="eyebrow">A LITTLE WILDERNESS. A CLEVER CATCH.</div><h1 dir="ltr">Critter Safari</h1><span class="badge">ספארי היצורים · 5 משימות שדה</span><p>קראו את החוזה באנגלית, צפו ביצורים ותכננו לכידה. המלכודת והפיתיון בידיים שלכם.</p><div class="steps"><div><b>01</b>בדקו ביומן מי מתאים לתיאור.</div><div><b>02</b>הציבו מלכודת וזרקו מזון מתאים.</div><div><b>03</b>כשהיצור בתוך הטבעת — הפעילו בועה.</div></div><p class="fine">WASD לתנועה · גרירת המסך למבט · E מלכודת · לחיצה פיתיון · Q החלפת מזון · רווח בועה. במגע: חצים וכפתורי הכלים. כל קריאה עוצרת את העולם.</p><div class="actions"><button id="start-btn" class="primary">נכנסים לגינה ←</button><button id="intro-help" class="quiet">מילים ועזרה</button></div>`;
 if(game.mode==='notes')return `<div class="eyebrow">FIELD JOURNAL / ${String(game.level+1).padStart(2,'0')}</div><h2>${c.titleHe}</h2><div class="instruction" lang="en" dir="ltr">${c.instruction}</div><p class="fine">מהירות רגילה = ללא פיתיון, על אותו משטח ישר. יחידות גן לשנייה. גודל ומהירות הם מדדים נפרדים.</p><div class="table-wrap"><table lang="en" dir="ltr"><thead><tr><th>Name / species</th><th>Food</th><th>Usual speed</th><th>Size</th><th>Habit</th></tr></thead><tbody>${c.creatures.map(a=>`<tr><td><b>${a.name}</b><br>${a.archetype}</td><td>${a.diet==='leaf'?'leaves':'berries'}</td><td>${a.usualSpeed.toFixed(2)}</td><td>${a.size.toFixed(2)}</td><td>${a.habit}</td></tr>`).join('')}</tbody></table></div><div class="actions"><button id="resume-btn" class="primary">חוזרים לשטח ←</button><button id="notes-help" class="quiet">מילים ועזרה</button></div>`;
 if(game.mode==='help')return `<div class="eyebrow">PAUSED / POCKET GUIDE</div><h2>קוראים, מתכננים, לוכדים</h2><p>${c.helpHe||'משימת העברה: השתמשו בנתונים החדשים ביומן ובמילים שלמדתם.'}</p><div class="glossary">${GLOSSARY.map(([en,he])=>`<div><b dir="ltr">${en}</b><span>${he}</span></div>`).join('')}</div><p>הציבו בטווח 5 מטר, זרקו מזון מתאים אל המלכודת והפעילו כשהיצור בטבעת. אבנים חוסמות זריקות וקו ראייה. R מחזיר את המלכודת. N יומן · P השהיה · F מסך מלא.</p><div class="actions"><button id="resume-btn" class="primary">חוזרים לשטח</button><button id="help-notes" class="quiet">פתיחת יומן</button></div>`;
 if(game.mode==='caught')return `<div class="eyebrow">${game.correct?'SAFE CAPTURE':'RELEASE & REPLAN'}</div><h2>${game.correct?'לכידה מוצלחת!':'אפשר לנסות שוב'}</h2><p dir="ltr" lang="en" class="instruction">${game.actors.find(a=>a.spec.id===game.captureId)?.spec.name} · ${c.instruction}</p><p>${game.message}</p><div class="actions"><button id="capture-btn" class="primary">${game.correct?(game.level===4?'מסיימים את המסע ←':'מעבירים וממשיכים ←'):'משחררים ומנסים שוב ←'}</button>${game.correct?'':'<button id="caught-notes" class="quiet">בדיקת היומן</button>'}</div>`;
 if(game.mode==='complete')return `<div class="eyebrow">FIELD JOURNAL COMPLETE</div><h1 dir="ltr">A fine safari.</h1><h2>כל חמש המשימות הושלמו</h2><p>קראתם תיאורים מזהים, הפרדתם גודל ממהירות והשוויתם בתוך קבוצה מוגדרת — גם בקרחת היער החדשה.</p><p class="fine">${game.events.filter(e=>e.type==='capture').length} לכידות · ${game.events.filter(e=>e.type==='retry').length} שחרורים · העזרה והניסיונות נשמרו רק בזיכרון המקומי של המשחק.</p><div class="actions"><button id="restart-btn" class="primary">מסע חדש ←</button></div>`;
 return `<div class="eyebrow">THE GARDEN IS WAITING</div><h2>הפסקה בגינה</h2><p>העולם נעצר. אפשר לקרוא ולתכנן בלי לחץ.</p><div class="actions"><button id="resume-btn" class="primary">ממשיכים ←</button><button id="restart-btn" class="quiet">מתחילים מחדש</button></div><div class="toggle-row"><button id="mute-btn" class="quiet">${muted?'צליל כבוי':'צליל פעיל'}</button><button id="motion-btn" class="quiet">${reduced?'תנועה מופחתת':'תנועה מלאה'}</button><button id="full-btn" class="quiet">מסך מלא</button></div>`;
}
function sync(){
 if(shownLevel!==game.level){if(shownLevel>=0){garden.dispose();garden=createGarden(scene,game.contract.scene==='transfer',game.variant)}shownLevel=game.level;void buildActors();pitch=-.3}
 const instruction=game.contract.instruction;if(lastInstruction!==instruction){$('instruction').textContent=instruction;$('contract-label').textContent=`FIELD CONTRACT ${String(game.level+1).padStart(2,'0')} / ${game.contract.transfer?'NEW CLEARING':'FERN GARDEN'}`;$('count').textContent=String(game.level+1).padStart(2,'0');lastInstruction=instruction}
 $('bait-icon').textContent=game.diet==='leaf'?'❧':'●';$('bait-text').innerHTML=`${game.diet==='leaf'?'עלה':'פרי'} <kbd>Q</kbd>`;
 if(lastMessage!==game.message){$('toast').textContent=game.message;lastMessage=game.message}
 $('asset-status').textContent=TRIPO_ASSETS_READY?'':'ART PIPELINE OPEN · diagnostic creature silhouettes; Tripo acquisition / rigs pending';
 $('modal').classList.toggle('hidden',game.mode==='playing');$('modal').classList.toggle('capture',game.mode==='caught');
 if(lastMode!==game.mode){needsRender=true;lastMode=game.mode;if(game.mode!=='playing'){$('modal-body').innerHTML=modalHTML();
 if(game.mode==='intro'){modalAction('start-btn',()=>{game.start();game.mode='notes';sync()});modalAction('intro-help',()=>{game.mode='help';sync()})}
 if(['notes','help','paused'].includes(game.mode))modalAction('resume-btn',resume);
 if(game.mode==='notes')modalAction('notes-help',()=>{game.hints++;game.noteEvent('hint');game.mode='help';sync()});
 if(game.mode==='help')modalAction('help-notes',()=>{game.mode='notes';sync()});
 if(game.mode==='caught'){modalAction('capture-btn',()=>{if(game.correct)game.next();else game.release();sync()});if(!game.correct)modalAction('caught-notes',()=>{game.release();game.mode='notes';sync()})}
 if(game.mode==='complete'||game.mode==='paused')modalAction('restart-btn',()=>{game.restart();sync()});
 if(game.mode==='paused'){modalAction('mute-btn',()=>{muted=!muted;lastMode='';sync()});modalAction('motion-btn',()=>{reduced=!reduced;lastMode='';sync()});modalAction('full-btn',fullscreen)}
 }else canvas.focus()}
}
$('notes-btn').onclick=()=>{game.open('notes');sync()};$('help-btn').onclick=()=>{game.open('help');sync()};$('pause-btn').onclick=()=>{game.open('paused');sync()};$('trap-btn').onclick=place;$('bait-btn').onclick=swap;$('pulse-btn').onclick=pulse;$('touch-toss').onclick=toss;
function fullscreen(){if(document.fullscreenElement)void document.exitFullscreen();else void document.documentElement.requestFullscreen()}
window.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat)return;keys.add(e.code);if(e.code==='KeyF')fullscreen();if(['Escape','KeyP'].includes(e.code)){if(game.mode==='playing')game.open('paused');else if(game.mode==='paused')resume()}if(game.mode==='playing'){if(e.code==='KeyE')place();if(e.code==='KeyQ')swap();if(e.code==='Space')pulse();if(e.code==='KeyR')game.resetTrap();if(e.code==='KeyN')game.open('notes');if(e.code==='KeyH')game.open('help')}sync()});window.addEventListener('keyup',e=>keys.delete(e.code));
let drag:{x:number;y:number;startX:number;startY:number;id:number}|null=null;
canvas.addEventListener('pointerdown',e=>{if(game.mode!=='playing')return;drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!drag||game.mode!=='playing')return;game.player.yaw-=(e.clientX-drag.x)*.004;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-drag.y)*.004,-1.15,.15);drag.x=e.clientX;drag.y=e.clientY});
canvas.addEventListener('pointerup',e=>{if(!drag)return;const moved=Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY);drag=null;if(moved<6)toss()});canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('contextmenu',e=>e.preventDefault());
for(const b of document.querySelectorAll<HTMLButtonElement>('[data-move]')){const key=({forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD'} as Record<string,string>)[b.dataset.move!];b.addEventListener('pointerdown',e=>{e.preventDefault();touchKeys.add(key);b.setPointerCapture(e.pointerId)});for(const event of['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>touchKeys.delete(key))}
function focusPause(){keys.clear();touchKeys.clear();drag=null;if(game.mode==='playing'){game.open('paused');sync()}}window.addEventListener('blur',focusPause);document.addEventListener('visibilitychange',()=>{if(document.hidden)focusPause()});
function resize(){needsRender=true;renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}addEventListener('resize',resize);resize();
function draw(dt=0){
 camera.position.set(game.player.x,1.25,game.player.z);camera.rotation.set(pitch,game.player.yaw,0,'YXZ');
 garden.update(game.time,reduced);
 for(const a of game.actors){const v=actorViews.get(a.spec.id);if(!v)continue;v.root.position.set(a.mode==='caught'&&game.trap?game.trap.x:a.x,a.mode==='caught'?.35:0,a.mode==='caught'&&game.trap?game.trap.z:a.z);v.body.rotation.y=a.angle;if(v.visual)v.visual.mixer.update(game.mode==='playing'?dt:0);if(!v.visual&&!reduced){const moving=a.mode==='lured'||a.mode==='wander'||a.mode==='escape';v.body.position.y=moving?Math.sin(game.time*(a.mode==='lured'?12:6)+a.spec.size)*.026:0}v.tag.material.depthTest=true;v.tag.visible=distance(game.player,a)<8;}
 trapRoot.visible=!!game.trap;if(game.trap){trapRoot.position.set(game.trap.x,0,game.trap.z);bubble.visible=true;bubbleMat.opacity=game.mode==='caught'?.19:.045;bubble.scale.y=game.mode==='caught'?.9:.43;bubble.position.y=game.mode==='caught'?.87:.2;bubbleEdge.visible=game.mode==='caught';pulseRing.visible=game.trap.pulse>0;pulseRing.scale.setScalar(1+(1-game.trap.pulse)*.8);$('charge').style.width=`${game.trap.charge*100}%`}else $('charge').style.width='100%';
 while(baitViews.length<game.baits.length){const g=new THREE.Group();scene.add(g);baitViews.push(g)}
 baitViews.forEach((v,i)=>{const b=game.baits[i];v.visible=!!b;if(!b)return;const old=v.userData.diet;if(old!==b.diet){v.clear();const item=mesh(new THREE.SphereGeometry(.12,10,7),mat(b.diet==='leaf'?0x99b947:0xae4662),v);if(b.diet==='leaf')item.scale.set(.65,.12,1.4);v.userData.diet=b.diet}const t=1-b.flight/.55;v.position.set(THREE.MathUtils.lerp(b.from.x,b.x,t),.12+Math.sin(t*Math.PI)*1.6,THREE.MathUtils.lerp(b.from.z,b.z,t));});
 const aim=aimPoint();aimMark.position.set(aim.x,.025,aim.z);aimMark.visible=game.mode==='playing';(aimMark.material as THREE.MeshBasicMaterial).color.setHex(game.fits(aim,.4)&&distance(game.player,aim)<5?0xf9efb2:0xb86648);
 $('aim-label').textContent=game.mode==='playing'?`${distance(game.player,aim).toFixed(1)}m` :'';
 recoil=Math.max(0,recoil-dt*.35);gadget.position.z=-.75+recoil;gadget.visible=game.mode!=='intro';renderer.render(scene,camera);
}
let manualTime=false,accumulator=0;function advance(ms:number){manualTime=true;const safe=Math.min(ms,300000);for(let t=0;t<safe;t+=1000/60){game.update(Math.min(1/60,(safe-t)/1000),input());}sync();draw(safe/1000);needsRender=false}
Object.assign(window,{render_game_to_text:()=>JSON.stringify({...game.text(),aim:aimPoint(),art:{tripoReady:TRIPO_ASSETS_READY,animatedModels:[...actorViews.values()].filter(v=>v.visual?.clips.length).length},settings:{muted,reducedMotion:reduced},render:{drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,pixelRatio:renderer.getPixelRatio()}}),advanceTime:advance});
function frame(stamp:number){const dt=Math.min((stamp-lastStamp)/1000,.05);lastStamp=stamp;accumulator+=dt;if(!manualTime)game.update(dt,input());if(accumulator>.12){sync();accumulator=0}if(!manualTime&&game.mode==='playing'){draw(dt);needsRender=false}else if(needsRender){draw(0);needsRender=false}requestAnimationFrame(frame)}sync();setTimeout(()=>requestAnimationFrame(frame),0);
