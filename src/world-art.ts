import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CLEARING_OBSTACLES, TRANSFER_OBSTACLES } from './simulation';

export interface GardenObstacle { x: number; z: number; r: number }
export interface GardenArt { obstacles: GardenObstacle[]; update(time: number, reducedMotion?: boolean): void; dispose(): void }
export interface CritterVisual { root: THREE.Group; mixer: THREE.AnimationMixer; clips: THREE.AnimationClip[]; nominalSpeeds?: Record<string, number> }

const palette = { soil: 0x59412e, moss: 0x486633, lightMoss: 0x788a49, leaf: 0x315d34, youngLeaf: 0x62843b, bark: 0x72533a, stone: 0x9c9b73 };
function rng(seed: number) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; }; }
function material(color: number, roughness = .87) { return new THREE.MeshStandardMaterial({ color, roughness }); }

/** Small deterministic, original texture fields; no external image dependency. */
function organicTexture(kind: 'soil' | 'moss' | 'leaf', size: number, repeatX = 1, repeatY = repeatX) {
  const rgb = new Uint8Array(size * size * 4), heights = new Uint8Array(size * size * 4);
  const hash = (x: number, y: number) => {
    let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ 0x45d9f3b;
    h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967295;
  };
  const smoothNoise = (x: number, y: number, frequency: number) => {
    const px = x * frequency, py = y * frequency, ix = Math.floor(px), iy = Math.floor(py);
    const fx = px - ix, fy = py - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const mix = (a: number, b: number, t: number) => a + (b - a) * t;
    const f = (a: number, b: number) => hash((a + frequency) % frequency, (b + frequency) % frequency);
    return mix(mix(f(ix, iy), f(ix + 1, iy), sx), mix(f(ix, iy + 1), f(ix + 1, iy + 1), sx), sy);
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size, v = y / size, grain = hash(x, y);
    const broad = smoothNoise(u, v, 5), fine = smoothNoise(u, v, 28);
    let r: number, g: number, b: number, height: number;
    if (kind === 'soil') {
      // Damp earth, pale grains and tiny dark crevices, without a painted grid.
      const pebble = grain > .973 ? 23 : grain < .075 ? -19 : 0;
      const variation = broad * 22 + fine * 18 + (grain - .5) * 24 + pebble;
      r = 58 + variation; g = 40 + variation * .76; b = 27 + variation * .5;
      height = 82 + fine * 82 + grain * 54 + pebble;
    } else if (kind === 'moss') {
      const fibre = Math.pow(Math.max(0, Math.sin(u * 290 + fine * 13) * Math.sin(v * 230 + broad * 11)), 3);
      r = 37 + broad * 32 + fibre * 27 + grain * 10;
      g = 62 + broad * 34 + fibre * 36 + grain * 12;
      b = 24 + fine * 20 + fibre * 8;
      height = 72 + fine * 80 + fibre * 80;
    } else {
      // Central and angled side veins stay subdued enough for natural leaves.
      const center = Math.exp(-Math.pow((u - .5) * 88, 2));
      const side = Math.pow(Math.max(0, Math.cos((v + Math.abs(u - .5) * 1.8) * 92)), 22) * (1 - Math.abs(u - .5) * 1.8);
      const veins = center * .7 + side * .28;
      r = 47 + broad * 24 + veins * 20; g = 91 + broad * 34 + veins * 26; b = 35 + fine * 18;
      height = 105 + fine * 20 + veins * 90;
    }
    const i = (y * size + x) * 4;
    rgb[i] = r; rgb[i + 1] = g; rgb[i + 2] = b; rgb[i + 3] = 255;
    heights[i] = heights[i + 1] = heights[i + 2] = height; heights[i + 3] = 255;
  }
  const make = (data: Uint8Array, color: boolean) => {
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(repeatX, repeatY);
    texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter; texture.generateMipmaps = true;
    if (color) texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true; return texture;
  };
  return { color: make(rgb, true), height: make(heights, false) };
}

