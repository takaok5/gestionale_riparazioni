---
story_id: "8.1"
verified: "2026-02-13T15:30:24.0000000+01:00"
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | `POST /api/clienti/:id/portal-account` creates `INVITATO` account | VERIFIED | `portal-account-create-atdd.spec.ts` passing |
| 2 | Duplicate portal-account request returns `409 PORTAL_ACCOUNT_ALREADY_EXISTS` | VERIFIED | `portal-account-conflict-atdd.spec.ts` passing |
| 3 | Missing customer email returns `400 CUSTOMER_EMAIL_REQUIRED` | VERIFIED | `portal-account-email-required-atdd.spec.ts` passing |
| 4 | Activation + first portal login returns `200` with tokens | VERIFIED | `portal-account-activation-atdd.spec.ts` passing |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| `packages/backend/src/routes/clienti.ts` | MODIFIED | 271 |
| `packages/backend/src/routes/auth.ts` | MODIFIED | 170 |
| `packages/backend/src/services/auth-service.ts` | MODIFIED | 385 |
| `packages/backend/src/services/notifiche-service.ts` | MODIFIED | 283 |
| `packages/backend/src/index.ts` | MODIFIED | 47 |
| `packages/backend/src/__tests__/portal-account-create-atdd.spec.ts` | CREATED | 57 |
| `packages/backend/src/__tests__/portal-account-conflict-atdd.spec.ts` | CREATED | 60 |
| `packages/backend/src/__tests__/portal-account-email-required-atdd.spec.ts` | CREATED | 51 |
| `packages/backend/src/__tests__/portal-account-activation-atdd.spec.ts` | CREATED | 62 |
| `docs/sprint-artifacts/review-8.1.md` | CREATED | 23 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| `packages/backend/src/routes/clienti.ts` | `packages/backend/src/services/auth-service.ts` | WIRED |
| `packages/backend/src/services/auth-service.ts` | `packages/backend/src/services/notifiche-service.ts` | WIRED |
| `packages/backend/src/routes/auth.ts` | `packages/backend/src/services/auth-service.ts` | WIRED |
| `packages/backend/src/index.ts` | `packages/backend/src/routes/auth.ts` | WIRED |
