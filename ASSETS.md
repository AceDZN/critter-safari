# Asset provenance

## Status

The lead confirmed first built-in imagegen target inspection before Tripo work. The Chrome acquisition step has an observed external browser-control blocker. No procedural character is represented as completed Tripo art.

## Bundled font

- `public/fonts/NotoSansHebrew.ttf`: unmodified Noto Sans Hebrew, 112,640 bytes. Copied from the user's existing local game asset with its adjacent license. Copyright 2022 The Noto Project Authors; upstream https://github.com/notofonts/hebrew . SIL Open Font License 1.1, retained at `public/fonts/OFL.txt`.
- SHA256: `7ef36a2c3593758cdb622e1bdef4f84523e92fbc3ccc667438dd80ff54c2de88`.

## Tripo acquisition ledger

Observed 26 October 2026:

- Opened an exclusive Chrome session/tab `🌿 Critter Safari`, tab `512279444`, at https://studio.tripo3d.ai/assets . Inspected the user's My Assets and Rigged filter. Existing rigged assets were humanoid/cartoon characters (boy, goblin, raccoon, automaton, farmer, kid), without a matching terrarium creature silhouette. No discovery asset was downloaded or treated as licensed for redistribution.
- Displayed balance before work: **6415** credits.
- Opened https://studio.tripo3d.ai/workspace/generate/ . Selected text generation, H3.1 Best Quality. Displayed Generate cost: **30 credits**.
- Attempted prompt entry and Generate in one bounded UI call. The call timed out after 30 seconds; generation submission/result and credit debit are **unverified**. No duplicate job was submitted.
- Own-tab recovery also timed out after 30 seconds. Native `cua.getApp('com.google.Chrome')` fallback timed out after 30 seconds. Native UI lock was acquired with this game's owner metadata and released after the failed bounded session. A later `cua.getState()` inventory attempt also timed out after the bounded 30-second call (returned after about42 seconds). Sentence Foundry owned the shared native lock during another opportunity; its lock was left untouched.
- No local creature GLB, rig, or clip has been obtained. `TRIPO_ASSETS_READY=false` is explicit in `src/world-art.ts`; `loadCritter` returns null. Runtime diagnostics must identify any temporary silhouettes as placeholders. This requirement remains open.

Attempted generation prompt (exact):

> Critter Safari original moss puffling creature, single full-body friendly small round forest animal, soft moss-green plush fur with leaf tufts, expressive big dark eyes and cream muzzle, four distinct stubby legs separated from round body in neutral standing quadruped pose, no clothing no props no ground no food shape, clean stylized game character with readable silhouette, warm natural colors, prepared for quadruped skeletal rigging.

Limit: at most three new model generations, plus needed rig/animation jobs, using existing credits. Existing owned assets must be inspected first. Runtime characters require actual useful skeletal clips and Three.js AnimationMixer playback.

## Environment

Authored Three.js geometry in `src/world-art.ts`: terrain, broad leaves, fallen twigs, moss, dew drops, bubble trap, bait launcher, and particles. These are intentionally procedural environment/tool geometry rather than substitutions for the required character pipeline.

## Authored material refinement

After inspection of actual gameplay, dark brown earth grain, soil roughness/bump, fibrous moss noise, and leaf veins were added as deterministic procedural DataTextures. Six buffers occupy786,432 bytes in memory and add zero texture network bytes. They are original environment materials, not generated creature art. Moss clumps were reduced and raised to resolve the flat polygon appearance. The garden is batched to66 Mesh objects plus one Points object, with59 shadow casters; collider landmarks and both reflected layouts remain aligned. The favicon is original simple vector icon geometry.

Final recovery check: after the app's IAB became responsive and the game passed final browser tests, the art owner retried only the existing Chrome Tripo tab512279444. That read/bind attempt again timed out at30 seconds (returned34.6 seconds); no UI input, native focus, duplicate generation or new job occurred. IAB responsiveness did not restore signed-in Chrome control. The unknown puffling submission, GLB acquisition, rigs and clips remain open.
