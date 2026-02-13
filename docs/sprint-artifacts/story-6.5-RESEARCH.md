## Patterns Found

- `packages/backend/src/routes/report.ts:17-35` uses centralized failure mapping with `buildErrorResponse` for `VALIDATION_ERROR` (400), `FORBIDDEN` (403), and fallback `REPORT_SERVICE_UNAVAILABLE` (500); `/finanziari` should reuse the same route pattern.
- `packages/backend/src/routes/report.ts:38-53` shows the route flow `authenticate -> payload from query -> service call -> 200 json` that should be mirrored for the financial endpoint.
- `packages/backend/src/services/report-service.ts:79-151` contains reusable input parsing/validation for `dateFrom`, `dateTo`, and date range consistency (`lte_dateTo`) with deterministic `VALIDATION_ERROR` details.
- `packages/backend/src/services/report-service.ts:270-271` returns `FORBIDDEN` with exact message `Admin only` at service layer; this aligns with story AC-3 contract.
- `packages/backend/src/__tests__/report-riparazioni-atdd.spec.ts:222-238` documents sad-path tests for invalid date range and invalid query values, which is the baseline ATDD pattern for `/api/report/finanziari`.

## Known Pitfalls

- Middleware `authorize("ADMIN")` in `packages/backend/src/middleware/auth.ts:113` returns `Accesso negato`; if AC expects `Admin only`, route/service mapping must preserve the AC-specific message contract.
- Approval-rate math can become non-deterministic if rounding precision is not fixed; existing report tests typically assert exact numeric values, so the story must lock two-decimal behavior.
- Date filters must reject inverted ranges (`dateFrom > dateTo`) to avoid silent wrong aggregates; this is already enforced in report-service parse patterns and should not be bypassed.

## Stack/Libraries to Use

- `Express` router in `packages/backend/src/routes/report.ts` for endpoint wiring and HTTP contract.
- Existing domain services (`fatture-service`, `preventivi-service`) for data sources used by financial KPIs.
- `Vitest` + `supertest` for ATDD endpoint verification, following `packages/backend/src/__tests__/report-riparazioni-atdd.spec.ts`.
