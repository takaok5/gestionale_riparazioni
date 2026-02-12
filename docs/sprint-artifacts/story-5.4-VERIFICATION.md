---
story_id: '5.4'
verified: '2026-02-12T17:10:45.7189595+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | `POST /api/riparazioni/:id/ricambi` collega ricambio e restituisce 201 con payload specifico | VERIFIED | `packages/backend/src/__tests__/riparazioni-ricambi-atdd.spec.ts` AC-1 passa |
| 2 | Stock insufficiente restituisce 400 con messaggio specifico per articolo | VERIFIED | `packages/backend/src/__tests__/riparazioni-ricambi-atdd.spec.ts` AC-2 passa |
| 3 | `GET /api/riparazioni/:id` espone `ricambi[].articolo` con id/nome/codice | VERIFIED | `packages/backend/src/__tests__/riparazioni-ricambi-atdd.spec.ts` AC-3 passa |
| 4 | Articolo non esistente restituisce `404 ARTICOLO_NOT_FOUND` | VERIFIED | `packages/backend/src/__tests__/riparazioni-ricambi-atdd.spec.ts` AC-4 passa |
| 5 | Nessuna regressione sulla suite backend esistente | VERIFIED | `npm test` root: backend 293/293 test pass |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| `packages/backend/src/routes/riparazioni.ts` | UPDATED | 408 |
| `packages/backend/src/services/riparazioni-service.ts` | UPDATED | 2211 |
| `packages/backend/src/services/anagrafiche-service.ts` | UPDATED | 4665 |
| `packages/backend/src/__tests__/riparazioni-ricambi-atdd.spec.ts` | UPDATED | 253 |
| `packages/backend/src/__tests__/riparazioni-detail-atdd.spec.ts` | UPDATED | 237 |
| `packages/backend/prisma/schema.prisma` | UPDATED | 222 |
| `docs/stories/5.4.collegamento-ricambi-riparazione.story.md` | UPDATED | 69 |
| `docs/sprint-artifacts/review-5.4.md` | UPDATED | 19 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| `packages/backend/src/routes/riparazioni.ts` | `packages/backend/src/services/riparazioni-service.ts` | WIRED |
| `packages/backend/src/services/riparazioni-service.ts` | `packages/backend/src/services/anagrafiche-service.ts` | WIRED |
| `packages/backend/src/__tests__/riparazioni-ricambi-atdd.spec.ts` | `POST /api/riparazioni/:id/ricambi` | VERIFIED |
| `packages/backend/src/__tests__/riparazioni-detail-atdd.spec.ts` | `GET /api/riparazioni/:id` ricambi projection | VERIFIED |

