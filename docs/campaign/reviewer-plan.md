# Independent campaign review — 28 October 2026

Planning record, followed by the lead's inspected-mockup gate and implementation assignment. The first version of this review was read-only. The lead has now approved the progression below and assigned content/semantics/independent content tests to this reviewer. This document does not establish gameplay completion.

## Core recommendation

Exactly fifty sequential levels in ten five-level chapters. No grade selector, grade gate, placement test, compulsory reading timer, first-person aiming or locomotion. Source grades remain internal provenance. Keep the recognizable rigged animals, fixed elevated camera, direct trap/food gestures, held-tool planning pause, persistent factual roster and one-button wrong-catch recovery.

Difficulty must change the necessary reading and physical plan. Do not obtain fifty levels by changing names, shortening timers or adding a paragraph above the same catch. Keep at most six active animals, increase rival interference and route choices, then introduce multi-stage rescues with actual captured animals leaving the clearing. Every stage has one independently justified target; many physically equivalent trapping plans remain valid.

## What the existing games establish

- Safari currently has conjunctions of literal traits and strict named comparisons, followed by an optional extreme. This is a useful small base, but cannot express equality, negative traits, described references, exclusions or previous-rescue references without explicit rule extensions. Keep semantic usual speed separate from all runtime modifiers.
- Safari's lure is noticed within 6.2 garden units, expires after sixteen seconds, is consumed by the first interested visitor, and permits only two live loose snacks. Routefinding currently uses a smaller grid than the full visible meadow. Those are physical constraints to test, not proof that any proposed clearing is solvable. Do not put the only valid trap in a narrow corner or outside a mobile viewport.
- Manual Mayhem's `src/campaign.ts`, `src/campaign-progress.ts`, `docs/CAMPAIGN.md` and independent campaign tests show useful authored action changes, a saved consecutive frontier and replay. Its grade field is explicitly provenance, not selection. Its concrete procedures and hand-authored solutions matter more than its level count.
- Skyport/Rift's current `AGENTS.md`, `PORTAL-CAMPAIGN-QUALITY.md` and README explicitly distinguish the rejected broad fifty-room draft from earned smaller normal-input batches. Reuse the changed-instruction counterfactual and per-room witness discipline; do not treat a catalogue, seeded screenshot or passing unit suite as fifty played levels.

## Ten chapters

| Levels | Hebrew chapter | Language demand | Consequential physical demand |
| --- | --- | --- | --- |
| 1–5 | שביל ההיכרות | Short identifying clause; individual preference; two similar candidates | Trap plus correct food; generous clear ground; two, then three actors; new-name transfer at 5 |
| 6–10 | גדול או מהיר | Comparisons with a named reference; size and speed stay independent | Different trap approach for small fast versus large slow individuals; three or four actors |
| 11–15 | כל התנאים | Negative statements and combined conditions | Introduce the reusable distraction feeder at 11; interested rivals can genuinely steal the catch |
| 16–20 | בין הקצוות | Strict intervals and intersecting groups | Separate same-preference animals along different obstacle approaches; target not always nearest |
| 21–25 | הכי בתוך הקבוצה | Bounded fastest/slowest/biggest/smallest; exclude global extremes | Full six-animal clearing; lure or distract a faster outside-set rival; transfer at 25 |
| 26–30 | שווים ושונים | `as … as`, `not as … as`; equality is not a strict comparison | Introduce a calming patch at 26; its local four-second modifier never changes usual-speed truth |
| 31–35 | מי מתואר? | Uniquely described references, `whose`, two-sentence reference | Reuse familiar tools while selecting a reference animal before the target; no answer highlighting |
| 36–40 | מי כבר חולץ? | Object relatives such as `the deer you rescued`; possession and comparison | Two real captures in one continuing scene; three-stage capstone at 40; previous rescues remain available as recorded facts |
| 41–45 | הכלל והחריג | Explicit exclusions; conditional exception with active and inactive branches | Excluded animals remain physically capturable and require genuine avoidance; wrong capture remains recoverable |
| 46–50 | מסע החילוץ הגדול | Integrated scoped groups, equality, reference chains and exception briefs | Two or three sequential captures, rival diversion and local calming in new terrain; final fresh cohort |

The feeder should hold interested animals near its actual position for about 6–8 seconds. It must not identify the correct animal, choose its own bait or globally immobilize all rivals. The calming patch should be spatial, visible, temporary and reusable, with the same drag/tap/keyboard placement affordances as familiar tools. It must not alter roster speed numbers or predicate truth. An early introduction can be forgiving; selected later witnesses must prove a tool changes the outcome of the plan. Do not reject a clever equivalent no-tool solution merely to make the player touch a new widget.

