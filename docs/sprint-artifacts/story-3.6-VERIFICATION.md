---
story_id: '3.6'
verified: '2026-02-11T20:53:00+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | User can transition `IN_DIAGNOSI -> PREVENTIVO_EMESSO` | VERIFIED | `packages/backend/src/__tests__/riparazioni-stato-preventivo-atdd.spec.ts` AC-1 passing in GREEN gate |
| 2 | User can transition through approval flow (`PREVENTIVO_EMESSO -> IN_ATTESA_APPROVAZIONE -> APPROVATA/ANNULLATA`) | VERIFIED | AC-2, AC-3, AC-4 passing in GREEN gate |
| 3 | Invalid jump `PREVENTIVO_EMESSO -> IN_LAVORAZIONE` is rejected with `VALIDATION_ERROR` | VERIFIED | AC-8 passing with exact message assertion |
| 4 | Successful transitions append status history with stato/userId/note/timestamp | VERIFIED | AC-1..AC-7 second test assertions on `statiHistory` |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| `packages/backend/src/services/riparazioni-service.ts` | MODIFIED | 1818 |
| `packages/backend/src/__tests__/riparazioni-stato-preventivo-atdd.spec.ts` | CREATED | 271 |
| `docs/stories/3.6.cambio-stato-riparazione-transizioni-preventivo.story.md` | CREATED | 103 |
| `docs/sprint-artifacts/review-3.6.md` | CREATED | 36 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| `packages/backend/src/routes/riparazioni.ts` | `packages/backend/src/services/riparazioni-service.ts` | WIRED |
| `packages/backend/src/__tests__/riparazioni-stato-preventivo-atdd.spec.ts` | `PATCH /api/riparazioni/:id/stato` | WIRED |
| `docs/stories/3.6.cambio-stato-riparazione-transizioni-preventivo.story.md` | `packages/backend/src/__tests__/riparazioni-stato-preventivo-atdd.spec.ts` | WIRED |
