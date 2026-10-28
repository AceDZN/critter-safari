import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createCritterVisual } from '../src/world-art';
import { travelHeading } from '../src/locomotion';
import { SafariSimulation, distance } from '../src/simulation';

// Anatomical oracle from the acquired rig, independent of a declared forward
// vector, Euler yaw, mesh bounding box or an implementation-facing metadata tag.
// Head chain is anterior; the midpoint of the two hind-hip roots is posterior.
const HEAD = 'tripoHead_0';
const HIPS = ['tripo1_Left_Limb_0', 'tripo1_Right_Limb_0'] as const;
const MIN_FORWARD_DOT = .98; // Allow <11.5 degrees of real neck motion; reject strafing.
let sourcePromise: ReturnType<GLTFLoader['parseAsync']> | undefined;
async function source() {
  if (!sourcePromise) {
    const bytes = await readFile(new URL('../public/models/deer.glb', import.meta.url));
    const loader = new GLTFLoader();
    // Image decoding needs a browser. Geometry, bones, skin weights, inverse
    // bind matrices and every original animation channel are genuinely parsed.
    loader.register(() => ({ name: 'heading-test-textures-only', loadTexture: () => Promise.resolve(new THREE.Texture()) }));
    sourcePromise = loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  }
  return sourcePromise;
}
function landmarks(root: THREE.Object3D) {
  const head = root.getObjectByName(HEAD), leftHip = root.getObjectByName(HIPS[0]), rightHip = root.getObjectByName(HIPS[1]);
  assert.ok(head?.isObject3D && leftHip?.isObject3D && rightHip?.isObject3D, 'actual named deer head and two rear hip bones exist');
  assert.equal(head.type, 'Bone'); assert.equal(leftHip.type, 'Bone'); assert.equal(rightHip.type, 'Bone');
  return { head, leftHip, rightHip };
}
function bodyForward(points: ReturnType<typeof landmarks>, worldRoot: THREE.Object3D) {
  worldRoot.updateMatrixWorld(true);
  const anterior = points.head.getWorldPosition(new THREE.Vector3());
  const posterior = points.leftHip.getWorldPosition(new THREE.Vector3()).add(points.rightHip.getWorldPosition(new THREE.Vector3())).multiplyScalar(.5);
  const forward = anterior.sub(posterior); forward.y = 0;
  assert.ok(forward.length() > .1, 'anterior/posterior anatomy has a usable ground-plane direction');
  return forward.normalize();
}
async function visualFixture(size = 1) {
  const raw = await source(), visual = createCritterVisual(raw, 'deer');
  const heading = new THREE.Group(); heading.scale.setScalar(size); heading.add(visual.root);
  const points = landmarks(visual.root);
  assert.ok(visual.clips.length > 0);
  const walk = visual.clips.find(c => c.name === 'preset:quadruped:walk');
  assert.ok(walk);
  assert.ok(walk.tracks.length >= 105, 'actual acquired thirty-five-joint animation is retained');
  visual.mixer.stopAllAction(); visual.mixer.clipAction(walk).reset().play();
  return { visual, heading, points, walk };
}
const directions = [
  { name: 'north +Z', x: 0, z: 1 }, { name: 'east +X', x: 1, z: 0 },
  { name: 'south -Z', x: 0, z: -1 }, { name: 'west -X', x: -1, z: 0 },
  { name: 'diagonal ++', x: 1, z: 1 }, { name: 'diagonal +-', x: 1, z: -1 },
  { name: 'diagonal --', x: -1, z: -1 }, { name: 'diagonal -+', x: -1, z: 1 },
];

test('travelHeading follows all actual displacement directions immediately, preserving a stationary redraw', () => {
  const previous = { x: 2.4, z: -1.7 };
  for (const d of directions) {
    const heading = travelHeading(previous, { x: previous.x + d.x, z: previous.z + d.z }, -2.8);
    const expected = new THREE.Vector3(d.x, 0, d.z).normalize();
    assert.ok(new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading)).dot(expected) > .999999999, d.name);
  }
  // A reversal must face the new motion on its first translating frame. This
  // fails if the old independently eased rotation is reintroduced in the helper.
  const reversed = travelHeading({ x: 0, z: 0 }, { x: 0, z: -1 }, 0);
  assert.ok(Math.cos(reversed) < -.999999999);
  for (const held of [-3.12, -1.8, 0, 2.4, 7.1]) {
    assert.equal(travelHeading(previous, { ...previous }, held), held);
  }
});

