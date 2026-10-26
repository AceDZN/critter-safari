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

## Human reconnection follow-up

After the human reported “should be good now”, the art owner made one bounded recovery call against the existing exclusive Chrome Tripo tab `512279444`. It again timed out at the requested30 seconds (returned31.3 seconds), resetting the tool session. This call did not enter UI text, submit a job, or change credits. The unknown puffling submission still cannot be verified.

New human preference for the resumed acquisition work: **search existing assets first, generate only when a suitable asset is unavailable or the required design is very custom.** Once signed-in Chrome control works, inspect the unknown job and owned assets before searching the supplied gallery categories https://studio.tripo3d.ai/3d-model-gallery/category/animal and https://studio.tripo3d.ai/3d-model-gallery/category/plants-nature . Public discovery alone is not a redistribution license; verify each selected asset's displayed ownership/license basis before integrating. Gallery search was not performed because the existing-tab bind failed before UI access. No generation beyond the original unverified attempt was made.

## Native recovery and prior-job resolution

The shared native Chrome lock was later acquired normally after Sentence Foundry released it. `cua.getApp('com.google.Chrome')` succeeded, and the art owner selected only the existing `🌿 Critter Safari` tab. The generation screen showed **Ready For A New 3D Model** and only **75/1000** prompt characters: `Critter Safari original moss puffling creature, single full-body friendly s`. The original timed-out `typeText` call had stopped before its following awaited Generate click. The refreshed My Assets list included newer other-crew assets and no Safari puffling. Thus the earlier uncertain Safari attempt is resolved as **not submitted**: zero Safari model generations have been submitted so far. Displayed balance differed between cached pages (6415 on the Safari page, 6275 on another crew's page); no debit is attributed to Safari.

Native navigation toward the animal gallery timed out before completion. A subsequent60-second-bounded native observation worked, but the human was actively playing Clockwork Alibi in another tab. Reacquiring the Safari tab was blocked by the runtime's human-navigation protection. The art owner stopped inputs and released the shared lock. Native access is viable but must coexist with active human browsing; the next step remains gallery inspection, not generation.

Official workflow references reviewed while waiting: https://www.tripo3d.ai/product-doc/module-post-processing/rigging-animation documents Humanoid versus Others (including quadruped) and animation export; https://www.tripo3d.ai/help/privacy-policy/how-to-use-tripo-models-commercially describes paid-generation rights. These pages do not establish a blanket license for other people's gallery models. Selected gallery assets still need their own visible licensing/ownership basis.

## Rebuild asset search and original jobs

After both new fixed-camera rebuild targets were generated and inspected, Chrome background access recovered using the explicit browser ID `1`. Native focus is no longer required for ordinary tab work. The account menu visibly showed **Pro**; fresh gallery balance was6275. Search-first requirement was followed through Animal/Turtle/Rabbit/Deer and Plants & Nature/Leaf pages and specific model detail/export inspection:

| Candidate | Observed quality / reason not integrated |
|---|---|
| https://studio.tripo3d.ai/3d-model/gray-brown-rabbit-sitting-on-mossy-forest-floor-with-dried-leaves-96e6105f-e971-4fb9-9642-fd899006ccce | Cute readable rabbit, creator vxv3327;977,014 triangles; seated/fused-leg pose; no displayed reuse license or verified useful rig/clips. |
| https://studio.tripo3d.ai/3d-model/turtle-with-domed-shell-four-sturdy-limbs-beige-brown-color-rough-t-30ef0795-e04f-4bda-ad68-9d04fd1a43ca | Readable tortoise, creator archfer;947,700 triangles; Export offered GLB1k for5credits, no displayed reuse license. |
| https://studio.tripo3d.ai/3d-model/stylized-brown-deer-fawn-with-white-patch-markings-standing-in-a-fore-2929768c-32c6-4d64-8b9e-4f9e06628125 |946,012 triangles; visually resembles an existing famous animated fawn; excluded, no displayed reuse license. |
| https://studio.tripo3d.ai/3d-model/green-leaf-with-prominent-veins-and-curved-shape-f34daf45-8bca-4a29-b539-c57fcc81e8eb | Natural leaf, creator orroque07;972,618 triangles; no displayed reuse license. |
| Owned original raccoon3bc68067-2954-4d62-b535-93de36cb34ca | Stronger quality and19,754 triangles, visible clean T-pose and animation workspace, but clothed biped mismatches new natural rabbit/tortoise/deer family. No mutation or new animation job was submitted. |

No gallery model was downloaded or treated as licensed merely because Export was available. No coherent qualified existing family was found. New original models were therefore submitted within the user's authorized three-model budget, after the new two-view gate, with Private visibility in the verified Pro workspace. Settings: H3.1, triangle20,000 polycount,2K texture, PBR enabled, Remove Lighting enabled, Ultra Mesh disabled. No purchase/upgrade.

### Original rabbit — generation1/3

- UI job URL: https://studio.tripo3d.ai/workspace/generate/f1acdc0f-ac6b-4e4e-89b5-ec89b8cc0b00
- Displayed cost30credits; balance6275→6245. Submission and Generating11% observed; later owned asset list named completed `cute rabbit3dmodel`.
- Rig/export not yet obtained at this ledger entry.
- Exact prompt:

> Critter Safari original woodland rabbit game character. One clearly recognizable cute natural rabbit, warm chestnut brown fur, cream chest and muzzle, long upright ears with soft pink interiors, round glossy dark eyes, small pink nose, fluffy white tail. Polished hand-painted storybook 3D style, natural animal anatomy, gentle friendly expression, restrained fine fur detail, coherent warm woodland palette. Neutral standing quadruped pose with all FOUR legs and paws clearly separated, body raised slightly above ground so joints can be rigged, no fused legs. Full body only, no base, no scenery, no props, no clothing, no text, no existing character likeness. Clean game-ready topology, 20000 polygons, 2K texture, unlit albedo for real-time lighting.

### Original tortoise — generation2/3

- UI job URL: https://studio.tripo3d.ai/workspace/generate/f0a37d75-4801-4b26-adb8-9fca23515c70
- Displayed cost30credits; balance6245→6215. Generating13% observed.
- Rig/export not yet obtained at this ledger entry.
- Exact prompt:

> Critter Safari original woodland tortoise game character. One clearly recognizable cute natural small tortoise, warm ochre and cocoa domed shell with clean hexagonal scutes, warm beige scaled skin, round glossy dark eyes, small friendly face. Polished hand-painted storybook 3D style, natural animal anatomy, gentle expression, restrained surface detail, coherent warm woodland palette matching a chestnut rabbit. Neutral standing quadruped pose with FOUR sturdy legs clearly separated and fully visible, belly raised above ground, neck extended slightly, joints available for rigging. Full body only, no base, no scenery, no props, no clothing, no text, no existing character likeness. Clean game-ready topology, 20000 polygons, 2K texture, unlit albedo for real-time lighting.

Generation3 deer has not been submitted yet. Navigation of own third tab toward Generate timed out, and its subsequent boundedAX read reset the tool; no prompt or Generate click occurred there. Known rabbit/tortoise jobs must be inspected rather than repeated.

### Current external blocker after successful submissions

The rabbit/tortoise jobs above were submitted successfully through normal signed-in ChromeUI. During the next deer-tab navigation and rabbit rebind, browser reads timed out again. A single native fallback under the shared lock returned a precise cause: **the Mac is locked and automatic unlock could not unlock it; the human must unlock the Mac manually.** The art owner released its lock. No agent credential entry, duplicate generation, cancellation, or purchase was attempted. LocalGLB download, actual quadruped rig/clip verification, and the third deer generation remain open until manual unlock restoresUI access.
