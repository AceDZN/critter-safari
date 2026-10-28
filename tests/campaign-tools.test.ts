import test from 'node:test';
import assert from 'node:assert/strict';
import { SafariSimulation, distance, CALM_SECONDS, type Point, type Actor } from '../src/simulation';
import { WorkbookSession, type HostMessage } from '../src/host';
import { validateObjective } from '../src/semantics';
import { CAPTURE_ORACLES } from './fixtures/campaign-oracles';

const DT = 1 / 60;
const actor = (sim: SafariSimulation, id: string): Actor => {
  const value = sim.actors.find(a => a.spec.id === id);
  assert.ok(value, `independent actor ${id} is present`);
  return value;
};
const reflected = (p: Point, variant: 0 | 1): Point => ({ x: p.x * (variant ? -1 : 1), z: p.z });
function catchAt(sim: SafariSimulation, point: Point, diet: 'leaf' | 'berry', id: string) {
  assert.equal(sim.place(point), true, `clear trap: ${JSON.stringify(point)} ${sim.message}`);
  assert.equal(sim.toss(point, diet), true);
  const start = { x: actor(sim, id).x, z: actor(sim, id).z };
  for (let i = 0; i < 1200 && sim.mode === 'playing'; i++) sim.update(DT);
  assert.equal(sim.mode, 'caught');
  assert.equal(sim.captureId, id, JSON.stringify(sim.text()));
  assert.ok(distance(start, actor(sim, id)) > .15, 'ordinary lure travel precedes capture');
}

test('consumed loose bait releases other approaching animals back into patrol', () => {
  const sim = new SafariSimulation();
  sim.load(10);
  assert.equal(sim.toss({ x: 1, z: 1.4 }, 'berry'), true);
  let sawApproach = false;
  for (let i = 0; i < 1200; i++) {
    sim.update(DT);
    sawApproach ||= sim.actors.some(a => a.mode === 'lured');
  }
  assert.equal(sawApproach, true);
  assert.equal(sim.baits.length, 0);
  assert.ok(sim.actors.every(a => a.mode !== 'lured'), 'no actor is stranded at the vanished food');
  const nib = actor(sim, 'nib'), before = { x: nib.x, z: nib.z };
  sim.advance(.5);
  assert.ok(distance(nib, before) > .1, 'patrol has resumed, rather than only changing its label');
});

test('relocating and immediately refilling a feeder cannot hold an animal at the old bowl', () => {
  const sim = new SafariSimulation();
  sim.load(10);
  assert.equal(sim.placeFeeder({ x: 4, z: -1 }), true);
  assert.equal(sim.toss({ x: 4, z: -1 }, 'berry'), true);
  sim.advance(1);
  assert.equal(actor(sim, 'nib').mode, 'feeding');
  const before = { x: actor(sim, 'nib').x, z: actor(sim, 'nib').z };
  // Two ordinary drops before the next simulation tick reproduce the original
  // lifecycle failure without assigning actor/tool/capture state.
  assert.equal(sim.placeFeeder({ x: -4, z: 1 }), true);
  assert.equal(sim.toss({ x: -4, z: 1 }, 'berry'), true);
  sim.advance(.2);
  assert.notEqual(actor(sim, 'nib').mode, 'feeding');
  assert.ok(distance(actor(sim, 'nib'), sim.feeder!) > 6);
  assert.ok(distance(actor(sim, 'nib'), before) > .05);
});

test('a filled feeder holds an interested rival longer than one ordinary snack, then expires', () => {
  const ordinary = new SafariSimulation(), feeder = new SafariSimulation();
  ordinary.load(10); feeder.load(10);
  const point = { x: 4, z: -1 };
  assert.equal(ordinary.toss(point, 'berry'), true);
  assert.equal(feeder.placeFeeder(point), true);
  assert.equal(feeder.toss(point, 'berry'), true);
  ordinary.advance(3); feeder.advance(3);
  assert.equal(actor(feeder, 'nib').mode, 'feeding');
  assert.ok(distance(actor(feeder, 'nib'), point) < .85);
  assert.notEqual(actor(ordinary, 'nib').mode, 'feeding');
  assert.equal(ordinary.baits.length, 0);
  assert.ok(distance(actor(ordinary, 'nib'), point) > .85, 'ordinary snack no longer holds the rival');
  feeder.advance(8);
  assert.equal(feeder.feeder!.remaining, 0);
  assert.ok(feeder.actors.every(a => a.mode !== 'feeding' && a.mode !== 'lured'));
});

