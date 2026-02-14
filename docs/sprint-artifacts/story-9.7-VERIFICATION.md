---
story_id: '9.7'
verified: '2026-02-14T04:30:16.7572252+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Conversion endpoint updates richiesta to `CONVERTITA` and returns `200` for authorized actor | VERIFIED | `packages/backend/src/__tests__/richieste-conversione-api.atdd.spec.ts` AC-1 assertions |
| 2 | Existing customer is reused with case-insensitive email match to avoid duplicates | VERIFIED | `packages/backend/src/services/anagrafiche-service.ts` lookup helper + AC-2 tests in `packages/backend/src/__tests__/richieste-conversione-api.atdd.spec.ts` |
| 3 | Conversion in `RIPARAZIONE` mode creates draft with required fallback device fields | VERIFIED | `packages/backend/src/routes/richieste.ts` draft payload wiring + AC-3 tests in `packages/backend/src/__tests__/richieste-conversione-api.atdd.spec.ts` |
| 4 | Re-conversion of already converted lead returns `409 REQUEST_ALREADY_CONVERTED` with no extra entities | VERIFIED | AC-4 tests in `packages/backend/src/__tests__/richieste-conversione-api.atdd.spec.ts` and route error mapping in `packages/backend/src/routes/richieste.ts` |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| `packages/backend/src/routes/richieste.ts` | UPDATED | 372 |
| `packages/backend/src/services/anagrafiche-service.ts` | UPDATED | 6733 |
| `packages/backend/src/services/riparazioni-service.ts` | UPDATED | 2379 |
| `packages/backend/src/__tests__/richieste-conversione-api.atdd.spec.ts` | CREATED | 208 |
| `docs/sprint-artifacts/review-9.7.md` | CREATED | 19 |
| `docs/stories/9.7.conversione-lead-in-cliente-pratica.story.md` | CREATED | 43 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| `packages/backend/src/routes/richieste.ts` | `packages/backend/src/services/anagrafiche-service.ts` | WIRED |
| `packages/backend/src/routes/richieste.ts` | `packages/backend/src/services/riparazioni-service.ts` | WIRED |
| `packages/backend/src/services/anagrafiche-service.ts` | audit + conversion lifecycle for `RichiestaPubblica` | WIRED |
