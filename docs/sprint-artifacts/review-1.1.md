# Review Story 1.1

Story: 1.1
Date: 2026-02-10
Reviewer: Codex

### Issue 1 - JWT secret fallback insecure in non-test runtime
- Severity: High
- Status: RESOLVED
- Evidence: `packages/backend/src/middleware/auth.ts` used a hardcoded fallback secret (`dev-jwt-secret`) when `JWT_SECRET` was missing.
- Impact: predictable token signing key in runtime without explicit secret configuration.
- Fix: `resolveJwtSecret()` now allows fallback only in `NODE_ENV=test`; in other environments it throws `JWT_SECRET_MISSING` and returns explicit 500 error in auth middleware.
- Verification: `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` all pass after fix.

### Issue 2 - Login service bypassed Prisma data source
- Severity: High
- Status: RESOLVED
- Evidence: `packages/backend/src/services/auth-service.ts` authenticated only against in-memory seeded users.
- Impact: production login would not use persisted users and would diverge from schema state.
- Fix: introduced `findUserByUsername()` with Prisma lookup for non-test runtime and test-only seeded fallback. Added lazy Prisma client initialization.
- Verification: backend test suite and workspace test suite pass; typecheck confirms Prisma select typing.

### Issue 3 - Missing route-level handling for auth service failures
- Severity: Medium
- Status: RESOLVED
- Evidence: `packages/backend/src/routes/auth.ts` awaited service call without protective error handling.
- Impact: runtime/service errors could bubble as unstructured failures.
- Fix: wrapped `loginWithCredentials()` in try/catch and return standardized `AUTH_SERVICE_UNAVAILABLE` 500 payload.
- Verification: tests for success/failure/rate-limit still pass; lint/typecheck/build remain green.

### Issue 4 - Rate limiter state cleanup and test isolation
- Severity: Medium
- Status: RESOLVED
- Evidence: `packages/backend/src/services/login-rate-limit.ts` retained empty buckets and tests shared mutable limiter state.
- Impact: potential memory growth and inter-test coupling.
- Fix: delete empty entries in `getRetryAfterSeconds()`, export `resetRateLimiter()`, invoke it in `beforeEach` in `packages/backend/src/__tests__/auth-login.spec.ts`.
- Verification: repeatable test runs remain stable and pass.