# Rebuild visual review — 27 October 2026

## Fresh mockups before implementation

The user's feedback rejected the first-person flow and diagnostic creatures. Fresh built-in imagegen concepts were generated and inspected **before rebuilding gameplay**: first placement, a softer real-time style revision, and consequence/recovery. Exact prompts are in `docs/visual-targets/rebuild/prompts.md`; lead inspection is recorded beside them. The initial photoreal detail was rejected as an implementation target. The recovery concept's misplaced Moss tag above a tortoise was explicitly rejected as semantic truth.

The adopted direction is a sunny, open woodland diorama with a fixed elevated camera, recognizable animals, cream contract, one Hebrew action prompt and a tangible three-item tray. Actual rendering is real Three.js geometry with local skinned GLBs, lighting, shadows, picking, authored collisions and skeletal animation.

## Concept versus actual, same desktop viewport

| Rebuild concept | Actual rebuilt gameplay |
|---|---|
| ![Placement target](docs/visual-targets/rebuild/01-placement.png) | ![Actual initial clearing](docs/actual-captures/rebuild/01-first-view.png) |
| ![Recovery target](docs/visual-targets/rebuild/02-recovery.png) | ![Actual wrong Pip capture](docs/actual-captures/rebuild/03-wrong-capture.png) |

The first actual frame intentionally starts with only two rabbits. The later scene expands to six animals across rabbit, tortoise and deer families, keeping the same gestures. The concept images are targets, not screenshots of a shipped build.

## Findings and changes

- Replaced diagnostic silhouettes with three original Tripo animals after gallery inspection. Sculpted fur, long ears, patterned shell and a coherent small deer silhouette are now present, with real quadruped rigs and acquired Walk clips.
- Removed walking/aiming/pulse requirements. The fixed camera puts trap placement and lure response in one view. Holding a tray item pauses planning; the landing ghost agrees with valid world/UI regions.
- Opened the center and removed terrain-intersecting overlays that made jagged bands. Reduced moss/plant density and retained low perimeter rails, selective flowers and exact obstacle props. Contract1/2 have no central obstacle props.
- Brought the first pair closer, corrected label colour space/tone mapping and made preference facts readable. The first action needs no notes modal. Size differences are visible without encoding the answer in colour.
- Kept a compact transparent bubble and one release/continue card. Final mobile checks found stale caught-state guidance and overlapping unrelated labels; the prompt now matches the recovery action, the card names the individual, and other labels hide while caught.
- Explicit LTR English, progress counts and range controls sit within the Hebrew interface. Touch capture/release/retry at390×844 and desktop progression through the transfer were visually inspected.

![Actual six-animal scene, Tumble captured](docs/actual-captures/rebuild/contract-3-capture.png)

## Remaining differences

This is a stylized real-time implementation. It has simpler grass, flatter terrain, harder shadows and less detailed vegetation than the concept; it does not match cinematic fur, dense foliage, soft depth of field or every HUD position. The first level's camera is closer than later levels to teach the gestures. The bubble is larger relative to animals during review, and the mobile recovery card occupies part of the world to preserve readable feedback and a usable button.

The acquired clips supply locomotion only. Stationary, planning and caught animals freeze their current gait pose; separate breathing, idle and capture skeletal performances have not been authored. The trap animation, bait arc, carried food and capture pop are local object effects. No exact visual-fidelity, learner-fun or learning-effectiveness claim is made.

Earlier targets and captures outside the `rebuild/` directories document the rejected first-person prototype and are not evidence of this version's current appearance or controls.
