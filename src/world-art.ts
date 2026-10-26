import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

export interface GardenObstacle { x: number; z: number; r: number }
export interface GardenArt { obstacles: GardenObstacle[]; update(time: number, reducedMotion?: boolean): void; dispose(): void }
export interface CritterVisual { root: THREE.Group; mixer: THREE.AnimationMixer; clips: THREE.AnimationClip[] }

const palette = { soil: 0x796b48, moss: 0x5e9036, lightMoss: 0x8caa4a, leaf: 0x356e3b, youngLeaf: 0x78a147, bark: 0x72533a, stone: 0x9c9b73 };
function rng(seed: number) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; }; }
function material(color: number, roughness = .87) { return new THREE.MeshStandardMaterial({ color, roughness }); }

/** Author-created terrain and props. Characters remain local Tripo assets. */
export function createGarden(scene: THREE.Scene, transfer = false, variant: 0 | 1 = 0): GardenArt {
  const group = new THREE.Group(); group.name = 'authored-terrarium'; scene.add(group);
  group.scale.x = variant === 1 ? -1 : 1;
  const random = rng(transfer ? 412 : 41);
  const mats = {
    soil: material(palette.soil), moss: material(palette.moss), leaf: material(palette.leaf),
    lightMoss: material(palette.lightMoss), youngLeaf: material(palette.youngLeaf), bark: material(palette.bark),
    barkLight: material(0x987151), stone: material(palette.stone), stem: material(0x477b34),
    water: new THREE.MeshPhysicalMaterial({ color: 0x8bbca4, transparent: true, opacity: .53, roughness: .12, metalness: .08, clearcoat: 1 }),
    dew: new THREE.MeshPhysicalMaterial({ color: 0xc4f1df, transparent: true, opacity: .74, roughness: .05, metalness: .12, clearcoat: 1 }),
  };
  function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; group.add(m); return m;
  }
  const groundGeo = new THREE.PlaneGeometry(31, 27, 64, 56); groundGeo.rotateX(-Math.PI / 2);
  const p = groundGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), edge = Math.max(0, Math.max(Math.abs(x) - 7.9, Math.abs(z) - 6.9));
    p.setY(i, -.075 + Math.sin(x * .7) * Math.cos(z * .82) * .035 + edge * .22 + (random() - .5) * .035);
  }
  groundGeo.computeVertexNormals(); mesh(groundGeo, mats.soil, 0, 0, 0);
  // A distant timber edge and tree silhouette close the terrarium's horizon.
  const fenceGeo = new THREE.BoxGeometry(.62, 3.5, .17);
  const fence = new THREE.InstancedMesh(fenceGeo, mats.barkLight, 33);
  const fenceDummy = new THREE.Object3D();
  for (let i = 0; i < 33; i++) { fenceDummy.position.set((i - 16) * .75, 1.8 + random() * .15, -11.8); fenceDummy.rotation.z = (random() - .5) * .035; fenceDummy.updateMatrix(); fence.setMatrixAt(i, fenceDummy.matrix); }
  fence.castShadow = true; fence.receiveShadow = true; group.add(fence);
  const tree = mesh(new THREE.CylinderGeometry(.72, 1.05, 11, 9), mats.bark, -9, 5.2, -9); tree.rotation.z = -.07;
  const mossGeo = new THREE.SphereGeometry(1, 7, 5);
  const moss = new THREE.InstancedMesh(mossGeo, mats.moss, 650); moss.receiveShadow = true; moss.castShadow = true;
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  for (let i = 0; i < 650; i++) {
    const x = (random() - .5) * 29, z = (random() - .5) * 25;
    const radius = .12 + random() * .38; dummy.position.set(x, -.035, z); dummy.scale.set(radius, .06 + random() * .065, radius * (.6 + random() * .7)); dummy.rotation.y = random() * 6.28; dummy.updateMatrix(); moss.setMatrixAt(i, dummy.matrix);
    color.setHex(i % 3 ? palette.moss : palette.lightMoss).multiplyScalar(.8 + random() * .35); moss.setColorAt(i, color);
  }
  group.add(moss);
  // Fine grass is instanced, leaving the observation clearing readable.
  const blade = new THREE.ConeGeometry(.045, .29, 3); blade.translate(0, .145, 0);
  const grass = new THREE.InstancedMesh(blade, mats.youngLeaf, 850);
  for (let i = 0; i < 850; i++) {
    const x = (random() - .5) * 28, z = (random() - .5) * 24;
    dummy.position.set(x, -.03, z); dummy.scale.setScalar(.5 + random()); dummy.rotation.set((random() - .5) * .5, random() * 6.28, (random() - .5) * .5); dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix);
  }
  group.add(grass);
  const leafGeo = new THREE.SphereGeometry(1, 12, 8); leafGeo.scale(.48, .085, 1.25);
  const sway: THREE.Group[] = [];
  function plant(x: number, z: number, scale: number, leaves = 5) {
    const plantRoot = new THREE.Group(); plantRoot.position.set(x, -.03, z); plantRoot.scale.setScalar(scale); group.add(plantRoot);
    for (let j = 0; j < leaves; j++) {
      const theta = j / leaves * Math.PI * 2 + random() * .35;
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(.026, .047, 1.05, 5), mats.stem); stalk.position.set(Math.sin(theta) * .23, .5, Math.cos(theta) * .23); stalk.rotation.z = -Math.sin(theta) * .42; stalk.rotation.x = Math.cos(theta) * .42; plantRoot.add(stalk);
      const leaf = new THREE.Mesh(leafGeo, j % 2 ? mats.leaf : mats.youngLeaf); leaf.position.set(Math.sin(theta) * .64, .98 + (j % 2) * .17, Math.cos(theta) * .64); leaf.rotation.set(-.33, theta, .1); leaf.castShadow = true; leaf.receiveShadow = true; plantRoot.add(leaf);
      // A visible central vein provides scale and a natural material cue.
      const vein = new THREE.Mesh(new THREE.CylinderGeometry(.012, .024, 1.7, 4), mats.stem); vein.rotation.set(Math.PI / 2 - .23, 0, 0); vein.position.copy(leaf.position); vein.rotation.y = theta; plantRoot.add(vein);
    }
    sway.push(plantRoot);
  }
  for (let i = 0; i < 23; i++) {
    const theta = i / 23 * Math.PI * 2;
    plant(Math.sin(theta) * (9.6 + random() * 2), Math.cos(theta) * (8.4 + random() * 2), 1.25 + random() * 1.2, 5);
  }
  plant(-7, 2.8, 2.4, 4); plant(7.4, -.8, 2.6, 4); plant(-4.6, -7.7, 2.9, 5); plant(4.3, -8.2, 3.1, 5);
  const obstacles: GardenObstacle[] = transfer ? [{x:-.7,z:1,r:.8},{x:1.7,z:-.1,r:.65},{x:-4.5,z:-1.7,r:.65}] : [{x:0,z:-.6,r:.65},{x:-4.6,z:-2.8,r:.65},{x:4.9,z:1.5,r:.7}];
  for (const o of obstacles) {
    const rock = mesh(new THREE.IcosahedronGeometry(o.r, 1), mats.stone, o.x, .25, o.z); rock.scale.set(1, .58, .87); rock.rotation.set(.1, random() * 3, .2);
    for (let j = 0; j < 5; j++) { const m = mesh(mossGeo, mats.lightMoss, o.x + (random() - .5) * .8, .49, o.z + (random() - .5) * .6); m.scale.set(.22, .075, .18); }
  }
  // Fallen twig gives a local trap landmark without blocking the center lane.
  const twig = new THREE.Group(); twig.position.set(transfer ? 2 : -1.8, .09, transfer ? -3.7 : -2.5); twig.rotation.y = -.48; group.add(twig);
  const wood = new THREE.Mesh(new THREE.CylinderGeometry(.13, .18, 2.5, 9), mats.bark); wood.rotation.z = Math.PI / 2; wood.castShadow = true; wood.receiveShadow = true; twig.add(wood);
  for (const side of [-1, 1]) { const end = new THREE.Mesh(new THREE.CylinderGeometry(.118, .118, .012, 12), mats.barkLight); end.rotation.z = Math.PI / 2; end.position.x = side * 1.253; twig.add(end); }
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(.035, .065, .75, 6), mats.bark); branch.position.set(-.3, .17, .23); branch.rotation.x = 1; branch.rotation.z = .8; twig.add(branch);
  // Water and muddy shortcut sit below the collider plane.
  const mud = mesh(new THREE.CircleGeometry(1.9, 24), mats.bark, transfer ? -2.7 : 2.9, -.035, transfer ? 2.8 : 1.8); mud.rotation.x = -Math.PI / 2; mud.rotation.z = .5; mud.scale.set(.62, 1.5, 1); mud.castShadow = false;
  const puddle = mesh(new THREE.CircleGeometry(1.1, 32), mats.water, transfer ? -4.5 : 4.6, -.025, transfer ? 2.6 : -.1); puddle.rotation.x = -Math.PI / 2; puddle.scale.set(1, .63, 1); puddle.castShadow = false;
  for (let i = 0; i < 45; i++) {
    const x = (random() - .5) * 25, z = (random() - .5) * 22;
    if (Math.abs(x) < 7.8 && Math.abs(z) < 6.8) continue;
    const rock = mesh(new THREE.IcosahedronGeometry(.3 + random() * .7, 1), i % 3 ? mats.stone : mats.bark, x, .05 + random() * .12, z); rock.scale.y = .45; rock.rotation.set(random(), random(), random());
  }
  const dewGeo = new THREE.SphereGeometry(.045, 7, 5);
  for (let i = 0; i < 24; i++) { const theta = random() * Math.PI * 2; mesh(dewGeo, mats.dew, Math.sin(theta) * (7.5 + random() * 2), .14 + random() * .12, Math.cos(theta) * (6.4 + random() * 2)); }
  const motes = new THREE.Group(); group.add(motes);
  const moteMat = new THREE.MeshBasicMaterial({ color: 0xffffbd, transparent: true, opacity: .65 });
  for (let i = 0; i < 18; i++) { const mote = new THREE.Mesh(new THREE.SphereGeometry(.018, 4, 3), moteMat); mote.position.set((random() - .5) * 17, .5 + random() * 3, (random() - .5) * 15); mote.userData.baseY = mote.position.y; motes.add(mote); }
  return {
    obstacles: obstacles.map(o => ({ ...o, x: variant === 1 ? -o.x : o.x })),
    update(time, reducedMotion = false) { if (reducedMotion) return; sway.forEach((p, i) => { p.rotation.z = Math.sin(time * .6 + i) * .014; }); motes.children.forEach((m, i) => { m.position.y = m.userData.baseY + Math.sin(time * .3 + i) * .16; }); },
    dispose() { group.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose(); }); Object.values(mats).forEach(m => m.dispose()); moteMat.dispose(); scene.remove(group); },
  };
}

