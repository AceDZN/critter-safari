import * as THREE from "three";
import { SafariSimulation, distance, BOUNDS, TRAP_RADIUS, CALM_RADIUS, CALM_SECONDS, FEEDER_SECONDS, type Point } from "./simulation";
import { CONTRACTS, CHAPTERS, GLOSSARY, type Archetype } from "./content";
import { habitatForLevel } from "./habitats";
import { SafariProgression } from "./progression";
import { travelHeading } from "./locomotion";
import {
  createGarden,
  loadCritter,
  TRIPO_ASSETS_READY,
  preloadCritters,
  type CritterVisual,
} from "./world-art";
import { SafariAudio } from "./audio";
import { initHost, parseLevelParam, postToHost, WorkbookSession } from "./host";
import "./style.css";
initHost("critter-safari");
const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const game = new SafariSimulation(Math.random() < 0.5 ? 0 : 1),
  soundtrack = new SafariAudio(),
  canvas = $<HTMLCanvasElement>("game");
const requestedLevel = parseLevelParam(location.search, CONTRACTS.length);
let storage: Storage | null = null;
try { storage = window.localStorage; } catch { /* Private browsing can deny storage. */ }
const campaign = new SafariProgression(storage);
const initialLevel = requestedLevel ?? campaign.currentLevel - 1;
campaign.enter(initialLevel + 1, requestedLevel !== null);
game.load(initialLevel);
const workbookSession = new WorkbookSession(postToHost);
let recordedLevel = -1, lastFacts = "", reservedFactsHeight = 0;
let renderer: THREE.WebGLRenderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
} catch {
  $("loading").textContent =
    "צריך דפדפן עם WebGL והאצת חומרה כדי לפתוח את קרחת היער.";
  throw Error("WebGL unavailable");
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd8dfba);
scene.fog = new THREE.Fog(0xd8dfba, 25, 50);
const camera = new THREE.OrthographicCamera(-8, 8, 6, -6, 0.1, 60);
scene.add(new THREE.HemisphereLight(0xfff6d8, 0x80965c, 2.3));
const sun = new THREE.DirectionalLight(0xffe1aa, 2.8);
sun.position.set(-5, 15, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {
  left: -8,
  right: 8,
  top: 7,
  bottom: -7,
  near: 1,
  far: 28,
});
sun.shadow.normalBias = 0.002;
scene.add(sun);
scene.add(sun.target);
let garden: ReturnType<typeof createGarden> = { obstacles: [], update() {}, dispose() {} },
  shownLevel = -1,
  assetVersion = 0,
  ready = false,
  hasRenderedModels = false,
  dirty = true,
  lastMode = "",
  lastMessage = "",
  lastCapture = "",
  reduced = matchMedia("(prefers-reduced-motion: reduce)").matches,
  manualTime = false,
  capturePop = 0;
const views = new Map<
  string,
  {
    root: THREE.Group;
    heading: THREE.Group;
    visual: CritterVisual;
    contact: THREE.Mesh;
    carried: THREE.Group;
    tag: THREE.Sprite;
    labelGuide: THREE.Line;
    lastClip: string;
    playbackRate: number;
    last: Point;
    skins: number;
    bones: number;
  }
>();
const mat = (color: number) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
const brass = mat(0xbfa163),
  wood = mat(0x876b42);