for (const variant of [0, 1] as const) test(`reflection ${variant}: distraction changes the actual first arrival and rescues Pip`, () => {
  for (const useFeeder of [false, true]) {
    const sim = new SafariSimulation(variant);
    sim.load(10); // Authored L11 scenario selection, not a win or target injection.
    if (useFeeder) {
      const feeder = reflected({ x: 4, z: -1 }, variant);
      assert.equal(sim.placeFeeder(feeder), true);
      assert.equal(sim.toss(feeder, 'berry'), true);
    }
    sim.advance(1);
    if (useFeeder) assert.equal(actor(sim, 'nib').mode, 'feeding');
    const target = useFeeder ? 'pip' : 'nib';
    catchAt(sim, reflected({ x: 2.6, z: -.3 }, variant), 'berry', target);
    assert.equal(sim.correct, useFeeder);
    if (!useFeeder) {
      sim.release();
      assert.equal(sim.mode, 'playing');
      assert.equal(sim.rescuedIds.length, 0);
    }
  }
});

test('calming changes measured world travel but never authored usual speed or English truth', () => {
  const control = new SafariSimulation(), slowed = new SafariSimulation();
  control.load(25); slowed.load(25);
  const speed = actor(slowed, 'fern').spec.usualSpeed;
  assert.equal(speed, .90);
  const fern = actor(slowed, 'fern');
  assert.equal(slowed.placeCalm({ x: fern.x, z: fern.z }), true);
  assert.equal(slowed.placeCalm({ x: 3, z: 3 }), false, 'cooldown prevents replacing the live patch');
  const paths = [0, 0];
  for (let i = 0; i < 36; i++) for (const [j, sim] of [control, slowed].entries()) {
    const a = actor(sim, 'fern'), before = { x: a.x, z: a.z };
    sim.update(DT);
    paths[j]! += distance(a, before);
  }
  assert.ok(paths[0]! > .3);
  assert.ok(paths[1]! > .05 && paths[1]! < paths[0]! * .65, `actual path lengths ${paths}`);
  assert.equal(actor(slowed, 'fern').spec.usualSpeed, speed);
  assert.equal(actor(control, 'fern').spec.usualSpeed, speed);
  assert.equal(validateObjective(slowed.contract), 'fern');
  slowed.advance(CALM_SECONDS);
  assert.equal(slowed.calm, null);
  assert.ok(slowed.calmCooldown > 0);
  assert.equal(slowed.placeCalm({ x: -4, z: -2.4 }), false);
  slowed.advance(4);
  assert.equal(slowed.placeCalm({ x: -4, z: -2.4 }), true, 'reusable after actual cooldown');
});

function physicsSnapshot(sim: SafariSimulation) {
  return structuredClone({
    time: sim.time, trap: sim.trap, baits: sim.baits, feeder: sim.feeder,
    calm: sim.calm, calmCooldown: sim.calmCooldown, actors: sim.actors,
  });
}
for (const panel of ['notes', 'help', 'levels', 'paused'] as const) test(`${panel}: all tools, routes, arming and cooldown remain paused`, () => {
  const sim = new SafariSimulation();
  sim.load(25);
  assert.equal(sim.placeFeeder({ x: 4, z: -1 }), true);
  assert.equal(sim.toss({ x: 4, z: -1 }, 'berry'), true);
  assert.equal(sim.placeCalm({ x: -4, z: -2.4 }), true);
  assert.equal(sim.place({ x: -3, z: 0 }), true);
  assert.equal(sim.toss({ x: -3, z: 0 }, 'leaf'), true);
  sim.open(panel);
  const frozen = physicsSnapshot(sim);
  sim.advance(4);
  sim.update(DT);
  assert.equal(sim.place({ x: 3, z: 3 }), false);
  assert.equal(sim.toss({ x: 3, z: 3 }, 'leaf'), false);
  assert.equal(sim.placeFeeder({ x: 3, z: 3 }), false);
  assert.equal(sim.placeCalm({ x: 3, z: 3 }), false);
  assert.deepEqual(physicsSnapshot(sim), frozen);
  sim.resume();
  sim.advance(.1);
  assert.ok(sim.time > frozen.time);
  assert.ok(sim.feeder!.remaining < frozen.feeder!.remaining);
  assert.ok(sim.calm!.remaining < frozen.calm!.remaining);
  assert.ok(sim.calmCooldown < frozen.calmCooldown);
  assert.ok(sim.trap!.arming < frozen.trap!.arming);
  assert.ok(sim.baits[0]!.flight < frozen.baits[0]!.flight);
});

