---
story_id: '6.1'
created: '2026-02-13'
depends_on: []
files_modified:
  - packages/backend/src/routes/dashboard.ts
  - packages/backend/src/services/dashboard-service.ts
  - packages/backend/src/index.ts
  - packages/backend/src/__tests__/dashboard-operativa-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 6.1

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/backend/src/services/dashboard-service.ts | Create role-specific aggregation service (ADMIN/TECNICO/COMMERCIALE payload builders) | Prisma schema + existing service patterns |
| packages/backend/src/routes/dashboard.ts | Create GET /api/dashboard route with uthenticate and response mapping per role | dashboard-service.ts, middleware/auth.ts |
| packages/backend/src/index.ts | Register dashboardRouter at /api/dashboard | outes/dashboard.ts export |
| packages/backend/src/__tests__/dashboard-operativa-atdd.spec.ts | Keep RED tests and evolve to GREEN assertions (same AC coverage) | route + service implementation |

## Implementation order

1. Implement packages/backend/src/services/dashboard-service.ts with typed result unions and test/db split pattern, using explicit key inclusion/exclusion per role.
2. Implement packages/backend/src/routes/dashboard.ts with uthenticate and role dispatch (ADMIN, TECNICO, COMMERCIALE), mapping service failures via uildErrorResponse.
3. Wire dashboardRouter in packages/backend/src/index.ts as /api/dashboard to make endpoint reachable.
4. Run focused backend tests for dashboard-operativa-atdd.spec.ts, adjust implementation until all 8 tests pass while preserving existing suites.
5. Run full workspace tests and store output in sprint artifacts to satisfy step gates before commit/merge steps.

## Patterns to follow

- Route registration pattern from packages/backend/src/index.ts:23-33.
- Auth and role enforcement pattern from packages/backend/src/middleware/auth.ts:33-36 and packages/backend/src/middleware/auth.ts:106-113.
- Route error mapping with uildErrorResponse from packages/backend/src/routes/riparazioni.ts:291-309 and packages/backend/src/routes/fatture.ts:249-266.
- Service organization (NODE_ENV split + Prisma transaction usage) from packages/backend/src/services/riparazioni-service.ts:2065-2140.
- Low-stock filtering logic reused for lertMagazzino from packages/backend/src/services/anagrafiche-service.ts:5423-5471.
- ATDD style (equest(app), role JWT helper) from packages/backend/src/__tests__/riparazioni-list-filter-atdd.spec.ts:12-22.

## Risks

- Returning admin keys to non-admin roles (payload leakage) if role branching is not explicit.
- Inconsistent date handling for ultimiPagamenti and atturato30gg if UTC window is not deterministic.
- Query cost regression if multiple aggregates are executed without constrained selects/grouping.
- Contract drift between story AC and current auth middleware error payload format.