test('the actual deer head/hips expose the original -X axis; production assembly faces +Z throughout Walk in eight directions', async () => {
  const raw = await source();
  const rawForward = bodyForward(landmarks(raw.scene), raw.scene);
  assert.ok(rawForward.x < -.98 && Math.abs(rawForward.z) < .15, 'raw acquired mesh anatomy faces -X, rather than the locomotion +Z convention');
  const { visual, heading, points, walk } = await visualFixture(.8);
  let minimum = 1;
  for (const d of directions) {
    const expected = new THREE.Vector3(d.x, 0, d.z).normalize();
    heading.rotation.y = travelHeading({ x: 0, z: 0 }, d, 1.7);
    for (let pose = 0; pose < 257; pose++) {
      visual.mixer.setTime((pose + .371) / 257 * walk.duration);
      const dot = bodyForward(points, heading).dot(expected);
      minimum = Math.min(minimum, dot);
      assert.ok(dot > MIN_FORWARD_DOT, `${d.name} actual Walk pose ${pose}: anatomical forward dot ${dot}`);
    }
  }
  assert.ok(minimum > MIN_FORWARD_DOT);
});

for (const variant of [0, 1] as const) test(`level4 reflection${variant}: thirty seconds of60FPS travel agree with actual deer anatomy through every turn`, async () => {
  const sim = new SafariSimulation(variant); sim.load(3);
  const reed = sim.actors.find(a => a.spec.id === 'reed'); assert.ok(reed);
  const { visual, heading, points } = await visualFixture(reed.spec.size);
  heading.rotation.y = reed.angle;
  let movingFrames = 0, turns = 0, previousDirection = new THREE.Vector3();
  for (let frame = 0; frame < 1800; frame++) {
    const before = { x: reed.x, z: reed.z };
    sim.advance(1 / 60);
    heading.rotation.y = travelHeading(before, reed, heading.rotation.y);
    heading.position.set(reed.x, 0, reed.z);
    if (distance(before, reed) <= .00001) continue;
    visual.mixer.update(1 / 60 * sim.movementMultiplier(reed));
    const travel = new THREE.Vector3(reed.x - before.x, 0, reed.z - before.z).normalize();
    if (movingFrames && previousDirection.dot(travel) < .5) turns++;
    const dot = bodyForward(points, heading).dot(travel);
    assert.ok(dot > MIN_FORWARD_DOT, `frame${frame}, time${sim.time}, dot${dot}: no backwards/sideways translating pose`);
    previousDirection.copy(travel); movingFrames++;
  }
  assert.ok(Math.abs(sim.time - 30) < 1e-7);
  assert.ok(movingFrames > 1500, 'test observes actual ongoing patrol, not a stationary rig');
  assert.ok(turns > 8, 'test includes repeated large direction changes, not only a straight walk');
});

for (const variant of [0, 1] as const) test(`level4 reflection${variant}: mixed manual-sized advances face net rendered travel and zero-time redraw stays still`, async () => {
  const sim = new SafariSimulation(variant); sim.load(3);
  const reed = sim.actors.find(a => a.spec.id === 'reed'); assert.ok(reed);
  const { visual, heading, points } = await visualFixture(reed.spec.size);
  heading.rotation.y = reed.angle;
  const sizes = [.075, .15, .25, 1 / 30, 1 / 60];
  let elapsed = 0, samples = 0;
  while (elapsed < 15 - 1e-8) {
    const dt = Math.min(sizes[samples % sizes.length]!, 15 - elapsed), before = { x: reed.x, z: reed.z };
    sim.advance(dt); elapsed += dt;
    heading.rotation.y = travelHeading(before, reed, heading.rotation.y);
    heading.position.set(reed.x, 0, reed.z);
    if (distance(before, reed) > .00001) {
      visual.mixer.update(dt * sim.movementMultiplier(reed));
      const travel = new THREE.Vector3(reed.x - before.x, 0, reed.z - before.z).normalize();
      assert.ok(bodyForward(points, heading).dot(travel) > MIN_FORWARD_DOT, `mixed-step sample${samples} matches actual rendered displacement`);
    }
    const held = heading.rotation.y;
    assert.equal(travelHeading(reed, reed, held), held, 'zero-time redraw cannot silently repair a different previous heading');
    samples++;
  }
  assert.ok(samples > 100);
});

// The first caught-frame centering teleport is intentionally guarded by main.ts,
// not travelHeading's position-only API. A normal-input browser check of actual
// rendered heading is required for that integration behavior; these units do not
// claim to test a guard by reproducing it in the test harness.
