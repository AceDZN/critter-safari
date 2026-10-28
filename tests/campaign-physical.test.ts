import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { replay, type LevelPlan } from "../scripts/solve-campaign";
import { CAPTURE_ORACLES } from "./fixtures/campaign-oracles";
import { SafariSimulation, distance, TRAP_RADIUS } from "../src/simulation";
const plans = JSON.parse(readFileSync(new URL("../docs/verification/campaign-physical-plans.json", import.meta.url), "utf8")) as LevelPlan[];
test("all fifty levels in both layouts have independently matched ordinary-action rescue witnesses", () => {
  assert.equal(plans.length,100);
  assert.equal(new Set(plans.map(p=>`${p.variant}:${p.level}`)).size,100);
  for(const plan of plans) {
    assert.deepEqual(plan.stages.map(s=>s.id),CAPTURE_ORACLES[plan.level-1]);
    const sim=replay(plan);
    assert.equal(sim.completed,1);assert.deepEqual(sim.completedLevels,[plan.level]);
    assert.equal(sim.mode,plan.level===50?"complete":"playing");
  }
});
test("every spawn and a useful number of full-trap placements remain clear in every habitat", () => {
  for(let level=0;level<50;level++)for(const variant of [0,1] as const) {
    const sim=new SafariSimulation(variant);sim.load(level);
    for(const actor of sim.actors)assert.ok(sim.obstacles.every(o=>distance(actor,o)>o.r+.24*actor.spec.size),`spawn ${level+1}:${actor.spec.id}`);
    let clear=0;
    for(let x=-5.5;x<=5.5;x+=.5)for(let z=-3.8;z<=3.8;z+=.5)if(sim.placementIssue({x,z})===null)clear++;
    assert.ok(clear>100,`level${level+1} has usable grass for a ${TRAP_RADIUS} trap`);
  }
});