## Local source audit

The exact paths below are the intended provenance. They resolve in the current `ENGLISH_SUBJECT` catalogue and corresponding teaching JSON under `apps/english/Data/Modules/english/`. Generated module routes enumerate catalogue modules. The three original Safari sources were also independently checked live on 27 October: HTTP 200 and correct lesson H1. Additional sources here have local catalogue/content checks, not a claimed fresh live HTTP audit.

| Key | GameModulePath | Limited use |
| --- | --- | --- |
| R | `grade-8/chapter-11/relative-clauses-reference` | Defining information identifies the animal/reference; subject and object roles |
| C | `grade-7/chapter-3/compare-two-places` | A stated feature relative to a named comparison item; independent measures |
| E | `grade-8/chapter-3/extremes-and-fair-comparisons` | An extreme inside a stated comparison set, not the whole world |
| N | `grade-7/chapter-1/be-statements-and-questions` and `grade-7/chapter-10/present-simple-rules` | `is not` and `does not` change meaning |
| Q | `grade-9/chapter-11/comparatives-and-superlatives-reference` | Equality, `not as … as`, less/least where the adjective/measure makes sense |
| T | `grade-8/chapter-9/tracking-reference-and-connections` | An unambiguous previous noun phrase, `one`, `these two`; never guess an ambiguous pronoun |
| R9 | `grade-9/chapter-11/relative-clauses-reference` | Subject/object relatives; limited omitted-object relative recognition; `whose` |
| X | `grade-9/chapter-4/a-rule-and-its-exception` | An explicit narrow exception leaves the rest of a rule intact |
| I | `grade-9/chapter-11/conditionals-reference` | A supplied `if` condition selects the stated consequence; limited recognition of this game rule |
| B | `grade-9/chapter-12/reading-comprehension-and-evidence-reference` | Combine explicit evidence in a brief; no full reading-course claim |

The checked quantifier reference pages teach some/any, much/many and few/little. They do not establish a dedicated all/except/at-least/both/neither/rank unit. No explicit second-fastest unit was found. Exclude unsupported ordinal-rank and generalized-quantifier teaching from the core scope. Ordinary `two`/`three` in a finite visible group is contextual vocabulary, not a quantifier mastery claim. Do not echo the conditional reference's overbroad statement that English never uses `will` after `if`; this campaign only uses its supplied ordinary condition patterns.

## Independent planning fixtures

These are hand-authored factual tables and target explanations. They are not runtime target flags. Runtime rules must independently derive the result from the full factual roster, condition data and genuine rescue history. Original A/B tables remain useful regression fixtures. Campaign spawn slots should be canonical safe slots supplied by the lead; table order must not rank or highlight candidates.

| Table | Individual | Kind | Prefers | Usual speed | Size |
| --- | --- | --- | --- | ---: | ---: |
| A | Moss | rabbit | leaves | .62 | 1.10 |
| A | Pip | rabbit | berries | 1.55 | .70 |
| A | Tumble | tortoise | leaves | .95 | 1.30 |
| A | Reed | deer | leaves | 1.25 | .80 |
| A | Nib | deer | berries | 1.85 | .90 |
| A | Pebble | tortoise | berries | .78 | 1.10 |
| B | Alba | deer | leaves | .90 | 1.20 |
| B | Brin | rabbit | berries | .70 | .85 |
| B | Coda | rabbit | berries | 1.10 | 1.05 |
| B | Dune | tortoise | berries | 1.50 | .65 |
| B | Echo | tortoise | leaves | 1.85 | .75 |
| B | Fizz | deer | leaves | .55 | 1.30 |
| C | Fern | rabbit | leaves | .90 | 1.20 |
| C | Glint | rabbit | berries | .90 | .80 |
| C | Hush | tortoise | leaves | 1.20 | 1.20 |
| C | Iris | tortoise | berries | 1.20 | .80 |
| C | Juniper | deer | leaves | 1.50 | 1.00 |
| C | Kite | deer | berries | 1.50 | 1.40 |
| D | Lark | rabbit | berries | .80 | .90 |
| D | Mica | rabbit | leaves | 1.20 | 1.10 |
| D | Nori | tortoise | berries | 1.20 | 1.30 |
| D | Orris | tortoise | leaves | .60 | .75 |
| D | Pollen | deer | berries | 1.70 | .85 |
| D | Quill | deer | leaves | 1.40 | 1.25 |
| Final | Alder | rabbit | berries | .88 | .92 |
| Final | Bramble | rabbit | leaves | 1.28 | 1.12 |
| Final | Clover | tortoise | berries | 1.28 | 1.32 |
| Final | Drift | tortoise | leaves | .64 | .76 |
| Final | Ember | deer | berries | 1.76 | .86 |
| Final | Fable | deer | leaves | 1.44 | 1.24 |

