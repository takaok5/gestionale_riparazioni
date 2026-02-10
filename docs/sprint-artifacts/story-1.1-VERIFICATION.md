---
story_id: '1.1'
verified: '2026-02-10T02:07:39.3417809+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Login valido restituisce token e user payload | VERIFIED | npm run test -w packages/backend -> 8/8 test pass in auth-login.spec.ts |
| 2 | Credenziali non valide restituiscono 401 INVALID_CREDENTIALS | VERIFIED | AC-2 assertions in packages/backend/src/__tests__/auth-login.spec.ts pass |
| 3 | Account disabilitato restituisce 401 ACCOUNT_DISABLED | VERIFIED | AC-3 assertions in packages/backend/src/__tests__/auth-login.spec.ts pass |
| 4 | 6o tentativo fallito da stesso IP restituisce 429 + retryAfter 1..60 | VERIFIED | AC-4 assertions in packages/backend/src/__tests__/auth-login.spec.ts pass |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| packages/backend/src/routes/auth.ts | CREATED | 78 |
| packages/backend/src/services/auth-service.ts | CREATED | 147 |
| packages/backend/src/services/login-rate-limit.ts | CREATED | 54 |
| packages/backend/src/lib/errors.ts | CREATED | 23 |
| packages/backend/src/__tests__/auth-login.spec.ts | CREATED | 116 |
| packages/backend/src/index.ts | MODIFIED | 23 |
| packages/backend/src/middleware/auth.ts | MODIFIED | 86 |
| packages/backend/prisma/schema.prisma | MODIFIED | 88 |
| packages/shared/src/types/index.ts | MODIFIED | 85 |
| packages/backend/vitest.config.ts | CREATED | 8 |
| packages/frontend/vitest.config.ts | CREATED | 9 |
| packages/shared/vitest.config.ts | CREATED | 9 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| packages/backend/src/index.ts | packages/backend/src/routes/auth.ts | WIRED |
| packages/backend/src/routes/auth.ts | packages/backend/src/services/auth-service.ts | WIRED |
| packages/backend/src/routes/auth.ts | packages/backend/src/services/login-rate-limit.ts | WIRED |
| packages/backend/src/services/auth-service.ts | packages/backend/src/middleware/auth.ts (issueAuthTokens) | WIRED |
| packages/backend/src/__tests__/auth-login.spec.ts | POST /api/auth/login route behavior | VERIFIED |