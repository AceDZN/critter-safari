import test from 'node:test';
import assert from 'node:assert/strict';
import { SafariSimulation, distance, type Point } from '../src/simulation';
import type { Diet } from '../src/content';

const DT = 1 / 60;
const idle = (sim: SafariSimulation, seconds: number) => {
  for (let frame = 0; frame < Math.ceil(seconds / DT); frame++) sim.update(DT);
};

/** Drive through ordinary movement inputs; no actor, trap or capture state assignment. */
function walk(sim: SafariSimulation, waypoints: readonly Point[]) {
  for (const point of waypoints) {
    let frames = 0;
    while (distance(sim.player, point) > 0.075 && frames++ < 900) {
      const dx = point.x - sim.player.x, dz = point.z - sim.player.z;
      const length = Math.hypot(dx, dz);
      sim.update(DT, { forward: -dz / length, strafe: dx / length, turn: 0 });
    }
    assert.ok(distance(sim.player, point) < 0.09, `reachable walking waypoint ${JSON.stringify(point)}; got ${JSON.stringify(sim.player)}`);
  }
}

// Independent physical plans: target IDs come from the hand-authored answer table,
// never from selectCandidates/validateContract. Offsets are relative to observed
// current positions, as a player placing a lure beside a wandering animal would do.
const PLANS = [
  { level: 0, id: 'moss', diet: 'leaf', via: [{ x: -2.5, z: 3 }], offset: { x: -1.8, z: 0 } },
  { level: 1, id: 'pip', diet: 'berry', via: [{ x: 2.8, z: 3 }], offset: { x: 1.6, z: -1.2 } },
  { level: 2, id: 'tumble', diet: 'leaf', via: [{ x: 3.4, z: 3 }, { x: 3.4, z: 0 }], offset: { x: 1.8, z: 0 } },
  { level: 3, id: 'reed', diet: 'leaf', via: [{ x: -2, z: 3 }, { x: -2, z: -1.5 }], offset: { x: 0, z: -2 } },
  { level: 4, id: 'brin', diet: 'berry', via: [{ x: 4, z: 4 }, { x: 4, z: -1 }], offset: { x: 0, z: -2 } },
] as const;
type Plan = { level: number; id: string; diet: Diet; via: readonly Point[]; offset: Point };

function lureAndCapture(sim: SafariSimulation, plan: Plan) {
  walk(sim, plan.via);
  const target = sim.actors.find((actor) => actor.spec.id === plan.id)!;
  const trapPoint = { x: target.x + plan.offset.x, z: target.z + plan.offset.z };
  const startingDistance = distance(target, trapPoint);
  assert.ok(startingDistance > 1.7, 'the actor begins outside the capture bubble');
  assert.equal(sim.place(trapPoint), true, `place reachable trap for ${plan.id}: ${sim.message}`);
  sim.diet = plan.diet; // Corresponds to the normal bait-type control.
  assert.equal(sim.toss(trapPoint), true, `toss reachable lure for ${plan.id}: ${sim.message}`);
  let sawLured = false;
  for (let frame = 0; frame < 60 * 10; frame++) {
    sim.update(DT);
    if (target.mode === 'lured' || target.mode === 'eating') sawLured = true;
    const nearest = sim.actors.filter((actor) => actor.mode !== 'caught').sort((a, b) => distance(a, trapPoint) - distance(b, trapPoint))[0];
    if (sawLured && distance(target, trapPoint) < 0.75 && nearest?.spec.id === plan.id) {
      assert.equal(sim.pulse(), true, `normal pulse catches ${plan.id}`);
      assert.equal(sim.captureId, plan.id);
      assert.ok(startingDistance - distance(target, trapPoint) > 0.9, 'the lure caused meaningful physical travel');
      assert.ok(sim.events.some((event) => event.type === 'bait'));
      return;
    }
  }
  assert.fail(`No achievable lure/capture for ${plan.id}; ${JSON.stringify(sim.text())}`);
}

for (const variant of [0, 1] as const) for (const basePlan of PLANS) {
  const sign = variant === 1 ? -1 : 1;
  const plan = { ...basePlan, via: basePlan.via.map((p) => ({ x: p.x * sign, z: p.z })), offset: { x: basePlan.offset.x * sign, z: basePlan.offset.z } };
  test(`variant ${variant}, contract ${plan.level + 1}: independently authored target can be lured and captured with normal tools`, () => {
    const sim = new SafariSimulation(variant);
    sim.load(plan.level); // Authored scenario selection only; never browser success injection.
    sim.start();
    lureAndCapture(sim, plan);
    assert.equal(sim.correct, true);
    assert.equal(sim.attempts, 1);
    sim.next();
    assert.equal(sim.mode, plan.level === 4 ? 'complete' : 'notes');
  });
}

