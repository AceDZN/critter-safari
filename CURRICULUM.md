# Critter Safari curriculum — fixed-camera rebuild

The rebuilt game practices **reading and using English descriptions to plan a physical capture**. It does not measure grammatical production or speaking, and no learning-gain or Ministry-approval claim is made. Hebrew-speaking grade-7/8 learners can pause the world to inspect notes or vocabulary without a score penalty. All contract sentences below are original authored fixtures, not Workbook quotations.

The animals are recognizable rabbits, deer and tortoises. Each named individual has an authored **preferred lure** and **usual garden pace**. These are facts about fictional individuals in this game, not general claims about real species' diets or maximum running speeds. The internal data key `diet` stores preferred bait (`leaf` or `berry`); product text says “prefers,” not “only eats.”

## Source scope

- [Grade 7: Comparing Places](https://english.workbook.co.il/grade-7/chapter-3/compare-two-places): a comparative compares a stated feature relative to a second item; one measure does not establish another measure or a universal preference.
- [Grade 8: Extremes and Fair Comparisons](https://english.workbook.co.il/grade-8/chapter-3/extremes-and-fair-comparisons): a superlative has a stated comparison set; an extreme within that set does not establish an unrestricted global extreme.
- [Grade 8: Relative Clauses Reference](https://english.workbook.co.il/grade-8/chapter-11/relative-clauses-reference): a defining clause supplies information needed to identify its referent. This game uses `that` for animal descriptions; it makes no claim that personified animals can never take `who`.

Saved source snapshots are in `docs/curriculum/`. No source quiz is copied into a gate or answer door.

## Contracts and consequential decisions

| Contract | Original English fixture | Intended reading | Intended physical consequence | Misconception tested | Exact source |
|---|---|---|---|---|---|
| 1 — First capture | “Catch the rabbit that prefers leaves.” | A short defining clause distinguishes two similar rabbits. | Place the trap and offer leaf bait to lure Moss rather than Pip. Both rabbits remain capturable. | Recognizable species or a similar appearance establishes the individual's preference. | https://english.workbook.co.il/grade-8/chapter-11/relative-clauses-reference |
| 2 — Small and swift | “Catch the rabbit that is smaller than Moss but faster than Reed.” | Read two comparisons, keeping size separate from usual pace. | Catch Pip using berry bait. The smaller rabbit is faster than the named deer on the garden's usual-pace measure. | Bigger means faster; satisfying only one comparison is sufficient. | https://english.workbook.co.il/grade-7/chapter-3/compare-two-places ; https://english.workbook.co.il/grade-8/chapter-11/relative-clauses-reference |
| 3 — Between two speeds | “Catch the animal that prefers leaves and is slower than Reed but faster than Moss.” | Combine a preference condition with two strict relations. | Lure Tumble into the trap; Pebble's pace is also between the named endpoints, but its bait preference fails the description. | Ignore the preference clause or one side of the speed comparison. | https://english.workbook.co.il/grade-8/chapter-11/relative-clauses-reference ; https://english.workbook.co.il/grade-7/chapter-3/compare-two-places |
| 4 — A bounded extreme | “Among the three animals that prefer leaves, catch the fastest.” | Apply `fastest` within the explicitly defined three-member subset. | Catch Reed. The faster Nib is outside the leaf-preferring set and remains capturable. | The fastest within a stated subset must be fastest in the whole clearing. | https://english.workbook.co.il/grade-8/chapter-3/extremes-and-fair-comparisons ; https://english.workbook.co.il/grade-8/chapter-11/relative-clauses-reference |
| 5 — New clearing transfer | “Among the three animals that prefer berries, catch the slowest.” | Transfer the set-and-measure strategy to new names, preferences, positions and terrain. | Catch Brin, one of two berry-preferring rabbits. Dune the berry-preferring tortoise is faster; the globally slower Fizz is outside the named set. | Reuse the previous route/target, use a species stereotype, or select the global extreme without reading the stated set. | https://english.workbook.co.il/grade-8/chapter-3/extremes-and-fair-comparisons ; https://english.workbook.co.il/grade-8/chapter-11/relative-clauses-reference |

Actor counts grow **2 → 3 → 6 → 6 → 6**. The first contract uses only Moss and Pip; the second uses Moss, Pip and Reed. Contracts 3 and 4 share the exact same six-individual content array and positions while requiring different targets. Any scene reflection chosen for a session must remain consistent across that pair. A repeated route that always catches the same actor cannot solve both. Body material/colour is absent from target predicates, and correct targets span all three animal kinds.

## Independent authored truth tables

`usualSpeed` means ordinary **unbaited** travel pace under the same level-ground conditions, in garden units per second. It does not mean animation playback rate, a temporary lure burst, an obstacle detour, or the maximum speed of a real species. Size is an independent authored measure. The second contract compares the two rabbits' sizes; the renderer must make Pip visibly smaller than Moss rather than infer size from speed.

| Clearing individual | Kind | Preferred lure | Usual pace | Size | Habit |
|---|---|---|---:|---:|---|
| Moss | rabbit | leaves | 0.62 | 1.10 | rests by ferns |
| Pip | rabbit | berries | 1.55 | 0.70 | circles pebbles |
| Tumble | tortoise | leaves | 0.95 | 1.30 | shelters in shade |
| Reed | deer | leaves | 1.25 | 0.80 | rests beside twigs |
| Nib | deer | berries | 1.85 | 0.90 | seeks sunny patches |
| Pebble | tortoise | berries | 0.78 | 1.10 | rests by logs |

The independent hand-authored answer oracle is **1 Moss; 2 Pip; 3 Tumble; 4 Reed**. Leaf-preference pace order is `Moss < Tumble < Reed`; the outside-set Nib outruns all three. Pip is smaller than Moss while faster than Reed. Each animal kind has one leaf-preferring and one berry-preferring individual in the full clearing, so species never defines bait preference.

| Transfer individual | Kind | Preferred lure | Usual pace | Size | Habit |
|---|---|---|---:|---:|---|
| Alba | deer | leaves | 0.90 | 1.20 | rests by stones |
| Brin | rabbit | berries | 0.70 | 0.85 | shelters in reeds |
| Coda | rabbit | berries | 1.10 | 1.05 | circles fallen seeds |
| Dune | tortoise | berries | 1.50 | 0.65 | seeks dry ground |
| Echo | tortoise | leaves | 1.85 | 0.75 | circles mushrooms |
| Fizz | deer | leaves | 0.55 | 1.30 | rests by moss |

The independent transfer oracle is **Brin**. Berry-preference pace order is `Brin < Coda < Dune`; Fizz is globally slower but outside that group. Both rabbits now prefer berries, and the slowest named-set member is a rabbit rather than a tortoise. The English refers to measured individual pace, not a familiar animal's presumed ranking.

All authored spawn points fit the rebuilt world bounds `x ∈ (-6.5, 6.5)`, `z ∈ (-4.9, 4.9)`.

## Evidence boundaries and recovery

The rebuilt control design uses a fixed elevated camera, a trap placed directly in the world, and visible leaf/berry bait. It must not automatically choose the correct individual, choose bait for the learner, or convert animal selection into a row of catch buttons. The first useful action should not require a field-note modal or movement/aim training. Subsequent physical complications should use the same small set of gestures.

Semantic identification and physical planning remain distinct. A learner may identify the intended animal correctly but lure a rival into the trap. A wrong animal must be released quickly, with a short Hebrew explanation tied to the actual contract wording and an immediate opportunity to change the plan. Notes and on-demand word help pause the world. The transfer contract supplies vocabulary support but no solution-identifying hint.

Local events may distinguish first unaided decisions, help use, retries and transfer; they contain no learner identity. Timing describes action fluency only. Pure fixture tests verify independent answer tables, strict endpoint comparisons, preference groups, outside-set distractors, ties and empty/ambiguous authoring failures. Runtime movement modifiers cannot redefine usual-pace truth.

The fixed-camera rebuild's pure simulation tests independently solve all five authored targets in both horizontal variants through ordinary trap and food drops, with actual lure travel and automatic capture. The same suite verifies wrong capture/release/retry, pause/arming freeze, invalid placement, preference response, a blocked approach, ordinary pace and restart. Together with the semantic fixtures and preserved capture-reading state check, 36 tests passed. The rebuilt production UI also passed all five contracts on desktop and touch wrong-catch/release/retry on mobile; see PLAYTEST.md and docs/verification/rebuild-review.json. Historical first-person movement tests/captures do not establish the rebuilt UI. Current browser/playtest evidence belongs in `PLAYTEST.md` and the rebuild visual review, separately from curriculum design claims. These checks do not establish that a new learner understands the controls or finds the game fun.

After the human playthrough, every active animal now has a persistent visible Name/Prefers/Pace/Size entry; comparisons no longer depend on discovering the optional journal. The roster retains content order and supplies plain individual facts, without candidate ranking, filtering or answer highlighting. A larger pace number means faster ordinary unbaited movement. Patrols use fixed full walking legs at the individual pace, rather than converging on a slowly moving point.
