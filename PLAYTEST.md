# Rebuilt slice verification — 27 October 2026

This record applies to the fixed elevated-camera rebuild, with real local Tripo animals and automatic capture. The earlier first-person prototype and its captures are historical. The user's rejection of its controls and creature art motivated this rebuild.

## Rules and physical simulation

`npm test`: **32 passing tests**. Independent numeric truth tables establish the five unique answers, bounded subsets, strict comparisons, ties, missing references, invalid authoring, near misses and invariance under temporary movement modifiers. Ten authored physical plans (five contracts × two reflected layouts) place a trap and food, observe actual lure-driven travel and catch the intended animal automatically. Tests do not assign capture/win states or move actors into the trap. Unit tests select authored contracts to isolate scenarios; the browser sequence progresses in order.

Physical tests also cover a wrong Pip catch, release and Moss retry; bait preference; invalid placement; body/obstacle clearance and detours; ordinary unbaited pace; planning/reading pause and trap arming; and restart. A separate regression checks that notes/help/settings opened during a capture return to that same capture/recovery state.

## Actual desktop production UI

`npm run build` passes. `npm run test:browser`, using headed Chromium at 1672×941 against production preview4232, passed all five contracts through normal pointer drags, timed simulation advancement and actual lure/capture consequences. It also passed completion/restart, wrong catch/release/correct retry, notes during recovery, notes freezing, keyboard music level, mute and reduced motion. No JS errors or HTTP failures were reported. Evidence: `docs/verification/rebuild-desktop.json`; PNG/JSON pairs under `docs/actual-captures/rebuild/`.

The script reads observable state and a read-only world-to-screen projection, and advances time with the documented hook. It never assigns the runtime level, answer, actor position or win. The captured-state assertions check that the prompt describes release/continue, the card names the caught animal, and tools are disabled during review.

Actual first-view, lure, wrong catch, release, correct rabbit/tortoise/deer catches, changed-context transfer, notes, settings and completion frames were inspected. The latest captures show the final prompt/name fixes. A prior RTL range-slider assertion exposed ambiguous direction; explicit LTR sliders now let ArrowRight increase the level.

## Independent visible UI, touch and keyboard

The independent reviewer first inspected only the screenshot and visible DOM, before reading simulation state. At1280×800 it identified the trap tray and the instruction to drag it to the grass, and placed it on the first attempt without opening notes. This is an informed-agent assessment, not an unfamiliar learner study.

At390×844, actual CDP touch drags placed a trap and berries, caught wrong Pip, opened and returned from notes to the same recovery, released it, and caught Moss with leaves on retry. The document width matched390px. Holding a selected item froze planning. Keyboard Enter selected without dropping, arrows moved in screen space, and a second Enter placed the trap. No JS/HTTP errors occurred.

Two real findings were fixed and independently rechecked on the final production build: the caught-state prompt now describes the available next action, and the capture card names the animal while unrelated labels hide. Final mobile wrong/correct captures were visually inspected. Evidence: `docs/verification/rebuild-review.json` and `reviewer-final-mobile-*` frames.

## Required develop-web-game client

The installed `web_game_playwright_client.js` ran against5232 after the rebuild. It selected the trap tool and clicked the ground via its action burst. The inspected1280×720 screenshot/state showed an actual placed trap, phase `drop-food`, two real skinned rabbits with31 bones each, and one decoded local music loop. No error file was produced. Copies are retained as `docs/verification/rebuild-required-client.json` and `docs/actual-captures/rebuild/required-client.png`. This verifies tap-select/tap-ground placement; the full desktop and touch sequences above verify consequences.

## Models and soundtrack

All three GLBs contain weighted skins and useful in-place skeletal Walk clips, not whole-object substitutes. `scripts/inspect-models.py` verifies hashes, joints, varying bone tracks and in-place root motion; output is in `docs/verification/rebuild-rigs.json`. Runtime actuals confirm model appearance and locomotion. Walk progression freezes during stationary/held/reading/caught states; a separate idle clip is not claimed.

The original57.6-second instrumental score and matching short effects replace the perceived noise background. The model-ready runtime audit checks gesture unlock, six decoded local buffers, one music voice across repeated notes/resume/restart, independent keyboard levels, mute, help freezing, fullscreen round trip, the blur event handler and restart. Automated tab activation did not change native focus/visibility in this run, so a native focus transition is not claimed as verified. Evidence and the scoped frame sample are in `docs/verification/rebuild-runtime.json`. AUDIO.md documents original composition, sample rights and rendering.

## Measured scope and remaining evaluation

Static `dist/` contains15 files totaling **5,815,626 bytes**, including **3,861,104 bytes** of models and **1,178,987 bytes** of audio. Each model is below3MB. The runtime audit recorded89 active frame intervals after20 warmup frames at1672×941/DPR1 with two real rabbits: median8.3ms,95th percentile9.3ms,43 draw calls and104,072 triangles. This is a brief callback sample on the shared Mac, not a sustained student-device benchmark. Automated first trap placement took about two seconds in the earlier rebuilt UI check; it is not a learner completion-time estimate.

The game is mechanically verified and ready for the user's playthrough. Automated and informed-agent checks do not establish fun, intuitive controls for a new learner, a6–10-minute learner duration, or learning gains. No production deployment was made. Dev5232 and preview4232 remain running.

The final game was opened in a fresh in-app browser tab, a trap was placed through visible tap-select/tap-ground controls, and the food-drop prompt was verified. The tab is marked as the deliverable; `iab-deliverable.png` records it.
