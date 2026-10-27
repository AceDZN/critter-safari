import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CLEARING_OBSTACLES, TRANSFER_OBSTACLES } from './simulation';

export interface GardenObstacle { x: number; z: number; r: number }
export interface GardenArt { obstacles: GardenObstacle[]; update(time: number, reducedMotion?: boolean): void; dispose(): void }
export interface CritterVisual { root: THREE.Group; mixer: THREE.AnimationMixer; clips: THREE.AnimationClip[] }

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
    const x = p.getX(i), z = p.getZ(i), edge = Math.max(0, Math.max(Math.abs(x) - 5.8, Math.abs(z) - 4.2));
    p.setY(i, -.075 + Math.sin(x * .7) * Math.cos(z * .82) * .035 + edge * .22 + (random() - .5) * .035);
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
export const CRITTER_ASSETS: Record<CritterKind, { file: string; bytes: number; joints: number; clips: string[] } | null> = {
  rabbit: { file: 'rabbit.glb', bytes: 1195884, joints: 31, clips: ['preset:quadruped:walk'] },
  deer: { file: 'deer.glb', bytes: 1263100, joints: 35, clips: ['preset:quadruped:walk'] },
  tortoise: { file: 'tortoise.glb', bytes: 1402120, joints: 32, clips: ['preset:quadruped:walk'] },
};
export const TRIPO_ASSETS_READY = Object.values(CRITTER_ASSETS).every(Boolean);
const loader = new GLTFLoader();
const critterCache = new Map<string, Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }>>();
function cachedCritter(kind: CritterKind) {
  const asset = CRITTER_ASSETS[kind];
  if (!asset) return null;
  const url = `${import.meta.env.BASE_URL}models/${asset.file}`;
  if (!critterCache.has(url)) critterCache.set(url, loader.loadAsync(url));
  return critterCache.get(url)!;
}
/** Warm only acquired local assets; partial acquisition never requests phantom files. */
export async function preloadCritters() {
  return Promise.allSettled((Object.keys(CRITTER_ASSETS) as CritterKind[]).map(kind => cachedCritter(kind)).filter((p): p is NonNullable<typeof p> => p !== null));
}
/** Real skinned GLBs only. Individual kinds become usable as their exports are verified. */
export async function loadCritter(kind: CritterKind): Promise<CritterVisual | null> {
  const pending = cachedCritter(kind);
  if (!pending) return null;
  const gltf = await pending;
  const model = clone(gltf.scene) as THREE.Group;
  const root = new THREE.Group(); root.name = `${kind}-visual`; root.add(model);
  const bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3());
  const targetHeight = kind === 'deer' ? 1.45 : kind === 'tortoise' ? .65 : 1.1;
  model.scale.multiplyScalar(targetHeight / Math.max(size.y, .01));
  const adjusted = new THREE.Box3().setFromObject(model), center = adjusted.getCenter(new THREE.Vector3());
  model.position.x -= center.x; model.position.z -= center.z; model.position.y -= adjusted.min.y;
  model.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; } });
  const mixer = new THREE.AnimationMixer(model), clips = gltf.animations;
  if (clips.length) mixer.clipAction(clips.find(c => /walk/i.test(c.name)) ?? clips[0]).play();
  return { root, mixer, clips };
}