function mesh(
  geo: THREE.BufferGeometry,
  material: THREE.Material,
  parent: THREE.Object3D,
  x = 0,
  y = 0,
  z = 0,
) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function tag(name: string, fact?: string) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = fact ? 96 : 72;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#f9efdbed";
  ctx.beginPath();
  ctx.roundRect(4, 4, 248, c.height - 8, 15);
  ctx.fill();
  ctx.fillStyle = "#3e5135";
  ctx.textAlign = "center";
  ctx.font = fact ? "bold 32px Georgia" : "bold 38px Georgia";
  ctx.fillText(name, 128, fact ? 37 : 49);
  if (fact) {
    ctx.font = "26px Georgia";
    ctx.fillText(fact, 128, 76);
  }
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: Object.assign(new THREE.CanvasTexture(c), {
        colorSpace: THREE.SRGBColorSpace,
      }),
      toneMapped: false,
      fog: false,
      depthTest: false,
      transparent: true,
    }),
  );
  s.renderOrder = 10;
  return s;
}
// Small ambient contact complements the cast shadow without changing foot height.
const contactCanvas = document.createElement("canvas");
contactCanvas.width = contactCanvas.height = 64;
const contactContext = contactCanvas.getContext("2d")!;
const falloff = contactContext.createRadialGradient(32, 32, 0, 32, 32, 32);
falloff.addColorStop(0, "rgba(0,0,0,1)");
falloff.addColorStop(.4, "rgba(0,0,0,.55)");
falloff.addColorStop(1, "rgba(0,0,0,0)");
contactContext.fillStyle = falloff;
contactContext.fillRect(0, 0, 64, 64);
const contactMaterial = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(contactCanvas), transparent: true, opacity: .14, depthWrite: false, toneMapped: false });
const contactGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
async function buildAnimals() {
  const version = ++assetVersion;
  ready = false;
  hasRenderedModels = false;
  $("loading").hidden = false;
  $("loading").textContent = "החיות מגיעות לקרחת היער…";
  for (const view of views.values()) {
    view.visual.mixer.stopAllAction();
    view.visual.root.traverse((node) => {
      if (node instanceof THREE.SkinnedMesh) node.skeleton.dispose();
    });
    view.tag.material.map?.dispose();
    view.tag.material.dispose();
    view.labelGuide.geometry.dispose();
    (view.labelGuide.material as THREE.Material).dispose();
    disposeSnack(view.carried);
    scene.remove(view.root);
  }
  views.clear();
  try {
    await garden.ready;
    const pending = await Promise.all(
      game.actors.map(async (actor) => ({
        actor,
        visual: await loadCritter(actor.spec.archetype),
      })),
    );
    if (version !== assetVersion) return;
    if (pending.some((p) => !p.visual)) {
      throw Error("Required character models are not available yet");
    }
    for (const { actor, visual } of pending) {
      if (!visual) continue;
      const root = new THREE.Group(),
        heading = new THREE.Group();
      heading.rotation.y = actor.angle;
      heading.add(visual.root);
      const contact = new THREE.Mesh(contactGeometry, contactMaterial);
      contact.position.y = .003;
      contact.scale.set(actor.spec.archetype === "tortoise" ? .85 : .65, 1, actor.spec.archetype === "deer" ? 1.1 : .85);
      heading.add(contact);
      const carried = snack(actor.spec.diet);
      carried.visible = false;
      carried.scale.setScalar(0.65);
      carried.position.set(
        0,
        actor.spec.archetype === "deer"
          ? 0.92
          : actor.spec.archetype === "tortoise"
            ? 0.23
            : 0.37,
        actor.spec.archetype === "deer"
          ? 0.58
          : actor.spec.archetype === "tortoise"
            ? 0.52
            : 0.42,
      );
      heading.add(carried);
      root.add(heading);
      root.scale.setScalar(actor.spec.size);
      const label = tag(
        actor.spec.name,
      );
      label.position.y =
        actor.spec.archetype === "deer"
          ? 1.65
          : actor.spec.archetype === "tortoise"
            ? 0.9
            : 1.3;
      root.add(label);
      const labelGuide = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,label.position.y-.08,0),new THREE.Vector3(0,label.position.y-.08,0)]), new THREE.LineBasicMaterial({ color:0xf6edcc, transparent:true, opacity:.8, depthTest:false }));
      labelGuide.visible = false; labelGuide.renderOrder = 9; root.add(labelGuide);
      scene.add(root);
      let skins = 0;
      const bones = new Set<THREE.Bone>();
      visual.root.traverse((node) => {
        if (node instanceof THREE.SkinnedMesh) {
          skins++;
          node.skeleton.bones.forEach((bone) => bones.add(bone));
        }
      });
      views.set(actor.spec.id, {
        root,
        heading,
        visual,
        contact,
        carried,
        tag: label,
        labelGuide,
        lastClip: "",
        playbackRate: 1,
        last: { x: actor.x, z: actor.z },
        skins,
        bones: bones.size,
      });
    }
    ready = true;
    void preloadCritters();
    $("loading").hidden = true;
    dirty = true;
  } catch (error) {
    $("loading").textContent =
      "המודלים החדשים עדיין בהכנה. המשחק לא מציג יצורי דמה.";
    console.error("Critter models unavailable", error);
    postToHost({ type: "error", message: "Required critter models could not be loaded." });
  }
}
const catcher = new THREE.Group();
const catcherShape = new THREE.Group();
catcherShape.scale.setScalar(TRAP_RADIUS);
catcher.add(catcherShape);
scene.add(catcher);
const base = mesh(
  new THREE.TorusGeometry(1, 0.065, 9, 64),
  brass,
  catcherShape,
  0,
  0.07,
  0,
);
base.rotation.x = Math.PI / 2;
for (const x of [-1, 1]) {
  const handle = mesh(
    new THREE.TorusGeometry(0.14, 0.035, 7, 16),
    brass,
    catcherShape,
    x,
    0.17,
    0,
  );
  handle.rotation.y = Math.PI / 2;
}
const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xc6ebe4,
  roughness: 0.08,
  metalness: 0.05,
  transparent: true,
  opacity: 0.1,
  clearcoat: 1,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const dome = mesh(
  new THREE.SphereGeometry(1.04, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2),
  glassMaterial,
  catcherShape,
  0,
  0.08,
  0,
);
dome.scale.y = 0.78;
const fullBubble = mesh(
  new THREE.SphereGeometry(1.05, 36, 24),
  glassMaterial,
  catcherShape,
  0,
  0.76,
  0,
);
fullBubble.visible = false;
const marker = mesh(
  new THREE.TorusGeometry(1, 0.025, 6, 48),
  new THREE.MeshBasicMaterial({
    color: 0xf8f1c7,
    transparent: true,
    opacity: 0.9,
  }),
  scene,
);
marker.rotation.x = Math.PI / 2;
marker.position.y = 0.035;
marker.visible = false;
const placementBoundary = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-BOUNDS.x, .025, -BOUNDS.z),
    new THREE.Vector3(BOUNDS.x, .025, -BOUNDS.z),
    new THREE.Vector3(BOUNDS.x, .025, BOUNDS.z),
    new THREE.Vector3(-BOUNDS.x, .025, BOUNDS.z),
  ]),
  new THREE.LineDashedMaterial({ color: 0xfff3cc, dashSize: .16, gapSize: .09, transparent: true, opacity: .9, depthTest: false }),
);
placementBoundary.computeLineDistances();
placementBoundary.visible = false;
scene.add(placementBoundary);
const snackViews = new Map<number, THREE.Group>();
function snack(type: "leaf" | "berry") {
  const group = new THREE.Group();
  if (type === "leaf") {
    const leaf = mesh(
      new THREE.SphereGeometry(0.22, 10, 6),
      mat(0x86ac4f),
      group,
      0,
      0.08,
      0,
    );
    leaf.scale.set(0.65, 0.18, 1.35);
    leaf.rotation.y = 0.6;
    const vein = mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.42, 4),
      mat(0xc9d68d),
      group,
      0,
      0.1,
      0,
    );
    vein.rotation.x = Math.PI / 2;
    vein.rotation.y = 0.6;
  } else {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      mesh(
        new THREE.SphereGeometry(0.09, 9, 6),
        mat(0xa94d68),
        group,
        Math.sin(a) * 0.08,
        0.1 + i * 0.018,
        Math.cos(a) * 0.08,
      );
    }
  }
  return group;
}
function disposeSnack(group: THREE.Group) {
  group.traverse(node => {
    if (node instanceof THREE.Mesh) {
      node.geometry.dispose();
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) material.dispose();
    }
  });
}
const feederView = new THREE.Group();
scene.add(feederView);
const bowl = mesh(new THREE.CylinderGeometry(.38, .29, .15, 20), wood, feederView, 0, .08, 0);
const rim = mesh(new THREE.TorusGeometry(.36, .045, 6, 28), brass, feederView, 0, .18, 0);
rim.rotation.x = Math.PI / 2;
const bowlLeaf = snack("leaf"), bowlBerry = snack("berry");
for (const food of [bowlLeaf, bowlBerry]) { food.position.y = .17; feederView.add(food); }
const feederClock = tag(""); feederClock.position.y = .8; feederView.add(feederClock);
const calmView = new THREE.Group(); scene.add(calmView);
const calmMaterial = new THREE.MeshBasicMaterial({ color: 0x91b9a2, transparent: true, opacity: .26, depthWrite: false });
const calmCircle = mesh(new THREE.CircleGeometry(CALM_RADIUS, 48), calmMaterial, calmView, 0, .012, 0);
calmCircle.rotation.x = -Math.PI / 2; calmCircle.castShadow = false;
const calmRing = mesh(new THREE.TorusGeometry(CALM_RADIUS, .018, 4, 56), mat(0xa8c5a4), calmView, 0, .025, 0); calmRing.rotation.x = Math.PI / 2;
const stem = mesh(new THREE.CylinderGeometry(.025,.025,.32,6), mat(0x5a7e44), calmView,0,.18,0);
for (let i=0;i<5;i++) { const angle=i/5*Math.PI*2, petal=mesh(new THREE.SphereGeometry(.11,8,6),mat(0xffedba),calmView,Math.sin(angle)*.12,.36,Math.cos(angle)*.12); petal.scale.set(1,.35,1.6); petal.rotation.y=angle; }
mesh(new THREE.SphereGeometry(.085,9,6),brass,calmView,0,.37,0);
const calmClock = tag(""); calmClock.position.y = .9; calmView.add(calmClock);
function updateClock(sprite: THREE.Sprite, text: string, pixelWidth: number, worldPixel: number) {
  if (sprite.userData.text !== text) {
    sprite.userData.text = text;
    const material = sprite.material as THREE.SpriteMaterial, texture = material.map!;
    const image = texture.image as HTMLCanvasElement, ctx = image.getContext("2d")!;
    ctx.clearRect(0,0,image.width,image.height); ctx.fillStyle="#f9efdbed"; ctx.beginPath();ctx.roundRect(4,4,248,64,15);ctx.fill();
    ctx.fillStyle="#3e5135";ctx.textAlign="center";ctx.font="bold 38px Arial";ctx.fillText(text,128,49);texture.needsUpdate=true;
  }
  sprite.scale.set(worldPixel*pixelWidth,worldPixel*pixelWidth*72/256,1);
}
let held: "catcher" | "leaf" | "berry" | "feeder" | "calm" | null = null,
  pointer: Point | null = null,
  drag: {
    id: number;
    startX: number;
    startY: number;
    moved: boolean;
    fromCanvas: boolean;
  } | null = null,
  keyboardPoint: Point = { x: 0, z: 1.7 };
