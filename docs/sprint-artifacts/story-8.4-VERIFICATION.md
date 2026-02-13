---
story_id: '8.4'
verified: '2026-02-13T18:41:17.0388115+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | User can list own orders with pagination metadata | VERIFIED | `packages/backend/src/__tests__/portal-ordini-list-detail.atdd.spec.ts:106`, route `packages/backend/src/routes/auth.ts:511`, service `packages/backend/src/services/auth-service.ts:824` |
| 2 | User can filter own orders by stato | VERIFIED | `packages/backend/src/__tests__/portal-ordini-list-detail.atdd.spec.ts:144`, service filter `packages/backend/src/services/riparazioni-service.ts:649` |
| 3 | User can read order detail with importi/timeline/documenti shape | VERIFIED | `packages/backend/src/__tests__/portal-ordini-list-detail.atdd.spec.ts:189`, detail mapping `packages/backend/src/services/auth-service.ts:876` |
| 4 | Cross-customer access is blocked with `FORBIDDEN` | VERIFIED | `packages/backend/src/__tests__/portal-ordini-list-detail.atdd.spec.ts:224`, ownership check `packages/backend/src/services/auth-service.ts:914` |
| 5 | Review findings are fixed and gate checks pass | VERIFIED | `docs/sprint-artifacts/review-8.4.md:1`, step-8 gate run PASS (`npm test`, `npm run lint`) |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| `packages/backend/src/routes/auth.ts` | MODIFIED | 565 |
| `packages/backend/src/services/auth-service.ts` | MODIFIED | 988 |
| `packages/backend/src/services/riparazioni-service.ts` | MODIFIED | 2660 |
| `packages/backend/src/__tests__/portal-ordini-list-detail.atdd.spec.ts` | CREATED | 258 |
| `docs/sprint-artifacts/review-8.4.md` | CREATED | 42 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| `packages/backend/src/routes/auth.ts:511` | `packages/backend/src/services/auth-service.ts:824` | WIRED |
| `packages/backend/src/routes/auth.ts:540` | `packages/backend/src/services/auth-service.ts:876` | WIRED |
| `packages/backend/src/services/auth-service.ts:835` | `packages/backend/src/services/riparazioni-service.ts:646` | WIRED |