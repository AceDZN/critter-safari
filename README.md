# Critter Safari — ספארי היצורים

A first-person 3D creature-capture game for Hebrew-speaking grade-7/8 English learners. Read a contract, inspect field notes, place a reusable bubble trap and lure a creature with suitable food. Comparative and bounded-superlative meanings change who should be caught.

**Current status: playable prototype; required Tripo character pipeline is blocked and incomplete.** The visible diagnostic silhouettes are author-created temporary geometry. They are explicitly labeled in the game. No acquired GLB, skeletal rig or clip is claimed. See ASSETS.md for the observed browser-control timeout and unknown generation submission. The screenshot targets are concepts, not gameplay captures.

## Run

Node 22.12+ recommended. `npm ci`, then `npm run dev` at http://localhost:5232 (strict port). `npm test` runs independent semantic and physical solvability fixtures. `npm run build` creates static `dist/`; `npm run preview` serves http://localhost:4232 (strict port). Dependencies and lockfile are pinned. Build uses relative Vite base and bundled local font; no runtime services, accounts, AI, analytics or API keys.

## Controls

- WASD: walk and strafe using physical key codes; drag the canvas: look; left/right arrows: turn.
- E or trap button: place at the ground reticle (5m range and open line of sight).
- Click/tap the canvas or touch Throw: toss selected bait (6m, line of sight).
- Q or bait button: alternate leaf/berry. Matching creatures react within 5.8m.
- Space or bubble button: pulse the trap; catches the nearest creature within its 1.06m radius. Requires open line of sight and a charged trap.
- R: retrieve/reset trap. N: field notes. H: vocabulary/help. P/Escape: pause. F: fullscreen.
- Mobile: movement pad, drag-to-look, large trap/bait/bubble and throw buttons.
- Reading, help, capture review and focus loss pause the world. Pause has restart, mute, reduced motion and fullscreen. No pointer lock or microphone required.

## Slice

Five authored contracts: identifying clause/diet/habit, independent size and speed comparisons, two constraints, bounded fastest leaf-eater, then slowest berry-eater in a changed clearing with new names/traits/obstacles. Four contracts deliberately share the same scene but require different targets. A session randomly selects one of two verified mirrored layouts. Wrong catches can be released immediately and retried; no quiz gates or answer buttons.

Implemented: Three.js garden, collision/line-of-sight/range rules, flying bait and reactive movement, trap charge/miss/capture/release, five-contract progression, local in-memory attempt/hint/retry events, Hebrew help and explicit LTR English, pausable reading, touch/keyboard/drag controls, sound after interaction, motion preference, restart, deterministic advance hook and observable text state.

Open: actual Tripo model acquisition, skeletal rigs/clips and runtime verification; final art-quality match to targets. Browser outcomes and performance limitations are in PLAYTEST.md and VISUAL_REVIEW.md. Do not describe this checkpoint as a completed art slice or validated learning intervention.

## Static Vercel preparation

Framework Vite; build command `npm run build`; output directory `dist`. No server or environment variables needed. The project is prepared for static hosting; no production deployment has been requested or made. Local Git main is the integration branch; no force pushes.

## Evidence and sources

GAME_IDENTITY.md describes the loop. CURRICULUM.md maps original fixtures to exact saved Workbook sources. ASSETS.md records provenance and the open art gate. docs/visual-targets contains two built-in image_gen concepts and exact prompts; docs/actual-captures is reserved for actual browser captures. Automated tests establish fixture consistency and tool solvability, not fun or learning gains.