/** Author-created terrain and props. Characters remain local Tripo assets. */
export function createGarden(scene: THREE.Scene, transfer = false, variant: 0 | 1 = 0, stage = 0): GardenArt {
  const group = new THREE.Group(); group.name = 'authored-terrarium'; scene.add(group);
  group.scale.x = variant === 1 ? -1 : 1;
  const random = rng(transfer ? 412 : 41);
  const retiredGeometries = new Set<THREE.BufferGeometry>();
  // Bake each static part's transform into one non-indexed geometry per material.
  // Plant roots are batched separately so their subtle sway remains independent.
  function batchMeshes(root: THREE.Group, excluded = new Set<THREE.Object3D>()) {
    root.updateWorldMatrix(true, true);
    const inverse = root.matrixWorld.clone().invert();
    const buckets = new Map<string, { material: THREE.Material; cast: boolean; receive: boolean; parts: THREE.BufferGeometry[]; meshes: THREE.Mesh[] }>();
    function visit(o: THREE.Object3D) {
      if (excluded.has(o) || o instanceof THREE.InstancedMesh || o instanceof THREE.Points) return;
      if (o instanceof THREE.Mesh && !Array.isArray(o.material)) {
        const key = `${o.material.uuid}:${o.castShadow}:${o.receiveShadow}`;
        let bucket = buckets.get(key);
        if (!bucket) { bucket = { material: o.material, cast: o.castShadow, receive: o.receiveShadow, parts: [], meshes: [] }; buckets.set(key, bucket); }
        const part = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
        part.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
        bucket.parts.push(part); bucket.meshes.push(o); retiredGeometries.add(o.geometry);
      }
      for (const child of o.children) visit(child);
    }
    for (const child of root.children) visit(child);
    for (const bucket of buckets.values()) {
      const geometry = mergeGeometries(bucket.parts, false);
      if (!geometry) throw new Error('Environment geometry batch attributes must match.');
      const merged = new THREE.Mesh(geometry, bucket.material); merged.castShadow = bucket.cast; merged.receiveShadow = bucket.receive; merged.name = 'batched-environment'; root.add(merged);
      for (const old of bucket.meshes) old.removeFromParent();
      for (const part of bucket.parts) part.dispose();
    }
  }
  const mats = {
    soil: material(palette.soil), moss: material(palette.moss), leaf: material(palette.leaf),
    lightMoss: material(palette.lightMoss), youngLeaf: material(palette.youngLeaf), bark: material(palette.bark),
    barkLight: material(0x987151), stone: material(palette.stone), stem: material(0x477b34), flowerWhite: material(0xf4eedb), flowerGold: material(0xe9bd45), flowerLilac: material(0xa2a0d9),
    water: new THREE.MeshPhysicalMaterial({ color: 0x8bbca4, transparent: true, opacity: .53, roughness: .12, metalness: .08, clearcoat: 1 }),
    dew: new THREE.MeshPhysicalMaterial({ color: 0xc4f1df, transparent: true, opacity: .74, roughness: .05, metalness: .12, clearcoat: 1 }),
  };
  const soilTexture = organicTexture('soil', 256, 13, 11);
  const mossTexture = organicTexture('moss', 128, 2);
  const leafTexture = organicTexture('leaf', 128);
  const textures = [soilTexture.color, soilTexture.height, mossTexture.color, mossTexture.height, leafTexture.color, leafTexture.height];
  Object.assign(mats.soil, { color: new THREE.Color(0xffffff), map: soilTexture.color, bumpMap: soilTexture.height, bumpScale: .045, roughness: .98 });
  Object.assign(mats.moss, { color: new THREE.Color(0xffffff), map: mossTexture.color, bumpMap: mossTexture.height, bumpScale: .028, roughness: .98 });
  Object.assign(mats.lightMoss, { color: new THREE.Color(0xd1d7a3), map: mossTexture.color, bumpMap: mossTexture.height, bumpScale: .028, roughness: .98 });
  Object.assign(mats.leaf, { color: new THREE.Color(0xe4edcc), map: leafTexture.color, bumpMap: leafTexture.height, bumpScale: .022, roughness: .8 });
  Object.assign(mats.youngLeaf, { color: new THREE.Color(0xf1e6a1), map: leafTexture.color, bumpMap: leafTexture.height, bumpScale: .022, roughness: .82 });
  // A single authored meadow map gives the fixed camera a green clearing and a soft dirt trail.
  const meadowBytes = new Uint8Array(256 * 256 * 4);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const wx = (x / 255 - .5) * 20, wz = (y / 255 - .5) * 18;
    let h = Math.imul(x + 17, 374761393) ^ Math.imul(y + 31, 668265263); h = Math.imul(h ^ h >>> 13, 1274126177); const grain = ((h ^ h >>> 16) >>> 0) / 4294967295 - .5;
    const trail = Math.exp(-Math.pow((wx - Math.sin(wz * .7) * 1.35) / .67, 2));
    const variation = Math.sin(wx * 1.4 + wz * .6) * 2 + grain * 5;
    const i = (y * 256 + x) * 4;
    meadowBytes[i] = 61 + variation + trail * 49; meadowBytes[i + 1] = 98 + variation - trail * 18; meadowBytes[i + 2] = 29 + variation * .4 + trail * 14; meadowBytes[i + 3] = 255;
  }
  const meadowMap = new THREE.DataTexture(meadowBytes, 256, 256, THREE.RGBAFormat); meadowMap.colorSpace = THREE.SRGBColorSpace; meadowMap.magFilter = THREE.LinearFilter; meadowMap.minFilter = THREE.LinearMipmapLinearFilter; meadowMap.generateMipmaps = true; meadowMap.needsUpdate = true; textures.push(meadowMap); mats.soil.map = meadowMap; mats.soil.bumpMap = null;
  function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; group.add(m); return m;
  }
  const groundGeo = new THREE.PlaneGeometry(20, 18, 48, 40); groundGeo.rotateX(-Math.PI / 2);
  const p = groundGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    // Actor support and picking both use y=0. Keep the entire area inside the
    // rails, plus a paw-width margin, exactly on that plane. Relief starts outside.
    const x = p.getX(i), z = p.getZ(i), edge = Math.max(0, Math.abs(x) - 7.3, Math.abs(z) - 5.8);
    const relief = Math.sin(x * .7) * Math.cos(z * .82) * .035 + (random() - .5) * .035;
    p.setY(i, edge * .22 + relief * Math.min(1, edge / .7));
  }
  groundGeo.computeVertexNormals(); mesh(groundGeo, mats.soil, 0, 0, 0).castShadow = false;
  // Low timber rails frame the open clearing instead of forming an overhead tunnel.
  const fenceGeo = new THREE.BoxGeometry(.14, .85, .14);
  const fence = new THREE.InstancedMesh(fenceGeo, mats.barkLight, 18);
  const fenceDummy = new THREE.Object3D();
  for (let i = 0; i < 18; i++) { const side = i < 9 ? -1 : 1; fenceDummy.position.set((i % 9 - 4) * 1.6, .37, side * 5.25); fenceDummy.rotation.z = (random() - .5) * .03; fenceDummy.updateMatrix(); fence.setMatrixAt(i, fenceDummy.matrix); }
  fence.castShadow = true; fence.receiveShadow = true; group.add(fence);
  for (const z of [-5.25, 5.25]) for (const y of [.23, .58]) mesh(new THREE.BoxGeometry(13.4, .075, .075), mats.barkLight, 0, y, z);
  for (const x of [-7.5, 7.5]) { const tree = mesh(new THREE.CylinderGeometry(.32, .55, 6.8, 9), mats.bark, x, 3.1, -5.9); tree.rotation.z = x > 0 ? -.04 : .04; }
  const mossGeo = new THREE.SphereGeometry(1, 12, 8);
  const mossPositions = mossGeo.attributes.position;
  for (let i = 0; i < mossPositions.count; i++) {
    const x = mossPositions.getX(i), y = mossPositions.getY(i), z = mossPositions.getZ(i);
    const lobe = 1 + Math.sin(x * 7 + z * 5) * .09 + Math.cos(y * 8 - z * 6) * .07;
    mossPositions.setXYZ(i, x * lobe, y * (1 + Math.sin(x * 11 + z * 8) * .1), z * lobe);
  }
  mossGeo.computeVertexNormals();
  const moss = new THREE.InstancedMesh(mossGeo, mats.moss, 220); moss.receiveShadow = true; moss.castShadow = true;
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  for (let i = 0; i < 220; i++) {
    const x = (random() - .5) * 17, z = (random() - .5) * 13;
    const inCenter = Math.abs(x) < 3.5 && Math.abs(z) < 2.5; const radius = (.07 + random() * .13) * (inCenter ? (random() < .12 ? .2 : 0) : 1); dummy.position.set(x, -.025, z); dummy.scale.set(radius, radius ? .025 + radius * .3 : 0, radius * (.7 + random() * .55)); dummy.rotation.y = random() * 6.28; dummy.updateMatrix(); moss.setMatrixAt(i, dummy.matrix);
    color.setHSL(.23 + random() * .03, .06, .78 + random() * .18); moss.setColorAt(i, color);
  }
  group.add(moss);
  // Fine grass is instanced, leaving the observation clearing readable.
  const blade = new THREE.ConeGeometry(.045, .29, 3); blade.translate(0, .145, 0);
  const grass = new THREE.InstancedMesh(blade, mats.youngLeaf, 500);
  for (let i = 0; i < 500; i++) {
    const x = (random() - .5) * 16, z = (random() - .5) * 12;
    dummy.position.set(x, -.03, z); dummy.scale.setScalar((.3 + random() * .4) * (Math.abs(x) < 3.5 && Math.abs(z) < 2.5 ? .26 : 1)); dummy.rotation.set((random() - .5) * .5, random() * 6.28, (random() - .5) * .5); dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix);
  }
  group.add(grass);
  const leafGeo = new THREE.SphereGeometry(1, 12, 8); leafGeo.scale(.48, .085, 1.25);
  const sway: THREE.Group[] = [];
  function plant(x: number, z: number, scale: number, leaves = 5) {
    const plantRoot = new THREE.Group(); plantRoot.position.set(x, -.03, z); plantRoot.scale.setScalar(scale); group.add(plantRoot);
    for (let j = 0; j < leaves; j++) {
      const theta = j / leaves * Math.PI * 2 + random() * .35;
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(.026, .047, 1.05, 5), mats.leaf); stalk.castShadow = stalk.receiveShadow = true; stalk.position.set(Math.sin(theta) * .23, .5, Math.cos(theta) * .23); stalk.rotation.z = -Math.sin(theta) * .42; stalk.rotation.x = Math.cos(theta) * .42; plantRoot.add(stalk);
      const leaf = new THREE.Mesh(leafGeo, j % 2 ? mats.leaf : mats.youngLeaf); leaf.position.set(Math.sin(theta) * .64, .98 + (j % 2) * .17, Math.cos(theta) * .64); leaf.rotation.set(-.33, theta, .1); leaf.castShadow = true; leaf.receiveShadow = true; plantRoot.add(leaf);
      // A visible central vein provides scale and a natural material cue.
      const vein = new THREE.Mesh(new THREE.CylinderGeometry(.012, .024, 1.7, 4), mats.leaf); vein.castShadow = vein.receiveShadow = true; vein.rotation.set(Math.PI / 2 - .23, 0, 0); vein.position.copy(leaf.position); vein.rotation.y = theta; plantRoot.add(vein);
    }
    batchMeshes(plantRoot);
    sway.push(plantRoot);
  }
  for (let i = 0; i < 14; i++) {
    const theta = i / 14 * Math.PI * 2;
    plant(Math.sin(theta) * (6.7 + random() * .6), Math.cos(theta) * (4.8 + random() * .5), .3 + random() * .18, 3);
  }
  // Restrained daisies and small woodland flowers brighten selected border pockets.
  const petalParts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const petal = new THREE.SphereGeometry(.055, 6, 4); petal.scale(1, .2, .6); petal.rotateY(-a); petal.translate(Math.cos(a) * .055, 0, Math.sin(a) * .055); petalParts.push(petal); }
  const flowerGeo = mergeGeometries(petalParts, false)!; petalParts.forEach(g => g.dispose());
  const flowerStems = new THREE.InstancedMesh(new THREE.CylinderGeometry(.008, .012, .23, 4), mats.stem, 42);
  const flowerCenters = new THREE.InstancedMesh(new THREE.SphereGeometry(.027, 6, 4), mats.flowerGold, 42);
  const flowerMeshes = [mats.flowerWhite, mats.flowerGold, mats.flowerLilac].map(mat => new THREE.InstancedMesh(flowerGeo, mat, 14));
  for (let i = 0; i < 42; i++) {
    const a = i / 42 * Math.PI * 2 + random() * .14, x = Math.sin(a) * (5.8 + random() * .55), z = Math.cos(a) * (4.05 + random() * .45), y = .16 + random() * .13;
    dummy.position.set(x, y, z); dummy.rotation.set(0, random() * 6.28, 0); dummy.scale.setScalar(.8 + random() * .35); dummy.updateMatrix(); flowerMeshes[i % 3].setMatrixAt(Math.floor(i / 3), dummy.matrix);
    dummy.position.y = y + .02; dummy.scale.setScalar(1); dummy.updateMatrix(); flowerCenters.setMatrixAt(i, dummy.matrix);
    dummy.position.y = y - .115; dummy.scale.set(1, y / .23 * 1.4, 1); dummy.updateMatrix(); flowerStems.setMatrixAt(i, dummy.matrix);
  }
  group.add(flowerStems, flowerCenters, ...flowerMeshes);
  const obstacles: GardenObstacle[] = stage < 2 ? [] : (transfer ? TRANSFER_OBSTACLES : CLEARING_OBSTACLES).map(o => ({...o}));
  for (const o of obstacles) {
    const rock = mesh(new THREE.IcosahedronGeometry(o.r, 1), mats.stone, o.x, .25, o.z); rock.scale.set(1, .58, .87); rock.rotation.set(.1, random() * 3, .2);
    for (let j = 0; j < 5; j++) { const m = mesh(mossGeo, mats.lightMoss, o.x + (random() - .5) * .8, .49, o.z + (random() - .5) * .6); m.scale.set(.2, .14, .17); }
  }
  // Fallen twig gives a local trap landmark without blocking the center lane.
  const twig = new THREE.Group(); twig.position.set(-3.1, .12, -4.55); twig.rotation.y = -.48; group.add(twig);
  const wood = new THREE.Mesh(new THREE.CylinderGeometry(.13, .18, 2.5, 9), mats.bark); wood.rotation.z = Math.PI / 2; wood.castShadow = true; wood.receiveShadow = true; twig.add(wood);
  for (const side of [-1, 1]) { const end = new THREE.Mesh(new THREE.CylinderGeometry(.118, .118, .012, 12), mats.barkLight); end.rotation.z = Math.PI / 2; end.position.x = side * 1.253; twig.add(end); }
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(.035, .065, .75, 6), mats.bark); branch.position.set(-.3, .17, .23); branch.rotation.x = 1; branch.rotation.z = .8; twig.add(branch);
  // Earth is painted into the meadow texture; flat overlay disks clipped the uneven terrain.
  for (let i = 0; i < 45; i++) {
    const x = (random() - .5) * 16, z = (random() - .5) * 12;
    if (Math.abs(x) < 6.2 && Math.abs(z) < 4.5) continue;
    const rock = mesh(new THREE.IcosahedronGeometry(.25 + random() * .3, 1), i % 3 ? mats.stone : mats.bark, x, .05 + random() * .12, z); rock.scale.y = .45; rock.rotation.set(random(), random(), random());
  }
  const dewGeo = new THREE.SphereGeometry(.045, 7, 5);
  for (let i = 0; i < 24; i++) { const theta = random() * Math.PI * 2; mesh(dewGeo, mats.dew, Math.sin(theta) * (7.5 + random() * 2), .14 + random() * .12, Math.cos(theta) * (6.4 + random() * 2)).castShadow = false; }
  const motes = new THREE.Group(); group.add(motes);
  const moteMat = new THREE.PointsMaterial({ color: 0xffffbd, transparent: true, opacity: .65, size: .04, sizeAttenuation: true, depthWrite: false });
  const motePositions = new Float32Array(18 * 3), moteBaseY = new Float32Array(18);
  for (let i = 0; i < 18; i++) { motePositions[i * 3] = (random() - .5) * 17; motePositions[i * 3 + 1] = moteBaseY[i] = .5 + random() * 3; motePositions[i * 3 + 2] = (random() - .5) * 15; }
  const moteGeo = new THREE.BufferGeometry(); moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
  motes.add(new THREE.Points(moteGeo, moteMat));
  batchMeshes(group, new Set<THREE.Object3D>([...sway, motes]));
  const liveGeometries = new Set<THREE.BufferGeometry>();
  group.traverse(o => { if (o instanceof THREE.Mesh || o instanceof THREE.Points) liveGeometries.add(o.geometry); });
  for (const geometry of retiredGeometries) if (!liveGeometries.has(geometry)) geometry.dispose();
  leafGeo.dispose(); dewGeo.dispose();
  group.userData.optimization = { plantMeshesPerRoot: 2, staticMaterialBatches: true, moteDraws: 1 };
  return {
    obstacles: obstacles.map(o => ({ ...o, x: variant === 1 ? -o.x : o.x })),
    update(time, reducedMotion = false) { if (reducedMotion) return; sway.forEach((p, i) => { p.rotation.z = Math.sin(time * .6 + i) * .014; }); for (let i = 0; i < 18; i++) motePositions[i * 3 + 1] = moteBaseY[i] + Math.sin(time * .3 + i) * .16; moteGeo.attributes.position.needsUpdate = true; },
    dispose() { for (const geometry of liveGeometries) geometry.dispose(); Object.values(mats).forEach(m => m.dispose()); textures.forEach(t => t.dispose()); moteMat.dispose(); scene.remove(group); },
  };
}

