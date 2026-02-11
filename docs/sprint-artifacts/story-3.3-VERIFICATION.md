---
story_id: '3.3'
verified: '2026-02-11T19:08:00+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | `GET /api/riparazioni/:id` espone dettaglio completo con envelope `data` | VERIFIED | `packages/backend/src/routes/riparazioni.ts:151`, test `riparazioni-detail-atdd.spec.ts` AC-1 |
| 2 | Lo storico stati (`statiHistory`) e le collezioni (`preventivi`, `ricambi`) sono disponibili nel payload dettaglio | VERIFIED | `packages/backend/src/services/riparazioni-service.ts:1195`, test AC-2/AC-3 |
| 3 | Richiesta a id inesistente ritorna `404` con `error.code = RIPARAZIONE_NOT_FOUND` | VERIFIED | `packages/backend/src/routes/riparazioni.ts:111`, test AC-4 |
| 4 | Il contratto RED→GREEN della story 3.3 e' passato senza regressioni | VERIFIED | `npm --workspace @gestionale/backend test -- --run src/__tests__/riparazioni-detail-atdd.spec.ts`, `npm test -- --run` |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| packages/backend/src/routes/riparazioni.ts | MODIFIED | +58 |
| packages/backend/src/services/riparazioni-service.ts | MODIFIED | +367 |
| packages/backend/prisma/schema.prisma | MODIFIED | +47 |
| packages/backend/src/__tests__/riparazioni-detail-atdd.spec.ts | CREATED | 234 |
| docs/stories/3.3.dettaglio-riparazione.story.md | CREATED | 68 |
| docs/sprint-artifacts/review-3.3.md | CREATED | 68 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| `packages/backend/src/routes/riparazioni.ts` | `packages/backend/src/services/riparazioni-service.ts` | WIRED |
| `packages/backend/src/services/riparazioni-service.ts` | `packages/backend/prisma/schema.prisma` | WIRED |
| `packages/backend/src/__tests__/riparazioni-detail-atdd.spec.ts` | `GET /api/riparazioni/:id` route/service flow | VERIFIED |
