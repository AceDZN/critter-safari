# Asset provenance

## Current acquisition status — 27 October 2026

The rebuilt game uses recognizable rabbit, tortoise and small deer models. Both fresh gameplay concepts were generated with built-in imagegen and inspected before this asset pipeline. Search-first was followed; selected gallery candidates lacked a verified reuse license and/or suitable riggable geometry. Three original models have now been submitted through the user's signed-in Chrome/Tripo Pro account, using existing credits only. No purchase, subscription, raw API, or third-party model generator was used.

**All three models are acquired locally with actual creature rigs and useful Walk clips.** Each normal UI export was parsed to verify its skin, joints, weighted mesh, skeletal animation channels and in-place root translation before being added to `CRITTER_ASSETS`. `TRIPO_ASSETS_READY` is now true. The lead verified actual rabbit, tortoise and deer gameplay through all five contracts in the production browser. Rig counts and moving bone tracks are independently recorded in docs/verification/rebuild-rigs.json; actual captures and target comparison are in VISUAL_REVIEW.md. No diagnostic character geometry is used.

## Original Tripo model ledger

| Kind | UI job | Generation | Observed geometry | Rig / clip / export status |
|---|---|---|---|---|
| Rabbit | [f1acdc0f-ac6b-4e4e-89b5-ec89b8cc0b00](https://studio.tripo3d.ai/workspace/generate/f1acdc0f-ac6b-4e4e-89b5-ec89b8cc0b00) |30credits, balance6275→6245 |19,404 triangles,11,374 vertices |Other creature AutoRig20 completed; real31-joint skeleton including four leg chains and ears visually inspected; quadruped Walk exported with skeleton and Animation stay in Place enabled. |
| Tortoise | [f0a37d75-4801-4b26-adb8-9fca23515c70](https://studio.tripo3d.ai/workspace/generate/f0a37d75-4801-4b26-adb8-9fca23515c70) |30credits, balance6245→6215 |19,034 triangles,11,406 vertices |Other creature AutoRig20 completed; actual32-joint skeleton and96-channel quadruped Walk exported with skeleton and Animation stay in Place enabled. |
| Deer | [4208314c-9666-4c7e-a07c-97563533a542](https://studio.tripo3d.ai/workspace/generate/4208314c-9666-4c7e-a07c-97563533a542) |30credits, after two rigs balance6175→6145 |19,480 generated /19,478 rigged triangles,11,658 vertices |Other creature AutoRig20 completed; actual35-joint skeleton and105-channel quadruped Walk exported with skeleton and Animation stay in Place enabled. |

All original generations: **Private**, verified **Pro** workspace; H3.1, triangle20,000 polycount,2K texture, PBR on, Remove Lighting on, Ultra Mesh off. Ownership basis: original text descriptions authored for this game in the user's paid account; [Tripo paid-generation rights](https://www.tripo3d.ai/help/privacy-policy/how-to-use-tripo-models-commercially) and [terms §5.2.2](https://www.tripo3d.ai/terms). No input reference photo or third-party character design was uploaded. Visible costs are recorded per UI, not inferred from API pricing. The three-generation limit is now exhausted; no fourth generation is authorized here.

Three generations cost90 credits and three creature rigs cost60 credits, for150 credits total; the final displayed balance was6125. Preset Walk selection and the Pro export button showed no additional credit amount. No duplicate model or rig jobs were submitted.

### Local rabbit export

- Normal UI download: `/Users/acedzn/Downloads/cute+rabbit+3d+model.glb`.
- Unchanged original saved at `work/raw-models/rabbit-walk.glb`; runtime copy `public/models/rabbit.glb`.
- Original and runtime bytes: **1,195,884** each, below3MB. SHA256 for both: `a374444210a92c13801841c55d837be650e86a0ae508df0a7f33bb8fae11207c`.
- Export GLB /1k embedded JPEG textures /Export Skeleton ON /one selected animation /Animation stay in Place ON. The Pro export button showed no additional credit amount.
- Locally parsed: one skin,31 joints, one mesh with `JOINTS_0` and `WEIGHTS_0`,93 skeletal animation channels. Clip name `preset:quadruped:walk`, duration **2.5833332538604736s**. No separate idle clip exists or is claimed.
- Root translation is already in place: first≈(2.06e-9,.03686565,7.01e-10), last≈(2.04e-9,.03686564,7.01e-10). No root-motion stripping, vertex simplification, or animation rewriting was needed. Original bone tracks are retained unchanged.
- `SkeletonUtils.clone` gives each actor its own skeleton; a parent normalization wrapper keeps placement transforms separate from skeletal tracks. A real `AnimationMixer` plays the acquired clip. Runtime integration was visually checked and advances the acquired gait only during actual locomotion.
- `preloadCritters()` warms only manifest-listed local files; missing kinds produce no phantom requests.

### Local tortoise and deer exports

Both were downloaded normally from their own Animate pages through Export: GLB, 1k embedded textures, Export Skeleton ON, Walk explicitly selected (animation count1), and Animation stay in Place ON. The default animation count0 was not used. Original downloads are retained unchanged under `work/raw-models`; runtime files are byte-identical. No vertex simplification or animation rewriting was needed to meet the3MB per-model target.

| Kind | Download name | Raw original / runtime | Bytes each | SHA256 |
|---|---|---|---:|---|
| Tortoise |`/Users/acedzn/Downloads/woodland+tortoise+3d+model.glb` |`work/raw-models/tortoise-walk.glb` / `public/models/tortoise.glb` |1,402,120 |`c20319f24e571d897130553ae05321ea1c10dde65a0c343d9dec17b14d3ea990` |
| Deer |`/Users/acedzn/Downloads/fawn+3d+model.glb` |`work/raw-models/deer-walk.glb` / `public/models/deer.glb` |1,263,100 |`23ef02815dad1b7a772e3483d6d0df84f9dddac0fb17517da4c45fd23020286b` |

- Tortoise: one skin,32 joints, one weighted mesh/material,96 skeletal channels. Root translation first≈(1.053e-9,.030609267,8.669e-9), last≈(1.048e-9,.030609263,8.669e-9); largest range3.73e-9.
- Deer: one skin,35 joints, one weighted mesh/material,105 skeletal channels. Root translation first≈(6.435e-9,.025390701,4.168e-9), last≈(6.435e-9,.025390696,4.191e-9); largest range5.59e-9.
- Each has the actual clip `preset:quadruped:walk`, duration **2.5833332538604736s**, with leg/body skeletal motion visible in Tripo before export. There is no separate idle clip. The runtime holds the rig pose while stationary and advances Walk only during locomotion.
- All three local GLBs total **3,861,104bytes**. They each use one material/mesh and remain below3MB without geometry reduction. `SkeletonUtils.clone`, normalization wrappers and per-actor `AnimationMixer` remain the shared loader path; `preloadCritters()` warms the available local files in the background.

## Exact original prompts

### Rabbit

> Critter Safari original woodland rabbit game character. One clearly recognizable cute natural rabbit, warm chestnut brown fur, cream chest and muzzle, long upright ears with soft pink interiors, round glossy dark eyes, small pink nose, fluffy white tail. Polished hand-painted storybook 3D style, natural animal anatomy, gentle friendly expression, restrained fine fur detail, coherent warm woodland palette. Neutral standing quadruped pose with all FOUR legs and paws clearly separated, body raised slightly above ground so joints can be rigged, no fused legs. Full body only, no base, no scenery, no props, no clothing, no text, no existing character likeness. Clean game-ready topology, 20000 polygons, 2K texture, unlit albedo for real-time lighting.

### Tortoise

> Critter Safari original woodland tortoise game character. One clearly recognizable cute natural small tortoise, warm ochre and cocoa domed shell with clean hexagonal scutes, warm beige scaled skin, round glossy dark eyes, small friendly face. Polished hand-painted storybook 3D style, natural animal anatomy, gentle expression, restrained surface detail, coherent warm woodland palette matching a chestnut rabbit. Neutral standing quadruped pose with FOUR sturdy legs clearly separated and fully visible, belly raised above ground, neck extended slightly, joints available for rigging. Full body only, no base, no scenery, no props, no clothing, no text, no existing character likeness. Clean game-ready topology, 20000 polygons, 2K texture, unlit albedo for real-time lighting.

### Deer

> Critter Safari original woodland small deer game character. One clearly recognizable cute natural young roe deer, warm chestnut brown short fur, cream throat and belly, subtle small white spots along the back, large natural ears, round glossy dark eyes, small black nose, short white tail. Polished hand-painted storybook 3D style, natural animal anatomy, gentle curious expression, restrained fine fur detail, coherent warm woodland palette matching a chestnut rabbit and ochre tortoise. Neutral standing quadruped pose with all FOUR slender legs and hooves clearly separated, level back and relaxed neck, joints available for rigging. Full body only, no antlers, no base, no scenery, no props, no clothing, no text, no existing animated character likeness. Clean game-ready topology, 20000 polygons, 2K texture, unlit albedo for real-time lighting.

## Search-first assessment

User-supplied categories inspected in their Chrome: [Animal](https://studio.tripo3d.ai/3d-model-gallery/category/animal), [Plants & Nature](https://studio.tripo3d.ai/3d-model-gallery/category/plants-nature), then Turtle/Rabbit/Deer and Leaf model pages. Public availability and Export controls were not treated as a redistribution license.

| Candidate | Observed reason not integrated |
|---|---|
| [Brown rabbit96e6105f](https://studio.tripo3d.ai/3d-model/gray-brown-rabbit-sitting-on-mossy-forest-floor-with-dried-leaves-96e6105f-e971-4fb9-9642-fd899006ccce) |Cute fur/readable silhouette; creator vxv3327;977,014 triangles, seated/fused-leg pose; no displayed reuse license or verified useful rig. |
| [Tortoise30ef0795](https://studio.tripo3d.ai/3d-model/turtle-with-domed-shell-four-sturdy-limbs-beige-brown-color-rough-t-30ef0795-e04f-4bda-ad68-9d04fd1a43ca) |Creator archfer;947,700 triangles; GLB1k export offered for5credits, no displayed reuse license. |
| [Fawn2929768c](https://studio.tripo3d.ai/3d-model/stylized-brown-deer-fawn-with-white-patch-markings-standing-in-a-fore-2929768c-32c6-4d64-8b9e-4f9e06628125) |946,012 triangles; recognizable famous animated-fawn likeness, excluded; no displayed reuse license. |
| [Leaf f34daf45](https://studio.tripo3d.ai/3d-model/green-leaf-with-prominent-veins-and-curved-shape-f34daf45-8bca-4a29-b539-c57fcc81e8eb) |Creator orroque07;972,618 triangles; no displayed reuse license. |
| Owned original raccoon3bc68067-2954-4d62-b535-93de36cb34ca |Strong quality,19,754 triangles, clean T-pose and rig workspace; clothed biped mismatches the natural rabbit/tortoise/deer family. No new job or download for this candidate. |

## Authored environment and fonts

- `src/world-art.ts`: original procedural meadow, soil grain, moss fibre noise, leaf veins, grass, low broad-leaf planting, small flowers, timber rails, tree trunks, stones, twig and dew. These are intentionally authored environment materials/props; they are not substitutes for the Tripo character pipeline.
- Rebuilt garden stage0/1: open center, zero central obstacle props; stages2/3 and4 import the pure simulation's exact obstacle arrays, including reflected variants. After actual-capture refinement, stage0/1 has43 meshes plus one Points object and33 shadow casters; later stages44/34. Static meshes are batched per material, plants use two meshes per sway root, and moss/grass/flowers/rails are instanced. Central moss density/scale and border foliage were substantially reduced; ground striping was removed and small flowers added. The flat mud and water overlays were removed because they intersected uneven terrain. Actual full-slice rendering was checked in headed desktop and mobile browsers; VISUAL_REVIEW.md records the target comparison.
- `public/fonts/NotoSansHebrew.ttf`: unmodified Noto Sans Hebrew,112,640bytes, copied from the user's existing licensed local game asset with its adjacent SIL Open Font License1.1 at `public/fonts/OFL.txt`. Copyright2022 The Noto Project Authors; upstream https://github.com/notofonts/hebrew . SHA256 `7ef36a2c3593758cdb622e1bdef4f84523e92fbc3ccc667438dd80ff54c2de88`.

## Earlier access failures, resolved

The initial old puffling text attempt stopped at75characters before its awaited Generate click: **no puffling job or debit occurred**. Repeated Chrome timeouts and later a precise Mac-locked report interrupted acquisition. After the human unlocked the Mac, Chrome background tab control using explicit browser ID1 recovered. No credentials, automatic-unlock bypass, duplicate job or purchase was used. Native Chrome sessions used the shared atomic lock and released it while processing/waiting; other crews' tabs and jobs were preserved.
