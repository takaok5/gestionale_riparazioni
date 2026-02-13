---
story_id: '6.4'
verified: '2026-02-13T01:54:45.9289032+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Admin puo' ottenere report riparazioni con filtri data/tecnico | VERIFIED | packages/backend/src/__tests__/report-riparazioni-atdd.spec.ts (AC-1, AC-2) |
| 2 | Endpoint blocca utenti non Admin con contratto FORBIDDEN coerente | VERIFIED | packages/backend/src/__tests__/report-riparazioni-atdd.spec.ts (AC-3) |
| 3 | 	empoMedioPerStato calcolato da storico stati | VERIFIED | packages/backend/src/services/report-service.ts + test AC-4 |
| 4 | Validazione query rifiuta input non valido | VERIFIED | packages/backend/src/__tests__/report-riparazioni-atdd.spec.ts (Sad path) |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| packages/backend/src/services/report-service.ts | CREATED | 312 |
| packages/backend/src/routes/report.ts | CREATED | 56 |
| packages/backend/src/index.ts | MODIFIED | 45 |
| packages/backend/src/__tests__/report-riparazioni-atdd.spec.ts | CREATED | 239 |
| docs/stories/6.4.report-riparazioni.story.md | MODIFIED | 63 |
| docs/sprint-artifacts/review-6.4.md | CREATED | 37 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| packages/backend/src/index.ts | packages/backend/src/routes/report.ts | WIRED |
| packages/backend/src/routes/report.ts | packages/backend/src/services/report-service.ts | WIRED |
| packages/backend/src/services/report-service.ts | packages/backend/src/services/riparazioni-service.ts | WIRED |