const raycaster = new THREE.Raycaster(),
  ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
  hit = new THREE.Vector3();
function worldPoint(x: number, y: number): Point | null {
  const rect = canvas.getBoundingClientRect();
  raycaster.setFromCamera(
    new THREE.Vector2(
      ((x - rect.left) / rect.width) * 2 - 1,
      (-(y - rect.top) / rect.height) * 2 + 1,
    ),
    camera,
  );
  if (!raycaster.ray.intersectPlane(ground, hit)) return null;
  return { x: hit.x, z: hit.z };
}
function valid(p: Point) {
  return held === "catcher"
    ? game.placementIssue(p) === null
    : held === "feeder" ? game.fits(p, .4)
    : held === "calm" ? game.calmCooldown === 0 && game.fits(p, .15)
    : game.fits(p, .12);
}
function select(type: typeof held) {
  held = type;
  for (const b of document.querySelectorAll<HTMLElement>("[data-tool]"))
    b.classList.toggle("selected", b.dataset.tool === type);
  $("drag-token").hidden = !type;
  dirty = true;
}
function overInterface(x: number, y: number) {
  return ["tray", "contract", "action-prompt", "animal-stats", "capture-card", "modal"].some(
    (id) => {
      const box = $(id).getBoundingClientRect();
      return (
        box.width > 0 &&
        box.height > 0 &&
        x >= box.left &&
        x <= box.right &&
        y >= box.top &&
        y <= box.bottom
      );
    },
  );
}
function moveToken(x: number, y: number) {
  $("drag-token").style.left = `${x}px`;
  $("drag-token").style.top = `${y}px`;
  pointer = overInterface(x, y) ? null : worldPoint(x, y);
  dirty = true;
}
function drop(p: Point | null) {
  if (!held || !p || !ready) return;
  const success = held === "catcher" ? game.place(p)
    : held === "feeder" ? game.placeFeeder(p)
    : held === "calm" ? game.placeCalm(p)
    : game.toss(p, held);
  if (success) {
    soundtrack.play(held === "catcher" ? "trap" : "bait");
    select(null);
    pointer = null;
  } else {
    soundtrack.play("trap");
  }
  sync();
  dirty = true;
}
for (const button of document.querySelectorAll<HTMLButtonElement>(
  "[data-tool]",
)) {
  button.addEventListener("pointerdown", (e) => {
    if (game.mode !== "playing" || !ready) return;
    e.preventDefault();
    void soundtrack.unlock();
    select(button.dataset.tool as typeof held);
    $("drag-token").innerHTML = button.querySelector("svg")!.outerHTML;
    moveToken(e.clientX, e.clientY);
    drag = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      fromCanvas: false,
    };
    button.setPointerCapture(e.pointerId);
  });
  button.addEventListener("keydown", (e) => {
    if (game.mode !== "playing" || !ready) return;
    if (e.code === "Enter" || e.code === "Space") {
      e.preventDefault();
      e.stopPropagation();
      void soundtrack.unlock();
      select(button.dataset.tool as typeof held);
      $("drag-token").innerHTML = button.querySelector("svg")!.outerHTML;
      pointer = { ...keyboardPoint };
      $("drag-token").hidden = true;
      canvas.focus();
      sync();
    }
  });
}
canvas.addEventListener("pointerdown", (e) => {
  if (game.mode !== "playing" || !ready) return;
  void soundtrack.unlock();
  const p = worldPoint(e.clientX, e.clientY);
  if (!held && p && game.trap && distance(p, game.trap) < TRAP_RADIUS + .08) {
    select("catcher");
    $("drag-token").innerHTML =
      $("catcher-tool").querySelector("svg")!.outerHTML;
  }
  if (held) {
    e.preventDefault();
    moveToken(e.clientX, e.clientY);
    drag = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      fromCanvas: true,
    };
    canvas.setPointerCapture(e.pointerId);
  }
});
window.addEventListener("pointermove", (e) => {
  if (!held) return;
  moveToken(e.clientX, e.clientY);
  if (drag && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 7)
    drag.moved = true;
});
window.addEventListener("pointerup", (e) => {
  if (!held || !drag || drag.id !== e.pointerId) return;
  const blocked = overInterface(e.clientX, e.clientY);
  const p = worldPoint(e.clientX, e.clientY);
  if ((drag.moved || drag.fromCanvas) && !blocked) drop(p);
  else $("drag-token").hidden = true;
  drag = null;
});
window.addEventListener("pointercancel", () => {
  drag = null;
  select(null);
  pointer = null;
});
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
function alignAction() {
  const box = $("contract").getBoundingClientRect();
  $("action-prompt").style.top = `${box.bottom + 8}px`;
  resize();
}
new ResizeObserver(alignAction).observe($("contract"));
new ResizeObserver(([entry]) => {
  document.documentElement.style.setProperty("--facts-height", `${entry.borderBoxSize[0]?.blockSize ?? 0}px`);
  const height = entry.borderBoxSize[0]?.blockSize ?? 0;
  if (height > 0) reservedFactsHeight = height;
  resize();
}).observe($("animal-stats"));
new ResizeObserver(resize).observe($("action-prompt"));
function fullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen();
}
function closePanel() {
  const wasMap = game.mode === "levels";
  game.resume();
  lastStamp = performance.now();
  sync();
  if (wasMap) $("progress").focus();
  else if (game.mode === "caught") $("capture-btn").focus();
  else canvas.focus();
}
function campaignHTML() {
  const resume = campaign.highestUnlocked;
  return `<div class="campaign-heading"><div><div class="eyebrow">CRITTER SAFARI · FIELD JOURNAL</div><h2>מסע הספארי</h2><p>50 שלבים · כל חילוץ פותח את הבא</p></div><button id="resume-btn" class="quiet" aria-label="סגירת מפת השלבים">×</button></div><div class="campaign-track" aria-label="${campaign.completedCount} מתוך 50הושלמו"><span style="width:${campaign.completedCount / CONTRACTS.length * 100}%"></span></div><div class="campaign-chapters">${CHAPTERS.map((chapter, i) => `<section class="campaign-chapter"><h3>${chapter.number}. ${chapter.titleHe}</h3><p>${habitatForLevel(i * 5).titleHe}</p><div class="level-stops" dir="ltr">${CONTRACTS.slice(i*5,i*5+5).map(c => { const done=!!campaign.save.completed[c.level], allowed=campaign.canPlay(c.level); return `<button data-level="${c.level}" class="level-stop ${done ? "done" : ""} ${game.level+1===c.level ? "current" : ""}" ${allowed ? "" : "disabled"} aria-label="שלב ${c.level}: ${c.titleHe}${done ? " · הושלם" : allowed ? " · פתוח" : " · נעול"}"><b>${c.level}</b><span>${done ? "✓" : allowed ? "פתוח" : "נעול"}</span></button>`; }).join("")}</div></section>`).join("")}</div><div class="campaign-bottom"><button id="continue-campaign" class="primary">ממשיכים לשלב ${resume} ←</button><p>${campaign.warning || `ההתקדמות נשמרת במכשיר הזה · ${campaign.completedCount} / 50 הושלמו`}</p></div>`;
}
function enterLevel(index: number, lesson = false) {
  if (!campaign.enter(index + 1, lesson)) return;
  game.load(index);
  workbookSession.restart();
  recordedLevel = -1;
  shownLevel = -1;
  lastMode = "";
  lastFacts = "";
  lastCapture = "";
  select(null);
  sync();
}
function openLevels() { campaign.refresh(); game.open("levels"); lastMode = ""; sync(); }
function modalHTML() {
  const c = game.contract;
  if (game.mode === "levels") return campaignHTML();
  if (game.mode === "notes")
    return `<div class="eyebrow">POCKET FIELD NOTES</div><h2>מי נמצא בקרחת היער?</h2><p class="instruction" dir="ltr" lang="en">${game.objective.instruction}</p>${game.objectiveTotal > 1 ? `<ol class="rescue-brief" lang="en" dir="ltr">${c.objectives!.map((o,i)=>`<li class="${i === game.objectiveIndex ? "active" : ""}">${o.instruction}</li>`).join("")}</ol>` : ""}<p class="fine">המספרים מתארים את החיות הבדיוניות במשחק. מהירות רגילה: ללא פיתיון, על אותו משטח ישר. העדפת מזון אינה עובדה על כל המין.</p><div class="table-wrap"><table lang="en" dir="ltr"><thead><tr><th>Name / animal</th><th>Prefers</th><th>Usual pace</th><th>Size</th><th>Habit</th></tr></thead><tbody>${c.creatures.map((a) => `<tr><td><b>${a.name}</b>${game.rescuedIds.includes(a.id) ? " ✓ rescued" : ""}<br>${a.archetype}</td><td>${a.diet === "leaf" ? "leaves" : "berries"}</td><td>${a.usualSpeed.toFixed(2)}</td><td>${a.size.toFixed(2)}</td><td>${a.habit}</td></tr>`).join("")}</tbody></table></div><div class="actions"><button id="resume-btn" class="primary">חוזרים לשטח ←</button><button id="help-btn" class="quiet">מילים ורמז</button></div>`;
  if (game.mode === "help")
    return `<div class="eyebrow">PAUSED / LITTLE FIELD GUIDE</div><h2>מלכודת, פיתיון, בועה!</h2><p>גררו את המלכודת אל דשא פנוי, ואז גררו עלה או פרי לשטח. החיות שמעדיפות את המזון יתקרבו. הראשונה שנכנסת למלכודת נלכדת אוטומטית.</p><p>${c.helpHe || "קראו את התיאור החדש ובדקו את הנתונים החדשים ביומן."}</p>${game.toolkit.feeder ? "<p><b>קערת הסחה:</b> הניחו קערה, ואז הוסיפו לתוכה עלה או פרי. החיות שמעדיפות אותו יעסקו באוכל10 שניות. אפשר להזיז ולמלא שוב.</p>" : ""}${game.toolkit.calm ? "<p><b>פרח הרגעה:</b> מאט חיות סמוכות5 שניות, ואז מתרענן. להשוואות משתמשים תמיד במהירות הרגילה שבנתונים.</p>" : ""}<div class="glossary">${GLOSSARY.map(([en, he]) => `<div><b dir="ltr" lang="en">${en}</b><span>${he}</span></div>`).join("")}</div><p class="fine">אפשר לבחור כלי ואז להקיש על הדשא. במקלדת: Enter לבחירה, חיצים למיקום, Enter להנחה. אין צורך ללכת או לכוון מצלמה.</p><div class="actions"><button id="resume-btn" class="primary">מנסים בשטח ←</button><button id="help-notes" class="quiet">פתיחת יומן</button></div>`;
  if (game.mode === "complete")
    return `<div class="eyebrow">THE WOODLAND JOURNEY</div><h2>${campaign.completedCount === CONTRACTS.length ? "כל 50 השלבים הושלמו!" : "החילוץ האחרון הושלם!"}</h2><div class="journey-stamp">✦</div><p>${campaign.completedCount} מתוך ${CONTRACTS.length} שלבים הושלמו במכשיר הזה.</p><div class="actions"><button id="finish-map" class="primary">למפת השלבים ←</button><button id="restart-btn" class="quiet">שוב לשלב הזה</button></div>`;
  return `<div class="eyebrow">THE CLEARING IS PAUSED</div><h2>הפסקה קטנה</h2><p>החיות מחכות. חוזרים כשמוכנים.</p><div class="actions"><button id="resume-btn" class="primary">ממשיכים ←</button><button id="settings-map" class="quiet">מפת50השלבים</button><button id="restart-btn" class="quiet">ניסיון חדש בשלב</button><button id="settings-help" class="quiet">איך משחקים?</button></div><div class="toggle-row"><button id="mute-btn" class="quiet">${soundtrack.muted ? "צליל כבוי" : "צליל פעיל"}</button><button id="motion-btn" class="quiet">${reduced ? "תנועה מופחתת" : "תנועה מלאה"}</button><button id="full-btn" class="quiet">מסך מלא</button></div><div class="audio-levels"><label for="music-volume">מוזיקה <output id="music-value">${Math.round(soundtrack.musicVolume * 100)}%</output></label><input id="music-volume" dir="ltr" type="range" min="0" max="100" value="${soundtrack.musicVolume * 100}" aria-label="עוצמת מוזיקה"><label for="effects-volume">אפקטים <output id="effects-value">${Math.round(soundtrack.effectsVolume * 100)}%</output></label><input id="effects-volume" dir="ltr" type="range" min="0" max="100" value="${soundtrack.effectsVolume * 100}" aria-label="עוצמת אפקטים"></div>`;
}
function bind(id: string, fn: () => void) {
  $(id).onclick = fn;
}
function sync() {
  soundtrack.setMode(game.mode);
  if (shownLevel !== game.level) {
    garden.dispose();
    garden = createGarden(
      scene,
      game.contract.scene === "transfer",
      game.variant,
      game.level,
    );
    shownLevel = game.level;
    recordedLevel = -1;
    lastFacts = "";
    $("animal-facts").innerHTML = game.contract.creatures.map(a =>
      `<li data-creature="${a.id}"><b>${a.name} <span>· ${a.archetype}</span></b><span>prefers ${a.diet === "leaf" ? "leaves" : "berries"}</span><span>speed <strong>${a.usualSpeed.toFixed(2)}</strong> · size <strong>${a.size.toFixed(2)}</strong></span><span class="habit">${a.habit}</span></li>`
    ).join("");
    $("animal-stats").dataset.count = String(game.actors.length);
    resize();
    void buildAnimals();
    lastCapture = "";
    select(null);
  }
  const factsKey = `${game.level}:${game.rescuedIds.join(",")}`;
  const factsChanged = lastFacts !== factsKey;
  if (factsChanged) {
    lastFacts = factsKey;
    $("animal-facts").innerHTML = game.contract.creatures.map(a => `<li data-creature="${a.id}" class="${game.rescuedIds.includes(a.id) ? "rescued" : ""}"><b>${a.name} <span>· ${a.archetype}${game.rescuedIds.includes(a.id) ? " · rescued ✓" : ""}</span></b><span>prefers ${a.diet === "leaf" ? "leaves" : "berries"}</span><span>speed <strong>${a.usualSpeed.toFixed(2)}</strong> · size <strong>${a.size.toFixed(2)}</strong></span><span class="habit">${a.habit}</span></li>`).join("");
  }
  if (game.levelCleared && recordedLevel !== game.level) {
    campaign.complete(game.level + 1, { attempts: game.attempts, hints: game.hints, seconds: game.time, rescues: game.objectiveTotal });
    recordedLevel = game.level;
  }
  $("instruction").textContent = game.objective.instruction;
  $("rescue-progress").hidden = game.objectiveTotal === 1;
  $("rescue-progress").textContent = `חילוץ ${game.objectiveIndex + 1} מתוך ${game.objectiveTotal} · ${game.rescuedIds.length} בדרך למחנה`;
  $("progress").textContent = `${game.level + 1} / ${CONTRACTS.length} ▦`;
  $("chapter").textContent = habitatForLevel(game.level).titleEn.toUpperCase();
  $("action-prompt").textContent =
    game.mode === "caught"
      ? game.correct
        ? game.levelCleared ? "השלב הושלם! ממשיכים לשלב הבא" : "החילוץ הושלם! ממשיכים לתיאור הבא"
        : "לחצו על ׳שחרור וניסיון נוסף׳ כדי לנסות שוב"
      : game.mode === "complete"
        ? "כל החברים הגיעו למחנה!"
        : held
          ? held === "catcher"
            ? pointer && game.placementIssue(pointer) === "edge"
              ? "הכניסו את כל הטבעת לתוך גבול הדשא המסומן"
              : pointer && game.placementIssue(pointer) === "rock"
                ? "הטבעת נוגעת באבן — הזיזו אותה מעט הצידה"
                : pointer && game.placementIssue(pointer) === "animal"
                  ? "הטבעת קרובה לחיה — הניחו לצידה ופַתו אותה במזון"
                  : "הניחו את הטבעת על דשא פנוי בתוך הקו המקווקו"
            : held === "feeder" ? pointer && !valid(pointer) ? "הקערה צריכה להיות על דשא פנוי, בתוך הגבול ומחוץ לאבנים" : "הניחו קערת הסחה, ואז מלאו אותה בעלה או פרי"
            : held === "calm" ? "הניחו פרח ליד יריבים כדי להאט אותם זמנית"
            : game.feeder && pointer && distance(pointer, game.feeder) < .65 ? "מלאו את קערת ההסחה במזון שבחרתם" : "הניחו את המזון על הדשא"
          : game.feeder && game.feeder.diet === null ? "הקערה ריקה — בחרו עלה או פרי והקישו על הקערה"
          : game.level === 10 && !game.feeder && !game.trap ? "כלי חדש: קערת הסחה — הניחו אותה ומלאו בעלה או פרי"
          : game.phase() === "place-catcher"
            ? "גררו את המלכודת אל הדשא"
            : game.phase() === "drop-food"
              ? "ועכשיו גררו עלה או פרי אל השטח"
              : "הם בדרך… אפשר להזיז מלכודת או להסיח יריב";
  if (factsChanged) alignAction();
  $("animal-stats").hidden = game.mode !== "playing";
  $("toast").hidden = held !== null || game.mode !== "playing";
  $("feeder-tool").hidden = !game.toolkit.feeder;
  $("calm-tool").hidden = !game.toolkit.calm;
  $("tray").dataset.tools = game.toolkit.calm ? "5" : game.toolkit.feeder ? "4" : "3";
  for (const tool of document.querySelectorAll<HTMLButtonElement>("[data-tool]"))
    tool.disabled = !ready || game.mode !== "playing" || (tool.dataset.tool === "calm" && game.calmCooldown > 0);
  $("calm-tool").querySelector("span")!.textContent = game.calmCooldown > 0 ? `הרגעה · ${Math.ceil(game.calmCooldown)}ש׳` : "פרח הרגעה";
  if (lastMessage !== game.message) {
    $("toast").textContent = game.message;
    lastMessage = game.message;
  }
  const captured = game.mode === "caught";
  $("capture-card").hidden = !captured;
  if (captured && lastCapture !== game.captureId) {
    lastCapture = game.captureId!;
    capturePop = 1;
    soundtrack.play(game.correct ? "capture" : "release");
    const name = game.actors.find((a) => a.spec.id === game.captureId)!.spec
      .name;
    const caughtSpec = game.actors.find(a => a.spec.id === game.captureId)!.spec;
    $("capture-card").innerHTML =
      `<div class="eyebrow">${game.correct ? "SAFE & SOUND" : "RELEASE & TRY AGAIN"}</div><h2>${game.correct ? `<bdi dir="ltr">${name}</bdi> בדרך למחנה!` : `<bdi dir="ltr">${name}</bdi> בתוך הבועה`}</h2><p lang="en" dir="ltr">prefers ${caughtSpec.diet === "leaf" ? "leaves" : "berries"} · speed ${caughtSpec.usualSpeed.toFixed(2)} · size ${caughtSpec.size.toFixed(2)}</p><p>${game.correct ? "בדיוק החיה שמתאימה לתיאור." : game.message}</p><button id="capture-btn" class="primary">${game.correct ? game.levelCleared ? game.level === CONTRACTS.length - 1 ? "סיום המסע ←" : `לשלב ${game.level + 2} ←` : "לחילוץ הבא ←" : "שחרור וניסיון נוסף ←"}</button>`;
    bind("capture-btn", () => {
      if (game.correct) {
        const oldLevel = game.level;
        game.next();
        if (game.level !== oldLevel) campaign.enter(game.level + 1, requestedLevel !== null);
      }
      else {
        game.release();
        soundtrack.play("release");
      }
      lastCapture = "";
      sync();
    });
    queueMicrotask(() => $("capture-btn").focus());
    dirty = true;
  }
  const panel = ["notes", "help", "paused", "levels", "complete"].includes(game.mode);
  $("modal").hidden = !panel;
  if (lastMode !== game.mode) {
    lastMode = game.mode;
    dirty = true;
    select(null);
    if (panel) {
      $("modal-body").dataset.panel = game.mode;
      $("modal-body").innerHTML = modalHTML();
      $("modal-body").scrollTop = 0;
      $("modal-body").querySelector("h2")?.setAttribute("id", "panel-title");
      $("modal").setAttribute("aria-labelledby", "panel-title");
      if (game.mode === "levels") {
        for (const button of $("modal-body").querySelectorAll<HTMLButtonElement>("[data-level]")) button.onclick = () => enterLevel(Number(button.dataset.level) - 1);
        bind("continue-campaign", () => enterLevel(campaign.highestUnlocked - 1));
        queueMicrotask(() => $("modal-body").querySelector(".level-stop.current")?.scrollIntoView({ block: "nearest" }));
      }
      if (game.mode === "complete") bind("finish-map", openLevels);
      queueMicrotask(() => {
        const heading = $("modal-body").querySelector<HTMLElement>("h2");
        if ((game.mode === "help" || game.mode === "notes") && heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); $("modal-body").scrollTop = 0; }
        else document.querySelector<HTMLButtonElement>("#modal .primary")?.focus({ preventScroll: true });
      });
      if (game.mode !== "complete") bind("resume-btn", closePanel);
      if (game.mode === "notes")
        bind("help-btn", () => {
          game.open("help");
          sync();
        });
      if (game.mode === "help")
        bind("help-notes", () => {
          game.open("notes");
          sync();
        });
      if (game.mode === "paused" || game.mode === "complete")
        bind("restart-btn", () => {
          game.restart();
          shownLevel = -1;
          recordedLevel = -1;
          lastFacts = "";
          workbookSession.restart();
          lastCapture = "";
          sync();
        });
      if (game.mode === "paused") {
        bind("settings-map", openLevels);
        bind("settings-help", () => {
          game.open("help");
          sync();
        });
        bind("mute-btn", () => {
          soundtrack.setMuted(!soundtrack.muted);
          lastMode = "";
          sync();
        });
        bind("motion-btn", () => {
          reduced = !reduced;
          lastMode = "";
          sync();
        });
        bind("full-btn", fullscreen);
        $<HTMLInputElement>("music-volume").oninput = (e) => {
          soundtrack.setMusicVolume(
            +(e.target as HTMLInputElement).value / 100,
          );
          $("music-value").textContent =
            `${Math.round(soundtrack.musicVolume * 100)}%`;
        };
        $<HTMLInputElement>("effects-volume").oninput = (e) => {
          soundtrack.setEffectsVolume(
            +(e.target as HTMLInputElement).value / 100,
          );
          $("effects-value").textContent =
            `${Math.round(soundtrack.effectsVolume * 100)}%`;
        };
      }
    }
  }
  syncWorkbook();
}
bind("progress", openLevels);
window.addEventListener("storage", e => { if (e.key === "critter-safari-campaign-v1") { campaign.refresh(); if (game.mode === "levels") { lastMode = ""; sync(); } } });
bind("notes-btn", () => {
  game.open("notes");
  sync();
});
bind("pause-btn", () => {
  game.open("paused");
  sync();
});
window.addEventListener("keydown", (e) => {
  if (e.code === "Tab" && !$("modal").hidden) {
    const nodes = [
      ...$("modal").querySelectorAll<HTMLElement>(
        "button:not(:disabled),input:not(:disabled)",
      ),
    ];
    const first = nodes[0],
      last = nodes[nodes.length - 1];
    if (
      e.shiftKey &&
      (document.activeElement === first ||
        !$("modal").contains(document.activeElement))
    ) {
      e.preventDefault();
      last?.focus();
      return;
    }
    if (
      !e.shiftKey &&
      (document.activeElement === last ||
        !$("modal").contains(document.activeElement))
    ) {
      e.preventDefault();
      first?.focus();
      return;
    }
  }
  if (e.code === "KeyF") {
    fullscreen();
    return;
  }
  if (e.code === "Escape") {
    if (held) {
      select(null);
      pointer = null;
    } else if (game.mode === "playing") game.open("paused");
    else game.resume();
    sync();
    return;
  }
  if (game.mode !== "playing") return;
  if (e.code === "KeyL") { openLevels(); return; }
  if (e.code === "KeyN") {
    game.open("notes");
    sync();
    return;
  }
  if (e.code === "KeyP") {
    game.open("paused");
    sync();
    return;
  }
  if (held) {
    const steps: Record<string, { x: number; y: number }> = {
      ArrowLeft: { x: -16, y: 0 },
      ArrowRight: { x: 16, y: 0 },
      ArrowUp: { x: 0, y: -16 },
      ArrowDown: { x: 0, y: 16 },
    };
    const step = steps[e.code];
    if (step) {
      e.preventDefault();
      const screen = new THREE.Vector3(
        keyboardPoint.x,
        0,
        keyboardPoint.z,
      ).project(camera);
      const moved = worldPoint(
        ((screen.x + 1) * innerWidth) / 2 + step.x,
        ((1 - screen.y) * innerHeight) / 2 + step.y,
      );
      if (moved)
        keyboardPoint = {
          x: THREE.MathUtils.clamp(moved.x, -BOUNDS.x + 1, BOUNDS.x - 1),
          z: THREE.MathUtils.clamp(moved.z, -BOUNDS.z + 1, BOUNDS.z - 1),
        };
      pointer = { ...keyboardPoint };
      dirty = true;
    } else if (e.code === "Enter" || e.code === "Space") {
      e.preventDefault();
      drop(keyboardPoint);
    }
  }
});
function focusPause() {
  drag = null;
  select(null);
  if (game.mode === "playing") {
    game.open("paused");
    sync();
  }
}
window.addEventListener("blur", focusPause);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) focusPause();
});
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  const aspect = innerWidth / innerHeight;
  if (aspect < 0.85) {
    camera.position.set(11, 8, 2);
    const halfWidth =
      game.level === 0
        ? 2.8
        : game.level === 1
          ? 3.4
          : game.level === 4
            ? 4.4
            : 3.9;
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfWidth / aspect;
    camera.bottom = -halfWidth / aspect;
  } else {
    camera.position.set(5, 6.5, 10.5);
    const halfHeight = game.level === 0 ? 3.2 : aspect > 1.5 ? 4.35 : 5.2;
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
  }
  camera.lookAt(0, 0, 0);
  if (aspect >= .85 && game.level > 0) {
    // Reserve the roster's screen area, so a wandering animal cannot hide behind it.
    const reserve = Math.min(285, innerWidth * .38);
    const scale = innerWidth / (innerWidth - reserve);
    camera.left *= scale;
    camera.right *= scale;
    camera.top *= scale;
    camera.bottom *= scale;
    const shift = reserve / 2 * (camera.right - camera.left) / innerWidth;
    camera.left += shift;
    camera.right += shift;
  }
  if (aspect < .85) {
    // Fit the whole patrol envelope, including heads/labels, between the visible UI.
    // This also covers wider portrait panes where a width-only zoom hid the top rabbit.
    camera.updateMatrixWorld(true);
    let low = Infinity, high = -Infinity;
    for (const spec of game.contract.creatures) {
      const home = game.home(spec);
      const labelHeight = (spec.archetype === "deer" ? 1.65 : spec.archetype === "tortoise" ? .9 : 1.3) * spec.size + .25;
      for (const x of [-1, 1]) for (const z of [-1, 1]) for (const y of [0, labelHeight]) {
        const point = new THREE.Vector3(home.x + x * (1.05 + .3 * spec.size), y, home.z + z * (.85 + .35 * spec.size)).applyMatrix4(camera.matrixWorldInverse);
        low = Math.min(low, point.y); high = Math.max(high, point.y);
      }
    }
    const top = $("action-prompt").getBoundingClientRect().bottom + 12;
    const factsBox = $("animal-stats").getBoundingClientRect();
    if (factsBox.height > 0) reservedFactsHeight = factsBox.height;
    const factsHeight = reservedFactsHeight || 52 + Math.ceil(game.actors.length / 2) * 50;
    const bottom = (factsBox.height > 0 ? factsBox.top : innerHeight - 130 - factsHeight) - 12;
    const halfHeight = Math.max(camera.top, (high - low) * innerHeight / Math.max(180, bottom - top) / 2);
    const center = (high + low) / 2 + ((top + bottom) / 2 - innerHeight / 2) * 2 * halfHeight / innerHeight;
    camera.top = center + halfHeight;
    camera.bottom = center - halfHeight;
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
  }
  camera.updateProjectionMatrix();
  dirty = true;
}
function layoutLabels() {
  const placed: { x:number; y:number; w:number; h:number }[] = [];
  const width = innerWidth < 700 ? 68 : 86, height = innerWidth < 700 ? 20 : 25;
  const ceiling = innerWidth < 700 ? $("action-prompt").getBoundingClientRect().bottom + height/2 + 3 : height/2;
  for (const actor of game.actors) {
    const view = views.get(actor.spec.id);
    if (!view) continue;
    view.labelGuide.visible = false;
    if (!view.root.visible || !view.tag.visible) continue;
    const base = actor.spec.archetype === "deer" ? 1.65 : actor.spec.archetype === "tortoise" ? .9 : 1.3;
    view.tag.position.y = base;
    const world = new THREE.Vector3(actor.x, view.root.position.y + base * actor.spec.size, actor.z);
    const projected = world.clone().project(camera), up = world.clone().add(new THREE.Vector3(0,1,0)).project(camera);
    const x = (projected.x + 1) * innerWidth / 2, originalY = (1-projected.y)*innerHeight/2;
    const pixelsPerY = Math.max(.001,Math.abs(up.y-projected.y)*innerHeight/2);
    let y = Math.max(ceiling, originalY);
    for (let tries=0;tries<4;tries++) {
      const overlaps = placed.some(r=>Math.abs(r.x-x)<(r.w+width)/2+3 && Math.abs(r.y-y)<(r.h+height)/2+3);
      if (!overlaps) break;
      const above = y-height-4;
      y = above >= ceiling ? above : originalY+height+4*(tries+1);
    }
    const shift = (originalY-y)/pixelsPerY/actor.spec.size;
    view.tag.position.y = base + shift;
    if (Math.abs(y-originalY)>2) {
      const positions = view.labelGuide.geometry.getAttribute("position") as THREE.BufferAttribute;
      positions.setXYZ(0,0,base-.08,0);positions.setXYZ(1,0,base+shift,0);positions.needsUpdate=true;
      view.labelGuide.geometry.computeBoundingSphere();view.labelGuide.visible=true;
    }
    placed.push({x,y,w:width,h:height});
  }
}
window.addEventListener("resize", resize);
resize();
function draw(dt = 0) {
  garden.update(game.time, reduced);
  const pxWorld = (camera.right - camera.left) / innerWidth;
  for (const actor of game.actors) {
    const view = views.get(actor.spec.id);
    if (!view) continue;
    view.root.visible = actor.mode !== "rescued";
    if (actor.mode === "rescued") continue;
    view.carried.visible = actor.carrying !== null;
    view.contact.visible = actor.mode !== "caught";
    view.tag.visible =
      game.captureId === null || actor.spec.id === game.captureId;
    const moving =
      actor.mode !== "caught" && distance(view.last, actor) > 0.00001;
    view.root.position.set(
      actor.x,
      actor.mode === "caught" ? 0.12 : 0,
      actor.z,
    );
    // Translation and facing share the same displacement. Independent yaw easing
    // made real-frame turns slide sideways/backward; zero-time test redraws hid it.
    if (actor.mode !== "caught")
      view.heading.rotation.y = travelHeading(view.last, actor, view.heading.rotation.y);
    view.tag.scale.set(
      (pxWorld * (innerWidth < 700 ? 68 : 86)) / actor.spec.size,
      (pxWorld * (innerWidth < 700 ? 20 : 25)) / actor.spec.size,
      1,
    );
    const walk = view.visual.clips.find(c => /walk|hop/i.test(c.name)) ?? view.visual.clips[0];
    const trot = view.visual.clips.find(c => /trot|run/i.test(c.name));
    const locomotion = actor.spec.archetype === "rabbit" && actor.spec.usualSpeed / actor.spec.size > .9
      ? trot ?? walk : walk;
    // A brief stop must hold the selected gait, rather than restart walk/trot each frame.
    const desired = (!moving && view.visual.clips.find(c => /idle|rest|breath/i.test(c.name))) || locomotion;
    if (desired && desired.name !== view.lastClip) {
      view.visual.mixer.stopAllAction();
      const action = view.visual.mixer
        .clipAction(desired)
        .reset()
        .setEffectiveWeight(1)
        .setEffectiveTimeScale(1);
      action.play();
      view.lastClip = desired.name;
    }
    if (desired) {
      const nominal = view.visual.nominalSpeeds?.[desired.name];
      const travelMultiplier = game.movementMultiplier(actor);
      view.playbackRate = nominal
        ? actor.spec.usualSpeed * travelMultiplier / (actor.spec.size * nominal)
        : travelMultiplier;
      view.visual.mixer.clipAction(desired).setEffectiveTimeScale(view.playbackRate);
    }
    const hasIdleMotion = /idle|rest|breath/i.test(desired?.name ?? "");
    view.visual.mixer.update(
      game.mode === "playing" && !held && (moving || hasIdleMotion) ? dt : 0,
    );
    view.last = { x: actor.x, z: actor.z };
  }
  layoutLabels();
  catcher.visible = !!game.trap;
  if (game.trap) {
    catcher.position.set(game.trap.x, 0, game.trap.z);
    const captured = game.captureId !== null;
    const capturedSpec = game.actors.find(a => a.spec.id === game.captureId)?.spec;
    const height = capturedSpec ? (capturedSpec.archetype === "deer" ? 1.45 : capturedSpec.archetype === "rabbit" ? 1.1 : .65) * capturedSpec.size : 0;
    catcherShape.scale.setScalar(captured ? Math.max(TRAP_RADIUS, (height + .12) / 1.6) : TRAP_RADIUS);
    dome.visible = !captured;
    fullBubble.visible = captured;
    glassMaterial.opacity = captured ? 0.2 : 0.09;
    const pop = reduced ? 1 : 1 + capturePop * 0.13;
    catcher.scale.setScalar(pop);
  }
  const ids = new Set(game.baits.map((b) => b.id));
  for (const [id, view] of snackViews)
    if (!ids.has(id)) {
      scene.remove(view);
      disposeSnack(view);
      snackViews.delete(id);
    }
  for (const bait of game.baits) {
    let view = snackViews.get(bait.id);
    if (!view) {
      view = snack(bait.diet);
      snackViews.set(bait.id, view);
      scene.add(view);
    }
    const t = 1 - bait.flight / 0.38;
    view.position.set(bait.x, 0.04 + Math.sin(t * Math.PI) * 0.85, bait.z);
  }
  feederView.visible = game.feeder !== null;
  if (game.feeder) {
    feederView.position.set(game.feeder.x, 0, game.feeder.z);
    bowlLeaf.visible = game.feeder.diet === "leaf" && game.feeder.remaining > 0;
    bowlBerry.visible = game.feeder.diet === "berry" && game.feeder.remaining > 0;
    updateClock(feederClock, game.feeder.remaining > 0 ? `${Math.ceil(game.feeder.remaining)}s` : "מלאו", 48, pxWorld);
  }
  calmView.visible = game.calm !== null;
  if (game.calm) {
    calmView.position.set(game.calm.x, 0, game.calm.z);
    calmMaterial.opacity = .1 + .18 * game.calm.remaining / CALM_SECONDS;
    updateClock(calmClock, `${Math.ceil(game.calm.remaining)}s`, 42, pxWorld);
  }
  marker.visible = held !== null && pointer !== null && game.mode === "playing";
  if (marker.visible && pointer) {
    marker.position.set(pointer.x, 0.03, pointer.z);
    marker.scale.setScalar(held === "catcher" ? TRAP_RADIUS : held === "calm" ? CALM_RADIUS : held === "feeder" ? .4 : .27);
    (marker.material as THREE.MeshBasicMaterial).color.setHex(
      valid(pointer) ? 0xf6efb9 : 0xbb7357,
    );
  }
  placementBoundary.visible = held !== null && game.mode === "playing";
  renderer.render(scene, camera);
  hasRenderedModels = ready;
  syncWorkbook();
  dirty = false;
}
function syncWorkbook() {
  workbookSession.sync({
    ready: ready && hasRenderedModels,
    level: game.level + 1,
    complete: game.levelCleared,
    durationMs: game.time * 1000,
  });
}
let lastStamp = performance.now(),
  syncAge = 0;