const loader = new GLTFLoader();
const critterCache = new Map<string, Promise<{scene: THREE.Group; animations: THREE.AnimationClip[]}>>();
/** Fails explicitly until an acquired asset exists; never substitutes generated primitives. */
export const TRIPO_ASSETS_READY = false;
export async function loadCritter(kind: 'puffling' | 'hopper' | 'shellback'): Promise<CritterVisual | null> {
  if (!TRIPO_ASSETS_READY) return null;
  const url = `${import.meta.env.BASE_URL}models/${kind}.glb`;
  if (!critterCache.has(url)) critterCache.set(url, loader.loadAsync(url));
  const gltf = await critterCache.get(url)!;
  const root = clone(gltf.scene) as THREE.Group;
  const bounds = new THREE.Box3().setFromObject(root), size = bounds.getSize(new THREE.Vector3());
  const targetHeight = kind === 'hopper' ? 1.25 : kind === 'shellback' ? .65 : .78;
  root.scale.multiplyScalar(targetHeight / Math.max(size.y, .01));
  const adjusted = new THREE.Box3().setFromObject(root); root.position.y -= adjusted.min.y;
  root.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; } });
  const mixer = new THREE.AnimationMixer(root); const clips = gltf.animations;
  if (clips.length) mixer.clipAction(clips.find(c => /idle|walk/i.test(c.name)) ?? clips[0]).play();
  return { root, mixer, clips };
}
