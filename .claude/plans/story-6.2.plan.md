---
story_id: '6.2'
created: '2026-02-13'
depends_on: []
files_modified:
  - packages/backend/src/services/dashboard-service.ts
  - packages/backend/src/routes/dashboard.ts
  - packages/backend/src/__tests__/dashboard-riparazioni-per-stato-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 6.2

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/backend/src/services/dashboard-service.ts | Add service function for iparazioni-per-stato with period-based filters (	oday, week, month) and complete status map output. | listRiparazioni in iparazioni-service.ts |
| packages/backend/src/routes/dashboard.ts | Add GET /riparazioni-per-stato route with auth and status/error mapping (VALIDATION_ERROR, FORBIDDEN, fallback 500). | getDashboardRiparazioniPerStato in dashboard-service.ts |
| packages/backend/src/__tests__/dashboard-riparazioni-per-stato-atdd.spec.ts | Keep RED tests and adjust assertions only if contract is clarified during implementation. | route + service behavior |

## Implementation order

1. Implement period parsing and date-window helper in packages/backend/src/services/dashboard-service.ts, including explicit UTC boundaries for today/week/month and validation for unsupported period.
2. Implement aggregation function in packages/backend/src/services/dashboard-service.ts that queries listRiparazioni with dataRicezioneDa/dataRicezioneA and returns all required status keys with integer values.
3. Expose new endpoint in packages/backend/src/routes/dashboard.ts as GET /riparazioni-per-stato reusing authenticate middleware and existing error mapping conventions.
4. Run RED->GREEN loop against packages/backend/src/__tests__/dashboard-riparazioni-per-stato-atdd.spec.ts, then run full 
pm test -- --run to confirm no regressions.

## Patterns to follow

- Route error mapping pattern from packages/backend/src/routes/dashboard.ts:16 and packages/backend/src/routes/dashboard.ts:22.
- Counter aggregation pattern from packages/backend/src/services/dashboard-service.ts:173.
- Date filtering integration pattern from packages/backend/src/services/riparazioni-service.ts:1327 using dataRicezioneDa/dataRicezioneA.
- ATDD test naming and structure pattern from packages/backend/src/__tests__/dashboard-operativa-atdd.spec.ts:33.

## Risks

- Off-by-one errors on period boundaries (UTC/local).
- Missing status keys in response when counts are zero.
- Regression on existing /api/dashboard route if shared service logic is changed incorrectly.