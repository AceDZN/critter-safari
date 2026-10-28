import test from 'node:test';
import assert from 'node:assert/strict';
import { SafariSimulation, distance, findRoute, segmentClear, type Point } from '../src/simulation';
import type { Diet } from '../src/content';

const DT = 1 / 60;
function idle(sim: SafariSimulation, seconds: number) {
  for (let frame = 0; frame < Math.ceil(seconds / DT); frame++) sim.update(DT);
}

// Independent authored physical plans. IDs come from the curriculum oracle, not
// selectCandidates/validateContract. Calls mirror only ordinary trap/food drops.
const PLANS = [
  { level: 0, id: 'moss', diet: 'leaf', trap: { x: 0, z: 0 } },
  { level: 1, id: 'pebble', diet: 'berry', trap: { x: 0, z: 0 } },
  { level: 2, id: 'reed', diet: 'leaf', trap: { x: 0, z: 0 } },
  { level: 3, id: 'pip', diet: 'berry', trap: { x: 0, z: 0 } },
  { level: 4, id: 'glint', diet: 'berry', trap: { x: 0, z: 0 } },
] as const;
interface Plan { level: number; id: string; diet: Diet; trap: Point }
const reflected = (point: Point, variant: 0 | 1): Point => ({ x: point.x * (variant ? -1 : 1), z: point.z });

function dropAndCapture(sim: SafariSimulation, plan: Plan) {
  const point = reflected(plan.trap, sim.variant);
  const target = sim.actors.find((actor) => actor.spec.id === plan.id)!;
  assert.ok(target, `independent fixture target ${plan.id} exists`);
  const startDistance = distance(target, point);
  assert.ok(startDistance > 1, 'the target begins outside the capture ring');
  assert.equal(sim.place(point), true, `clear trap drop for ${plan.id}: ${sim.message}`);
  assert.equal(sim.phase(), 'drop-food');
  assert.equal(sim.toss(point, plan.diet), true, `food drop for ${plan.id}: ${sim.message}`);
  assert.equal(sim.phase(), 'watch');
  let sawLured = false, nearestBeforeCapture = startDistance;
  for (let frame = 0; frame < 60 * 20 && sim.mode === 'playing'; frame++) {
    sim.update(DT);
    if (target.mode === 'lured' || target.mode === 'eating') {
      sawLured = true;
      nearestBeforeCapture = Math.min(nearestBeforeCapture, distance(target, point));
    }
  }
  assert.equal(sim.mode, 'caught', `auto bubble must complete without pulse/camera/player input: ${JSON.stringify(sim.text())}`);
  assert.equal(sim.captureId, plan.id, `the intended animal must arrive first: ${JSON.stringify(sim.text())}`);
  assert.ok(sawLured, 'preferred food changes actual movement before capture');
  assert.ok(startDistance - nearestBeforeCapture > 0.15, 'the lure produces travel before capture-centering, not just a visual snap');
  assert.ok(sim.events.some((event) => event.type === 'bait'));
}

for (const variant of [0, 1] as const) for (const plan of PLANS) {
  test(`variant ${variant}, contract ${plan.level + 1}: two ordinary drops lure and auto-capture the independent target`, () => {
    const sim = new SafariSimulation(variant);
    sim.load(plan.level); // Authored unit scenario selection, never browser win injection.
    dropAndCapture(sim, plan);
    assert.equal(sim.correct, true);
    assert.equal(sim.attempts, 1);
    sim.next();
    assert.equal(sim.mode, 'playing');
    assert.equal(sim.completed, 1);
    assert.deepEqual(sim.completedLevels, [plan.level + 1]);
  });
}

test('first useful action starts directly in the world, with only two candidate rabbits', () => {
  const sim = new SafariSimulation();
  assert.equal(sim.mode, 'playing');
  assert.equal(sim.phase(), 'place-catcher');
  assert.equal(sim.actors.length, 2);
  assert.ok(sim.actors.every((actor) => actor.spec.archetype === 'rabbit'));
  assert.equal(sim.place({ x: 0, z: 0 }), true);
  assert.equal(sim.phase(), 'drop-food');
  assert.match(sim.message, /גררו/);
});

test('the wrong rabbit is genuinely capturable, release returns the trap to its tray, and a correct retry works', () => {
  const sim = new SafariSimulation();
  dropAndCapture(sim, { level: 0, id: 'pip', diet: 'berry', trap: { x: 0, z: 0 } });
  assert.equal(sim.correct, false);
  assert.match(sim.message, /prefers leaves/);
  sim.next();
  assert.equal(sim.level, 0, 'wrong capture cannot advance the contract');
  sim.release();
  assert.equal(sim.mode, 'playing');
  assert.equal(sim.captureId, null);
  assert.equal(sim.trap, null);
  assert.equal(sim.baits.length, 0);
  assert.equal(sim.phase(), 'place-catcher');
  assert.equal(sim.actors.find((actor) => actor.spec.id === 'pip')!.mode, 'escape');
  idle(sim, 2); // Real release travel clears the trap area; no actor repositioning.
  dropAndCapture(sim, PLANS[0]);
  assert.equal(sim.correct, true);
  assert.equal(sim.attempts, 2);
  assert.ok(sim.events.some((event) => event.type === 'retry'));
});

