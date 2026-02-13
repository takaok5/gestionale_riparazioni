---
story_id: '6.6'
created: '2026-02-13'
depends_on: []
files_modified:
  - packages/backend/src/routes/report.ts
  - packages/backend/src/services/report-service.ts
  - packages/backend/src/__tests__/report-magazzino-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 6.6

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/backend/src/services/report-service.ts | Add input/output types and getReportMagazzino service logic (KPI aggregation, admin guard, 30-day SCARICO top usage). | Existing anagrafiche/riparazioni report helpers |
| packages/backend/src/routes/report.ts | Add GET /magazzino route and failure mapper aligned with existing report endpoints. | getReportMagazzino service export |
| packages/backend/src/__tests__/report-magazzino-atdd.spec.ts | Keep RED tests as acceptance target and adapt setup/assertions if implementation contracts require minor alignment. | Service + route contracts |

## Implementation order

1. Extend packages/backend/src/services/report-service.ts with GetReportMagazzinoInput, result type, parser reuse, admin-only guard, and KPI aggregation (aloreGiacenze, rticoliEsauriti, rticoliSottoSoglia, 	opArticoliUtilizzati).
2. Add /api/report/magazzino endpoint in packages/backend/src/routes/report.ts using the same authenticate -> payload -> service -> buildErrorResponse pattern as /riparazioni and /finanziari.
3. Run packages/backend/src/__tests__/report-magazzino-atdd.spec.ts, fix implementation gaps until the story ATDD file passes and no previous report tests regress.
4. Re-run target test set and capture output for pipeline artifacts before Step 8 review.

## Patterns to follow

- Use report route failure mapping pattern from packages/backend/src/routes/report.ts:31 and packages/backend/src/routes/report.ts:52 (VALIDATION_ERROR/FORBIDDEN/500 mapping).
- Keep Admin-only contract from report services (FORBIDDEN + message Admin only) as used in packages/backend/src/services/report-service.ts:349 and packages/backend/src/services/report-service.ts:404.
- Reuse stock semantics and low-stock threshold logic from packages/backend/src/services/anagrafiche-service.ts:3903 and packages/backend/src/services/anagrafiche-service.ts:5146.

## Risks

- Top usage sorting can be unstable on ties unless a deterministic tie-breaker is defined.
- 30-day window boundaries may drift if timezone handling is inconsistent.
- Admin guard divergence (Accesso negato vs Admin only) can break AC-4 contract.
