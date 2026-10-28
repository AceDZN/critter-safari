import test from "node:test";
import assert from "node:assert/strict";
import {
  isWorkbookParentOrigin,
  parseLevelParam,
  WorkbookSession,
  type HostMessage,
} from "../src/host";
import { SafariSimulation } from "../src/simulation";

test("Workbook deep links accept only the fifty authored integer contracts", () => {
  for (let n = 1; n <= 50; n++)
    assert.equal(parseLevelParam(`?level=${n}`, 50), n - 1);
  for (const search of [
    "",
    "?level=0",
    "?level=51",
    "?level=-1",
    "?level=2.5",
    "?level=NaN",
    "?level=2abc",
  ])
    assert.equal(parseLevelParam(search, 50), null);
});
test("bridge targets only first-party Workbook HTTPS hosts or local development", () => {
  for (const origin of [
    "https://workbook.co.il",
    "https://english-games.workbook.co.il",
    "https://english.workbook.co.il",
    "http://localhost:4017",
    "http://127.0.0.1:4232",
  ])
    assert.equal(isWorkbookParentOrigin(origin), true);
  for (const origin of [
    "https://workbook.co.il.evil.test",
    "https://evilworkbook.co.il",
    "http://english-games.workbook.co.il",
    "https://example.com",
    "null",
    "*",
  ])
    assert.equal(isWorkbookParentOrigin(origin), false);
});
test("real capture/recovery sends ready, starts and correct completion once, without counting a wrong catch", () => {
  const sim = new SafariSimulation(),
    messages: HostMessage[] = [];
  const session = new WorkbookSession((m) => messages.push(m));
  const observe = (ready = true) =>
    session.sync({
      ready,
      level: sim.level + 1,
      complete: sim.levelCleared,
      durationMs: sim.time * 1000,
    });
  observe(false);
  assert.deepEqual([...messages], []);
  observe();
  observe();
  assert.deepEqual(
    [...messages],
    [{ type: "ready" }, { type: "level-start", level: 1 }],
  );
  const catchWith = (diet: "berry" | "leaf") => {
    assert.equal(sim.place({ x: 0, z: 0 }), true);
    assert.equal(sim.toss({ x: 0, z: 0 }, diet), true);
    for (let i = 0; i < 1200 && sim.mode === "playing"; i++) {
      sim.update(1 / 60);
      observe();
    }
    assert.equal(sim.mode, "caught");
  };
  catchWith("berry");
  assert.equal(sim.correct, false);
  assert.equal(messages.length, 2);
  sim.open("notes");
  observe();
  sim.resume();
  observe();
  assert.equal(messages.length, 2);
  sim.release();
  for (let i = 0; i < 120; i++) sim.update(1 / 60);
  catchWith("leaf");
  assert.equal(sim.correct, true);
  assert.equal(messages.filter((m) => m.type === "level-complete").length, 1);
  const complete = messages.at(-1);
  assert.equal(complete?.type, "level-complete");
  if (complete?.type === "level-complete") assert.ok(complete.durationMs! > 0);
  observe();
  assert.equal(messages.length, 3);
  sim.next();
  observe(false);
  assert.equal(messages.length, 3);
  observe();
  assert.deepEqual(messages.at(-1), { type: "level-start", level: 2 });
  sim.restart();
  session.restart();
  observe();
  assert.deepEqual(messages.at(-1), { type: "level-start", level: 2 });
  assert.equal(messages.filter((m) => m.type === "ready").length, 1);
});
test("a direct lesson reports one earned contract without pretending skipped levels were done", () => {
  const sim = new SafariSimulation();
  sim.load(4);
  const messages: HostMessage[] = [],
    session = new WorkbookSession((m) => messages.push(m));
  const observe = () =>
    session.sync({
      ready: true,
      level: sim.level + 1,
      complete: sim.levelCleared,
      durationMs: sim.time * 1000,
    });
  observe();
  assert.equal(sim.place({ x: 0, z: 0 }), true);
  assert.equal(sim.toss({ x: 0, z: 0 }, "berry"), true);
  for (let i = 0; i < 1200 && sim.mode === "playing"; i++) {
    sim.update(1 / 60);
    observe();
  }
  assert.equal(sim.captureId, "glint");
  assert.equal(sim.correct, true);
  sim.next();
  assert.equal(sim.mode, "playing");
  assert.equal(sim.completed, 1);
  assert.deepEqual(sim.completedLevels, [5]);
  assert.deepEqual(
    messages.map((m) => m.type),
    ["ready", "level-start", "level-complete"],
  );
  assert.equal(messages[1]?.type === "level-start" && messages[1].level, 5);
  sim.restart();
  assert.deepEqual(sim.completedLevels, [5]);
});
