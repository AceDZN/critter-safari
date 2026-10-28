# Campaign art plan

28 October 2026. The campaign is one sequence of about 50 levels, without grade selection or grade gates. The lead reported the first campaign map mockup generated and inspected before opening the source gate. This plan records local asset research and the resulting environment implementation; final campaign captures and performance verification remain required.

## Direction

Keep the recognizable rabbit, tortoise and small deer, their corrected motion, bright three-quarter camera and open placement area. Ten five-level chapters can feel different through plant families, border construction, trail composition and authored boulder arrangements. New animals are unnecessary for the 50-level baseline. Environment variety must support the lead's new challenges; reskinning a repeated solution is not sufficient progression.

The current actual capture `docs/actual-captures/refinements/contract-3-lure.png` and pH Rangers' `docs/captures/01-first-30s.png` were inspected. The latter confirms that its olive/stone/plant shapes can fit the garden, but its dense vegetation and darker lighting should not be copied. Keep the center clear and paws visible.

## Search-first local inventory

Runtime GLB filenames across `/Users/acedzn/dev/AceDZN-exp` were inventoried, candidate provenance ledgers read, and candidate binaries parsed for size, geometry, skins and actual clips. No Chrome session, generation, download or credit spend occurred for this campaign pass.

| Candidate | Verified local contents | Decision |
|---|---|---|
| Existing Safari rabbit/deer/tortoise | 1.20/1.26/1.40 MB; 31/35/32 weighted joints; rabbit authored four-paw Walk/Trot, deer/tortoise imported Walk | Keep all three; preserve actual skin/gait checks and individual speed-to-cadence metadata. |
| Rule Rascals raccoon | 1,922,172 B; 19,754 triangles; 65-joint humanoid skin; actual idle/walk/run/carry | Original commissioned Pro output with explicit rights record in its `ASSETS.md`, but clothed biped anatomy conflicts with this cast. Exclude as a fourth quadruped. |
| Gene Ranch Gnoomie | 1,801,572 B; 19,322 triangles; 65-joint humanoid skin; idle/walk/jump/cheer | Original user-account generation; upright fantasy body. Exclude rather than reintroducing the rejected alien/biped look. |
| Clumpus seagull | 537,644 B; 24,000 triangles; no skin or clips | Original user-account generation; could be a distant static bird, but provides no real walking/flying performance. Not a fourth quadruped. |
| pH Rangers fish | 221,876 B; 14,678 triangles; no skin or clips | Original user-account generation. Do not add a new aquatic capture system or call rigid movement a rig. |
| Sign Runner manta/jellyfish | 102,712/122,464 B; 7,683/10,807 triangles; no skin or clips | Original user-account generations, neon aquatic styling; exclude from the warm woodland cast. |
| Ringwarden ink beetle | 3,872,276 B; 88,482 triangles; no skin or clips | Original user-account generation; six legs and costly static geometry. Exclude from this campaign. |
| Circuit Critters mascot / Clockwork Alibi bird | Mechanical humanoid / mechanical bird | Different anatomy and material language; exclude. |

The corresponding source `ASSETS.md` files preserve prompts, Tripo IDs and account/processing notes. These are original-user output records, not proof that public gallery models can be redistributed. Some older ledgers say account-default “Sharing Only” and do not independently repeat the Pro-plan observation. The lead explicitly approved reuse of the owned pH Rangers plants; their original ledger, URLs and exact file hashes are carried into Safari `ASSETS.md`. No third-party gallery mesh is copied.

## Selected plant pack

All five files are byte-identical copies from `ph-rangers/public/models/`, with one static mesh/material each. Original prompts, jobs and optimization steps remain in `/Users/acedzn/dev/AceDZN-exp/ph-rangers/ASSETS.md`.

| File under `public/models/habitats/` | Bytes | Triangles | Main use |
|---|---:|---:|---|
| `cypress.glb` | 138,176 | 4,783 | Sparse columnar background trees |
| `bush.glb` | 172,344 | 4,766 | Low berry hedge outside the play boundary |
| `olive.glb` | 350,388 | 19,291 | One broad-canopy orchard landmark |
| `anemone.glb` | 83,252 | 2,831 | Small red flower pockets |
| `poppy-daisy.glb` | 76,752 | 2,836 | White/gold flower pockets |
| **Total** | **820,912** | **34,507 unique** | Lazy-load per habitat |

The props require `EXT_meshopt_compression`, `KHR_mesh_quantization` and `EXT_texture_webp`. A separate local GLTFLoader uses Three's bundled MeshoptDecoder. Static node transforms and normalized quantized attributes are baked once to cached float geometry. Placements then use one InstancedMesh per source material; they do not clone full scenes repeatedly. The animal loader is unchanged.

## Ten habitat chapters

These are chapter environments, not grade bands. The same animals and ambiguous individual preferences appear in multiple habitats; plant colors and scenery must not reveal the English target.

