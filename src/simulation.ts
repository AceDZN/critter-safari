import { CONTRACTS, type CreatureSpec, type Diet } from "./content";
import { acceptsCapture } from "./semantics";
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
  | "caught"
  | "complete";
export interface Actor extends Point {
  spec: CreatureSpec;
  angle: number;
  mode: "wander" | "lured" | "eating" | "escape" | "caught";
  timer: number;
  destination: Point;
  route: Point[];
  routeAge: number;
  carrying: Diet | null;
}
export interface Bait extends Point {
  id: number;
  diet: Diet;
  age: number;
  flight: number;
}
export const BOUNDS = { x: 5.5, z: 3.8 };
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
    nx = 27,
    nz = 18;
  const pos = (id: number): Point => ({
    x: -5.2 + (id % nx) * step,
    z: -3.4 + Math.floor(id / nx) * step,
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
  get obstacles() {
    const base =
      this.level < 2
        ? []
        : this.contract.scene === "transfer"
          ? TRANSFER_OBSTACLES
          : CLEARING_OBSTACLES;
    return this.variant ? base.map((o) => ({ ...o, x: -o.x })) : base;
  }
  home(spec: CreatureSpec): Point {
    return { x: spec.spawn[0] * (this.variant ? -1 : 1), z: spec.spawn[1] };
  }
  load(level: number) {
    this.level = level;
    this.time = 0;
    this.trap = null;
    this.baits = [];
    this.captureId = null;
    this.correct = false;
    this.message = "";
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
    return !this.trap
      ? "place-catcher"
      : !this.baits.length &&
          !this.actors.some((a) => a.mode === "lured" || a.mode === "eating")
        ? "drop-food"
        : "watch";
  }
  fits(p: Point, r = 0.25) {
    return pointClear(p, this.obstacles, r);
  }
  place(point: Point) {
    if (this.mode !== "playing") return false;
    if (!this.fits(point, 1.02)) {
      this.message = "צריך פיסת דשא פנויה. נסו מעט הצידה.";
      return false;
    }
    if (
      this.actors.some((a) => distance(a, point) < 1.05 + 0.15 * a.spec.size)
    ) {
      this.message = "כאן עומדת חיה. הניחו את המלכודת על דשא פנוי לצידה.";
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
  private capture(actor: Actor) {
    if (!this.trap) return;
    actor.x = this.trap.x;
    actor.z = this.trap.z;
    actor.mode = "caught";
    actor.carrying = null;
    this.trap.pop = 1;
    this.captureId = actor.spec.id;
    this.correct = acceptsCapture(this.contract, actor.spec.id);
    this.attempts++;
    this.mode = "caught";
    this.message = this.correct
      ? "בדיוק! עוד חיה בדרך למחנה."
      : this.contract.misconceptionHe;
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
    this.mode = "playing";
    this.message = "החיה שוחררה. מזיזים מלכודת, בוחרים מזון, ומנסים שוב.";
    this.noteEvent("retry");
  }
  next() {
    if (this.mode !== "caught" || !this.correct) return;
    this.noteEvent("contract-complete", this.captureId!);
    this.completed = this.level + 1;
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
    this.completed = 0;
    this.load(0);
    this.noteEvent("restart");
  }
  open(mode: "notes" | "help" | "paused") {
    if (["playing", "caught", "complete"].includes(this.mode))
      this.suspendedMode = this.mode as "playing" | "caught" | "complete";
    this.mode = mode;
    if (mode === "help") {
      this.hints++;
      this.noteEvent("hint");
    }
  }
  resume() {
    if (["notes", "help", "paused"].includes(this.mode))
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
  update(dt: number) {
    if (this.mode !== "playing") return;
    dt = Math.min(dt, 0.05);
    this.time += dt;
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
      if (a.mode === "caught") continue;
      a.timer -= dt;
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
          : this.baits
              .filter(
                (b) =>
                  !b.flight && b.diet === a.spec.diet && distance(a, b) < 6.2,
              )
              .sort((b, c) => distance(a, b) - distance(a, c))[0];
      if (lure) {
        if (a.mode !== "lured" || distance(a.destination, lure) > 0.15)
          a.route = [];
        a.destination = lure;
        a.mode = "lured";
        if (distance(a, lure) < 0.24) {
          a.mode = "eating";
          a.timer = 1.2;
          a.carrying = lure.diet;
          this.baits = this.baits.filter((b) => b !== lure);
          this.message = `${a.spec.name} לקח את הפיתיון!`;
          continue;
        }
      } else if (a.timer <= 0 || distance(a, a.destination) < 0.1) {
        a.mode = "wander";
        a.carrying = null;
        const phase = this.time * 0.3 + this.actors.indexOf(a) * 1.7;
        const goal = {
          x:
            this.home(a.spec).x +
            Math.sin(phase) * 0.72 * (this.variant ? -1 : 1),
          z: a.spec.spawn[1] + Math.cos(phase) * 0.58,
        };
        if (this.fits(goal, 0.3)) {
          a.destination = goal;
          a.route = [];
        }
        a.timer = 2.5;
      }
      this.move(
        a,
        a.destination,
        a.spec.usualSpeed *
          (a.mode === "lured" ? 1.35 : a.mode === "escape" ? 1.5 : 1),
        dt,
      );
    }
    // Gentle body separation prevents the visual pile-up of the former prototype.
    for (let i = 0; i < this.actors.length; i++)
      for (let j = i + 1; j < this.actors.length; j++) {
        const a = this.actors[i],
          b = this.actors[j];
        if (a.mode === "caught" || b.mode === "caught") continue;
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
            a.mode !== "caught" &&
            distance(a, this.trap!) < 0.9 &&
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
      phase: this.phase(),
      variant: this.variant,
      contract: this.level + 1,
      instruction: this.contract.instruction,
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
      captureId: this.captureId,
      correct: this.correct,
      attempts: this.attempts,
      hints: this.hints,
      completed: this.completed,
      message: this.message,
      events: this.events.slice(-12),
    };
  }
}
