# Story 6.2 Research

## Patterns Found

- packages/backend/src/routes/dashboard.ts:8 already uses authenticated route handlers with payload mapping and centralized error responses via uildErrorResponse.
- packages/backend/src/services/dashboard-service.ts:167 aggregates dashboard data by iterating over listRiparazioni results and incrementing counters by stato.
- packages/backend/src/services/riparazioni-service.ts:1327 applies date range filtering through dataRicezioneDa/dataRicezioneA; this is the preferred existing mechanism for period filters.
- packages/backend/src/__tests__/dashboard-operativa-atdd.spec.ts:33 defines ATDD structure with AC-labelled describe blocks and supertest requests against pp.

## Known Pitfalls

- UTC/local boundary mismatches can break 	oday, week, and month counts if period boundaries are not normalized consistently.
- Extending dashboard-service.ts can accidentally change existing /api/dashboard payload shape; regression tests are required.
- Returning sparse counters (only seen statuses) causes unstable API contract; response must include all expected status keys with zero defaults.

## Stack/Libraries to Use

- Express router and middleware patterns already used in packages/backend/src/routes/dashboard.ts.
- Existing services (listRiparazioni) for data access and filtering.
- Vitest + Supertest style already used in backend ATDD specs.