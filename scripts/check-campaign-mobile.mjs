/** Independent focused QA: actual browser input + observable state/time hooks.
 * No game, actor, rescue, storage or completion assignments. Plans are read-only.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import { chromium } from 'playwright';

const base = process.env.CRITTER_URL || 'http://127.0.0.1:4232';
const out = process.env.CRITTER_MOBILE_OUT || 'work/campaign/mobile-review';
const freezeStartup = process.env.CRITTER_MANUAL_CLOCK_START !== '0';
const executablePath = process.env.CRITTER_BROWSER_PATH || '/Users/acedzn/Library/Caches/ms-playwright/chromium-1148/chrome-mac/Chromium.app/Contents/MacOS/Chromium';
const plans = JSON.parse(await fs.readFile('docs/verification/campaign-physical-plans.json', 'utf8'));
await fs.mkdir(out, { recursive: true });
const report = { kind: 'Independent automated input review; not a novice study or fun/learning validation.', base, clockPolicy: freezeStartup ? 'Public advanceTime(0) at earliest availability; preset physical witnesses begin at t=0.' : 'Live startup, then public advanceTime(0) after ready; may invalidate a t=0 witness.', checks: {}, focus: [], actions: [], errors: [], httpErrors: [], failures: [] };
const wrapper = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://127.0.0.1');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><style>body{margin:0}iframe{width:100vw;height:100svh;border:0;display:block}</style><script>window.messages=[];addEventListener('message',e=>{if(e.origin===${JSON.stringify(new URL(base).origin)}&&e.source===document.querySelector('iframe')?.contentWindow)messages.push(e.data)})</script><iframe title="Critter Safari QA" allow="autoplay;fullscreen" src="${base}/?level=${Number(u.searchParams.get('level')) || 50}"></iframe>`);
});
await new Promise(resolve => wrapper.listen(0, '127.0.0.1', resolve));
const wrapperURL = `http://127.0.0.1:${wrapper.address().port}/?level=50`;
const browser = await chromium.launch({ headless: false, executablePath });
let context, page, frame, cdp;
function track(p) {
  p.on('pageerror', e => report.errors.push(String(e)));
  p.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
  p.on('response', r => { if (r.status() >= 400) report.httpErrors.push({ status: r.status(), url: r.url() }); });
}
const state = async () => JSON.parse(await frame.evaluate(() => window.render_game_to_text()));
const step = async ms => frame.evaluate(ms => window.advanceTime(ms), ms);
async function save(name) {
  await page.screenshot({ path: `${out}/${name}.png`, timeout: 60000 });
  await fs.writeFile(`${out}/${name}.json`, JSON.stringify({ state: await state(), dom: await frame.locator('body').innerText() }, null, 2));
}
async function point(p) {
  const canvas = await frame.locator('#game').boundingBox();
  assert.ok(canvas);
  const local = await frame.evaluate(p => window.worldToScreen(p), p);
  return { x: canvas.x + local.x, y: canvas.y + local.y, local };
}
async function click(selector, touch = false) {
  const locator = frame.locator(selector);
  assert.equal(await locator.isVisible(), true, `${selector} must be visible before input`);
  assert.equal(await locator.isEnabled(), true, `${selector} must be enabled before input`);
  const b = await locator.boundingBox(); assert.ok(b);
  if (touch) await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  else await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
}
async function focusAndResume(label) {
  await page.bringToFront();
  const s = await state();
  const focused = await frame.evaluate(() => ({ hasFocus: document.hasFocus(), visibility: document.visibilityState }));
  report.focus.push({ label, mode: s.mode, ...focused, resumed: s.mode === 'paused' });
  if (s.mode === 'paused') await click('#resume-btn');
  await step(0);
  assert.equal((await state()).mode, 'playing', `${label}: active world after any explicit user-style resume`);
}
async function open(level, mobile = false, hosted = false) {
  // Close the previous context before opening another window; handle actual
  // pause/focus state explicitly instead of assuming a new page is playing.
  if (context) await context.close();
  context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, deviceScaleFactor: 1, ...(mobile ? { isMobile: true, hasTouch: true } : {}) });
  if (freezeStartup) await context.addInitScript(origin => {
    if (location.origin !== origin) return;
    // The existing deterministic public hook freezes the initial clock, not
    // actor/win/storage state. Exact preauthored plans assume this baseline.
    const timer = setInterval(() => {
      if (typeof window.advanceTime === 'function') {
        clearInterval(timer);
        window.advanceTime(0);
      }
    }, 0);
  }, new URL(base).origin);
  page = await context.newPage(); page.setDefaultTimeout(15000); track(page);
  await page.bringToFront();
  await page.goto(hosted ? wrapperURL : `${base}/?level=${level}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  if (hosted) {
    await page.waitForFunction(() => window.messages.some(m => m.type === 'ready'), null, { timeout: 120000 });
    frame = page.frames().find(f => f.url().startsWith(base)); assert.ok(frame);
  } else frame = page.mainFrame();
  await frame.waitForFunction(() => typeof window.render_game_to_text === 'function' && JSON.parse(window.render_game_to_text()).ready, null, { timeout: 120000 });
  await step(0);
  await focusAndResume(`open-${level}-${mobile ? 'mobile' : 'desktop'}-${hosted ? 'hosted' : 'direct'}`);
  assert.equal((await state()).contract, level);
  if (freezeStartup) assert.equal((await state()).elapsedSeconds, 0, 'preset witnesses require an actual t=0 baseline');
  cdp = mobile ? await context.newCDPSession(page) : null;
}
async function touch(type, touchPoints) {
  let timer;
  try {
    await Promise.race([
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints }),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`Touch protocol acknowledgment timed out: ${type}`)), 30000); }),
    ]);
  } finally { clearTimeout(timer); }
}
async function drag(tool, groundPoint, useTouch = false) {
  const before = await state();
  assert.equal(before.mode, 'playing', `before ${tool} drag`);
  const button = frame.locator(`#${tool}-tool`);
  assert.equal(await button.isVisible(), true);
  assert.equal(await button.isEnabled(), true);
  const b = await button.boundingBox(); assert.ok(b);
  const p = await point(groundPoint), viewport = page.viewportSize();
  assert.ok(p.x > 2 && p.x < viewport.width - 2 && p.y > 2 && p.y < viewport.height - 2, `planned drop projects inside viewport: ${JSON.stringify({ tool, groundPoint, p, viewport })}`);
  const target = await frame.evaluate(p => document.elementFromPoint(p.x, p.y)?.tagName, p.local);
  assert.equal(target, 'CANVAS', `planned world drop must not be hidden by interface (${tool}, ${JSON.stringify(p.local)})`);
  const start = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  report.actions.push({ contract: before.contract, objective: before.objective, tool, point: groundPoint, input: useTouch ? 'CDP touch drag' : 'mouse drag' });
  if (useTouch) {
    await touch('touchStart', [{ ...start, id: 2 }]);
    assert.equal((await state()).heldTool, tool, 'touch down selects the visible tool');
    for (let i = 1; i <= 12; i++) await touch('touchMove', [{ x: start.x + (p.x - start.x) * i / 12, y: start.y + (p.y - start.y) * i / 12, id: 2 }]);
    await touch('touchEnd', []);
  } else {
    await page.mouse.move(start.x, start.y); await page.mouse.down();
    assert.equal((await state()).heldTool, tool, 'mouse down selects the visible tool');
    await page.mouse.move(p.x, p.y, { steps: 12 }); await page.mouse.up();
  }
  await step(0);
  const after = await state();
  assert.equal(after.mode, 'playing');
  assert.equal(after.heldTool, null, `${tool} must complete its drop: ${after.message}`);
  if (tool === 'catcher') assert.ok(after.trap, 'trap was placed');
  if (tool === 'feeder') assert.ok(after.feeder, 'feeder was placed');
  if (tool === 'calm') assert.ok(after.calm, 'calming patch was placed');
  if (tool === 'leaf' || tool === 'berry') {
    assert.ok(after.baits.length > before.baits.length || after.feeder?.remaining > (before.feeder?.remaining || 0), 'food becomes an actual loose lure or fills the bowl');
  }
}
async function capture(stage, name, touchInput = false) {
  for (const action of stage.actions) await drag(action.tool, action.point, touchInput);
  assert.ok((await state()).trap);
  let s, sawLured = false;
  for (let i = 0; i < 400; i++) {
    s = await state();
    sawLured ||= s.creatures.find(a => a.id === stage.id)?.mode === 'lured';
    if (s.mode !== 'playing') break;
    await step(75);
  }
  assert.equal(s.mode, 'caught', `capture phase must be reached: ${JSON.stringify(s)}`);
  assert.equal(s.captureId, stage.id);
  assert.equal(s.correct, true);
  assert.equal(sawLured, true, 'preferred food produced genuine approach');
  assert.equal(await frame.locator('#capture-btn').isVisible(), true, 'capture action exists only after a verified capture');
  await save(name);
  return s;
}
async function savedProgress() {
  // Read-only evidence: no seed, storage or completion assignment.
  return frame.evaluate(() => JSON.parse(localStorage.getItem('critter-safari-campaign-v1')));
}
async function facts() {
  const s = await state(), rows = frame.locator('#animal-facts li');
  assert.equal(await rows.count(), 6);
  const text = await frame.locator('#animal-facts').innerText();
  for (const a of s.creatures) for (const value of [a.name, a.preferredBait === 'leaf' ? 'leaves' : 'berries', a.usualSpeed.toFixed(2), a.size.toFixed(2)]) assert.ok(text.includes(value), `visible factual roster contains ${value}`);
  assert.equal(await frame.locator('#animal-stats').isVisible(), true);
  assert.equal(await frame.evaluate(() => document.body.scrollWidth), 390, 'no horizontal viewport overflow');
}
async function grassPoint() {
  // Use only observable geometry and visible DOM to select an unobscured test
  // patch. This never selects an answer animal or changes the state.
  const s = await state(), candidates = [];
  for (let x = -4; x <= 4; x += 1) for (let z = -3; z <= 3; z += 1) {
    if (s.obstacles.some(o => Math.hypot(x - o.x, z - o.z) <= o.r + .85)) continue;
    if (s.creatures.some(a => a.mode !== 'rescued' && Math.hypot(x - a.x, z - a.z) < 1.05)) continue;
    const p = await point({ x, z });
    if (p.x < 30 || p.x > 360 || p.y < 100 || p.y > 600) continue;
    const canvas = await frame.evaluate(p => document.elementFromPoint(p.x, p.y)?.tagName === 'CANVAS', p.local);
    if (canvas) candidates.push({ x, z, score: Math.abs(p.x - 195) + Math.abs(p.y - 350) });
  }
  candidates.sort((a, b) => a.score - b.score); assert.ok(candidates.length);
  return { x: candidates[0].x, z: candidates[0].z };
}
async function directFinal() {
  await open(50, false, true);
  const initial = await state();
  assert.equal(initial.objective, 1); assert.equal(initial.objectiveTotal, 3);
  assert.deepEqual(initial.campaign.completed, []); assert.equal(initial.campaign.highestUnlocked, 1);
  const plan = plans.find(p => p.level === 50 && p.variant === initial.variant); assert.ok(plan);
  await save('direct50-opening');
  for (let index = 0; index < plan.stages.length; index++) {
    assert.equal((await state()).objective, index + 1);
    const s = await capture(plan.stages[index], `direct50-capture-${index + 1}`);
    const events = await page.evaluate(() => window.messages);
    assert.equal(events.filter(m => m.type === 'level-complete').length, index === 2 ? 1 : 0);
    assert.equal(s.levelCleared, index === 2);
    assert.deepEqual(s.campaign.completed, index === 2 ? [50] : []);
    await click('#capture-btn');
    await step(0);
    if (index < 2) {
      assert.equal((await state()).mode, 'playing');
      assert.deepEqual((await state()).rescuedIds, plan.stages.slice(0, index + 1).map(stage => stage.id));
      await save(`direct50-reference-${index + 2}`);
    }
  }
  const final = await state(), stored = await savedProgress();
  assert.equal(final.mode, 'complete'); assert.deepEqual(final.campaign.completed, [50]); assert.equal(final.campaign.highestUnlocked, 1);
  assert.deepEqual(Object.keys(stored.completed), ['50']);
  const events = await page.evaluate(() => window.messages);
  assert.deepEqual(events.map(m => m.type), ['ready', 'level-start', 'level-complete']);
  assert.equal(events[1].level, 50); assert.equal(events[2].level, 50);
  await save('direct50-complete');
  report.checks.direct50 = { captures: plan.stages.map(s => s.id), events, completed: final.campaign.completed, highestUnlocked: final.campaign.highestUnlocked, stored };
  console.log('DIRECT50_PASS');
}
async function mobileTools() {
  await open(26, true);
  await facts();
  assert.equal(await frame.locator('[data-tool]:visible').count(), 5);
  for (const tool of ['catcher', 'leaf', 'berry', 'feeder', 'calm']) {
    const b = await frame.locator(`#${tool}-tool`).boundingBox(); assert.ok(b && b.x >= 0 && b.x + b.width <= 391 && b.y >= 0 && b.y + b.height <= 845);
  }
  await save('mobile26-opening');
  const p = await grassPoint();
  await drag('feeder', p, true);
  await drag('berry', p, true);
  let s = await state(); assert.equal(s.feeder.diet, 'berry'); assert.ok(s.feeder.remaining > 0);
  await save('mobile26-filled-feeder');
  await drag('calm', p, true);
  s = await state(); assert.ok(s.calmCooldown > 0); assert.equal(await frame.locator('#calm-tool').isDisabled(), true);
  await save('mobile26-calming');
  await click('#notes-btn', true); assert.equal((await state()).mode, 'notes');
  await click('#help-btn', true); assert.equal((await state()).mode, 'help');
  const paused = await state(); await step(2000);
  s = await state(); assert.deepEqual(s.creatures, paused.creatures); assert.deepEqual(s.feeder, paused.feeder); assert.deepEqual(s.calm, paused.calm); assert.equal(s.calmCooldown, paused.calmCooldown);
  await save('mobile26-help'); await click('#resume-btn', true); assert.equal((await state()).mode, 'playing');
  await click('#progress', true); assert.equal((await state()).mode, 'levels');
  const mapped = await state(); await step(2000); s = await state();
  assert.deepEqual(s.creatures, mapped.creatures); assert.deepEqual(s.feeder, mapped.feeder); assert.deepEqual(s.calm, mapped.calm);
  assert.equal(await frame.locator('[data-level]').count(), 50);
  await save('mobile26-map'); await click('#resume-btn', true);
  await frame.locator('#catcher-tool').focus(); await page.keyboard.press('Enter');
  s = await state(); assert.equal(s.heldTool, 'catcher'); assert.equal(s.trap, null); assert.equal(s.planning, true);
  await save('mobile26-keyboard-positioning');
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter'); await step(0);
  s = await state(); assert.ok(s.trap, `keyboard drop succeeds: ${s.message}`); assert.equal(s.heldTool, null);
  await save('mobile26-keyboard-trap');
  report.checks.mobile26 = { sixFacts: true, fiveVisibleTools: true, actualTouchDrags: ['feeder', 'berry', 'calm'], filledFeeder: true, cooldown: true, helpFreeze: true, mapFreeze: true, keyboardSelectThenDrop: true, grassPoint: p };
  console.log('MOBILE26_PASS');
}
async function mobileReference() {
  await open(39, true); await facts();
  const initial = await state(), plan = plans.find(p => p.level === 39 && p.variant === initial.variant); assert.ok(plan);
  await save('mobile39-opening');
  await capture(plan.stages[0], 'mobile39-first-capture', true);
  assert.equal((await state()).levelCleared, false);
  await click('#capture-btn', true); await step(0);
  let s = await state(); assert.equal(s.mode, 'playing'); assert.equal(s.objective, 2); assert.deepEqual(s.rescuedIds, ['alba']);
  assert.match(await frame.locator('#instruction').innerText(), /deer you rescued/);
  assert.match(await frame.locator('[data-creature="alba"]').innerText(), /rescued/);
  await facts(); await save('mobile39-rescued-reference');
  await capture(plan.stages[1], 'mobile39-second-capture', true);
  s = await state(); assert.equal(s.levelCleared, true); assert.deepEqual(s.campaign.completed, [39]); assert.equal(s.campaign.highestUnlocked, 1);
  report.checks.mobile39 = { actualTouchCaptures: plan.stages.map(s => s.id), rescuedReferenceVisible: true, isolatedCompletion: true };
  console.log('MOBILE39_PASS');
}
try {
  for (const [name, action] of [['direct50', directFinal], ['mobile26', mobileTools], ['mobile39', mobileReference]]) {
    try { await action(); }
    catch (error) {
      report.failures.push({ phase: name, error: String(error), stack: error.stack, state: await state().catch(() => null) });
      console.error('PHASE_FAILED', name, String(error));
      await save(`${name}-failure`).catch(e => report.failures.push({ phase: `${name}-failure-save`, error: String(e) }));
    }
  }
  assert.deepEqual(report.errors, []); assert.deepEqual(report.httpErrors, []);
} catch (error) { report.failures.push({ phase: 'runtime-errors', error: String(error) }); }
finally {
  await fs.writeFile(`${out}/results.json`, JSON.stringify(report, null, 2));
  await browser.close(); await new Promise(resolve => wrapper.close(resolve));
  console.log('REVIEW_BROWSER_CLOSED', JSON.stringify({ checks: Object.keys(report.checks), failures: report.failures.map(f => ({ phase: f.phase, error: f.error })), errors: report.errors, httpErrors: report.httpErrors }));
}
if (report.failures.length) process.exitCode = 1;