Early subsets: 1 A[Moss,Pip]; 2 A[Tumble,Pebble]; 3 A[Reed,Nib]; 4 A[Moss,Pip,Reed]; 5 C[Fern,Glint]. Levels6,9 use A[Moss,Pip,Reed]; 7–8 use A[Moss,Pip,Reed,Nib]. Other A/B/C/D/Final levels use their six-member roster. Any early subset change must preserve the independent truth reasoning.

| Level | Table | Original task direction / each-stage target | Independent target reason |
| ---: | --- | --- | --- |
| 1 | A subset | Rabbit that prefers leaves → Moss | The other rabbit prefers berries |
| 2 | A subset | Tortoise that prefers berries → Pebble | Tumble prefers leaves |
| 3 | A subset | Deer that prefers leaves → Reed | Nib prefers berries |
| 4 | A subset | Rabbit that prefers berries → Pip | Moss fails preference; Reed fails kind |
| 5 | C subset | Rabbit that prefers berries → Glint | New names; Fern prefers leaves |
| 6 | A subset | Rabbit smaller than Moss → Pip | .70 < 1.10; the reference is not smaller than itself |
| 7 | A subset | Deer faster than Pip → Nib | 1.85 > 1.55; Reed1.25 fails |
| 8 | A subset | Rabbit bigger than Pip → Moss | 1.10 > .70; do not substitute speed |
| 9 | A subset | Rabbit smaller than Moss but faster than Reed → Pip | .70 < 1.10 and 1.55 > 1.25 |
| 10 | B | Rabbit smaller than Coda but faster than Fizz → Brin | .85 < 1.05 and .70 > .55 |
| 11 | A | Rabbit that does not prefer leaves → Pip | Negative preference, not negative species |
| 12 | A | Leaf-preferrer bigger than Moss → Tumble | 1.30 > 1.10; Pebble equals1.10 and prefers berries |
| 13 | A | Non-rabbit smaller than Moss and slower than Pip → Reed | .80 < 1.10 and 1.25 < 1.55; Nib fails speed |
| 14 | A, same scene as13 | Change slower to faster → Nib | 1.85 > 1.55; Reed fails this changed clause |
| 15 | B | Not berries, bigger than Coda, slower than Brin → Fizz | Leaves;1.30 > 1.05;.55 < .70 |
| 16 | A | Berry-preferrer slower than Tumble → Pebble | .78 < .95; other berry-preferrers are faster |
| 17 | A | Leaves; slower than Reed; faster than Moss → Tumble | .62 < .95 < 1.25; Pebble fails preference |
| 18 | A | Berries; faster than Tumble; slower than Nib → Pip | .95 < 1.55 < 1.85 |
| 19 | A | Bigger than Reed but smaller than Moss → Nib | .80 < .90 < 1.10; equality is not smaller |
| 20 | B | Rabbit faster than Brin but slower than Dune → Coda | .70 < 1.10 < 1.50; Alba fails kind |
| 21 | A | Fastest among leaf-preferrers → Reed | Leaf order Moss<Tumble<Reed; faster Nib excluded |
| 22 | A, same scene as21 | Change leaves to berries → Nib | Berry order Pebble<Pip<Nib |
| 23 | A | Biggest among leaf-preferrers → Tumble | 1.30 exceeds1.10/.80; speed is irrelevant |
| 24 | A | Smallest among animals faster than Tumble → Pip | Qualifiers Pip/Reed/Nib; .70 is smallest |
| 25 | B | Slowest among berry-preferrers → Brin | .70 < 1.10 < 1.50; globally slower Fizz excluded |
| 26 | C | Rabbit as fast as Glint but bigger than Glint → Fern | Equal .90 speed;1.20 > .80 size |
| 27 | C | Tortoise as small as Glint but faster than Fern → Iris | .80 equality and1.20 > .90 |
| 28 | C | Leaf-preferrer not as fast as Hush → Fern | .90 < 1.20; Hush equality fails |
| 29 | C | Smaller of animals as fast as Kite → Juniper | Both deer1.50;1.00 < 1.40 |
| 30 | D | Smaller of animals as fast as Nori → Mica | Both1.20;1.10 < 1.30 |
| 31 | A | Berry-preferrer faster than the berry-preferring rabbit → Nib | Uniquely described reference Pip1.55; Nib1.85 |
| 32 | A | Leaves; slower than leaf-preferring deer; faster than leaf-preferring rabbit → Tumble | Resolve Reed/Moss, then .62 < .95 < 1.25 |
| 33 | A | Of the tortoises, the one whose usual speed is lower → Pebble | .78 < .95; whose attaches to candidate |
| 34 | A | Deer whose size is below Moss's and speed above Pip's → Nib | .90 < 1.10 and1.85 > 1.55 |
| 35 | B | Alba and Fizz prefer leaves. Of these two, catch the faster animal → Alba | Explicit antecedent pair; .90 > .55 |
| 36 | A | Leaf-preferring deer → Reed; then leaf-preferrer slower than the deer you rescued but faster than Moss → Tumble | Actual rescued Reed supplies1.25; .95 is between |
| 37 | A | Fastest berry-preferrer → Nib; then rabbit slower than the deer you rescued but faster than Moss → Pip | Actual Nib1.85; .62 < 1.55 < 1.85 |
| 38 | C | Berry-preferring rabbit → Glint; then leaf-preferrer as fast as the rabbit you rescued → Fern | Actual Glint.90; only Fern matches equality and leaves |
| 39 | B | Faster leaf-preferring deer → Alba; then rabbit whose speed is above that of the deer you rescued → Coda | Alba.90 exceeds Fizz.55; Coda1.10 > .90, Brin.70 fails |
| 40 | D | Berry-preferring rabbit → Lark; leaf-preferring deer → Quill; then berries, between those two rescued references → Nori | .80 < 1.20 < 1.40; Pollen1.70 fails |
| 41 | A | Reed stays free; fastest other leaf-preferrer → Tumble | Remove Reed; .95 > .62 |
| 42 | A | Nib stays free; fastest other berry-preferrer → Pip | Remove Nib;1.55 > .78 |
| 43 | B | Fastest berry-preferrer; if it is a tortoise, leave it free and catch slowest berry-preferrer instead → Brin | Dune1.50 is tortoise, so exception applies; .70 is bounded minimum |
| 44 | C | Fastest leaf-preferrer; same tortoise condition → Juniper | Juniper1.50 is deer; exception does not apply |
| 45 | B | Only berry-preferrers; Dune excluded; fastest still included → Coda | Exclusion changes1.50 maximum to1.10; Echo is outside group |
| 46 | C | Smallest berry-preferrer faster than Fern → Iris; then remaining animal as small as the tortoise you rescued but slower → Glint | Iris.80/1.20 beats Kite1.40/1.50; Glint.80/.90 matches recorded Iris |
| 47 | B | Echo stays free; fastest other leaf-preferrer → Alba; then rabbit faster and smaller than that rescued deer → Coda | .90 > .55; Coda1.10/1.05 compared with Alba.90/1.20 |
| 48 | A | Slower berry-preferring non-rabbit → Pebble; then leaves, faster than rescued tortoise but not as fast as Reed → Tumble | .78 < 1.85; .78 < .95 < 1.25 |
| 49 | C | Smaller animal as fast as Kite → Juniper; fastest leaf-preferrer below rescued deer's speed → Hush; then same speed but different preference from rescued tortoise → Iris |1.00 < 1.40; .90 < 1.20 < 1.50; Iris/Hush speed1.20, opposite preferences |
| 50 | Final | Fastest berries, except if deer choose slowest berries → Alder; then leaf-preferrer slower than rescued rabbit → Drift; then exclude berry-preferring deer and choose smallest remaining animal faster than rescued rabbit → Bramble | Ember triggers exception; .64 < .88; eligible sizes Bramble1.12/Clover1.32/Fable1.24, excluded Ember.86 would otherwise win |