test('tools unlock by campaign progress and retry stays on the same level without erasing earned rescues', () => {
  const sim = new SafariSimulation();
  assert.equal(sim.placeFeeder({ x: 4, z: -1 }), false);
  assert.equal(sim.placeCalm({ x: -4, z: -2.4 }), false);
  catchAt(sim, { x: 0, z: 0 }, 'leaf', 'moss');
  sim.next();
  assert.deepEqual(sim.completedLevels, [1]);
  sim.load(35);
  catchAt(sim, { x: 3, z: 2.3 }, 'leaf', 'reed');
  sim.next();
  assert.deepEqual(sim.rescuedIds, ['reed']);
  sim.restart();
  assert.equal(sim.level, 35);
  assert.equal(sim.objectiveIndex, 0);
  assert.deepEqual(sim.rescuedIds, []);
  assert.deepEqual(sim.completedLevels, [1]);
  assert.equal(sim.completed, 1);
  assert.equal(sim.actors.every(a => a.mode === 'wander'), true);
  assert.equal(sim.feeder, null);
  assert.equal(sim.calm, null);
});

test('a genuine multistage rescue preserves references through wrong-catch recovery and posts completion only at the final catch', () => {
  const sim = new SafariSimulation();
  sim.load(35);
  assert.deepEqual(CAPTURE_ORACLES[35], ['reed', 'tumble']);
  const messages: HostMessage[] = [], session = new WorkbookSession(m => messages.push(m));
  const observe = () => session.sync({ ready: true, level: sim.level + 1, complete: sim.levelCleared, durationMs: sim.time * 1000 });
  const completedMessages = () => messages.filter(m => m.type === 'level-complete');
  observe();
  assert.equal(sim.placeFeeder({ x: 4, z: -1 }), true);
  assert.equal(sim.placeCalm({ x: -5, z: -4 }), true);
  catchAt(sim, { x: 3, z: 2.3 }, 'leaf', 'reed');
  assert.equal(sim.correct, true);
  assert.equal(sim.levelCleared, false);
  observe();
  assert.equal(completedMessages().length, 0);
  sim.next();
  observe();
  assert.equal(sim.objectiveIndex, 1);
  assert.deepEqual(sim.rescuedIds, ['reed']);
  assert.equal(actor(sim, 'reed').mode, 'rescued');
  assert.equal(actor(sim, 'reed').spec.usualSpeed, 1.25, 'the absent deer remains a factual reference');
  assert.equal(sim.feeder, null);
  assert.equal(sim.calm, null);
  assert.equal(sim.calmCooldown, 0);
  assert.equal(validateObjective(sim.contract, sim.objectiveIndex, sim.rescuedIds), 'tumble');
  assert.equal(sim.completed, 0);

  catchAt(sim, { x: -3, z: 2.6 }, 'berry', 'pip');
  assert.equal(sim.correct, false);
  observe();
  assert.equal(completedMessages().length, 0);
  assert.equal(sim.placeFeeder({ x: 4, z: -1 }), false, 'caught review cannot change the world');
  sim.release();
  observe();
  assert.equal(sim.objectiveIndex, 1);
  assert.deepEqual(sim.rescuedIds, ['reed']);
  assert.equal(actor(sim, 'reed').mode, 'rescued');
  sim.advance(2);
  catchAt(sim, { x: 0, z: -3.5 }, 'leaf', 'tumble');
  assert.equal(sim.correct, true);
  assert.equal(sim.levelCleared, true);
  observe(); observe();
  assert.equal(completedMessages().length, 1);
  assert.equal(completedMessages()[0]!.type === 'level-complete' && completedMessages()[0]!.level, 36);
  sim.open('notes'); observe(); sim.resume(); observe();
  assert.equal(completedMessages().length, 1);
  sim.next();
  observe();
  assert.equal(sim.level, 36);
  assert.deepEqual(sim.completedLevels, [36]);
  assert.equal(completedMessages().length, 1);
  assert.deepEqual(messages.filter(m => m.type === 'level-start').map(m => m.level), [36, 37]);
});
