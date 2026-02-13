---
story_id: '8.2'
verified: '2026-02-13T16:26:14+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Login portale restituisce token + profile summary | VERIFIED | `packages/backend/src/__tests__/portal-auth-login-refresh-logout.atdd.spec.ts` AC-1 passa |
| 2 | Lockout portale dopo tentativi falliti restituisce 423 + Retry-After | VERIFIED | `packages/backend/src/__tests__/portal-auth-login-refresh-logout.atdd.spec.ts` AC-3 passa |
| 3 | Refresh portale ruota token e invalida il precedente | VERIFIED | `packages/backend/src/__tests__/portal-auth-login-refresh-logout.atdd.spec.ts` AC-4 passa |
| 4 | Logout portale revoca refresh token e blocca refresh successivi | VERIFIED | `packages/backend/src/__tests__/portal-auth-login-refresh-logout.atdd.spec.ts` AC-5 passa |
| 5 | Suite completa resta green dopo integrazione 8.2 | VERIFIED | `npm test -- --run` passato (457 backend + 4 shared) |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| `packages/backend/src/services/login-rate-limit.ts` | MODIFIED | 87 |
| `packages/backend/src/services/auth-service.ts` | MODIFIED | 646 |
| `packages/backend/src/routes/auth.ts` | MODIFIED | 317 |
| `packages/backend/src/__tests__/portal-auth-login-refresh-logout.atdd.spec.ts` | CREATED | 278 |
| `docs/sprint-artifacts/review-8.2.md` | CREATED | 26 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| `packages/backend/src/routes/auth.ts` | `packages/backend/src/services/auth-service.ts` | WIRED |
| `packages/backend/src/routes/auth.ts` | `packages/backend/src/services/login-rate-limit.ts` | WIRED |
| `packages/backend/src/__tests__/portal-auth-login-refresh-logout.atdd.spec.ts` | `packages/backend/src/routes/auth.ts` | VERIFIED |
