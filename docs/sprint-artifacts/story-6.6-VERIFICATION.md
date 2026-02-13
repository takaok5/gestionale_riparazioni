---
story_id: '6.6'
verified: '58+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Admin can call GET /api/report/magazzino and receive inventory KPI payload | VERIFIED | packages/backend/src/routes/report.ts + test eport-magazzino-atdd AC-1 |
| 2 | KPI computes esauriti and sotto-soglia using inventory thresholds | VERIFIED | packages/backend/src/services/report-service.ts filters on giacenza/sogliaMinima |
| 3 | Top usage is derived from SCARICO movements within last 30 days | VERIFIED | etchTopArticoliUtilizzati + AC-3 tests in eport-magazzino-atdd.spec.ts |
| 4 | Non-admin users receive 403 FORBIDDEN Admin only contract | VERIFIED | AC-4 tests in packages/backend/src/__tests__/report-magazzino-atdd.spec.ts |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| packages/backend/src/services/report-service.ts | UPDATED | ~750 |
| packages/backend/src/routes/report.ts | UPDATED | ~130 |
| packages/backend/src/__tests__/report-magazzino-atdd.spec.ts | CREATED | ~210 |
| docs/stories/6.6.report-magazzino.story.md | UPDATED | ~80 |
| docs/sprint-artifacts/review-6.6.md | CREATED | ~45 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| eportRouter.get('/magazzino') | getReportMagazzino service | WIRED |
| getReportMagazzino | listArticoli / getArticoloById / listAuditLogs | WIRED |
| eport-magazzino-atdd.spec.ts | /api/report/magazzino endpoint | VERIFIED |
