# Critter Safari curriculum

This game practices **reading and using English descriptions during an action game**. It does not measure grammatical production or speaking, and no learning-gain or Ministry-approval claim is made. Hebrew-speaking grade-7/8 learners can pause the world to read field notes, instructions and vocabulary without a score penalty. The contract sentences below are original authored fixtures, not Workbook quotations.

## Source scope

- [Grade 7: Comparing Places](https://english.workbook.co.il/grade-7/chapter-3/compare-two-places): a comparative compares a stated feature relative to a second item; one measure does not establish another measure or universal preference.
- [Grade 8: Extremes and Fair Comparisons](https://english.workbook.co.il/grade-8/chapter-3/extremes-and-fair-comparisons): a superlative has a stated comparison set; an extreme within that set does not establish an unrestricted global extreme.
- [Grade 8: Relative Clauses Reference](https://english.workbook.co.il/grade-8/chapter-11/relative-clauses-reference): a defining clause supplies information needed to identify its referent. This game uses `that` for creature descriptions; it makes no claim that personified animals can never take `who`.

Saved source snapshots are in `docs/curriculum/`. The game adapts the reading principles to fictional creatures and independently authored measurements. No source quiz is copied into a gate or answer door.

## Contracts and consequential decisions

| Contract | Original English fixture | Intended reading | World consequence | Misconception tested | Exact source |
|---|---|---|---|---|---|
| 1 — First field capture | “Catch the puffling that eats leaves and rests by the ferns.” | A defining clause distinguishes two similar pufflings. | Select leaf bait, place a real trap in the leaf-eater's reachable path, and capture Moss rather than Pip. | A shared silhouette identifies neither diet nor target. | https://english.workbook.co.il/grade-8/chapter-11/relative-clauses-reference |
| 2 — Small and swift | “Catch the puffling that is smaller than Moss but faster than Reed.” | Read two comparisons and keep size separate from usual speed. | Catch Pip using berry bait; the larger Moss is not faster. | Bigger means faster; satisfying only one part is enough. | https://english.workbook.co.il/grade-7/chapter-3/compare-two-places |
| 3 — Between two speeds | “Among the three leaf-eaters, catch the one that is slower than Reed but faster than Moss.” | Combine a stated diet set with two strict relations. | Catch Tumble with leaf bait; trap/bait placement must work near its patrol area. | Read only `slower` or only `leaf-eater`, or include a berry-eater. | https://english.workbook.co.il/grade-8/chapter-11/relative-clauses-reference ; https://english.workbook.co.il/grade-7/chapter-3/compare-two-places |
| 4 — A bounded extreme | “Among the three leaf-eaters, catch the fastest one.” | Apply `fastest` within the explicitly named three-member subset. | Catch Reed, even though Nib is faster in the clearing and remains capturable. | The fastest in a subset must be fastest in the whole world. | https://english.workbook.co.il/grade-8/chapter-3/extremes-and-fair-comparisons |
| 5 — New clearing transfer | “Among the three berry-eaters, catch the slowest one.” | Transfer the set-and-measure strategy to new names, traits, positions and obstacle arrangement. | Catch Brin with berry bait; the globally slower Fizz is outside the named set. | Reuse the previous leaf target, route or global extreme without reading the changed contract. | https://english.workbook.co.il/grade-8/chapter-3/extremes-and-fair-comparisons |

The first four contracts share the same authored clearing, six creature identities and trait values. In particular, contracts 2 and 4 require different targets in the same scene. A route that catches the same actor cannot satisfy both. Each browser session chooses one of two verified horizontal reflections; creature home positions, solid obstacles and garden art reflect together. The chosen scene stays the same across contracts 1–4, so the changed English remains the reason to change target. Both reflected physical plans are tested. Body material/colour is appearance only and is absent from target predicates. Targets span all three archetypes.

## Independent authored truth tables

`usual speed` is unbaited ground travel in garden units per second, measured on the same level observation lane. It never means animation playback rate, a temporary scared burst, a mud penalty or the instantaneous speed of a creature turning around. Body-size units are a separate authored measure shown in the notes.

| Clearing creature | Archetype | Diet | Usual speed | Size | Habit |
|---|---|---|---:|---:|---|
| Moss | puffling | leaves | 0.62 | 1.10 | rests by ferns |
| Pip | puffling | berries | 1.55 | 0.70 | circles pebbles |
| Tumble | shellback | leaves | 0.95 | 1.30 | shelters in shade |
| Reed | hopper | leaves | 1.25 | 0.80 | hops beside twigs |
| Nib | hopper | berries | 1.85 | 0.90 | seeks sunny patches |
| Pebble | shellback | berries | 0.78 | 1.10 | rests by logs |

The hand-authored answer oracle is **1 Moss; 2 Pip; 3 Tumble; 4 Reed**. This table and oracle are authored independently of the selector implementation. Leaf speed order is `Moss < Tumble < Reed`; the outside-set Nib outruns all three. Pip is smaller than Moss while faster than Reed, so a size heuristic fails.

| Transfer creature | Archetype | Diet | Usual speed | Size | Habit |
|---|---|---|---:|---:|---|
| Alba | hopper | leaves | 0.90 | 1.20 | rests by stones |
| Brin | shellback | berries | 0.70 | 0.85 | shelters in reeds |
| Coda | puffling | berries | 1.10 | 1.05 | circles fallen seeds |
| Dune | hopper | berries | 1.50 | 0.65 | seeks dry ground |
| Echo | shellback | leaves | 1.85 | 0.75 | circles mushrooms |
| Fizz | puffling | leaves | 0.55 | 1.30 | rests by moss |

The hand-authored transfer oracle is **Brin**. Berry speed order is `Brin < Coda < Dune`; Fizz is globally slower but outside that set. The old archetype/diet correspondence is deliberately changed: the fastest creature is now a leaf-eating shellback, and a puffling is no longer necessarily the smaller actor.

## Evidence boundaries and recovery

Semantic identification and tool handling are distinct. A correct identification can still produce an escaped lure or a mistimed trap; such mechanical misses do not prove failed English comprehension. A wrong captured animal is released and the reusable trap resets, with a short Hebrew explanation tied to the relevant contract phrase. Notes explain `smaller`, `faster`, `slower`, `among` and diet words on demand; opening help pauses action. The transfer contract receives vocabulary support but no solution-identifying hint.

Local events distinguish the first unaided capture decision, help use, retries and transfer. They remain on the device and contain no learner identity. Timing may describe action fluency only. Pure fixture tests must reject empty/ambiguous target sets and ties at the requested extreme, and must preserve truth when current movement modifiers change. Browser evidence must exercise bait, trap range, escape, wrong-capture release and successful transfer through normal inputs before completion is claimed.

Implementation/playtest status is recorded separately in `PLAYTEST.md`; this document states the authored curriculum design rather than validated educational effects.