## Authoring and API requirements

Keep all fifty ordinary numbered contracts authored and source-linked. Keep first-stage `rule` for compatibility, but normalize optional `objectives` through one accessor. Each objective's target pool excludes genuine rescued IDs; named and described comparison references still use the original roster. A rescued-reference selector filters actual recorded rescues, never a prefilled answer list. Described references must yield exactly one individual before the outer comparison is attempted. The finite fixture table is always visible, including rescued records needed for later clauses.

Use explicit data for equal/strict comparisons, trait negation, a uniquely described reference, a rescued reference, same/different preference, named exclusions and conditional branches. `not as fast as` is strictly slower here, not less-than-or-equal. The reference may itself satisfy an equality set. Do not reduce nested English to a target ID hidden in content. Reject missing references, duplicate IDs, nonfinite measures, unresolved/tied reference selectors, empty candidate sets and tied extrema during authoring.

Each stage advances only on a genuine correct capture and acknowledgment. Wrong release preserves earlier genuine rescues. A level completes and emits one host completion only after its final stage. Restart/retry resets the current level's stage history and tools; it never deletes earned campaign progress. A reload may restart the unfinished current level rather than pretending to restore an unsaved physical scene; say so plainly. Persist completed levels/frontier independently from current trial state. Direct lesson practice at `?level=N` can record that isolated completion but must not unlock skipped levels, award their stamps or advance the consecutive frontier across gaps.

