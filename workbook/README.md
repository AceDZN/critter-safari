# Workbook integration

Catalog slug: `critter-safari`; subject: English; grades7–8; orientation: any.

The owning `acedzn-tools` repository releases `dist/` and `poster.jpg` to an immutable R2 folder, then records the version/commit in `packages/catalog-games/src/games/critter-safari.ts`. No standalone hosting project or runtime service is required.

`?level=N` accepts integers1–5 and falls back to contract1 for missing/invalid values. Ready is sent after real models have rendered. The scoped parent bridge accepts HTTPS Workbook origins and local HTTP development parents, uses an exact target origin, and is silent outside an iframe. It reports each loaded contract and only correct captures, once per contract. Duration is active simulation time; held-tool planning and reading are excluded. Restart begins a fresh run without a second document-ready event. Deep-linking the final contract awards one completed contract, not five.

Validation:40 semantic/physical/host tests; actual same-origin iframe drag/capture tests for all five direct links; event order ready → level-start → level-complete with no duplicates after notes; final direct-link completion displays one badge. Evidence: `docs/verification/workbook-host.json` and `docs/actual-captures/refinements/workbook-deep-final-completion.png`. The separate full sequential normal-input regression verifies the complete five-contract journey.

Exact catalog lesson paths match CURRICULUM.md: grade8/chapter11 relative clauses, grade7/chapter3 comparing places, and grade8/chapter3 extremes/fair comparisons. All three published lesson pages and catalog section IDs were verified before release.

Released27 October2026: https://english-games.workbook.co.il/critter-safari. Monorepo PR360 merged as21b1f939b; R2 release2026-10-27 records game2058cfc. Production home/detail/lesson links, direct contract5 capture and exact bridge events, one earned contract, plus390px contract3 models/facts passed. docs/verification/workbook-production.json retains the actual result. The fresh automation browser received an existing Clerk client403 before and after this deployment; it did not block unauthenticated gameplay. Account sign-in was not tested. The release-source commit remains2058cfc because this follow-up changes documentation only.
