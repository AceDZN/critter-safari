/** Browser witnesses avoid exact navigation-grid ties and tolerate projection roundoff.
 * Uses the independent English oracle and ordinary actions only. Runtime is unchanged. */
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { SafariSimulation } from "../src/simulation";
import { CAPTURE_ORACLES } from "../tests/fixtures/campaign-oracles";
import { solveStage, type LevelPlan } from "./solve-campaign";

function verify(plan: LevelPlan, dx: number, dz: number, burst: boolean) {
  const sim = new SafariSimulation(plan.variant); sim.load(plan.level - 1);
  for (const stage of plan.stages) {
    for (const action of stage.actions) {
      const p = { x: action.point.x + dx, z: action.point.z + dz };
      const ok = action.tool === "catcher" ? sim.place(p) : action.tool === "feeder" ? sim.placeFeeder(p)
        : action.tool === "calm" ? sim.placeCalm(p) : sim.toss(p, action.tool);
      assert.equal(ok, true, `accepted ${action.tool}: ${sim.message}`);
    }
    for (let i = 0; sim.mode === "playing" && i < 1200; i++) {
      if (burst) for (let t = 0; t < 75; t += 1000 / 60) sim.update(Math.min(1 / 60, (75 - t) / 1000));
      else sim.update(1 / 60);
    }
    assert.equal(sim.captureId, stage.id); assert.equal(sim.correct, true); sim.next();
  }
  assert.deepEqual(sim.completedLevels, [plan.level]);
}
const plans: LevelPlan[] = [];
for (const level of [39, 50]) for (const variant of [0, 1] as const) {
  let selected: LevelPlan | undefined;
  for (const offset of [.003, .007, .013, .019, .031]) {
    try {
      const plan: LevelPlan = { level, variant, stages: [] };
      for (const id of CAPTURE_ORACLES[level - 1]!) plan.stages.push(solveStage(plan, id, offset));
      for (const dx of [-.0001, 0, .0001]) for (const dz of [-.0001, 0, .0001])
        for (const burst of [false, true]) verify(plan, dx, dz, burst);
      selected = plan; console.log(`Verified level ${level}, variant ${variant}, offset ${offset}: 18 perturbation/timing cases`); break;
    } catch (error) { console.log(`Retry level ${level}, variant ${variant}, offset ${offset}: ${String(error).slice(0,100)}`); }
  }
  assert.ok(selected, `Projection-tolerant witness for ${level}/${variant}`); plans.push(selected);
}
writeFileSync("docs/verification/campaign-workbook-plans.json", JSON.stringify(plans, null, 2));
