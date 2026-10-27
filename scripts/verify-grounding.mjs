// CPU geometry verification of acquired weighted GLBs and authored rabbit skeletal clips. No GPU required.
// Run from the repository root: node scripts/verify-grounding.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

fs.mkdirSync('work/grounding', {recursive:true});
await build({ entryPoints: ['src/world-art.ts'], bundle: true, format: 'esm', platform: 'node', external: ['three', 'three/*'], define: { 'import.meta.env.BASE_URL': '"./"' }, outfile: 'work/grounding/world-art-verify.mjs' });
// Embedded image decoding is unnecessary for a geometry oracle. The real loader still
// parses every vertex, inverse bind matrix, skin weight, joint and animation channel.
GLTFLoader.prototype.loadAsync = async function(url) {
  const bytes = fs.readFileSync(`public/${url.replace(/^\.\//, '')}`);
  const loader = new GLTFLoader();
  loader.register(() => ({ name: 'geometry-oracle-texture-stub', loadTexture: () => Promise.resolve(new THREE.Texture()) }));
  return loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
};
const rabbitData = JSON.parse(fs.readFileSync('public/models/rabbit-gaits.json', 'utf8'));
const realFetch = globalThis.fetch;
globalThis.fetch = async input => String(input).endsWith('models/rabbit-gaits.json') ? new Response(fs.readFileSync('public/models/rabbit-gaits.json'), {status:200}) : realFetch(input);
const { loadCritter, createGarden } = await import('../work/grounding/world-art-verify.mjs');
const results = [];
for (const kind of ['rabbit', 'deer', 'tortoise']) {
  const visual = await loadCritter(kind), meshes = [];
  visual.root.traverse(node => { if (node.isMesh) meshes.push(node); });
  for (const clip of visual.clips) {
    visual.mixer.stopAllAction(); visual.mixer.clipAction(clip).reset().play();
    const gait = kind === 'rabbit' ? rabbitData.gaits.find(g => g.name === clip.name) : null;
    const feet = gait ? rabbitData.legs.map(leg => ({ name: leg.name, vertices: new Set(leg.vertices), minFloor: Infinity, maxLift: -Infinity, maxPlantError: 0, stanceResidual: [] })) : [];
    const vertex = new THREE.Vector3(); let min = Infinity, max = -Infinity, minPlanted = 4;
    // Sample actual skin between authored keys; physical contacts are independent of the IK generator.
    for (let sample = 0; sample < 601; sample++) {
      const time = (sample + .371) / 601 * clip.duration;
      visual.mixer.setTime(time); visual.root.updateMatrixWorld(true);
      let floor = Infinity;
      const footFloors = feet.map(() => Infinity), footZ = feet.map(() => 0);
      for (const mesh of meshes) for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
        mesh.getVertexPosition(i, vertex).applyMatrix4(mesh.matrixWorld); floor = Math.min(floor, vertex.y);
        for (let f = 0; f < feet.length; f++) if (feet[f].vertices.has(i)) { footFloors[f] = Math.min(footFloors[f], vertex.y); footZ[f] += vertex.z; }
      }
      min = Math.min(min, floor); max = Math.max(max, floor);
      if (gait) {
        minPlanted = Math.min(minPlanted, footFloors.filter(y => y < .002).length);
        for (let f = 0; f < feet.length; f++) {
          const foot = feet[f], phase = (time / clip.duration + gait.phaseOffsets[f]) % 1;
          foot.minFloor = Math.min(foot.minFloor, footFloors[f]); foot.maxLift = Math.max(foot.maxLift, footFloors[f]);
          if (phase > .01 && phase < gait.stanceFraction - .01) {
            foot.maxPlantError = Math.max(foot.maxPlantError, Math.abs(footFloors[f]));
            foot.stanceResidual.push(footZ[f] / foot.vertices.size + gait.nominalSpeed * time - gait.cycleDistance * Math.floor(time / clip.duration + gait.phaseOffsets[f]));
          }
        }
      }
    }
    assert.ok(Math.max(Math.abs(min), Math.abs(max)) < .002, `${kind}/${clip.name}: lowest foot within2mm of y=0`);
    if (gait) {
      assert.equal(clip.tracks.filter(t => t.name.endsWith('.quaternion')).length, 31, 'Author motion on the actual31-joint rabbit rig');
      assert.equal(clip.tracks.length, 34, '31 skeletal quaternion tracks, root/spine position tracks, model support track');
      for (const track of clip.tracks) {
        const width = track.getValueSize();
        for (let i=0;i<width;i++) assert.ok(Math.abs(track.values[i]-track.values[track.values.length-width+i])<1e-5, 'Authored loop endpoints match');
      }
      assert.ok(minPlanted >= (clip.name.endsWith('walk') ? 3 : 2), 'Walk retains three paw plants; trot retains a diagonal support pair');
      for (const foot of feet) {
        foot.stanceSlipRange = Math.max(...foot.stanceResidual) - Math.min(...foot.stanceResidual);
        assert.ok(foot.maxPlantError < .002, `${foot.name} sole plants within2mm`);
        assert.ok(foot.maxLift > .025, `${foot.name} has visible swing clearance`);
        assert.ok(foot.minFloor > -.002, `${foot.name} avoids ground penetration`);
        assert.ok(foot.stanceSlipRange < .006, `${foot.name} stance slips less than6mm at declared nominal travel`);
        delete foot.vertices; delete foot.stanceResidual;
      }
      assert.equal(visual.nominalSpeeds[clip.name], gait.nominalSpeed, 'Runtime exposes the measured constant cadence basis');
    } else assert.equal(clip.tracks.length, ({deer:105,tortoise:96}[kind]) + 1, 'Imported deer/tortoise bone tracks retained plus support');
    const result = {kind, clip:clip.name, authoredRabbit:!!gait, checkedPoses:601, footMinY:min, footMaxY:max, ...(gait ? {nominalSpeed:gait.nominalSpeed,minPlanted,feet} : {})};
    results.push(result); console.log(JSON.stringify(result));
  }
}
for (const variant of [0, 1]) {
  const scene = new THREE.Scene(), garden = createGarden(scene, false, variant, 0);
  scene.updateMatrixWorld(true);
  let ground;
  scene.traverse(node => { if (node.isMesh && node.material.map?.image?.width === 256 && node.geometry.attributes.position.count > 10000) ground = node; });
  assert.ok(ground, 'Find the actual rendered meadow geometry');
  const ray = new THREE.Raycaster(); let maxAbsY = 0;
  for (const x of [-6.8, -5, -2, 0, 2, 5, 6.8]) for (const z of [-5.2, -3, 0, 3, 5.2]) {
    ray.set(new THREE.Vector3(x, 5, z), new THREE.Vector3(0, -1, 0));
    const hit = ray.intersectObject(ground)[0]; assert.ok(hit, 'Playable ground must exist');
    maxAbsY = Math.max(maxAbsY, Math.abs(hit.point.y));
  }
  assert.ok(maxAbsY < 1e-7, 'Rendered support plane matches simulation in both mirrored variants');
  console.log(JSON.stringify({ variant, checkedGroundPoints: 35, maxAbsY }));
  garden.dispose();
}
fs.writeFileSync('work/grounding/verification.json', JSON.stringify(results, null, 2));
