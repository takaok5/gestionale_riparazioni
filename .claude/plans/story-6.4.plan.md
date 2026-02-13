---
story_id: '6.4'
created: '2026-02-13'
depends_on: []
files_modified:
  - packages/backend/src/routes/report.ts
  - packages/backend/src/services/report-service.ts
  - packages/backend/src/index.ts
  - packages/backend/src/__tests__/report-riparazioni-atdd.spec.ts
  - docs/stories/6.4.report-riparazioni.story.md
must_pass: [typecheck, lint, test]
---

# Plan Story 6.4

## Files to modify

| File | Change | Depends on |
| --------------- | ----------- | ---------- |
| packages/backend/src/services/report-service.ts | Add getReportRiparazioni with query validation, filtering and aggregations (	otaleRiparazioni, completate, 	assoCompletamento, countPerStato, 	empoMedioPerStato) | packages/backend/src/services/riparazioni-service.ts |
| packages/backend/src/routes/report.ts | Add GET /riparazioni route with uthenticate + uthorize("ADMIN"), query mapping and uildErrorResponse handling | packages/backend/src/services/report-service.ts, packages/backend/src/middleware/auth.ts |
| packages/backend/src/index.ts | Mount eportRouter under /api/report | packages/backend/src/routes/report.ts |
| packages/backend/src/__tests__/report-riparazioni-atdd.spec.ts | Keep RED tests and refine fixtures/assertions to match real endpoint contract after implementation | packages/backend/src/routes/report.ts |
| docs/stories/6.4.report-riparazioni.story.md | Align final validation notes/deviation notes with implemented behavior | implementation and tests |

## Implementation order

1. Create packages/backend/src/services/report-service.ts and implement report computation by reusing listRiparazioni filter patterns (	ecnicoId, date range) and dashboard-style aggregation logic.
2. Create packages/backend/src/routes/report.ts following dashboard.ts error mapping style and enforce uthorize("ADMIN") for /riparazioni.
3. Wire eportRouter in packages/backend/src/index.ts with pp.use("/api/report", reportRouter).
4. Adjust packages/backend/src/__tests__/report-riparazioni-atdd.spec.ts fixture setup so AC expectations are deterministic and endpoint-focused.
5. Run tests and iterate until the new ATDD suite passes and existing suites stay green.

## Patterns to follow

- Route error mapping pattern: packages/backend/src/routes/dashboard.ts:15 and packages/backend/src/routes/dashboard.ts:44 (uthenticate -> service -> buildErrorResponse).
- Router registration pattern: packages/backend/src/index.ts:35 (pp.use("/api/dashboard", dashboardRouter)).
- Filter validation and Prisma where clauses: packages/backend/src/services/riparazioni-service.ts:605-657 and packages/backend/src/services/riparazioni-service.ts:1319-1333.
- Aggregation style for dashboard stats: packages/backend/src/services/dashboard-service.ts:281 and packages/backend/src/services/dashboard-service.ts:413.
- Authorization middleware behavior: packages/backend/src/middleware/auth.ts:106-113.

## Risks

- Message mismatch risk: middleware default forbidden message is Accesso negato, while story/tests require Admin only.
- Performance risk on large date windows if report aggregation fetches too many rows without bounded strategy.
- Date boundary risk (dateFrom/dateTo) causing off-by-one day errors if UTC handling is inconsistent.