test('wrong capture releases safely, clears bait and resets charge before a correct retry', () => {
  const sim = new SafariSimulation();
  sim.start();
  lureAndCapture(sim, { ...PLANS[1], level: 0 }); // Pip is a real, capturable wrong animal in contract 1.
  assert.equal(sim.correct, false);
  assert.equal(sim.mode, 'caught');
  assert.match(sim.message, /eats leaves/);
  sim.next();
  assert.equal(sim.level, 0, 'wrong capture cannot advance the contract');
  sim.release();
  assert.equal(sim.mode, 'playing');
  assert.equal(sim.captureId, null);
  assert.equal(sim.baits.length, 0);
  assert.equal(sim.trap?.charge, 1);
  assert.equal(sim.actors.find((actor) => actor.spec.id === 'pip')!.mode, 'escape');
  assert.ok(sim.events.some((event) => event.type === 'retry'));
  lureAndCapture(sim, PLANS[0]);
  assert.equal(sim.correct, true);
  assert.equal(sim.attempts, 2);
});

test('reading, help and pause freeze movement, lure flight, cooldown and clock', () => {
  for (const panel of ['notes', 'help', 'paused'] as const) {
    const sim = new SafariSimulation();
    sim.start();
    assert.equal(sim.place({ x: 0, z: 3 }), true);
    assert.equal(sim.toss({ x: 0, z: 3 }), true);
    sim.pulse(); // Empty pulse begins an ordinary recharge.
    sim.open(panel);
    const before = JSON.stringify(sim.text());
    idle(sim, 5);
    assert.equal(JSON.stringify(sim.text()), before);
    if (panel === 'help') assert.equal(sim.hints, 1);
    sim.start();
    idle(sim, 0.1);
    assert.ok(sim.time > 0);
  }
});

test('range, collision, line of sight, pulse cooldown and trap reset have consequences', () => {
  const sim = new SafariSimulation();
  sim.start();
  assert.equal(sim.place({ x: 0, z: -3 }), false, 'remote placement fails');
  assert.equal(sim.toss({ x: 7, z: -5 }), false, 'remote toss fails');
  walk(sim, [{ x: 0, z: 2 }]);
  assert.equal(sim.place({ x: 0, z: -2 }), false, 'the central stone blocks placement line of sight');
  assert.equal(sim.toss({ x: 0, z: -2 }), false, 'the central stone blocks a throw');
  for (let i = 0; i < 180; i++) sim.update(DT, { forward: 1, strafe: 0, turn: 0 });
  assert.ok(sim.player.z > 0.3, 'walking cannot cross the central solid stone');
  assert.equal(sim.place({ x: 0, z: 3 }), true);
  assert.equal(sim.pulse(), false, 'empty trap misses');
  assert.equal(sim.trap?.charge, 0);
  assert.equal(sim.pulse(), false, 'a second immediate pulse cannot fire');
  idle(sim, 1);
  assert.equal(sim.trap?.charge, 1);
  sim.resetTrap();
  assert.equal(sim.trap, null);
  assert.equal(sim.baits.length, 0);
});

test('wrong diet does not lure the target; restart returns an intact first contract', () => {
  const sim = new SafariSimulation();
  sim.start();
  walk(sim, PLANS[0].via);
  const moss = sim.actors.find((actor) => actor.spec.id === 'moss')!;
  const point = { x: moss.x - 1.8, z: moss.z };
  sim.diet = 'berry';
  assert.equal(sim.toss(point), true);
  for (let frame = 0; frame < 180; frame++) {
    sim.update(DT);
    assert.notEqual(moss.mode, 'lured');
    assert.notEqual(moss.mode, 'eating');
  }
  sim.open('help');
  sim.restart();
  assert.equal(sim.mode, 'intro');
  assert.equal(sim.level, 0);
  assert.equal(sim.trap, null);
  assert.equal(sim.baits.length, 0);
  assert.equal(sim.attempts, 0);
  assert.equal(sim.hints, 0);
  assert.equal(sim.captureId, null);
  assert.ok(sim.actors.every((actor) => actor.mode === 'wander'));
});


test('field-note usual speed equals ordinary unbaited travel on an unobstructed path', () => {
  const sim = new SafariSimulation();
  sim.start();
  const moss = sim.actors.find((actor) => actor.spec.id === 'moss')!;
  const before = { x: moss.x, z: moss.z };
  sim.update(DT);
  assert.equal(moss.mode, 'wander');
  assert.ok(Math.abs(distance(before, moss) - 0.62 * DT) < 1e-9);
});
