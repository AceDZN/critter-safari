# Asset provenance

## Current acquisition status — 27 October 2026

The rebuilt game uses recognizable rabbit, tortoise and small deer models. Both fresh gameplay concepts were generated with built-in imagegen and inspected before this asset pipeline. Search-first was followed; selected gallery candidates lacked a verified reuse license and/or suitable riggable geometry. Three original models have now been submitted through the user's signed-in Chrome/Tripo Pro account, using existing credits only. No purchase, subscription, raw API, or third-party model generator was used.

**All three models are acquired locally with actual creature rigs. Rabbit now uses newly authored quadruped Walk/Trot clips on that acquired weighted skeleton; deer/tortoise retain their imported Walk.** Each normal UI export was parsed to verify its skin, joints, weighted mesh, skeletal animation channels and in-place root translation before being added to `CRITTER_ASSETS`. `TRIPO_ASSETS_READY` is now true. The lead verified actual rabbit, tortoise and deer gameplay through all five contracts in the production browser. Rig counts and moving bone tracks are independently recorded in docs/verification/rebuild-rigs.json; actual captures and target comparison are in VISUAL_REVIEW.md. No diagnostic character geometry is used.

## Original Tripo model ledger

| Kind | UI job | Generation | Observed geometry | Rig / clip / export status |
|---|---|---|---|---|
| Rabbit | [f1acdc0f-ac6b-4e4e-89b5-ec89b8cc0b00](https://studio.tripo3d.ai/workspace/generate/f1acdc0f-ac6b-4e4e-89b5-ec89b8cc0b00) |30credits, balance6275→6245 |19,404 triangles,11,374 vertices |Other creature AutoRig20 completed; real31-joint skeleton including four leg chains and ears visually inspected; original quadruped Walk exported in place, then rejected for bipedal-looking hind-leg extension. Runtime uses authored four-paw Walk/Trot described below. |
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
- Root translation is already in place: first≈(2.06e-9,.03686565,7.01e-10), last≈(2.04e-9,.03686564,7.01e-10). The source GLB needs no root-motion stripping or vertex simplification. Original bone tracks remain in the unchanged source GLB; the rabbit runtime now uses the authored skeletal replacement below.
- `SkeletonUtils.clone` gives each actor its own skeleton; a parent normalization wrapper keeps placement transforms separate from skeletal tracks. A real `AnimationMixer` plays the selected authored rabbit clip or imported deer/tortoise clip; locomotion advances during actual travel.
- `preloadCritters()` warms only manifest-listed local files; missing kinds produce no phantom requests.

### Local tortoise and deer exports

Both were downloaded normally from their own Animate pages through Export: GLB, 1k embedded textures, Export Skeleton ON, Walk explicitly selected (animation count1), and Animation stay in Place ON. The default animation count0 was not used. Original downloads are retained unchanged under `work/raw-models`; runtime files are byte-identical. No vertex simplification or animation rewriting was needed to meet the3MB per-model target.

| Kind | Download name | Raw original / runtime | Bytes each | SHA256 |
|---|---|---|---:|---|
| Tortoise |`/Users/acedzn/Downloads/woodland+tortoise+3d+model.glb` |`work/raw-models/tortoise-walk.glb` / `public/models/tortoise.glb` |1,402,120 |`c20319f24e571d897130553ae05321ea1c10dde65a0c343d9dec17b14d3ea990` |
| Deer |`/Users/acedzn/Downloads/fawn+3d+model.glb` |`work/raw-models/deer-walk.glb` / `public/models/deer.glb` |1,263,100 |`23ef02815dad1b7a772e3483d6d0df84f9dddac0fb17517da4c45fd23020286b` |

- Tortoise: one skin,32 joints, one weighted mesh/material,96 skeletal channels. Root translation first≈(1.053e-9,.030609267,8.669e-9), last≈(1.048e-9,.030609263,8.669e-9); largest range3.73e-9.
- Deer: one skin,35 joints, one weighted mesh/material,105 skeletal channels. Root translation first≈(6.435e-9,.025390701,4.168e-9), last≈(6.435e-9,.025390696,4.191e-9); largest range5.59e-9.
- Each tortoise/deer GLB has the actual clip `preset:quadruped:walk`, duration **2.5833332538604736s**, with leg/body skeletal motion visible in Tripo before export. There is no separate idle clip. The runtime holds the rig pose while stationary and advances Walk only during locomotion.
- All three local GLBs total **3,861,104bytes**; authored rabbit motion metadata adds300,097bytes, giving4,161,201bytes for models plus motion. They each use one material/mesh and remain below3MB without geometry reduction. `SkeletonUtils.clone`, normalization wrappers and per-actor `AnimationMixer` remain the shared loader path; `preloadCritters()` warms the available local files in the background.

## Ground contact correction — 27 October 2026

The initial scene used terrain centered at y=-0.075 while simulation/picking placed animals at y=0, and normalization measured only a cached bind-pose box. The playable meadow is now exactly y=0 throughout the rails and beyond the expanded actor bounds; relief begins outside x±7.3/z±5.8. Colliders and the loader's public API are unchanged.

Deer/tortoise skinned Walk cycles were sampled offline at120Hz (311 keys each), after normalization and the same `updateMatrixWorld` traversal used for rendering. Their cached clips retain all105/96 acquired bone channels and add one measured whole-model vertical support track. Raw GLBs remain unchanged. Runtime does no per-vertex loading or frame scan.

### Rabbit gait repair after anatomy review

The human's10.19 screenshot and actual skinned side-view renders revealed that the generic imported Walk extended both hind chains downward while barely moving the forelegs. Whole-model floor correction raised the torso and left the forepaws hanging. The previous support-only rabbit fix was rejected; this was an actual gait defect.

`public/models/rabbit-gaits.json` is original authored animation data, **300,097bytes**, SHA256 `3a3b713cad0a652baa289ec8a25e8d75301fb1915d155b128ba127f0c8ed225f`. It targets the unchanged acquired rabbit GLB/SHA256 above, its31-joint skeleton, skin weights and textured surface. No primitive character parts, new model, external animation job or extra credits were used. The imported rabbit Walk is retained only in the source GLB and is not used in play.

Two authored loops lower/incline the chest through the spine, preserve folded hind hocks, and solve all four paw targets independently. Each loop has31 skeletal quaternion tracks, real root/spine position tracks and one whole-model support track (34 tracks total). Skeletal poses are baked at120Hz, and support is measured offline at240Hz over the actual deformed mesh. Runtime parses/caches this finite local data and plays it with `AnimationMixer`; it performs no IK or vertex scan per frame.

| Runtime clip | Duration | Stance | Cycle travel at size1 | Nominal speed at size1 |
|---|---:|---:|---:|---:|
|`authored:rabbit:quadruped-walk` |1.00s |.76 per paw; at least3 plants |.347538units |.347538units/s |
|`authored:rabbit:quadruped-trot` |.65s |.54; diagonal support pair |.652170units |1.003339units/s |

`CritterVisual.nominalSpeeds` exposes those constants. Recommended selection uses trot when usualSpeed/size>.9, otherwise walk. Playback rate =usualSpeed/(size×nominalSpeed), with the same1.35 lure/1.5 escape multiplier as actual travel; it does not follow noisy frame velocity. This gives Moss(size1.10,speed.62) Walk≈1.622× and Pip(size.70,speed1.55) Trot≈2.207×.

All four paw regions were tracked through601 times between authored keys. Walk retained at least3 planted paws; Trot retained at least2. Maximum stance sole error was0.14mm Walk /1.20mm Trot at normalized scale; swing clearance≈4.4cm /5.5cm. Maximum planted-paw drift at declared nominal forward travel was2.51mm /3.00mm. The rig's crouched knee articulation and actual skinned side/three-quarter cycle renders were inspected; translated actual-loader videos at Moss/Pip scales and normal/lure rates provide the motion proof. These measurements do not claim perfect biological anatomy or zero sliding under every game turning/collision condition.

Reproducible geometry oracle: `node scripts/verify-grounding.mjs`, saved measurements at `docs/verification/grounding.json`; Regeneration source is `scripts/author-rabbit-gaits.mjs`, with candidate validation at `scripts/check-rabbit-gaits.mjs`; intermediates stay in ignored `work/gait/`. Terrain raycasts at35 points spanning x±6.8/z±5.2 in both reflected variants measured y=0. The lead performs final gameplay, cadence and rendered contact review.

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

## Deer forward-axis correction — 28 October 2026

The live sideways/backward movement report exposed a constant model-axis mismatch. In the actual deer GLB, `tripoHead_0` minus the midpoint of hind hip roots `tripo1_Left_Limb_0` / `tripo1_Right_Limb_0` points approximately **−X**: bind horizontal unit(−.999993,0,.003846), yaw−89.7796°. Across257 imported Walk poses the anatomical axis stays−90.6741°…−82.5879°; the root quaternion is constant within0.000003° numerical noise. This is not an internally rotating Walk root. Rabbit/tortoise already face+Z.

The correction selected for integration is a deer-only **+π/2 Y rotation on the unanimated visual wrapper below the external heading group**. The game heading remains `atan2(dx,dz)` with forward+Z, preserving carried food, labels and simulation coordinates. A separate300-pose/eight-heading calculation gives corrected head/travel dot≥.991642, versus−.0120…+.1290 before correction; natural neck movement explains the remaining few degrees. Raw GLB bytes, source Walk tracks and vertical grounding data remain unchanged. No asset generation, browser use or credits were involved. CPU measurement evidence: `work/heading/raw-asset-axis.json`; final runtime direction verification belongs to the lead's integration check.

## Campaign habitat reuse — 28 October 2026

After local search and the lead's inspected campaign map target, five existing pH Rangers plant outputs were approved for reuse. These are original text-generated assets from the user's signed-in Tripo account, not public gallery downloads. Source prompts, normal UI exports, historical costs and local optimization commands remain in `/Users/acedzn/dev/AceDZN-exp/ph-rangers/ASSETS.md`. That ledger records account-default Sharing Only, 1k UI exports and subsequent WebP/meshopt processing; it does not independently assert that those earlier exports were Private. The original-output account/terms basis and the explicit approval to reuse owned plants apply here. No new browser task, generation, download, purchase or credit spend occurred for this campaign pass.

Runtime copies under `public/models/habitats/` are byte-identical to the source project's shipped files:

| File | Bytes | Triangles | Original Tripo task | SHA256 |
|---|---:|---:|---|---|
|`cypress.glb` |138,176 |4,783 |[0758e7c2-13d5-490b-9a2f-fcd318dac973](https://studio.tripo3d.ai/workspace/generate/0758e7c2-13d5-490b-9a2f-fcd318dac973) |`3e26bcea23fa496a8636bc54fe50622a2a8a676f8a573bdafbba086f76282ef2` |
|`bush.glb` |172,344 |4,766 |[59ec3978-801a-4b00-8fa6-6081e53857cd](https://studio.tripo3d.ai/workspace/generate/59ec3978-801a-4b00-8fa6-6081e53857cd) |`d8e3ab9ad2ced9b7db635e599287a173cf368ee202dd90dedd583a065ede147a` |
|`olive.glb` |350,388 |19,291 |[cf63a88e-5fc4-4735-90da-d2e7712d043d](https://studio.tripo3d.ai/workspace/generate/cf63a88e-5fc4-4735-90da-d2e7712d043d) |`41214f212ecdc3a603fe7eb277d3c4bb9b6510a3bd27239545b438f63ef3099f` |
|`anemone.glb` |83,252 |2,831 |[8dace501-2e8c-4be6-8f18-1e6e4de7bc81](https://studio.tripo3d.ai/workspace/generate/8dace501-2e8c-4be6-8f18-1e6e4de7bc81) |`8a974a4736f7b89f9679ffa019dc08057133bbc7898663b67793b449537c373c` |
|`poppy-daisy.glb` |76,752 |2,836 |[e8a2d1bf-3ad7-47cb-8235-4e8ba60228b8](https://studio.tripo3d.ai/workspace/generate/e8a2d1bf-3ad7-47cb-8235-4e8ba60228b8) |`73dde55798f71dd320885d702342b8d50e8af50a58affc50bcb10d8224fc89a7` |

Total five-file pack: **820,912bytes**, five static meshes/materials, no skins or clips. Combined animal GLBs/authored motion plus this pack total **4,982,113bytes**, before application code, fonts and audio. The files require EXT_meshopt_compression, KHR_mesh_quantization and EXT_texture_webp. A separate foliage loader uses the already-bundled Three MeshoptDecoder; no CDN or new package is needed. Node transforms/quantized vertex attributes are baked once into cached float geometry, then each habitat uses instancing per material. Source files and materials are preserved; only placement/normalization changes at runtime.

`src/habitats.ts` owns ten chapter environments and the exact zero-based `obstaclesForLevel` arrays. Garden boulders use those arrays directly, with the same x reflection as simulation. First five levels have no boulders; later layouts use two to five. New water/dry-channel relief stays outside the flat playable support margin. Optional foliage loading is lazy and guarded after garden disposal, with a bounded five-asset cache. `garden.ready` lets diagnostics await enrichment.

The rabbit/deer/tortoise loader, normalization and gait section was preserved byte-for-byte during environment work (SHA256 of the section starting `export type CritterKind`: `2dd2f5bbd0dae5890a3c8c50e0f33aabd5d5acfde8672de58ed105e2f79dc451`). No new animal or primitive animal substitute was added. Local inventory, excluded animal candidates, habitat composition and performance limits are in `docs/campaign/art-plan.md`; actual campaign visual/performance acceptance is tracked by the lead.
