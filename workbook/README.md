# Workbook campaign integration

Slug `critter-safari`, subject English, orientation any. The existing English games app serves the static bundle from an immutable R2 version and records the source commit. Its catalog lists50 levels and the exact source lessons; grade metadata is provenance only. The game has no grade control or grade-dependent access.

`?level=N` accepts authored integers1–50. Normal play resumes local progress; a deliberate lesson link opens its requested level without forging previous completions. Only genuine final-objective success records that level. Local progress stores anonymous level results, merges earned records from another tab, rejects invalid results, derives its unlock frontier from consecutive completions and preserves unreadable/future-version saves. Storage denial falls back to the current window with a visible save warning.

The bridge accepts exact HTTPS Workbook parents and local HTTP test parents; standalone play posts nothing. Ready follows real model/foliage rendering. One start is reported per loaded attempt; a multi-rescue level sends completion only after its final correct capture. Wrong catches, intermediate captures and reading panels do not report level success. Retry/map replay reset the attempt latch without a second document-ready event. Duration is active simulation time, excluding reading/planning/paused time.

`src/progression.ts`, `src/host.ts` and tests provide the persistence/bridge contract. The current campaign evidence is in docs/verification/campaign-*.json and PLAYTEST.md. Earlier workbook-host.json/workbook-production.json files describe the historical five-contract release, not the current50-level scope. No account-login or learner-fun/learning-gain claim is made by these automated tests.


## Fifty-level release — 28 October 2026

The catalog update was merged in [Workbook PR 371](https://github.com/AceDZN/acedzn-tools/pull/371), merge commit `bcfb71167ba539b26da083223d2ec4501c7195ca`. Its immutable bundle is `2026-10-28`, built from source game commit `e85ac17`. Subsequent verification-only commits do not change those release bytes.

All 22 public objects / 7,236,867 bytes match the frozen tested bundle by SHA-256. The production-built local Workbook app passed its 50-level detail, 11 distinct lesson sources, three actual final-level rescues and two actual portrait touch rescues. Catalog checks were rerun after merging concurrent game releases: 16 passed, followed by catalog typecheck and the full English Games production build. The repository discovery check passed on the merged PR head. See `docs/verification/campaign-release.json` and `campaign-workbook-local.json`. The live production check is recorded below.


Production deployment `dpl_7jSff3XvnbKTKFeQKGcp3tdyc2kJ` is READY with the public `english-games.workbook.co.il` alias on the merge commit above. The live site passes 50 catalog levels, 11 lesson sources, all three level 50 captures and both level 39 rescues through touch, with one final-only completion event per level and truthful local saves. No JavaScript or game-bundle HTTP errors occurred; the existing Clerk client returned two non-blocking 403 responses. Account sign-in was not tested. `docs/verification/campaign-workbook-production.json` and `campaign-workbook-deployment.json` retain the evidence.


The deer-facing hotfix is immutable release `2026-10-28-2`, game source `9314b9f`, with the same 50 levels and progress schema. All 22 public files match the tested bundle by SHA-256. The production-built local Workbook player passes real-frame patrol/food facing, pause, correct capture/Next, wrong capture/release and portrait late-level captures. See `docs/verification/deer-heading-*`. Catalog PR: https://github.com/AceDZN/acedzn-tools/pull/372. Production rollout is checked after merge.
