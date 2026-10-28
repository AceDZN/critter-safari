# Critter Safari — ספארי היצורים

[Play in Workbook](https://english-games.workbook.co.il/critter-safari)

A real3D English-reading campaign with **50 sequential levels across 10 habitats**. Everyone follows the same journey: there is no grade selector or grade-based level limit. The campaign grows from two-animal preference clues to comparisons, negation, equality, described references, conditional exceptions and 2–3-animal rescue sequences. Fifty levels contain 63 genuine rescue objectives.

Read the current description, drag a bubble trap onto clear grass, and offer a leaf or berries. The first animal reaching the ring is caught automatically. Wrong catches can be released immediately. All individual names, preferences, usual speeds, sizes and habits remain visible; rescued animals leave the field but keep their facts available for later references.

## Progress and controls

- Each completed level opens the next. The 50-stop journal shows chapters, completed levels and the next available level. Progress saves locally; refresh resumes, completed levels can be replayed, and retry restarts the current level without deleting earned progress. L opens the level map.
- Drag a tray tool to the ground, or choose it then tap the ground. Keyboard: focus a tool, Enter to select, arrows to position, Enter to place, Escape to cancel.
- Trap + leaf/berries are available from the opening. At 11 the distraction feeder unlocks: place the bowl, then drop food into it to occupy interested rivals for 10 seconds. At 26 the calming flower unlocks: nearby animals slow for 5 seconds, followed by recharge. Neither tool changes the usual-speed facts used by the English.
- Holding a tool, reading, help, the map and settings pause without penalty. N opens notes; P pauses; F toggles fullscreen. Settings have separate music/effects volume, mute and reduced motion. Losing focus pauses.
- `?level=1` through `?level=50` support deliberate Workbook lesson practice. A direct final-level completion earns that level only and never invents49 skipped completions.

## Run

Node 22.12+; `npm ci`, then `npm run dev` at http://localhost:5232. `npm run build` creates static `dist/`; `npm run preview` serves http://localhost:4232. Both ports are strict. Models, font, music and effects are local. No game backend, account, runtime AI, microphone or API key. Standalone play sends no analytics; the exact-origin Workbook parent bridge reports ready/start and final-objective completion to the existing host.

## Art and teaching sources

Three original owned Tripo animals retain weighted skeletons, contact grounding and the authored four-paw rabbit Walk/Trot. Five existing owned plant models add distinct paths, borders and habitats without new generation. ASSETS.md records provenance, hashes, sizes and the unchanged animal section. “Fern Garden Waltz” and matching effects are original local music; AUDIO.md retains the composition/render sources.

CURRICULUM.md maps all 50 levels to 11 exact Workbook lessons spanning the underlying grade 7–9 material. Those grades are provenance, not player restrictions or claims of complete grade coverage. All sentences are original game fixtures. Preferences, habits and usual pace describe fictional individuals, not biological species. Reading success does not demonstrate productive grammar, speaking or validated learning gains.

## Verification and release

`npm test` runs 119 independent semantic, physical, state, progression, tool and host checks, including 100 level/layout witnesses and 126 actual captures. `npm run test:browser` exercises the whole earned 1→50 journey through normal inputs. `CRITTER_BROWSER_PATH` can select an installed Chromium; `CRITTER_HEADLESS=1` selects headless. Install Chromium with `npx playwright install chromium` if needed. PLAYTEST.md records the actual scope and remaining checks; unit fixture loading is not a substitute for an earned browser journey.

Built-in imagegen campaign mockups and exact prompts are under docs/visual-targets/campaign. Actual captures and target differences are separate in VISUAL_REVIEW.md. The English games app in AceDZN/acedzn-tools serves immutable static R2 releases through its same-origin versioned rewrite. No new standalone hosting project is needed. Workbook release was approved 27 October2026; this 50-level expansion was requested 28 October2026. See workbook/README.md for the bridge and progress contract.
