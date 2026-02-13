---
story_id: "8.1"
created: "2026-02-13"
depends_on: []
files_modified:
  - packages/backend/prisma/schema.prisma
  - packages/backend/src/services/anagrafiche-service.ts
  - packages/backend/src/routes/clienti.ts
  - packages/backend/src/services/auth-service.ts
  - packages/backend/src/routes/auth.ts
  - packages/backend/src/middleware/auth.ts
  - packages/backend/src/services/notifiche-service.ts
  - packages/backend/src/lib/errors.ts
  - packages/backend/src/index.ts
  - packages/backend/src/__tests__/portal-account-create-atdd.spec.ts
  - packages/backend/src/__tests__/portal-account-conflict-atdd.spec.ts
  - packages/backend/src/__tests__/portal-account-email-required-atdd.spec.ts
  - packages/backend/src/__tests__/portal-account-activation-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 8.1

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| `packages/backend/prisma/schema.prisma` | Add portal-account model/fields, status enum and activation token expiry | - |
| `packages/backend/src/services/anagrafiche-service.ts` | Add portal-account creation flow with validation/error mapping and persistence | schema.prisma |
| `packages/backend/src/routes/clienti.ts` | Add `POST /:id/portal-account` route and failure responders | anagrafiche-service.ts |
| `packages/backend/src/middleware/auth.ts` | Reuse/extend token helpers for activation token verification | - |
| `packages/backend/src/services/auth-service.ts` | Add portal activation flow (`activatePortalAccount`) and portal login branch | middleware/auth.ts, schema.prisma |
| `packages/backend/src/routes/auth.ts` | Add `/portal/auth/activate` and `/portal/auth/login` endpoints | auth-service.ts |
| `packages/backend/src/services/notifiche-service.ts` | Add portal activation notification creation with deterministic payload | anagrafiche-service.ts |
| `packages/backend/src/lib/errors.ts` | Add/align new error codes and envelope messages | routes/service files |
| `packages/backend/src/index.ts` | Mount portal auth router path if split by router | routes/auth.ts |
| `packages/backend/src/__tests__/portal-account-*.spec.ts` | Keep RED tests and make them pass in GREEN phase | all implementation files |

## Implementation order

1. Extend data model in `packages/backend/prisma/schema.prisma` and adjust typed domain contracts in `packages/backend/src/services/anagrafiche-service.ts`.
2. Implement portal-account creation service logic in `packages/backend/src/services/anagrafiche-service.ts` including `CUSTOMER_EMAIL_REQUIRED` and `PORTAL_ACCOUNT_ALREADY_EXISTS`.
3. Expose `POST /api/clienti/:id/portal-account` in `packages/backend/src/routes/clienti.ts` with dedicated `respond*Failure` mapping.
4. Implement activation token handling in `packages/backend/src/middleware/auth.ts` and activation business logic in `packages/backend/src/services/auth-service.ts`.
5. Expose portal auth endpoints in `packages/backend/src/routes/auth.ts` (`/api/portal/auth/activate`, `/api/portal/auth/login`) and wire in `packages/backend/src/index.ts`.
6. Add portal activation notification flow in `packages/backend/src/services/notifiche-service.ts` and align shared errors in `packages/backend/src/lib/errors.ts`.
7. Iterate on RED tests in `packages/backend/src/__tests__/portal-account-*.spec.ts` until all tests in `docs/sprint-artifacts/atdd-tests-8.1.txt` pass.

## Patterns to follow

- Route error mapping pattern: `packages/backend/src/routes/clienti.ts:33` (`respond*Failure` + `buildErrorResponse`).
- Service validation pattern: `packages/backend/src/services/anagrafiche-service.ts:1347` (`ValidationFailure` with field/rule/message).
- Transaction and failure mapping pattern: `packages/backend/src/services/anagrafiche-service.ts:2748`.
- JWT token payload pattern: `packages/backend/src/middleware/auth.ts:152` (`tokenType` + expiration handling).
- Notification payload pattern: `packages/backend/src/services/notifiche-service.ts:178`.

## Risks

- Keeping in-memory test store and database branch behavior aligned in `anagrafiche-service`.
- Token validation/runtime failures if JWT secret handling diverges from existing auth flow.
- Regressions on existing auth routes when adding portal auth endpoints in `routes/auth.ts`.
