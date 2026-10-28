import test from "node:test";
import assert from "node:assert/strict";
import { SafariProgression, SAVE_KEY, readProgress, highestUnlocked } from "../src/progression";
const result = { attempts: 1, hints: 0, seconds: 12, rescues: 1 };
function store() {
  const data = new Map<string, string>();
  return { data, getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); } };
}
test("fifty levels unlock in order, persist, resume and replay without a grade input", () => {
  const storage = store(); let p = new SafariProgression(storage);
  assert.equal(p.currentLevel, 1); assert.equal(p.canPlay(2), false);
  for (let n = 1; n <= 50; n++) {
    assert.equal(p.enter(n), true); assert.equal(p.complete(n, result), true);
    p = new SafariProgression(storage);
    assert.equal(p.completedCount, n); assert.equal(p.highestUnlocked, Math.min(50, n + 1));
    assert.equal(p.currentLevel, Math.min(50, n + 1));
  }
  assert.equal(p.enter(8), true); assert.equal(p.currentLevel, 8);
  p.complete(8, { ...result, attempts: 8, hints: 3 });
  assert.equal(p.save.completed[8]!.attempts, 1); assert.equal(p.completedCount, 50);
});
test("a direct final lesson completes only that level and cannot unlock skipped levels", () => {
  const p = new SafariProgression(store());
  assert.equal(p.enter(50), false); assert.equal(p.enter(50, true), true);
  assert.equal(p.currentLevel, 1); assert.equal(p.complete(50, { ...result, rescues: 3 }), true);
  assert.equal(p.completedCount, 1); assert.equal(p.highestUnlocked, 1);
  assert.equal(p.canPlay(49), false); assert.equal(p.canPlay(50), true);
  assert.equal(p.enter(51, true), false);
});
test("saved unlock claims and invalid results do not grant progress", () => {
  const p = readProgress({ version: 1, currentLevel: 50, highestUnlocked: 50,
    completed: { 1: { ...result, attempts: -1 }, 2: result, 3: { ...result, seconds: Infinity }, 51: result } });
  assert.equal(highestUnlocked(p), 1); assert.equal(p.currentLevel, 1);
  assert.deepEqual(Object.keys(p.completed), ["2"]);
});
test("another tab's earned levels survive a stale-tab completion and reload", () => {
  const storage = store(), a = new SafariProgression(storage), b = new SafariProgression(storage);
  a.complete(1, result); a.complete(2, result);
  b.complete(1, { ...result, attempts: 2 });
  const reloaded = new SafariProgression(storage);
  assert.equal(reloaded.completedCount, 2); assert.equal(reloaded.highestUnlocked, 3);
  assert.equal(reloaded.save.completed[1]!.attempts, 1);
});
test("blocked storage stays playable and a future or unreadable save is preserved", () => {
  const blocked = new SafariProgression({ getItem() { throw Error("blocked"); }, setItem() { throw Error("blocked"); } });
  assert.equal(blocked.complete(1, result), true); assert.equal(blocked.highestUnlocked, 2); assert.ok(blocked.warning);
  for (const raw of ["broken{", '{"version":99,"completed":{"50":{}}}']) {
    const storage = store(); storage.data.set(SAVE_KEY, raw);
    const p = new SafariProgression(storage); p.complete(1, result);
    assert.equal(storage.data.get(SAVE_KEY), raw); assert.ok(p.warning);
  }
});
