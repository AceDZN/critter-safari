import { CONTRACTS, type CreatureSpec, type Diet } from "./content";
import { acceptsCapture, objectiveFor, objectiveCount } from "./semantics";
import { obstaclesForLevel } from "./habitats";
export interface Point {
  x: number;
  z: number;
}
export interface Obstacle extends Point {
  r: number;
}
export type GameMode =
  | "playing"
  | "notes"
  | "help"
  | "paused"
  | "levels"
  | "caught"
  | "complete";
export interface Actor extends Point {
  spec: CreatureSpec;
  angle: number;
  mode: "wander" | "lured" | "eating" | "feeding" | "escape" | "caught" | "rescued";
  timer: number;
  destination: Point;
  route: Point[];
  routeAge: number;
  carrying: Diet | null;
  wanderStep: number;
}
export interface Bait extends Point {
  id: number;
  diet: Diet;
  age: number;
  flight: number;
}
// The usable grass reaches the inner timber rails, rather than an invisible small rectangle.
export const BOUNDS = { x: 6.5, z: 4.9 };
export const TRAP_RADIUS = 0.76;
export const CAPTURE_RADIUS = 0.64;
export const FEEDER_SECONDS = 10;
export const CALM_SECONDS = 5;
export const CALM_RADIUS = 1.45;
export const CLEARING_OBSTACLES: Obstacle[] = [
  { x: 0.15, z: -0.3, r: 0.62 },
  { x: -3.9, z: -2.6, r: 0.45 },
  { x: 3.9, z: 1.3, r: 0.5 },
];
export const TRANSFER_OBSTACLES: Obstacle[] = [
  { x: -0.7, z: 0.8, r: 0.65 },
  { x: 1.7, z: -0.7, r: 0.55 },
  { x: -4.1, z: -2.1, r: 0.45 },
];
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.z - b.z);
export function segmentClear(
  a: Point,
  b: Point,
  obstacles: readonly Obstacle[],
  margin = 0,
) {
  const dx = b.x - a.x,
    dz = b.z - a.z,
    l = dx * dx + dz * dz;
  return obstacles.every((o) => {
    const t = l
      ? Math.max(0, Math.min(1, ((o.x - a.x) * dx + (o.z - a.z) * dz) / l))
      : 0;
    return Math.hypot(o.x - a.x - t * dx, o.z - a.z - t * dz) > o.r + margin;
  });
}
export function pointClear(
  p: Point,
  obstacles: readonly Obstacle[],
  radius = 0.25,
) {
  return (
    Math.abs(p.x) < BOUNDS.x - radius &&
    Math.abs(p.z) < BOUNDS.z - radius &&
    obstacles.every((o) => distance(p, o) > o.r + radius)
  );
}
/** Small authored ground grid; detours obey the same collider clearance as direct travel. */
export function findRoute(
  from: Point,
  to: Point,
  obstacles: readonly Obstacle[],
  radius = 0.28,
): Point[] {
  if (segmentClear(from, to, obstacles, radius)) return [to];
  const step = 0.4,
    nx = 31,
    nz = 23;
  const pos = (id: number): Point => ({
    x: -6 + (id % nx) * step,
    z: -4.4 + Math.floor(id / nx) * step,
  });
  const nearest = (p: Point) => {
    let id = -1,
      best = Infinity;
    for (let i = 0; i < nx * nz; i++) {
      const q = pos(i),
        d = distance(p, q);
      if (
        d < best &&
        pointClear(q, obstacles, radius) &&
        segmentClear(p, q, obstacles, radius)
      ) {
        best = d;
        id = i;
      }
    }
    return id;
  };
  const start = nearest(from),
    end = nearest(to);
  if (start < 0 || end < 0) return [];
  const open = [start],
    cost = new Map<number, number>([[start, 0]]),
    previous = new Map<number, number>(),
    closed = new Set<number>();
  while (open.length) {
    open.sort(
      (a, b) =>
        cost.get(a)! +
        distance(pos(a), pos(end)) -
        (cost.get(b)! + distance(pos(b), pos(end))),
    );
    const id = open.shift()!;
    if (id === end) {
      const path: Point[] = [to];
      let k = id;
      while (k !== start) {
        path.unshift(pos(k));
        k = previous.get(k)!;
      }
      return path;
    }
    closed.add(id);
    const x = id % nx,
      z = Math.floor(id / nx);
    for (let dz = -1; dz <= 1; dz++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue;
        const xx = x + dx,
          zz = z + dz;
        if (xx < 0 || xx >= nx || zz < 0 || zz >= nz) continue;
        const next = zz * nx + xx;
        if (
          closed.has(next) ||
          !pointClear(pos(next), obstacles, radius) ||
          !segmentClear(pos(id), pos(next), obstacles, radius)
        )
          continue;
        const c = cost.get(id)! + Math.hypot(dx, dz) * step;
        if (c < (cost.get(next) ?? Infinity)) {
          cost.set(next, c);
          previous.set(next, id);
          if (!open.includes(next)) open.push(next);
        }
      }
  }
  return [];
}
export class SafariSimulation {
  level = 0;
  mode: GameMode = "playing";
  private suspendedMode: "playing" | "caught" | "complete" = "playing";
  time = 0;
  actors: Actor[] = [];
  trap: (Point & { arming: number; pop: number }) | null = null;
  baits: Bait[] = [];
  message = "";
  captureId: string | null = null;
  correct = false;
  attempts = 0;
  hints = 0;
  completed = 0;
  objectiveIndex = 0;
  rescuedIds: string[] = [];
  feeder: (Point & { diet: Diet | null; remaining: number }) | null = null;
  calm: (Point & { remaining: number }) | null = null;
  calmCooldown = 0;
  private collisionObstacles: Obstacle[] = [];
  private finishedContracts = new Set<number>();
  get completedLevels() { return [...this.finishedContracts].map(level => level + 1); }
  private baitId = 0;
  events: Array<{
    type: string;
    level: number;
    time: number;
    id?: string;
    assisted: boolean;
  }> = [];
  constructor(public readonly variant: 0 | 1 = 0) {
    this.load(0);
  }
  get contract() {
    return CONTRACTS[this.level]!;
  }
  get objective() { return objectiveFor(this.contract, this.objectiveIndex); }
  get objectiveTotal() { return objectiveCount(this.contract); }
  get levelCleared() { return this.mode === "caught" && this.correct && this.objectiveIndex === this.objectiveTotal - 1; }
  get toolkit() { return { feeder: this.level >= 10, calm: this.level >= 25 }; }
  get obstacles() {
    return this.collisionObstacles;
  }
  home(spec: CreatureSpec): Point {
    return { x: spec.spawn[0] * (this.variant ? -1 : 1), z: spec.spawn[1] };
  }
  load(level: number) {
    if (!Number.isInteger(level) || level < 0 || level >= CONTRACTS.length) throw new RangeError("Invalid safari level");
    this.level = level;
    this.collisionObstacles = obstaclesForLevel(level).map(o => ({ ...o, x: o.x * (this.variant ? -1 : 1) }));
    this.time = 0;
    this.trap = null;
    this.baits = [];
    this.objectiveIndex = 0;
    this.rescuedIds = [];
    this.feeder = null;
    this.calm = null;
    this.calmCooldown = 0;
    this.captureId = null;
    this.correct = false;
    this.message = level === 10 ? "כלי חדש: קערת הסחה. הניחו אותה ואז גררו לתוכה עלה או פרי כדי להעסיק יריב."
      : level === 25 ? "כלי חדש: פרח הרגעה. האטו חיות סמוכות זמנית; להשוואה משתמשים במהירות הרגילה שבנתונים." : "";
    this.hints = 0;
    this.attempts = 0;
    this.mode = "playing";
    this.suspendedMode = "playing";
    this.actors = this.contract.creatures.map((spec, i) => ({
      spec,
      ...this.home(spec),
      angle: i * 0.8,
      mode: "wander",
      timer: 1 + i * 0.2,
      destination: {
        x: this.home(spec).x + Math.sin(i) * 0.5,
        z: spec.spawn[1] + Math.cos(i) * 0.5,
      },
      route: [],
      routeAge: 0,
      carrying: null,
      wanderStep: i,
    }));
  }
  noteEvent(type: string, id?: string) {
    this.events.push({
      type,
      level: this.level + 1,
      time: Math.round(this.time * 10) / 10,
      id,
      assisted: this.hints > 0,
    });
    if (this.events.length > 100) this.events.shift();
  }
  phase() {
    return !this.trap ? "place-catcher" : !this.baits.length ? "drop-food" : "watch";
  }

