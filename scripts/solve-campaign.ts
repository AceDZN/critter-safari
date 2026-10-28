/** Search ordinary placement actions against an independent English oracle.
 * No actor positions, clocks, capture flags or win states are assigned. */
import { writeFileSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";
import { SafariSimulation, distance, type Point } from "../src/simulation";
import { CAPTURE_ORACLES } from "../tests/fixtures/campaign-oracles";
import type { Diet } from "../src/content";
type Tool = "catcher" | "leaf" | "berry" | "feeder" | "calm";
interface Action { tool: Tool; point: Point }
export interface StagePlan { id: string; actions: Action[]; ticks: number }
export interface LevelPlan { level: number; variant: 0 | 1; stages: StagePlan[] }
function act(sim: SafariSimulation, a: Action) {
  return a.tool === "catcher" ? sim.place(a.point) : a.tool === "feeder" ? sim.placeFeeder(a.point)
    : a.tool === "calm" ? sim.placeCalm(a.point) : sim.toss(a.point, a.tool);
}
export function runActions(sim: SafariSimulation, actions: Action[]) {
  return actions.every(a => act(sim,a));
}
export function runUntilCaught(sim: SafariSimulation, limit = 1200) {
  let ticks = 0;
  while (sim.mode === "playing" && ticks < limit) { sim.update(1/60); ticks++; }
  return ticks;
}
export function replay(plan: LevelPlan, count = plan.stages.length) {
  const sim = new SafariSimulation(plan.variant); sim.load(plan.level-1);
  for (const stage of plan.stages.slice(0,count)) {
    assert.equal(runActions(sim,stage.actions),true);
    for(let tick=0;tick<stage.ticks;tick++)sim.update(1/60);
    assert.equal(sim.captureId,stage.id); assert.equal(sim.correct,true); sim.next();
  }
  return sim;
}
function candidatePoints(sim: SafariSimulation, id: string, offset = 0) {
  const actor = sim.actors.find(a=>a.spec.id===id)!;
  const rivals=sim.actors.filter(a=>a.spec.id!==id&&a.mode!=="rescued"&&a.spec.diet===actor.spec.diet);
  const points: Point[]=[];
  for(const radius of [1.12,1.5,2,2.7])for(let i=0;i<16;i++)points.push({x:actor.x+Math.sin(i/16*Math.PI*2)*radius,z:actor.z+Math.cos(i/16*Math.PI*2)*radius});
  for(let x=-5.4;x<=5.4;x+=1.2)for(let z=-3.6;z<=3.6;z+=1.2)points.push({x,z});
  const score=(p:Point)=>Math.min(20,...rivals.map(a=>distance(a,p)/a.spec.usualSpeed))-distance(actor,p)/actor.spec.usualSpeed;
  return points.map(p=>({x:p.x+offset,z:p.z+offset})).filter(p=>!sim.placementIssue(p)&&distance(actor,p)>.95).sort((a,b)=>score(b)-score(a));
}
export function solveStage(plan: LevelPlan, id: string, offset = 0): StagePlan {
  const initial = replay(plan), target=initial.actors.find(a=>a.spec.id===id)!;
  const points=candidatePoints(initial,id,offset), diet=target.spec.diet;
  const candidates: Action[][] = points.slice(0,40).map(point=>[{tool:"catcher",point},{tool:diet,point}]);
  const rivals=initial.actors.filter(a=>a.spec.id!==id&&a.mode!=="rescued"&&a.spec.diet===diet).sort((a,b)=>b.spec.usualSpeed-a.spec.usualSpeed);
  if(initial.toolkit.feeder)for(const rival of rivals)for(const point of points.slice(0,16)) {
    const dx=rival.x-target.x,dz=rival.z-target.z,len=Math.hypot(dx,dz)||1;
    const bowl={x:rival.x+dx/len*.8,z:rival.z+dz/len*.8};
    if(initial.fits(bowl,.4))candidates.push([{tool:"feeder",point:bowl},{tool:diet,point:bowl},{tool:"catcher",point},{tool:diet,point}]);
  }
  if(initial.toolkit.calm)for(const rival of rivals)for(const point of points.slice(0,16))candidates.push([{tool:"calm",point:{x:rival.x,z:rival.z}},{tool:"catcher",point},{tool:diet,point}]);
  for(const actions of candidates){
    const sim=replay(plan); if(!runActions(sim,actions))continue;
    const before={x:sim.actors.find(a=>a.spec.id===id)!.x,z:sim.actors.find(a=>a.spec.id===id)!.z};
    const ticks=runUntilCaught(sim);
    if(sim.captureId===id&&sim.correct&&distance(before,sim.trap!)>.95)return {id,actions,ticks};
  }
  throw Error(`No ordinary-action witness for level${plan.level}/stage${plan.stages.length+1}, variant${plan.variant}, target${id}`);
}
if(process.argv[1]?.endsWith("solve-campaign.ts")) {
  const plans: LevelPlan[]=[];
  for(const variant of [0,1] as const)for(let i=0;i<CAPTURE_ORACLES.length;i++) {
    const plan:LevelPlan={level:i+1,variant,stages:[]};
    for(const id of CAPTURE_ORACLES[i]!)plan.stages.push(solveStage(plan,id));
    const final = replay(plan);
    assert.equal(final.completed,1);
    assert.deepEqual(final.completedLevels,[i+1]);
    plans.push(plan);console.log(`Verified level${i+1}/50, variant${variant}, ${plan.stages.length} rescues`);
    mkdirSync("work/campaign",{recursive:true});writeFileSync("work/campaign/physical-plans.json",JSON.stringify(plans,null,2));
  }
  mkdirSync("docs/verification",{recursive:true});writeFileSync("docs/verification/campaign-physical-plans.json",JSON.stringify(plans,null,2));
  console.log(`All${plans.length} level/layout witnesses and${plans.reduce((n,p)=>n+p.stages.length,0)} genuine captures passed.`);
}