test('notes, vocabulary help and pause freeze animal travel, bait flight, arming and clock', () => {
  for (const panel of ['notes', 'help', 'paused', 'levels'] as const) {
    const sim = new SafariSimulation();
    assert.equal(sim.place({ x: 0, z: 0 }), true);
    assert.equal(sim.toss({ x: 0, z: 0 }, 'leaf'), true);
    sim.open(panel);
    const before = JSON.stringify({ time: sim.time, world: sim.text() });
    idle(sim, 5);
    assert.equal(JSON.stringify({ time: sim.time, world: sim.text() }), before);
    if (panel === 'help') assert.equal(sim.hints, 1);
    sim.resume();
    idle(sim, 0.1);
    assert.equal(sim.mode, 'playing');
    assert.ok(sim.time > 0);
    assert.ok(sim.trap!.arming < 0.55);
  }
});

test('a drop must land on clear grass, with room for the whole trap and no animal beneath it', () => {
  const sim = new SafariSimulation();
  assert.equal(sim.place({ x: 7, z: 0 }), false, 'outside the arena');
  assert.equal(sim.place({ x: 6, z: 0 }), false, 'trap radius crosses the visible garden edge');
  assert.equal(sim.placementIssue({ x: 6, z: 0 }), 'edge');
  assert.equal(sim.place({ x: 4.8, z: 0 }), true, 'clear grass inside the rails is usable');
  assert.equal(sim.place({ x: -2, z: 0 }), false, 'cannot drop directly onto Moss');
  assert.equal(sim.toss({ x: 7, z: 0 }, 'leaf'), false, 'bait also respects the arena edge');
  sim.load(20);
  assert.equal(sim.place({ x: 0, z: -0.45 }), false, 'solid central stone');
  assert.equal(sim.placementIssue({ x: 0, z: -0.45 }), 'rock');
  assert.equal(sim.toss({ x: 0, z: -0.45 }, 'leaf'), false, 'bait cannot be hidden inside a stone');
  assert.equal(sim.place({ x: 1.6, z: -2.2 }), true);
  assert.equal(sim.toss({ x: 1.6, z: -2.2 }, 'leaf'), true);
  sim.resetTrap();
  assert.equal(sim.trap, null);
  assert.equal(sim.baits.length, 0);
  assert.equal(sim.phase(), 'place-catcher');
});

test('an individual does not follow its non-preferred lure, while the other rabbit reacts', () => {
  const sim = new SafariSimulation();
  const moss = sim.actors.find((actor) => actor.spec.id === 'moss')!;
  const pip = sim.actors.find((actor) => actor.spec.id === 'pip')!;
  assert.equal(sim.toss({ x: 0, z: 0 }, 'berry'), true);
  let pipReacted = false;
  for (let frame = 0; frame < 120; frame++) {
    sim.update(DT);
    assert.notEqual(moss.mode, 'lured');
    assert.notEqual(moss.mode, 'eating');
    if (pip.mode === 'lured' || pip.mode === 'eating') pipReacted = true;
  }
  assert.equal(pipReacted, true);
});

test('a blocked route takes a physical detour around an independently specified stone', () => {
  const from = { x: 1.1, z: .7 }, to = { x: -1.8, z: -1.2 }, rock = { x: .15, z: -.3, r: .62 };
  assert.equal(segmentClear(from, to, [rock], .216), false);
  const route = findRoute(from, to, [rock], .216);
  assert.ok(route.length > 1); assert.deepEqual(route.at(-1), to);
  let previous = from, travelled = 0;
  for (const point of route) { assert.equal(segmentClear(previous, point, [rock], .216), true); travelled += distance(previous, point); previous = point; }
  assert.ok(travelled > distance(from,to));
});

test('field-note usual pace equals ordinary unbaited motion on clear level ground', () => {
  const sim = new SafariSimulation();
  const moss = sim.actors.find((actor) => actor.spec.id === 'moss')!;
  const before = { x: moss.x, z: moss.z };
  sim.update(DT);
  assert.equal(moss.mode, 'wander');
  assert.ok(Math.abs(distance(before, moss) - 0.62 * DT) < 1e-9);
});

test('retry restarts the current level and requires new drops without wiping earned levels', () => {
  const sim = new SafariSimulation();
  dropAndCapture(sim, PLANS[0]);
  sim.next();
  sim.open('help');
  sim.restart();
  assert.equal(sim.mode, 'playing');
  assert.equal(sim.level, 1);
  assert.equal(sim.completed, 1);
  assert.equal(sim.trap, null);
  assert.equal(sim.baits.length, 0);
  assert.equal(sim.attempts, 0);
  assert.equal(sim.hints, 0);
  assert.equal(sim.captureId, null);
  assert.equal(sim.actors.length, 2);
  assert.deepEqual(sim.events.map((event) => event.type), ['restart-level']);
});