## Independent verification required before completion claims

1. A hand-written expected ID sequence for every level, separate from rule code; compare every stage and every wrong candidate. Add the table measurements independently, rather than deriving the expected answer with the selector under test.
2. True and false conditional branches; global-extreme distractors; strict/equal endpoints; negative-scope flips; ambiguous or missing described/rescued references; ties, empty sets and invalid measurements. Shuffle array order, appearance and positions; runtime lure/calming/animation modifiers cannot change truth.
3. A physical plan for every stage in both reflected layouts through normal place/food/feeder/calming/update APIs. Verify lure travel, each actual capture, continuing scene state, genuine rescue history, wrong-catch release/retry and a non-target rival. Include delayed-start and ordinary input jitter, not one frame-perfect script. No capture-state or win assignment.
4. Tools change actual routes or arrival order in selected later fixtures. Capture a plausible failed plan and successful revision. Distinguish required semantic decision from optional physically equivalent tactics; do not impose artificial tool-use quotas.
5. Fresh sequential normal-input play earns the entire1→50 frontier on one frozen production build. Test reload/Continue, unlocked replay, locked map behavior, direct50 without false fifty-completion, retry/reset distinctions, final state, source links and host events. Unit load(index) witnesses and seeded inspection screenshots do not replace this earned campaign.
6. Desktop and390×844 touch: later objectives, rescued facts, two new tools, ring/obstacle/boundary previews, one-button recovery and chapter journal all remain readable and operable. Reinspect full-cycle four-paw gait and real-clock motion after any size/speed changes; a new actor specification must not recreate upright motion or foot sliding.

These fixtures establish an authored design and testable scope. They do not establish fun, a real novice's understanding, retained learning, productive grammar, speaking, complete grade coverage, Ministry endorsement or fifty verified runtime levels.

## Implemented content/semantics handoff after the visual gate

`src/content.ts` now contains exactly50 contracts and63 capture objectives. The original five contracts remain exported as `LEGACY_CONTRACTS` for regression evidence; `CONTRACTS` is the public ordered fifty-level campaign. Legacy factual tables remain unchanged, while campaign rosters clone facts into the lead's safe spawn slots. `CHAPTERS` supplies ten Hebrew names. Each level has its own `skill`, chapter/level, language/planning difficulty, exact source URLs/module paths and internal source-grade provenance.

Rule data extends the original trait/comparison model as follows:

- Trait clauses can negate their literal value. Comparison relations are `greater`, `less`, `equal`; `not as fast as` authors a strict `less` rule.
- Legacy comparisons keep `referenceId`. New references are `{kind:'id',id}`, `{kind:'described',rule}` or `{kind:'rescued',rule}`. Described references evaluate over the original full roster. Rescued references evaluate over the actual `rescuedIds` context, using original facts. Every reference must resolve uniquely.
- `exclude` supports a named `referenceId` or a described `reference`. `named-set` represents an explicitly stated pair of names. `trait-reference` compares the same/different preference or another authored trait against a uniquely resolved reference.
- `conditional` supplies `reference`, `trait`, `value`, `ifTrue`, `ifFalse`. The resolved individual's fact selects a real rule branch, which then filters the candidate pool. It does not encode a target ID. Even the inactive branch is checked for unknown named references.
- `objectiveFor(contract,index)` normalizes the single-stage/optional-objectives shape; `objectiveCount` returns its length. `validateObjective(contract,index,rescuedIds)` rejects invalid authoring/context and returns the unique current target. `acceptsCapture(contract,id,index,rescuedIds)` is objective-aware. The caller must check correctness before appending a newly rescued ID. `selectCandidates` excludes prior rescues from targets while keeping them available as references.

The independent test oracle separately names all63 expected stage targets, then checks all other individuals as distractors. It is not generated from selector results or stored in runtime content. Source catalogue/content resolution passed for all11 source paths. Targeted content plus preserved legacy-semantic tests passed73/73; structural tests and TypeScript do not establish physical/tool/browser completion. Lead owns those next checks and the actual campaign/progression integration.
