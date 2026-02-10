---
story_id: '1.1'
created: '2026-02-10'
depends_on: []
files_modified:
  - packages/backend/src/index.ts
  - packages/backend/src/routes/auth.ts
  - packages/backend/src/services/auth-service.ts
  - packages/backend/src/services/login-rate-limit.ts
  - packages/backend/src/lib/errors.ts
  - packages/backend/src/middleware/auth.ts
  - packages/backend/prisma/schema.prisma
  - packages/shared/src/types/index.ts
  - packages/backend/src/__tests__/auth-login.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 1.1

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| `packages/backend/src/routes/auth.ts` | Add `POST /login` endpoint with AC-driven status/error mapping | `packages/backend/src/services/auth-service.ts`, `packages/backend/src/services/login-rate-limit.ts` |
| `packages/backend/src/services/auth-service.ts` | Implement credential check, disabled-account check, JWT issuance payload and response shaping | `packages/backend/prisma/schema.prisma`, `packages/backend/src/middleware/auth.ts`, `packages/shared/src/types/index.ts` |
| `packages/backend/src/services/login-rate-limit.ts` | Implement in-memory failed-attempt tracker per IP (5 attempts/60s) and retryAfter seconds | none |
| `packages/backend/src/index.ts` | Register `/api/auth` router using existing `app.use` pattern | `packages/backend/src/routes/auth.ts` |
| `packages/backend/src/lib/errors.ts` | Centralize auth error payload format `{ error: { code, message, details } }` for `401` and `429` responses | none |
| `packages/backend/src/middleware/auth.ts` | Add token issuing utility shared by login flow (access 15m, refresh 7d) | none |
| `packages/backend/prisma/schema.prisma` | Add `isActive` flag on `User` for AC-3 disabled-account path | none |
| `packages/shared/src/types/index.ts` | Add typed login response contract for `{ accessToken, refreshToken, user }` | none |
| `packages/backend/src/__tests__/auth-login.spec.ts` | Keep RED tests and align final assertions with implemented response shape | all implementation files above |

## Implementation order

1. Update `packages/backend/prisma/schema.prisma` (`User.isActive`) and regenerate Prisma client to unblock disabled-account logic.
2. Add core domain helpers: `packages/backend/src/lib/errors.ts` and `packages/backend/src/services/login-rate-limit.ts`.
3. Implement `packages/backend/src/services/auth-service.ts` and token utility updates in `packages/backend/src/middleware/auth.ts`.
4. Create `packages/backend/src/routes/auth.ts` wiring service + rate-limit + explicit AC error mapping.
5. Register auth router in `packages/backend/src/index.ts` via `app.use('/api/auth', authRouter)`.
6. Extend `packages/shared/src/types/index.ts` with login response types and update backend typings.
7. Run `packages/backend/src/__tests__/auth-login.spec.ts` until all AC tests pass, then run workspace checks (`typecheck`, `lint`, `test`).

## Patterns to follow

- From `docs/sprint-artifacts/story-1.1-RESEARCH.md`: keep middleware/route registration consistent with `packages/backend/src/index.ts:9-13`.
- Follow router structure from `packages/backend/src/routes/health.ts:1-7` (`Router()`, handler exports, JSON responses).
- Reuse JWT conventions from `packages/backend/src/middleware/auth.ts:17-54` (Bearer parsing, `jwt.verify`, typed payload).
- Keep error payload deterministic and testable (explicit `error.code` values for `INVALID_CREDENTIALS`, `ACCOUNT_DISABLED`, rate-limit).

## Risks

- Current workspace test configuration may not pick backend tests when run from workspace script; verification commands may need root-level vitest invocation.
- Adding `isActive` in Prisma may require migration/backfill strategy for existing rows.
- In-memory rate limit is process-local; behavior differs under multi-instance deployment.