  fits(p: Point, r = 0.25) {
    return pointClear(p, this.obstacles, r);
  }
  placementIssue(point: Point): "edge" | "rock" | "animal" | null {
    if (Math.abs(point.x) >= BOUNDS.x - TRAP_RADIUS || Math.abs(point.z) >= BOUNDS.z - TRAP_RADIUS) return "edge";
    if (this.obstacles.some(o => distance(o, point) <= o.r + TRAP_RADIUS)) return "rock";
    if (this.actors.some(a => a.mode !== "rescued" && distance(a, point) < TRAP_RADIUS + 0.15 * a.spec.size)) return "animal";
    return null;
  }
  place(point: Point) {
    if (this.mode !== "playing") return false;
    const issue = this.placementIssue(point);
    if (issue) {
      this.message = issue === "edge"
        ? "כל הטבעת צריכה להיות בתוך גבול הדשא המסומן. הזיזו אותה מעט פנימה."
        : issue === "rock"
          ? "הטבעת נוגעת באבן. הרחיקו אותה מעט מהאבן המסומנת."
          : "הטבעת קרובה מדי לחיה. הניחו אותה לצידה ופַתו אותה במזון.";
      return false;
    }
    this.trap = { ...point, arming: 0.55, pop: 0 };
    this.message = "מעולה! עכשיו גררו עלה או פרי אל השטח.";
    this.noteEvent("place-trap");
    return true;
  }
  toss(point: Point, diet: Diet) {
    if (this.mode !== "playing") return false;
    if (!this.fits(point, 0.12)) {
      this.message = "הניחו את המזון על הדשא, מחוץ לאבן.";
      return false;
    }
    if (this.feeder && distance(this.feeder, point) < .65) {
      this.feeder.diet = diet;
      this.feeder.remaining = FEEDER_SECONDS;
      this.message = "הקערה תעסיק את החיות שמעדיפות את המזון הזה למשך10שניות. הציבו מלכודת במקום אחר.";
      this.noteEvent("fill-feeder");
      return true;
    }
    this.baits.push({
      ...point,
      id: ++this.baitId,
      diet,
      age: 0,
      flight: 0.38,
    });
    if (this.baits.length > 2) this.baits.shift();
    this.message = "הם בדרך! אפשר להוסיף פיתיון שיסיח חיה מתחרה.";
    this.noteEvent("bait");
    return true;
  }
  placeFeeder(point: Point) {
    if (this.mode !== "playing" || !this.toolkit.feeder) return false;
    if (!this.fits(point, .4)) { this.message = "הניחו את כל הקערה על דשא פנוי, מחוץ לאבנים ולגבול."; return false; }
    this.feeder = { ...point, diet: null, remaining: 0 };
    this.message = "הקערה ריקה. גררו לתוכה עלה או פרי כדי להסיח חיות מתחרות.";
    this.noteEvent("place-feeder");
    return true;
  }
  placeCalm(point: Point) {
    if (this.mode !== "playing" || !this.toolkit.calm || this.calmCooldown > 0 || !this.fits(point, .15)) return false;
    this.calm = { ...point, remaining: CALM_SECONDS };
    this.calmCooldown = 9;
    this.message = "הפרח מאט זמנית חיות סמוכות. המהירות הרגילה ביומן נשארת הנתון להשוואה.";
    this.noteEvent("calming-patch");
    return true;
  }
  movementMultiplier(actor: Actor) {
    const ordinary = actor.mode === "lured" ? 1.35 : actor.mode === "escape" ? 1.5 : 1;
    return ordinary * (this.calm && distance(actor, this.calm) < CALM_RADIUS ? .35 : 1);
  }
  private capture(actor: Actor) {
    if (!this.trap) return;
    actor.x = this.trap.x;
    actor.z = this.trap.z;
    actor.mode = "caught";
    actor.carrying = null;
    this.trap.pop = 1;
    this.captureId = actor.spec.id;
    this.correct = acceptsCapture(this.contract, actor.spec.id, this.objectiveIndex, this.rescuedIds);
    this.attempts++;
    this.mode = "caught";
    this.message = this.correct
      ? "בדיוק! עוד חיה בדרך למחנה."
      : this.objective.misconceptionHe ?? this.contract.misconceptionHe;
    this.noteEvent("capture", actor.spec.id);
  }
  release() {
    if (this.mode !== "caught" || this.correct) return;
    const actor = this.actors.find((a) => a.spec.id === this.captureId)!;
    actor.mode = "escape";
    actor.timer = 1.5;
    actor.destination = this.home(actor.spec);
    actor.route = [];
    this.captureId = null;
    this.baits = [];
    this.trap = null;
    this.feeder = null;
    this.calm = null;
    this.calmCooldown = 0;
    this.mode = "playing";
    this.message = "החיה שוחררה. מזיזים מלכודת, בוחרים מזון, ומנסים שוב.";
    this.noteEvent("retry");
  }
  next() {
    if (this.mode !== "caught" || !this.correct) return;
    this.rescuedIds.push(this.captureId!);
    this.actors.find(a => a.spec.id === this.captureId)!.mode = "rescued";
    if (this.objectiveIndex + 1 < this.objectiveTotal) {
      this.objectiveIndex++;
      this.captureId = null;
      this.correct = false;
      this.trap = null;
      this.baits = [];
      this.feeder = null;
      this.calm = null;
      this.calmCooldown = 0;
      this.mode = "playing";
      this.message = "חילוץ אחד הושלם. התיאור הבא מתייחס גם לחיות שכבר חולצו — הנתונים נשארים ביומן.";
      this.noteEvent("rescue-step");
      return;
    }
    this.noteEvent("contract-complete", this.captureId!);
    this.finishedContracts.add(this.level);
    this.completed = this.finishedContracts.size;
    if (this.level === CONTRACTS.length - 1) {
      this.mode = "complete";
      return;
    }
    this.load(this.level + 1);
  }
  resetTrap() {
    if (this.mode !== "playing") return;
    this.trap = null;
    this.baits = [];
    this.message = "המלכודת חזרה למגש. אפשר לגרור אותה למקום אחר.";
    this.noteEvent("reset-trap");
  }
  restart() {
    this.events = [];
    this.load(this.level);
    this.noteEvent("restart-level");
  }
  open(mode: "notes" | "help" | "paused" | "levels") {
    if (["playing", "caught", "complete"].includes(this.mode))
      this.suspendedMode = this.mode as "playing" | "caught" | "complete";
    this.mode = mode;
    if (mode === "help") {
      this.hints++;
      this.noteEvent("hint");
    }
  }
  resume() {
    if (["notes", "help", "paused", "levels"].includes(this.mode))
      this.mode = this.suspendedMode;
  }
  private move(actor: Actor, goal: Point, speed: number, dt: number) {
    const radius = 0.24 * Math.min(actor.spec.size, 1.25);
    actor.routeAge -= dt;
    if (!actor.route.length || actor.routeAge <= 0) {
      actor.route = findRoute(actor, goal, this.obstacles, radius);
      actor.routeAge = 0.5;
    }
    const target = actor.route[0];
    if (!target) return;
    const d = distance(actor, target);
    if (d < 0.09) {
      actor.route.shift();
      return;
    }
    const step = Math.min(d, speed * dt),
      dx = ((target.x - actor.x) / d) * step,
      dz = ((target.z - actor.z) / d) * step;
    actor.angle = Math.atan2(dx, dz);
    if (this.fits({ x: actor.x + dx, z: actor.z + dz }, radius)) {
      actor.x += dx;
      actor.z += dz;
    }
  }
  /** Retain elapsed real time on slower frames; collision updates remain short. */
  advance(seconds: number) {
    for (let remaining = Math.max(0, seconds); remaining > 1e-8 && this.mode === "playing"; remaining -= 1 / 60)
      this.update(Math.min(1 / 60, remaining));
  }
  update(dt: number) {
    if (this.mode !== "playing") return;
    dt = Math.min(dt, 0.05);
    this.time += dt;
    this.calmCooldown = Math.max(0, this.calmCooldown - dt);
    if (this.calm) { this.calm.remaining -= dt; if (this.calm.remaining <= 0) this.calm = null; }
    if (this.feeder) { this.feeder.remaining = Math.max(0, this.feeder.remaining - dt); }
    if (this.trap) {
      this.trap.arming = Math.max(0, this.trap.arming - dt);
      this.trap.pop = Math.max(0, this.trap.pop - dt * 2);
    }
    for (const b of this.baits) {
      b.flight = Math.max(0, b.flight - dt);
      if (!b.flight) b.age += dt;
    }
    this.baits = this.baits.filter((b) => b.age < 16);
    for (const a of this.actors) {
      if (a.mode === "caught" || a.mode === "rescued") continue;
      a.timer -= dt;
      if (a.mode === "feeding") {
        if (this.feeder && this.feeder.remaining > 0 && this.feeder.diet === a.spec.diet && distance(a, this.feeder) < .85) continue;
        a.mode = "wander"; a.carrying = null; a.timer = 0; a.route = []; a.destination = this.home(a.spec);
      }
      if (a.mode === "eating" && a.timer > 0) continue;
      if (a.mode === "eating") {
        a.mode = "escape";
        a.timer = 1.7;
        a.destination = this.home(a.spec);
        a.route = [];
      }
      const lure =
        a.mode === "escape"
          ? null
          : [...this.baits
              .filter(
                (b) =>
                  !b.flight && b.diet === a.spec.diet && distance(a, b) < 6.2,
              ), ...(this.feeder && this.feeder.remaining > 0 && this.feeder.diet === a.spec.diet && distance(a, this.feeder) < 6.2 ? [this.feeder] : [])]
              .sort((b, c) => distance(a, b) - distance(a, c))[0];
      if (!lure && a.mode === "lured") {
        a.mode = "wander"; a.carrying = null; a.route = []; a.timer = 0; a.destination = this.home(a.spec);
      }
      if (lure) {
        if (a.mode !== "lured" || distance(a.destination, lure) > 0.15)
          a.route = [];
        a.destination = lure;
        a.mode = "lured";
        if (lure === this.feeder && distance(a, lure) < .5) {
          a.mode = "feeding"; a.carrying = a.spec.diet; a.route = []; continue;
        }
        if (distance(a, lure) < 0.24) {
          a.mode = "eating";
          a.timer = 1.2;
          a.carrying = lure.diet;
          this.baits = this.baits.filter((b) => b !== lure);
          this.message = `${a.spec.name} לקח את הפיתיון!`;
          continue;
        }
      } else if (
        (a.mode === "escape" && (a.timer <= 0 || distance(a, a.destination) < .1)) ||
        (a.mode === "wander" && (distance(a, a.destination) < .1 || (!a.route.length && a.timer <= 0)))
      ) {
        a.mode = "wander";
        a.carrying = null;
        // Pick a real walking leg. Chasing a continuously moving nearby point
        // previously reduced every animal to tiny ~0.2m/s steps after arrival.
        for (let attempt = 0; attempt < 8; attempt++) {
          const phase = ++a.wanderStep * 2.399963 + this.actors.indexOf(a) * 1.7;
          const goal = {
            x: this.home(a.spec).x + Math.sin(phase) * 1.05 * (this.variant ? -1 : 1),
            z: a.spec.spawn[1] + Math.cos(phase) * .85,
          };
          if (this.fits(goal, .3) && distance(a, goal) > .75) {
            a.destination = goal;
            a.route = [];
            break;
          }
        }
        a.timer = 3;
      }
      this.move(
        a,
        a.destination,
        a.spec.usualSpeed * this.movementMultiplier(a),
        dt,
      );
    }
    // Gentle body separation prevents the visual pile-up of the former prototype.
    for (let i = 0; i < this.actors.length; i++)
      for (let j = i + 1; j < this.actors.length; j++) {
        const a = this.actors[i],
          b = this.actors[j];
        if (["caught", "rescued"].includes(a.mode) || ["caught", "rescued"].includes(b.mode)) continue;
        const d = distance(a, b),
          gap = 0.24 * (a.spec.size + b.spec.size);
        if (d > 0 && d < gap) {
          const push = (gap - d) * 0.5,
            dx = ((a.x - b.x) / d) * push,
            dz = ((a.z - b.z) / d) * push;
          if (this.fits({ x: a.x + dx, z: a.z + dz }, 0.23)) {
            a.x += dx;
            a.z += dz;
          }
          if (this.fits({ x: b.x - dx, z: b.z - dz }, 0.23)) {
            b.x -= dx;
            b.z -= dz;
          }
        }
      }
    if (this.trap && this.trap.arming === 0) {
      const nearest = this.actors
        .filter(
          (a) =>
            a.mode !== "caught" && a.mode !== "rescued" &&
            distance(a, this.trap!) < CAPTURE_RADIUS &&
            segmentClear(a, this.trap!, this.obstacles, 0.15),
        )
        .sort((a, b) => distance(a, this.trap!) - distance(b, this.trap!))[0];
      if (nearest) this.capture(nearest);
    }
  }
  text() {
    return {
      coordinateSystem:
        "ground x east, z south, y up; fixed camera; units metres",
      mode: this.mode,
      elapsedSeconds: +this.time.toFixed(3),
      phase: this.phase(),
      variant: this.variant,
      contract: this.level + 1,
      instruction: this.objective.instruction,
      brief: this.contract.instruction,
      chapter: this.contract.chapter,
      objective: this.objectiveIndex + 1,
      objectiveTotal: this.objectiveTotal,
      rescuedIds: [...this.rescuedIds],
      levelCleared: this.levelCleared,
      toolkit: this.toolkit,
      feeder: this.feeder,
      calm: this.calm,
      calmCooldown: +this.calmCooldown.toFixed(2),
      trap: this.trap,
      baits: this.baits.map(({ id, x, z, diet, age, flight }) => ({
        id,
        x,
        z,
        diet,
        age,
        flight,
      })),
      creatures: this.actors.map((a) => ({
        id: a.spec.id,
        name: a.spec.name,
        archetype: a.spec.archetype,
        x: +a.x.toFixed(2),
        z: +a.z.toFixed(2),
        y: a.mode === "caught" ? 0.12 : 0,
        mode: a.mode,
        preferredBait: a.spec.diet,
        usualSpeed: a.spec.usualSpeed,
        size: a.spec.size,
        habit: a.spec.habit,
        carrying: a.carrying,
      })),
      obstacles: this.obstacles,
      placement: { bounds: BOUNDS, trapRadius: TRAP_RADIUS },
      captureId: this.captureId,
      correct: this.correct,
      attempts: this.attempts,
      hints: this.hints,
      completed: this.completed,
      completedLevels: this.completedLevels,
      message: this.message,
      events: this.events.slice(-12),
    };
  }
}
