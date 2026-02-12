## Patterns Found

- Route registration follows centralized wiring in `packages/backend/src/index.ts` with one `app.use("/api/...", router)` per module.
- Protected endpoints consistently use `authenticate` and, when needed, role checks via `authorize(...)` or route-local guard helpers (example: `ensureCommercialeRole` in `packages/backend/src/routes/fatture.ts`).
- Backend routes map domain failures to HTTP responses through `buildErrorResponse(...)`, keeping error payloads deterministic.
- Service modules split execution paths by environment (`process.env.NODE_ENV === "test"`) and isolate DB operations in Prisma transactions.
- Existing ATDD suites use `request(app)` + JWT helper-based `authHeader(role, userId)` pattern for role matrix coverage.

## Known Pitfalls

- No existing `/api/dashboard` endpoint exists; creating route/service from scratch risks drifting from established response/error conventions.
- Role-specific payload leakage is easy (e.g., exposing admin-only fields to `TECNICO`) unless keys are explicitly asserted as absent.
- 30-day metrics can become flaky if date boundaries/timezone are not fixed (UTC window should be explicit in implementation/tests).
- Aggregations over repairs, invoices, and stock can become expensive without grouped queries and narrow selects.
- Epic asks for `401 "Unauthorized"`, while current auth middleware returns localized payload (`{ "error": "Token mancante" }`); expectations must be aligned in tests/story text.

## Stack/Libraries to Use

- Express Router and existing middleware in `packages/backend/src/middleware/auth.ts`.
- Prisma Client for grouped counts and filtered queries on `Riparazione`, `User`, `Cliente`, invoice/preventivo-related models, and `Articolo` low-stock data.
- Existing backend testing stack: Vitest + Supertest + JWT helper pattern used across ATDD specs.