export type CritterKind = 'rabbit' | 'deer' | 'tortoise';
export const CRITTER_ASSETS: Record<CritterKind, { file: string; bytes: number; joints: number; clips: string[]; motionFile?: string } | null> = {
  rabbit: { file: 'rabbit.glb', bytes: 1195884, joints: 31, clips: ['authored:rabbit:quadruped-walk', 'authored:rabbit:quadruped-trot'], motionFile: 'rabbit-gaits.json' },
  deer: { file: 'deer.glb', bytes: 1263100, joints: 35, clips: ['preset:quadruped:walk'] },
  tortoise: { file: 'tortoise.glb', bytes: 1402120, joints: 32, clips: ['preset:quadruped:walk'] },
};
export const TRIPO_ASSETS_READY = Object.values(CRITTER_ASSETS).every(Boolean);
const loader = new GLTFLoader();
const critterCache = new Map<string, Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }>>();
type CritterSource = { scene: THREE.Group; animations: THREE.AnimationClip[] };
type RabbitGaits = { sourceSHA256: string; normalizationHeight: number; gaits: { name: string; nominalSpeed: number; clip: THREE.AnimationClipJSON }[] };
type GroundedClips = { clips: THREE.AnimationClip[]; samples: number; sourceFloorRange?: [number, number]; nominalSpeeds?: Record<string, number> };
const groundingCache = new WeakMap<THREE.Group, GroundedClips>();
let rabbitGaitsCache: Promise<RabbitGaits> | null = null;
function cachedRabbitGaits() {
  if (!rabbitGaitsCache) rabbitGaitsCache = fetch(`${import.meta.env.BASE_URL}models/${CRITTER_ASSETS.rabbit!.motionFile}`).then(async response => {
    if (!response.ok) throw new Error('Rabbit skeletal gait data is unavailable');
    const data = await response.json() as RabbitGaits;
    if (data.sourceSHA256 !== 'a374444210a92c13801841c55d837be650e86a0ae508df0a7f33bb8fae11207c' || data.normalizationHeight !== 1.1 || data.gaits.length !== 2) throw new Error('Rabbit gait data does not match the acquired rig');
    return data;
  });
  return rabbitGaitsCache;
}

