# Critter Safari — ספארי היצורים

Read COMMON.md. Exclusive repo /Users/acedzn/dev/AceDZN-exp/critter-safari, public AceDZN/critter-safari, main; dev5232/preview4232.

## Game promise

A playful creature-capture sandbox in a compact lush terrarium. Watch strange little animals follow habits, place a trap, toss the right bait, quietly circle behind, trigger a satisfying capture, then release or relocate. A poor setup sends a puffling bouncing away with the bait and gives the player a quick second attempt. The enjoyment is planning a trap and seeing an emergent physical chain work, not selecting a named answer from a panel.

First-person gadget view with click-drag camera and touch alternative, no mandatory pointer-lock-only onboarding. One small garden, three creature archetypes, six individual actors at most, two tools (reusable bubble trap and bait launcher), five contracts. A spring trap can replace bubble if clearer. No combat, breeding/economy sim, giant catalogue or open-ended AI. Original creatures, never Bugsnax/Slime Rancher character designs or art.

Abstract inspirations: Bugsnax's observation/capture and Slime Rancher's responsive creatures/tools. Measured centroid NN .871 and isolation5.9% describe seeds, not this game's novelty.

## Learning and semantics

Sources:
- https://english.workbook.co.il/grade-8/chapter-3/extremes-and-fair-comparisons
- https://english.workbook.co.il/grade-8/chapter-11/relative-clauses-reference
- https://english.workbook.co.il/grade-7/chapter-3/compare-two-places (reference for basic comparison)

Primary skill is reading comparative/superlative descriptions with a stated set; identifying clauses support it. “The fastest of these three leaf-eaters” is not fastest on the whole island. Bigger does not imply faster. A relative clause must distinguish the intended creature among actual candidates. Use “that/which” for creature descriptions without making a false absolute statement that English never uses who for personified animals.

Original example: “Among the three leaf-eaters in this clearing, catch the one that is slower than Pip but faster than Moss.” The level truth must yield exactly one candidate in that stated set. Species names/individual identifiers, observable traits and usual speeds are in the field notes. Do not mark the target, always assign it one color, or make it the only capturable animal. Several animals share one trait, forcing attention to the whole description.

Speed comparisons mean usual unbaited travel speed under the same conditions, not a burst during a chase, a path detour or animation speed. Give a short comparable observation lane or field-note measurements to establish that. If a trap temporarily slows someone, preserve the comparison's reference context. Size/diet are separate properties. Do not infer a universal “best” trap from one measure.

Reading and vocabulary help pause the world. Tool skill and English identification evidence are separate. A wrong capture is recoverable: release the animal, reset trap and revise the plan, with a brief Hebrew explanation tied to the mistaken phrase. Bait placement must alter real agent behavior and trap range/line of sight/cooldown must matter. A list of six “catch” buttons is unacceptable.

## Five contracts

1. Learn lure/capture: identify one of two visually similar critters by an English diet/habit clue; place trap within range and lure it.
2. Bigger versus faster: candidates deliberately break the size-speed correlation; use a comparative clue to select, then trap the right one.
3. Two constraints: a relational clue (“slower than Pip but faster than Moss”) plus a feeding habit, with a different viable bait location than the first contract.
4. Bounded superlative: among three members of a named subset, select the fastest/slowest; the fastest animal outside that subset is a deliberate distractor.
5. Transfer: new individual names, trait assignments and terrain/obstacle arrangement, same tools, no solution hint. The changed context must be validated to have a unique semantic target and a physically achievable capture.

Provide independent fixture tables and answer oracles, not tests that just echo the selector function. Verify tie handling, empty/ambiguous targets rejected during authoring, comparisons under movement modifiers, wrong-capture recovery, trap reset and pause. Include at least one pair of contracts with identical scene and different English target; following a fixed route cannot solve both. Randomize only verified cases, never create unsolvable clue sets.

## Identity and screenshot prompts

Lush terrarium viewed at creature eye height, moss, translucent dew, broad leaves, warm daylight, lively squash/deform animation on rigged characters, natural shapes and readable capture arcs. A compact brass/wood field gadget and minimal HUD; not a farm dashboard or a flat zoo grid.

Target 1:
Use case: ui-mockup. Asset type: 16:9 gameplay screenshot target for Critter Safari, an original real-3D browser capture game. First-person low gadget view in a lush miniature garden. A soft bubble trap is set beside a fallen twig, a tossed berry lure is airborne, and three original expressive non-food creatures react differently: a little moss puffling, a long-legged seed hopper and a stout shellback. They have distinct silhouettes with animated poses and natural materials, not recognizable existing game characters. Show actual space for circling, trap placement and hiding, warm sun through broad leaves, readable depth. Minimal Hebrew HUD shell and small LTR field contract “Catch the slower leaf-eater.”; two small tool slots and trap charge. No highlighted correct creature, no answer buttons, no promotional title. A conceptual gameplay target.

Target 2:
Use case: ui-mockup. Asset type: second 16:9 gameplay target with the same Critter Safari garden, camera, creatures and gadget. A baited seed hopper has dashed out of trap range with a berry; another puffling is safely enclosed in a softly glowing transparent bubble trap; a visible reset handle and a small muddy shortcut suggest the player's recoverable mistake. Compact English contract “Among these three, catch the fastest leaf-eater.” and a minimal Hebrew retry/help control. Keep the world dominant, capture mechanics understandable and target identity unmarked. No “wrong answer” popup or worksheets. Same lighting/material fidelity as target 1.

## Tripo asset plan

First-person camera needs no visible explorer avatar. Inspect owned models, otherwise max THREE original creature generations matching the targets. Use riggable limb-separated poses and appropriate creature/biped/quadruped options actually supported by Tripo; inspect and record the rig and clips rather than assuming a humanoid works. Three archetypes can be instanced into six individuals with clear identifiers and authored traits. Do not assign target truth by model color. If one shared body rig supports a useful silhouette family, variants may reuse it, with provenance and clip playback verified. Procedural traps, bait, plants, colliders and particles are appropriate. Required character body animations get real Tripo rigs.

## Acceptance

Observation, bait, trap placement, actual capture, escape and quick recovery are playable in a real 3D space. Five distinct contracts including transfer, valid bounded comparisons, no color target shortcut. Tripo models and rigs animate in runtime; document target/actual match and browser test a correct capture and meaningful mistake via normal inputs. COMMON.md covers the rest.

