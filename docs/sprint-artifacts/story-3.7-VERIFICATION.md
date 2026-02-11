---
story_id: '3.7'
verified: '2026-02-11T23:05:08'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Admin puo' annullare riparazioni da stati diversi (IN_LAVORAZIONE, RICEVUTA) | VERIFIED | Test AC-1/AC-2 in iparazioni-annullamento-admin-atdd.spec.ts passano |
| 2 | Tecnico non admin non puo' annullare e riceve messaggio specifico | VERIFIED | Assert 403 + Only admins can cancel repairs in iparazioni-annullamento-admin-atdd.spec.ts e iparazioni-stato-preventivo-atdd.spec.ts |
| 3 | Mapping errori mantiene compatibilita' (Accesso negato per forbidden generici) | VERIFIED | outes/riparazioni.ts usa esult.message ?? "Accesso negato" |
| 4 | Regressione flusso stati base/preventivo rimane verde | VERIFIED | 
pm test -- --run PASS (backend 189 test) |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| packages/backend/src/services/riparazioni-service.ts | UPDATED | 1841 |
| packages/backend/src/routes/riparazioni.ts | UPDATED | 328 |
| packages/backend/src/__tests__/riparazioni-annullamento-admin-atdd.spec.ts | CREATED | 226 |
| packages/backend/src/__tests__/riparazioni-stato-preventivo-atdd.spec.ts | UPDATED | 320 |
| docs/stories/3.7.annullamento-riparazione-admin.story.md | CREATED | 56 |
| docs/sprint-artifacts/review-3.7.md | CREATED | 51 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| packages/backend/src/routes/riparazioni.ts | packages/backend/src/services/riparazioni-service.ts | WIRED |
| packages/backend/src/__tests__/riparazioni-annullamento-admin-atdd.spec.ts | PATCH /api/riparazioni/:id/stato | VERIFIED |
| packages/backend/src/__tests__/riparazioni-stato-preventivo-atdd.spec.ts | Nuova regola cancel admin-only | VERIFIED |
| docs/stories/3.7.annullamento-riparazione-admin.story.md | Implementazione + test | ALIGNED |