function normalizeCritter(model: THREE.Group, kind: CritterKind) {
  const bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3());
  const targetHeight = kind === 'deer' ? 1.45 : kind === 'tortoise' ? .65 : 1.1;
  model.scale.multiplyScalar(targetHeight / Math.max(size.y, .01));
  const adjusted = new THREE.Box3().setFromObject(model), center = adjusted.getCenter(new THREE.Vector3());
  model.position.x -= center.x; model.position.z -= center.z; model.position.y -= adjusted.min.y;
}

/** Offline measurements of the acquired GLBs at normalized scale (120 Hz).
 * Each value is the whole-model Y support offset for the actual skinned Walk pose.
 * Deer/tortoise raw GLBs and source bone tracks remain unchanged. Recheck with
 * node scripts/verify-grounding.mjs after replacing a model or changing its scale.
 */
const WALK_SUPPORT: Record<'deer' | 'tortoise', { duration: number; sourceFloorRange: [number, number]; values: number[] }> = {
  deer: {
    duration: 2.5833332538604736,
    sourceFloorRange: [-0.16178696663164432, -0.039718323988558055],
    values: [
      0.0453333, 0.0458838, 0.0464302, 0.0469724, 0.0475104, 0.0480441, 0.0502676, 0.0523804, 0.0543817, 0.0562707, 0.0580467, 0.0594015,
      0.0605659, 0.0615379, 0.0623155, 0.062897, 0.0641048, 0.0651373, 0.0659919, 0.0666657, 0.0671563, 0.0682425, 0.0691842, 0.0699796,
      0.0706267, 0.0711238, 0.0715423, 0.0718824, 0.0721442, 0.0723276, 0.0724325, 0.0722027, 0.0718171, 0.0712758, 0.0705793, 0.0697277,
      0.0696812, 0.0693514, 0.0687378, 0.0678399, 0.0666573, 0.0664973, 0.0656518, 0.0641215, 0.0678112, 0.0730599, 0.0849136, 0.0959285,
      0.106082, 0.1153547, 0.12373, 0.1317435, 0.1392359, 0.1461933, 0.1526033, 0.1584542, 0.1566124, 0.154493, 0.1520953, 0.1494186,
      0.1464628, 0.1429677, 0.1392101, 0.1351902, 0.1309084, 0.1263651, 0.1241211, 0.1217613, 0.1192851, 0.1166925, 0.1139832, 0.1125357,
      0.1110189, 0.1094328, 0.1077772, 0.106052, 0.1048561, 0.1035887, 0.1022495, 0.1008385, 0.0993556, 0.0972601, 0.0949995, 0.0925745,
      0.0899857, 0.0877942, 0.0873892, 0.0865377, 0.0852386, 0.083491, 0.0812949, 0.0804949, 0.0789689, 0.0767174, 0.0737428, 0.0700487,
      0.0679379, 0.0645054, 0.060209, 0.0546623, 0.0484941, 0.0451697, 0.0415966, 0.0405592, 0.0430506, 0.0453329, 0.04643, 0.0475102,
      0.0485736, 0.04962, 0.0506495, 0.0525803, 0.0543816, 0.0560526, 0.0575924, 0.0590002, 0.0602956, 0.0614013, 0.0623152, 0.0630351,
      0.063559, 0.0648218, 0.0659176, 0.0668437, 0.0675975, 0.0681763, 0.0691837, 0.0700539, 0.0707854, 0.0713764, 0.0718253, 0.0720263,
      0.072144, 0.0721788, 0.0721308, 0.0720001, 0.0716959, 0.0712223, 0.0705793, 0.0697671, 0.0687861, 0.069012, 0.0688818, 0.0683945,
      0.0675492, 0.0663458, 0.0656522, 0.0641357, 0.0695231, 0.0755514, 0.0811193, 0.0940817, 0.1060881, 0.1171041, 0.1270995, 0.1360477,
      0.1419297, 0.1474512, 0.1526055, 0.1573859, 0.1617866, 0.1587315, 0.155281, 0.1514352, 0.147195, 0.1425615, 0.1392127, 0.1356384,
      0.1318386, 0.1278135, 0.1235633, 0.1214757, 0.1192844, 0.1169892, 0.1145899, 0.1120863, 0.110716, 0.1092796, 0.1077769, 0.1062078,
      0.1045721, 0.1034417, 0.1022287, 0.1009332, 0.099555, 0.098094, 0.094996, 0.0916534, 0.0881505, 0.0875153, 0.0867182, 0.0862225,
      0.0852382, 0.0837641, 0.0817995, 0.0793445, 0.0782571, 0.0763891, 0.0737426, 0.0703216, 0.0661317, 0.0634747, 0.0599384, 0.0554075,
      0.050371, 0.0442999, 0.0415967, 0.0399036, 0.0418308, 0.0436407, 0.0453328, 0.0469721, 0.0485736, 0.0501369, 0.051662, 0.0531487,
      0.054789, 0.0562706, 0.0575924, 0.0587536, 0.0597531, 0.0611182, 0.0623002, 0.0632963, 0.0641042, 0.0647214, 0.0659175, 0.0669502,
      0.0678171, 0.0685155, 0.0690431, 0.0699795, 0.0707856, 0.0714601, 0.0720016, 0.0724086, 0.0724202, 0.0723274, 0.0721307, 0.0718303,
      0.0714267, 0.0712987, 0.0709653, 0.0704261, 0.069681, 0.06873, 0.0688817, 0.0686325, 0.0679813, 0.0669277, 0.0654717, 0.0641217,
      0.0695266, 0.0763706, 0.0826899, 0.088482, 0.1024716, 0.1153591, 0.1270954, 0.1376364, 0.1469433, 0.14962, 0.152126, 0.1544594,
      0.1566183, 0.1586005, 0.155286, 0.1516031, 0.1475521, 0.1431337, 0.1383491, 0.1351897, 0.1318368, 0.1282903, 0.1245502, 0.1206165,
      0.1187001, 0.1166912, 0.1145894, 0.1123946, 0.1101065, 0.1088901, 0.1076096, 0.1062648, 0.1048557, 0.1033819, 0.1022284, 0.1009845,
      0.09965, 0.098225, 0.0967095, 0.0925669, 0.0881503, 0.0874026, 0.0864402, 0.0852629, 0.0846444, 0.0834904, 0.0817997, 0.079572,
      0.0768076, 0.0760035, 0.0742543, 0.0715644, 0.0679409, 0.0633932, 0.0599421, 0.0557205, 0.0512018, 0.045895, 0.039718,
    ],
  },
  tortoise: {
    duration: 2.5833332538604736,
    sourceFloorRange: [-0.07237493254769974, -0.058699850808842484],
    values: [
      0.072005, 0.0720588, 0.0721085, 0.0721539, 0.0721952, 0.0722323, 0.0723381, 0.0723488, 0.0722643, 0.0720848, 0.0718104, 0.0714671,
      0.0710549, 0.070574, 0.0700248, 0.0694074, 0.0688656, 0.0682778, 0.0676441, 0.0669648, 0.06624, 0.0656363, 0.0649906, 0.0655325,
      0.0661351, 0.0666753, 0.0666232, 0.0665341, 0.0664082, 0.0662455, 0.066046, 0.0649625, 0.0638312, 0.0626524, 0.0614267, 0.0601636,
      0.0603444, 0.0604786, 0.0605662, 0.0606074, 0.0606025, 0.0602009, 0.0601714, 0.0599308, 0.05967, 0.0612482, 0.0628641, 0.0643637,
      0.0657461, 0.0670105, 0.0681561, 0.0691035, 0.0699359, 0.0706532, 0.0712551, 0.0717417, 0.0719339, 0.0720332, 0.0720397, 0.0719537,
      0.0717755, 0.0714593, 0.0710813, 0.0706416, 0.0701406, 0.0695785, 0.0690849, 0.0685494, 0.0679723, 0.0673538, 0.0666942, 0.0662131,
      0.0657127, 0.0651931, 0.0648412, 0.065416, 0.0658143, 0.0661447, 0.0664469, 0.0669203, 0.0673239, 0.0670015, 0.0666313, 0.0662134,
      0.065748, 0.065235, 0.0633963, 0.0628615, 0.0623592, 0.0616521, 0.0607442, 0.0597927, 0.0588591, 0.0602487, 0.0620473, 0.0636884,
      0.0651523, 0.0664884, 0.0676961, 0.0687744, 0.0697227, 0.070359, 0.0709056, 0.0713623, 0.0717289, 0.0720053, 0.0721086, 0.0721952,
      0.0722652, 0.0723184, 0.072355, 0.0723549, 0.072264, 0.0720823, 0.0718101, 0.0714474, 0.0710378, 0.0705635, 0.0700247, 0.0694217,
      0.0687548, 0.0681874, 0.0675861, 0.0669512, 0.0662828, 0.065581, 0.0649907, 0.0655243, 0.066122, 0.0666603, 0.0671387, 0.0667928,
      0.0664082, 0.0659851, 0.0655237, 0.0650243, 0.0638721, 0.0626727, 0.0614267, 0.0602424, 0.0601555, 0.060208, 0.060195, 0.0601167,
      0.0601373, 0.0601698, 0.0601716, 0.0599588, 0.0597373, 0.061362, 0.0628719, 0.064368, 0.0657462, 0.0670057, 0.0681459, 0.0691662,
      0.0699755, 0.0706719, 0.0712551, 0.0717251, 0.0720821, 0.0721233, 0.0720804, 0.0719533, 0.0717423, 0.0714477, 0.0710813, 0.0706574,
      0.0701761, 0.0696379, 0.069043, 0.0685264, 0.0679723, 0.0673811, 0.0667528, 0.0660879, 0.0656267, 0.0651489, 0.0648412, 0.0653018,
      0.0657068, 0.0660028, 0.0662266, 0.0665889, 0.066998, 0.0673328, 0.0666309, 0.0658795, 0.0650789, 0.0642293, 0.0633311, 0.0628398,
      0.0623577, 0.0616684, 0.0607759, 0.0596847, 0.0588056, 0.0602349, 0.0620478, 0.0636986, 0.0651858, 0.066538, 0.0677468, 0.0688112,
      0.0697306, 0.0705043, 0.0709058, 0.0712568, 0.0715571, 0.0718067, 0.0720056, 0.0721542, 0.0722654, 0.072339, 0.0723751, 0.0723736,
      0.0722723, 0.0720845, 0.0718102, 0.0714495, 0.0710028, 0.0705535, 0.0700475, 0.0694848, 0.0688659, 0.0681909, 0.0675862, 0.0669522,
      0.0662889, 0.0655964, 0.064887, 0.0655326, 0.0661221, 0.0666551, 0.0671313, 0.0675501, 0.066921, 0.0662455, 0.0655238, 0.0647563,
      0.0639433, 0.0627482, 0.0615079, 0.0603104, 0.0603449, 0.0603453, 0.0601943, 0.0600672, 0.0601695, 0.0601843, 0.060112, 0.0599305,
      0.0597374, 0.0613957, 0.0629438, 0.0643805, 0.0657552, 0.0670105, 0.0681458, 0.0691606, 0.0700543, 0.0706835, 0.0712065, 0.0716233,
      0.0719338, 0.0721384, 0.0720803, 0.0719425, 0.0717251, 0.0714284, 0.0710528, 0.0706416, 0.0701761, 0.0696564, 0.069083, 0.0684561,
      0.0679216, 0.0673538, 0.0667529, 0.066119, 0.0654523, 0.06507, 0.065128, 0.0654965, 0.0658142, 0.0660808, 0.0662265, 0.066503,
      0.066833, 0.0670955, 0.0672901, 0.0662129, 0.0650787, 0.0638879, 0.0629889, 0.0627755, 0.0623176, 0.0616502, 0.060777, 0.0597023,
      0.0587, 0.0601317, 0.0619412, 0.0636112, 0.0651404, 0.0665276, 0.0677353, 0.0688009, 0.0697238, 0.0705032, 0.0711388,
    ],
  },
};