function advance(ms: number) {
  manualTime = true;
  const total = Math.max(0, Math.min(ms, 300000));
  for (let t = 0; ready && !held && t < total; t += 1000 / 60)
    game.update(Math.min(1 / 60, (total - t) / 1000));
  sync();
  draw(total / 1000);
}
function measuredDeerFacing(visual: CritterVisual) {
  if (visual.root.name !== "deer-visual") return undefined;
  const head = visual.root.getObjectByName("tripoHead_0");
  const leftHip = visual.root.getObjectByName("tripo1_Left_Limb_0");
  const rightHip = visual.root.getObjectByName("tripo1_Right_Limb_0");
  if (!head || !leftHip || !rightHip) return undefined;
  const forward = head.getWorldPosition(new THREE.Vector3()).sub(
    leftHip.getWorldPosition(new THREE.Vector3()).add(rightHip.getWorldPosition(new THREE.Vector3())).multiplyScalar(.5),
  );
  forward.y = 0; forward.normalize();
  return { x: forward.x, z: forward.z };
}
Object.assign(window, {
  render_game_to_text: () =>
    JSON.stringify({
      ...game.text(),
      campaign: { currentLevel: game.level + 1, highestUnlocked: campaign.highestUnlocked, completed: Object.keys(campaign.save.completed).map(Number), savedResume: campaign.currentLevel, warning: campaign.warning },
      heldTool: held,
      planning: held !== null,
      ready,
      art: {
        tripoReady: TRIPO_ASSETS_READY,
        models: views.size,
        rigs: [...views.entries()].map(([id, v]) => ({
          id,
          skins: v.skins,
          bones: v.bones,
          clip: v.lastClip,
          mixerTime: +v.visual.mixer.time.toFixed(3),
          playbackRate: +v.playbackRate.toFixed(3),
          headingYaw: v.heading.rotation.y,
          modelYaw: v.visual.root.rotation.y,
          position: { x: v.root.position.x, z: v.root.position.z },
          bodyForward: measuredDeerFacing(v.visual),
        })),
        animatedModels: [...views.values()].filter(
          (v) => v.visual.clips.length > 0,
        ).length,
      },
      audio: soundtrack.state(),
      settings: { muted: soundtrack.muted, reducedMotion: reduced },
      render: {
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        pixelRatio: renderer.getPixelRatio(),
      },
    }),
  worldToScreen: (p: Point) => {
    const v = new THREE.Vector3(p.x, 0, p.z).project(camera);
    return {
      x: ((v.x + 1) * innerWidth) / 2,
      y: ((1 - v.y) * innerHeight) / 2,
    };
  },
  advanceTime: advance,
});
function frame(stamp: number) {
  const dt = Math.max(0, Math.min((stamp - lastStamp) / 1000, 0.25));
  lastStamp = stamp;
  if (capturePop > 0) {
    capturePop = Math.max(0, capturePop - dt * 3.5);
    dirty = true;
  }
  if (ready && !manualTime && !held) game.advance(dt);
  syncAge += dt;
  if (syncAge > 0.1) {
    sync();
    syncAge = 0;
  }
  if ((ready && !manualTime && !held && game.mode === "playing") || dirty)
    draw(manualTime || held ? 0 : dt);
  requestAnimationFrame(frame);
}
sync();
setTimeout(() => requestAnimationFrame(frame), 0);
