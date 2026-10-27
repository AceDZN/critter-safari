# Critter Safari — ספארי היצורים

A real3D woodland capture game for Hebrew-speaking grade-7/8 English learners. Read a short contract, drag a bubble trap onto the grass, and drop suitable food. Creatures follow the lure; the first one entering the ring is caught automatically.

The rebuild replaces the rejected first-person prototype's movement/aim/pulse controls with **two direct world gestures**. It opens on two rabbits with an always-visible preference/pace/size roster and one Hebrew action prompt. Wrong animals remain capturable, with one-button release and retry. English changes whom to catch; placement and competing feeders change what actually happens.

## Run

Node22.12+ recommended. `npm ci`, then `npm run dev` at http://localhost:5232 (strict port). `npm run build` creates static `dist/`; `npm run preview` serves http://localhost:4232 (strict port). Dependencies and lockfile are pinned. Relative Vite base, local models/font/audio; no backend, accounts, runtime AI, microphone or API keys. Standalone play sends no analytics; inside Workbook, a scoped parent bridge reports readiness and contract progress to the existing player.

## Controls

- Drag the trap from its tray to clear grass. Drag the placed trap to move it. A dashed meadow boundary and the same full-size placement preview explain edge/rock/animal clearance.
- Drag a leaf or berry onto the grass. A second drop can distract a rival. The trap bubbles automatically.
- Tap a tray item and then tap the ground as an alternative to dragging.
- Holding a selected item pauses planning. Reading/help/settings also pause without penalty.
- Animal facts: all names, preferences, usual pace and size stay visible during play. Journal: expanded facts and vocabulary. Settings: independent music/effects levels, global mute, reduced motion, restart and fullscreen.
- Keyboard alternative: focus a tray item and press Enter, use arrows to position it in screen space, then Enter to drop; Escape cancels. N opens notes, P pauses, F toggles fullscreen.

## Slice and source material

Five authored contracts: individual food preference, independent size/pace comparison, two constraints, bounded fastest within a named subset, and a changed-context slowest with new names/traits/terrain. Contracts3–4 share the same scene but require different targets. A session chooses one of two verified horizontal reflections. These are fictional individuals' preferences and game pace, not claims about real animal species.

CURRICULUM.md maps exact original fixtures to saved Workbook sources. These are reading-comprehension tasks, not proof of grammar production or validated learning gains.

## Art and music

Three original private Pro Tripo models were generated after existing gallery candidates were inspected and rejected for fit, riggability or unverified reuse rights. All three GLBs have acquired weighted creature skeletons. Deer/tortoise use their imported Walk; rabbit now uses locally authored four-paw Walk/Trot clips on its acquired rig after the generic preset produced a bipedal posture. Cadence follows measured stride and individual travel speed. GLBs total3,861,104bytes; local rabbit motion adds300,097bytes, totaling4,161,201bytes. Each GLB is below3MB. ASSETS.md records prompts, jobs, costs, license basis, file hashes and skeletal evidence. There is no separate idle clip; locomotion stops advancing while stationary/paused.

“Fern Garden Waltz” is an original57.6-second composition with sampled woodwinds, pizzicato strings, harp and celesta, plus matching bait/trap/bubble/capture/release cues. AUDIO.md records creation, sources and reproducible MIDI/render scripts. Music is local and starts after a gesture.

## Verification

`npm test` runs40 independent semantic/physical/state/host tests, including all five captures in both reflected layouts, mistakes, recovery, pause, collision detours and preserved capture reading. `npm run test:browser` is the normal-input browser sequence; install Playwright Chromium with `npx playwright install chromium` if needed. `CRITTER_BROWSER_PATH` may select an installed Chromium binary, and `CRITTER_HEADLESS=1` enables headless.

PLAYTEST.md and VISUAL_REVIEW.md distinguish the rebuilt slice's actual desktop/touch evidence and remaining visual differences from historical prototype captures. Fresh built-in imagegen concepts/prompts are in docs/visual-targets/rebuild; actual frames are separately under docs/actual-captures/rebuild. Automated plans establish solvability and input behavior; they do not establish fun or learning gains.

## Workbook release

The English games app in `AceDZN/acedzn-tools` hosts the static build through its existing same-origin R2 rewrite. `?level=1` through `?level=5` open the corresponding contract. The bridge emits ready after actual models render, then one start and one successful completion per contract. Wrong captures, notes and retries do not report success. Direct entry counts only contracts actually completed. See workbook/README.md and docs/verification/workbook-host.json.

Build command `npm run build`; output directory `dist`; relative Vite assets require no game environment variables. The human approved release to the existing Workbook games app on27 October2026. Main receives working checkpoints, without force pushes.