| Levels | Habitat | Distinct composition / material change | Reused foliage |
|---|---|---|---|
| 1–5 | Fern Clearing / קרחת השרכים | Open central meadow, winding earth path, low timber rails, more fern pockets; no boulders | Small daisies |
| 6–10 | Wildflower Meadow / אחו פרחי הבר | Crescent trail and selected red/white/gold perimeter flower patches | Anemone + daisy |
| 11–15 | Berry Hedge Garden / גינת פירות היער | Forked path, four separated rear hedge pockets, mixed stone/timber border | Bush + anemone |
| 16–20 | Limestone Courtyard / חצר אבן הגיר | Low pale stone courses, diagonal trail, sparse narrow trees | Cypress + daisy |
| 21–25 | Olive Orchard Edge / שולי מטע הזיתים | One broad tree silhouette outside the left edge, twin trail, small side shrubs | Olive + bush + daisy |
| 26–30 | Cypress Glade / חורשת הברושים | Four separated narrow rear trees and stone border, leaving the whole field open | Cypress + anemone |
| 31–35 | Dry Creek Garden / ערוץ הנחל היבש | Pale dry channel outside the field, warm sandy trail and mixed border | Bush + daisy |
| 36–40 | Pondside Terrace / גדת הבריכה | Small real basin beyond the fence, crescent path, stone courses | Cypress + daisy |
| 41–45 | Amber Leaf Glade / קרחת עלי הסתיו | Ring trail, sparse copper leaves outside the field and a broad tree; daylight remains readable | Olive + anemone |
| 46–50 | Reserve Crossroads / מפגש שבילי השמורה | Forked routes and mixed reserve landmarks with the fullest authored boulder layout | Cypress + bush + daisy |

Bushes and decorative fruit remain outside the playable boundary so they do not masquerade as unimplemented food sources. Water and the dry channel are exterior scenery; they do not imply swimming, slippery ground or a new tool. No opaque canopy crosses the field. There is no primitive replacement animal.

## Shared layout and API contract

`src/habitats.ts` is a pure module exporting `CHAPTERS`, `habitatForLevel(index)`, `HabitatObstacle` and `obstaclesForLevel(index)`. Indices are zero-based. Levels 1–5 return no obstacles; later authored layouts use two to five boulders, with additional final-step/transfer variations. Return values are fresh copies. The same array drives simulation and visible boulders. The existing reflected variant negates x for both.

Safe spawn families to preserve are the six slots `[-4,-2.4],[-2,1.4],[0,-2.4],[2,1.4],[4,-2.4],[0,2.7]`, opening `±2,0`, and three-animal `[-3,-1],[3,-1],[0,2]`. Layout validation must check clearance from every family, route connectivity and several trap-sized free areas; a scene that merely looks open is not enough.

`createGarden(scene, transfer, variant, levelIndex)` still returns synchronously. Its fourth argument now selects the campaign level, and the legacy transfer boolean cannot independently change collider geometry. Optional `garden.ready` settles the foliage enrichment. Late requests check a disposal flag before attaching, and cached source geometry/materials are not disposed with individual gardens. The collision/picking/support plane remains exactly y=0 through the existing x±7.3/z±5.8 safety margin; water relief starts beyond it. The critter loader, normalization and gait section must remain unchanged.

## Performance limits and verification

The recorded six-actor refined scene reports 70 draw calls / 189,488 triangles at DPR1 (`contract-3-lure.json`), and transfer reports 73 / 190,222. These are existing observations, not a campaign benchmark. The earlier 8.3 ms callback sample used two actors and does not establish sustained performance on student devices.

Keep six actors as the normal ceiling. A seventh/eighth needs a separate full-flow mobile measurement and label review. Use at most two or three imported foliage kinds in a habitat, one olive, four cypresses, and small flower pockets; instancing lowers submissions but does not remove triangle or shadow cost. Flowers/bushes do not cast directional shadows. Keep one sun, existing DPR cap and shadow settings; avoid additional shadowed lights, transparent leaf cards or postprocessing.

Aim to remain near 90 draw calls / 275k reported triangles with six actors after foliage is ready, then measure actual numbers rather than claiming FPS. Five packed GLBs add only 0.82 MB to the 4.16 MB animal/motion payload, but decoded textures also use GPU memory. Load only the current habitat's assets, reuse the bounded five-file cache across chapters, dispose old garden instances/materials/textures, and never retain fifty complete scenes. Preserve the <=20 MB initial-download goal and <=3 MB per-model target.

Before final integration, inspect all ten actual enriched habitats, both reflection variants, at least one mid- and one late-level detour/capture, mobile with the roster open, and a rapid chapter change while foliage is loading. Re-run the existing full-cycle grounding/gait oracle and verify zero failed model requests. New implementation is not accepted solely because these plans or numeric budgets exist.

## Fourth animal decision

Do not make a fourth animal a prerequisite for this campaign. None of the inspected local candidates is a suitable natural quadruped, and the three existing families already support several individuals, sizes, preferences and comparative relations. If a later mechanic warrants it, a small goat is a coherent herbivore option for the stone/orchard habitats. Search owned/licensed models first, require visibly separated four-leg anatomy and a real useful cycle, and review translated side/three-quarter footage before accepting it. Do not relabel a deer or attach primitive parts and call it a new animal. No new model generation or spending is authorized/performed by this art pass.
