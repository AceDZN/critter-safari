# Rebuilt slice verification — 27 October 2026

This record applies to the fixed elevated-camera rebuild, with real local Tripo animals and automatic capture. The earlier first-person prototype and its captures are historical. The user's rejection of its controls and creature art motivated this rebuild.

## Rules and physical simulation

`npm test`: **36 passing tests**. Independent numeric truth tables establish the five unique answers, bounded subsets, strict comparisons, ties, missing references, invalid authoring, near misses and invariance under temporary movement modifiers. Ten authored physical plans (five contracts × two reflected layouts) place a trap and food, observe actual lure-driven travel and catch the intended animal automatically. Tests do not assign capture/win states or move actors into the trap. Unit tests select authored contracts to isolate scenarios; the browser sequence progresses in order.

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

All three GLBs contain weighted skins and source Walk clips. Runtime now replaces the rabbit's unsuitable preset with authored four-paw Walk/Trot on that real rig; deer/tortoise keep imported Walk. `scripts/inspect-models.py` verifies hashes, joints, varying bone tracks and in-place root motion; output is in `docs/verification/rebuild-rigs.json`. Runtime actuals confirm model appearance and locomotion. Walk progression freezes during stationary/held/reading/caught states; a separate idle clip is not claimed.

The original57.6-second instrumental score and matching short effects replace the perceived noise background. The model-ready runtime audit checks gesture unlock, six decoded local buffers, one music voice across repeated notes/resume/restart, independent keyboard levels, mute, help freezing, fullscreen round trip, the blur event handler and restart. Automated tab activation did not change native focus/visibility in this run, so a native focus transition is not claimed as verified. Evidence and the scoped frame sample are in `docs/verification/rebuild-runtime.json`. AUDIO.md documents original composition, sample rights and rendering.

## Measured scope and remaining evaluation

Static `dist/` contains16 files totaling **6,128,643 bytes**, including **4,161,201 bytes** of models and authored motion and **1,178,987 bytes** of audio. Each model is below3MB. The runtime audit recorded89 active frame intervals after20 warmup frames at1672×941/DPR1 with two real rabbits: median8.3ms,95th percentile9.3ms,43 draw calls and104,072 triangles. This is a brief callback sample on the shared Mac, not a sustained student-device benchmark. Automated first trap placement took about two seconds in the earlier rebuilt UI check; it is not a learner completion-time estimate.

The game is mechanically verified and ready for the user's playthrough. Automated and informed-agent checks do not establish fun, intuitive controls for a new learner, a6–10-minute learner duration, or learning gains. No production deployment was made. Dev5232 and preview4232 remain running.

The final game was opened in a fresh in-app browser tab, a trap was placed through visible tap-select/tap-ground controls, and the food-drop prompt was verified. The tab is marked as the deliverable; `iab-deliverable.png` records it.

## Follow-up to the human playthrough

The screenshots exposed three real usability/rendering defects plus progressive gait slowdown. Current refinements retain elapsed frame time through short physics steps; replace tiny moving patrol destinations with full walking legs; flatten the actual playable support plane to y=0; and add measured support offsets to the existing Walk clips. Geometry checks cover601 off-key poses per animal below2mm contact error. Raw GLB bytes remain unchanged. Deer/tortoise retain their imported bone tracks; rabbit motion is replaced as described below. The initial fade from an incompatible bind pose is removed and shadow bias reduced.

Facts now stay visible in a plain roster on every contract (including all six animals), with a compact two-column mobile strip. Capture feedback also lists the caught animal's facts. The visible meadow and routing/food/trap bounds now agree at±6.5/±4.9, with a dashed boundary while placing. The real ring/preview radius is0.76; one shared eligibility function supplies edge, rock or animal reasons. Clear grass previously rejected at x4.8 is independently tested as usable.

New regressions compare12seconds of10FPS elapsed-frame advancement with720 normal fixed updates, and check continued individual patrol pace after30seconds. All36 tests pass. The final refined production UI passes all five contracts, wrong catch/release/retry, notes/recovery, controls and every roster's names/pace/size with zero JS/HTTP errors. Current evidence is `docs/verification/refinements-desktop.json` and `docs/actual-captures/refinements/`; prior rebuild frames remain historical.

## Rabbit posture correction

The next human screenshot correctly rejected the rabbit's two-legged silhouette. Textured side views proved the imported Walk extended the hind legs while leaving front paws raised; checking only the lowest vertex had missed the anatomy defect. Rabbit now uses authored low-body four-paw Walk/Trot on the same31-joint weighted rig, with independent forepaw plants, hind hock push/recovery, and continuous loops. Deer/tortoise motion is unchanged.

The full actual-loader side and three-quarter phase sequences were independently reviewed at actual Moss/Pip scales and normal/lure travel speeds. No biped silhouette, obvious tearing, floor pop or seam snap was observed in the reviewed sequences. This is a stylized walk/scurry, not a photorealistic hopping claim. Every paw was measured through601 off-key poses per clip: at least3 plants Walk/2 Trot, stance error≤1.20mm and nominal straight-line planted drift≤3.00mm. `docs/verification/grounding.json` records all four runtime clips.

Main uses Walk for usualSpeed/size≤.9 and Trot above it, with exact playback=usualSpeed/(size×nominalSpeed), multiplied by the simulation's lure/escape factor. Required-client actual state confirms Moss Walk1.622× and Pip Trot2.207×. The final normal-input production five-contract sequence and390px all-six-facts check pass.36 tests include source-SHA compatibility and loop/quaternion checks; they supplement full skinned-motion review. Video and phase proof are in `docs/actual-captures/refinements/`.

Final delivery: the main-game action client placed a trap and leaves through visible coordinates, then captured actual lured Moss state with authored Walk2.189× and wandering Pip Trot2.207×, no JS errors. State/PNG are `rabbit-gait-runtime.json` and `rabbit-gait-runtime.png`. A locator-acknowledgement timeout occurred in an earlier software-rendered client despite the actual trap drop succeeding; the final coordinate-based action burst completed cleanly. Final portrait checks at390×844 (six animals) and599×861 (first pair) passed; the camera fits the patrol envelope between visible UI. The final app-browser game is opened and marked; current `refinements/iab-deliverable.png` replaces the earlier browser proof.
