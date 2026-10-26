import { CONTRACTS, type CreatureSpec, type Diet } from './content';
import { acceptsCapture } from './semantics';
export interface Point { x:number; z:number }
export interface Obstacle extends Point { r:number }
export interface Actor extends Point { spec:CreatureSpec; angle:number; mode:'wander'|'lured'|'eating'|'escape'|'caught'; timer:number; destination:Point }
export type GameMode='intro'|'playing'|'paused'|'notes'|'help'|'caught'|'complete';
export interface Input { forward:number; strafe:number; turn:number }
export const CLEARING_OBSTACLES:Obstacle[]=[{x:0,z:-.6,r:.65},{x:-4.6,z:-2.8,r:.65},{x:4.9,z:1.5,r:.7}];
export const TRANSFER_OBSTACLES:Obstacle[]=[{x:-.7,z:1,r:.8},{x:1.7,z:-.1,r:.65},{x:-4.5,z:-1.7,r:.65}];
export function distance(a:Point,b:Point){return Math.hypot(a.x-b.x,a.z-b.z)}
export function segmentClear(a:Point,b:Point,obstacles:readonly Obstacle[],margin=0){
 const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz;
 return obstacles.every(o=>{const t=l?Math.max(0,Math.min(1,((o.x-a.x)*dx+(o.z-a.z)*dz)/l)):0;return Math.hypot(o.x-a.x-t*dx,o.z-a.z-t*dz)>o.r+margin});
}
export class SafariSimulation {
 level=0;mode:GameMode='intro';time=0;player={x:0,z:6,yaw:0};actors:Actor[]=[];
 trap:{x:number;z:number;charge:number;pulse:number}|null=null;
 baits:Array<Point&{diet:Diet;age:number;flight:number;from:Point}>=[];
 diet:Diet='leaf';message='';captureId:string|null=null;correct=false;attempts=0;hints=0;
 events:Array<{type:string;level:number;time:number;id?:string;assisted?:boolean}>=[];
 get contract(){return CONTRACTS[this.level]!}
 get obstacles(){const base=this.contract.scene==='transfer'?TRANSFER_OBSTACLES:CLEARING_OBSTACLES;return this.variant?base.map(o=>({...o,x:-o.x})):base}
 constructor(public readonly variant:0|1=0){this.load(0);this.mode='intro'}
 home(spec:CreatureSpec):Point{return{x:spec.spawn[0]*(this.variant?-1:1),z:spec.spawn[1]}}
 load(level:number){this.level=level;this.time=0;this.player={x:0,z:6,yaw:0};this.trap=null;this.baits=[];this.captureId=null;this.correct=false;this.message='';this.hints=0;this.attempts=0;
 this.actors=this.contract.creatures.map((spec,i)=>({spec,...this.home(spec),angle:i,mode:'wander',timer:1+i*.31,destination:{x:this.home(spec).x+Math.sin(i)*.6*(this.variant?-1:1),z:spec.spawn[1]+Math.cos(i)*.6}}));}
 start(){this.mode='playing';this.message='E — הצבת מלכודת · לחיצה — פיתיון · רווח — בועה';}
 noteEvent(type:string,id?:string){this.events.push({type,level:this.level+1,time:Math.round(this.time*10)/10,id,assisted:this.hints>0});if(this.events.length>80)this.events.shift()}
 fits(p:Point,r=.28){return Math.abs(p.x)<7.6-r&&p.z>-6.5+r&&p.z<6.6-r&&this.obstacles.every(o=>distance(p,o)>o.r+r)}
 move(p:Point,dx:number,dz:number,r=.28){if(this.fits({x:p.x+dx,z:p.z},r))p.x+=dx;if(this.fits({x:p.x,z:p.z+dz},r))p.z+=dz}
 place(point:Point){if(this.mode!=='playing')return false;if(distance(this.player,point)>5||!this.fits(point,.4)||!segmentClear(this.player,point,this.obstacles,.1)){this.message='אין מקום פנוי בטווח. נסו להתקרב או להקיף את האבן.';return false}this.trap={...point,charge:1,pulse:0};this.message='המלכודת מוכנה. פתו יצור אל הטבעת ואז הפעילו בועה.';this.noteEvent('place-trap');return true}
 toss(point:Point){if(this.mode!=='playing')return false;if(distance(this.player,point)>6||!this.fits(point,.1)||!segmentClear(this.player,point,this.obstacles,.05)){this.message='הזריקה חסומה או רחוקה מדי — הקיפו את המכשול.';return false}this.baits.push({...point,diet:this.diet,age:0,flight:.55,from:{x:this.player.x,z:this.player.z}});if(this.baits.length>3)this.baits.shift();this.noteEvent('bait');this.message=this.diet==='leaf'?'עלה נזרק — אוכלי עלים יגיבו.':'פרי נזרק — אוכלי פירות יגיבו.';return true}
 pulse(){if(this.mode!=='playing'||!this.trap)return false;const trap=this.trap;
 if(trap.charge<1){this.message='הבועה נטענת…';return false}if(distance(this.player,trap)>7||!segmentClear(this.player,trap,this.obstacles,.04)){this.message='התקרבו למלכודת עם קו ראייה פתוח.';return false}
 trap.charge=0;trap.pulse=1;this.noteEvent('pulse');
 const candidates=this.actors.filter(a=>a.mode!=='caught'&&distance(a,trap)<1.06&&segmentClear(a,trap,this.obstacles,.1)).sort((a,b)=>distance(a,trap)-distance(b,trap));
 const actor=candidates[0];if(!actor){this.message='כמעט! הבועה התפוגגה. הפיתיון עדיין יכול לעבוד.';return false}
 this.captureId=actor.spec.id;actor.mode='caught';this.correct=acceptsCapture(this.contract,actor.spec.id);this.attempts++;this.noteEvent('capture',actor.spec.id);this.mode='caught';this.message=this.correct?'לכידה מוצלחת! אפשר להעביר את היצור בבטחה.':this.contract.misconceptionHe;return true;
 }
 release(){if(this.mode!=='caught'||this.correct)return;const actor=this.actors.find(a=>a.spec.id===this.captureId)!;actor.mode='escape';actor.timer=2;actor.destination=this.home(actor.spec);this.captureId=null;this.baits=[];if(this.trap)this.trap.charge=1;this.mode='playing';this.message='היצור שוחרר. אפשר לשנות פיתיון, מיקום ותזמון ולנסות שוב.';this.noteEvent('retry')}
 next(){if(this.mode!=='caught'||!this.correct)return;this.noteEvent('contract-complete',this.captureId!);if(this.level===CONTRACTS.length-1){this.mode='complete';return}this.load(this.level+1);this.mode='notes'}
 resetTrap(){if(this.mode!=='playing')return;this.trap=null;this.baits=[];this.message='המלכודת הוחזרה. E כדי להציב מחדש.';this.noteEvent('reset-trap')}
 restart(){this.noteEvent('restart');this.load(0);this.mode='intro'}
 open(mode:'notes'|'help'|'paused'){if(this.mode!=='playing')return;this.mode=mode;if(mode==='help'){this.hints++;this.noteEvent('hint')}}
 update(dt:number,input:Input={forward:0,strafe:0,turn:0}){
 if(this.mode!=='playing')return;dt=Math.min(dt,.05);this.time+=dt;this.player.yaw+=input.turn*dt*1.8;
 const sin=Math.sin(this.player.yaw),cos=Math.cos(this.player.yaw);let f=input.forward,s=input.strafe;const mag=Math.hypot(f,s);if(mag>1){f/=mag;s/=mag}this.move(this.player,(s*cos-f*sin)*2.7*dt,(-f*cos-s*sin)*2.7*dt,.3);
 if(this.trap){this.trap.charge=Math.min(1,this.trap.charge+dt/.95);this.trap.pulse=Math.max(0,this.trap.pulse-dt*2.4)}
 for(const b of this.baits){b.flight=Math.max(0,b.flight-dt);if(!b.flight)b.age+=dt}this.baits=this.baits.filter(b=>b.age<12);
 for(const a of this.actors){if(a.mode==='caught')continue;a.timer-=dt;
 const lure=this.baits.filter(b=>!b.flight&&b.diet===a.spec.diet&&distance(a,b)<5.8&&segmentClear(a,b,this.obstacles,.16)).sort((b,c)=>distance(a,b)-distance(a,c))[0];
 if(a.mode==='eating'&&a.timer>0)continue;
 if(lure&&a.mode!=='escape'){a.destination=lure;a.mode='lured';if(distance(a,lure)<.16){a.mode='eating';a.timer=2.6;this.baits=this.baits.filter(b=>b!==lure);this.message=`${a.spec.name} לקח את הפיתיון — הפעילו בזמן!`;continue}}
 else if(a.timer<=0||distance(a,a.destination)<.13){a.mode='wander';const phase=this.time*.35+this.actors.indexOf(a)*1.7;const goal={x:this.home(a.spec).x+Math.sin(phase)*.85*(this.variant?-1:1),z:a.spec.spawn[1]+Math.cos(phase)*.65};if(this.fits(goal,.25))a.destination=goal;a.timer=2}
 let dx=a.destination.x-a.x,dz=a.destination.z-a.z;const len=Math.hypot(dx,dz);if(len>.08){const speed=a.spec.usualSpeed*(a.mode==='lured'?1.55:a.mode==='escape'?1.8:1);dx=dx/len*speed*dt;dz=dz/len*speed*dt;const prev={x:a.x,z:a.z};this.move(a,dx,dz,.23);if(distance(prev,a)<.001){this.move(a,-dz*1.7,dx*1.7,.23)}a.angle=Math.atan2(dx,dz)}
 }
 }
 text(){return {coordinateSystem:'ground x east/right, z south; y up; yaw 0 looks north (-z); units metres',mode:this.mode,variant:this.variant,contract:this.level+1,instruction:this.contract.instruction,player:this.player,trap:this.trap,baitType:this.diet,baits:this.baits.map(({x,z,diet,age,flight})=>({x,z,diet,age,flight})),creatures:this.actors.map(a=>({id:a.spec.id,name:a.spec.name,x:+a.x.toFixed(2),z:+a.z.toFixed(2),mode:a.mode,diet:a.spec.diet,usualSpeed:a.spec.usualSpeed,size:a.spec.size,habit:a.spec.habit})),obstacles:this.obstacles,captureId:this.captureId,correct:this.correct,attempts:this.attempts,hints:this.hints,message:this.message,events:this.events.slice(-8)}}
}