/** Clone clips once per loaded source; runtime never scans skinned vertices. */
function groundedClips(gltf: CritterSource, kind: CritterKind, rabbitGaits: RabbitGaits | null): GroundedClips {
  const cached = groundingCache.get(gltf.scene);
  if (cached) return cached;
  if (kind === 'rabbit') {
    if (!rabbitGaits) throw new Error('Rabbit requires its authored quadruped gait data');
    const clips = rabbitGaits.gaits.map(gait => THREE.AnimationClip.parse(gait.clip));
    const result: GroundedClips = { clips, samples: clips.reduce((sum, clip) => sum + clip.tracks[clip.tracks.length - 1].times.length, 0), nominalSpeeds: Object.fromEntries(rabbitGaits.gaits.map(gait => [gait.name, gait.nominalSpeed])) };
    groundingCache.set(gltf.scene, result); return result;
  }
  const support = WALK_SUPPORT[kind];
  const clips = gltf.animations.map(sourceClip => {
    if (sourceClip.name !== 'preset:quadruped:walk' || Math.abs(sourceClip.duration - support.duration) > 1e-6) {
      throw new Error(`Missing measured foot support for ${kind}/${sourceClip.name}`);
    }
    const clip = sourceClip.clone();
    const times = support.values.map((_, i) => sourceClip.duration * i / (support.values.length - 1));
    // Move the complete model vertically, preserving all acquired limb/body tracks.
    clip.tracks.push(new THREE.NumberKeyframeTrack('.position[y]', times, support.values));
    return clip;
  });
  const result: GroundedClips = { clips, samples: support.values.length, sourceFloorRange: support.sourceFloorRange };
  groundingCache.set(gltf.scene, result); return result;
}
function cachedCritter(kind: CritterKind) {
  const asset = CRITTER_ASSETS[kind];
  if (!asset) return null;
  const url = `${import.meta.env.BASE_URL}models/${asset.file}`;
  if (!critterCache.has(url)) critterCache.set(url, loader.loadAsync(url));
  return critterCache.get(url)!;
}
/** Warm only acquired local assets; partial acquisition never requests phantom files. */
export async function preloadCritters() {
  const pending: Promise<unknown>[] = (Object.keys(CRITTER_ASSETS) as CritterKind[]).map(kind => cachedCritter(kind)).filter((p): p is NonNullable<typeof p> => p !== null);
  if (CRITTER_ASSETS.rabbit) pending.push(cachedRabbitGaits());
  return Promise.allSettled(pending);
}
/** Real skinned GLBs only. Individual kinds become usable as their exports are verified. */
export async function loadCritter(kind: CritterKind): Promise<CritterVisual | null> {
  const pending = cachedCritter(kind);
  if (!pending) return null;
  const [gltf, rabbitGaits] = await Promise.all([pending, kind === 'rabbit' ? cachedRabbitGaits() : Promise.resolve(null)]);
  const grounding = groundedClips(gltf, kind, rabbitGaits);
  const model = clone(gltf.scene) as THREE.Group;
  const root = new THREE.Group(); root.name = `${kind}-visual`; root.add(model);
  normalizeCritter(model, kind);
  model.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; } });
  const mixer = new THREE.AnimationMixer(model), clips = grounding.clips;
  if (clips.length) mixer.clipAction(clips.find(c => /walk/i.test(c.name)) ?? clips[0]).play();
  mixer.update(0);
  root.userData.grounding = { groundY: 0, samples: grounding.samples, sourceFloorRange: grounding.sourceFloorRange };
  root.userData.locomotion = grounding.nominalSpeeds;
  return { root, mixer, clips, nominalSpeeds: grounding.nominalSpeeds };
}
