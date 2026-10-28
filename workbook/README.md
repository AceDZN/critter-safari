# Workbook campaign integration

Slug `critter-safari`, subject English, orientation any. The existing English games app serves the static bundle from an immutable R2 version and records the source commit. Its catalog lists50 levels and the exact source lessons; grade metadata is provenance only. The game has no grade control or grade-dependent access.

`?level=N` accepts authored integers1–50. Normal play resumes local progress; a deliberate lesson link opens its requested level without forging previous completions. Only genuine final-objective success records that level. Local progress stores anonymous level results, merges earned records from another tab, rejects invalid results, derives its unlock frontier from consecutive completions and preserves unreadable/future-version saves. Storage denial falls back to the current window with a visible save warning.

The bridge accepts exact HTTPS Workbook parents and local HTTP test parents; standalone play posts nothing. Ready follows real model/foliage rendering. One start is reported per loaded attempt; a multi-rescue level sends completion only after its final correct capture. Wrong catches, intermediate captures and reading panels do not report level success. Retry/map replay reset the attempt latch without a second document-ready event. Duration is active simulation time, excluding reading/planning/paused time.

`src/progression.ts`, `src/host.ts` and tests provide the persistence/bridge contract. The current campaign evidence is in docs/verification/campaign-*.json and PLAYTEST.md. Earlier workbook-host.json/workbook-production.json files describe the historical five-contract release, not the current50-level scope. No account-login or learner-fun/learning-gain claim is made by these automated tests.
