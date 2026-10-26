# Playtest record

26 October 2026. Playable prototype verification, with the required Tripo character pipeline still open.

## Independent rules and tool tests

`npm test`: 25 passing tests. Independent numeric fixture tables establish unique targets, bounded sets, near misses, strict equality/tie rejection, missing references, invalid authoring and invariance under current movement modifiers. Ten authored physical plans (five contracts × two reflected layouts) walk through movement inputs, place a trap, toss matching bait, observe more than .9 ground units of lure-driven travel and pulse the correct capture. No actor positions, capture result or win state are assigned by tests. Unit tests select authored contracts to isolate scenarios; browser progression below runs them in order.

Recovery tests catch real wrong Pip in contract1, release it, clear bait, restore charge and capture Moss on retry. Pause/notes/help freeze actor motion, flight, clock and recharge. Tests cover obstacles/LOS/range/cooldown/reset, wrong diet and restart. A direct ordinary ground-speed test matches the journal's0.62 for Moss. Capture pulls the authoritative actor to the trap center and exposes its lifted y=.35 position, matching the enclosure on screen. Restart begins a fresh local event history so completion counts refer to one safari.

## Desktop browser

A headed Playwright process using installed Chromium1148 completed a normal-input sequence at1672×941:

1. Start and read field notes; move/drag aim; place trap and throw berry bait; catch Pip during contract1 and observe a recoverable mistake.
2. Release, lure Moss with leaves and capture correctly; advance through all five contracts using keyboard movement, pointer aiming, tool inputs and ordinary lure/capture timing. The fifth contract changes names, diets and obstacles.
3. Reach the completed journal; restart; open vocabulary help and verify four seconds of manual advancement leave creatures unchanged; toggle mute and reduced motion in pause.

The script reads `render_game_to_text` and uses `advanceTime` to step time; it never assigns a win, target capture, actor position or runtime level. The first run logged one resource404; an explicit local favicon was then added. The final stable build was rerun through the same full sequence after material, camera, name-label, capture-center, favicon and restart fixes: **passed, zero console errors and zero reported HTTP failures**. The latest captures replace the original gameplay views; pre-material-fix images are retained separately.

Screenshots/state are separately saved under docs/actual-captures. The independent reviewer inspected journal, wrong catch/release, correct capture, changed-context lure, completion and help. English and field-note values match original fixtures; no target beacon or answer panel appears. Automated plans know the fixtures: these are mechanical checks, not evidence that an unfamiliar learner finds the game fun or learns from it.

## Required develop-web-game client

Ran the installed `web_game_playwright_client.js` repeatedly after renderer changes. Initial localhost navigation exceeded its30s timeout. Explicit IPv4 preview produced an actual1280×720 intro screenshot/state, which lead and reviewer inspected. The stable optimized build then passed a complete client journal capture with no errors (`work/client-final`), inspected by lead. A longer mouse/tool action sequence hit its5s click-stability boundary and slow per-frame software rendering; that exact process was terminated, and is not counted as successful gameplay evidence. Headed normal-input desktop verification above supplies actual gameplay captures.

Environment optimization reduced495 meshes/205 casters to66 meshes/59 casters plus one Points object. Redundant render work stops while paused/reading/manual stepping. Observed renderer counts and any frame-time sample are reported below; no broad hardware claim is inferred from this shared host.

## Mobile regression

Initial390×844 touch entry reached field notes, but Playwright locator.tap timed out awaiting acknowledgement. The screenshot exposed an actual RTL-scroll issue: names were initially clipped. Fixed by explicit LTR scrolling and a sticky name column. The independent follow-up used real CDP touch input on headed Chromium with its default GPU. It passed movement, drag-to-look, trap placement, berry→leaf bait switching, throwing, observed lure travel and a correct Moss capture. No script errors or HTTP failures. The prior forced-software run stalled input acknowledgement; default GPU completed the sequence. Saved and inspected `mobile-01-journal`, `mobile-02-lure` and `mobile-03-capture` PNG/JSON pairs. Document width390 matched viewport390; the384px table scrolls in a322px pane, with names initially visible and sticky.

## Open acceptance

Actual Tripo GLBs, skeletal rigs and animation clips are absent due to the external browser-control timeout in ASSETS.md. They cannot be verified by browser tests. No production deployment or student learning/fun validation has been made.

## Final measured checkpoint

Static dist bytes:750,486 across HTML, JS, CSS, local font/license and favicon (required GLBs are absent). Vite reports JS623.44kB raw/165.35kB gzip. A brief headed default-GPU sample at1672×941, DPR1 recorded80 post-warm-up animation-frame intervals: median8.3ms,95th percentile10.2ms,131 draw calls and154,256 triangles. These are observed callback intervals on this shared host, not a sustained hardware benchmark or a claim for student devices.

The actual game was also opened in the app browser pane, entered through the journal into playing mode using UI controls, and marked as a deliverable. `iab-deliverable.png` records that visible result. Dev5232 and preview4232 remain running.
