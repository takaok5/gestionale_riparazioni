---
story_id: '8.6'
verified: '2026-02-13T20:25:41+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Portal customer can approve preventivo and receives APPROVATO/APPROVATA | VERIFIED | src/__tests__/portal-preventivi-risposta.atdd.spec.ts AC-1 passes |
| 2 | Portal customer can reject preventivo and receives RIFIUTATO/ANNULLATA | VERIFIED | src/__tests__/portal-preventivi-risposta.atdd.spec.ts AC-2 passes |
| 3 | Duplicate response returns RESPONSE_ALREADY_RECORDED with HTTP 400 | VERIFIED | packages/backend/src/routes/auth.ts:383 + AC-3 passing |
| 4 | Cross-customer preventivo response is blocked with FORBIDDEN | VERIFIED | packages/backend/src/services/auth-service.ts:1088 + AC-4 passing |
| 5 | Legacy preventivi response API contract remains backward compatible | VERIFIED | packages/backend/src/routes/preventivi.ts:198 + preventivi-response-atdd passing |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| packages/backend/src/routes/auth.ts | MODIFIED | 762 |
| packages/backend/src/services/auth-service.ts | MODIFIED | 1152 |
| packages/backend/src/services/preventivi-service.ts | MODIFIED | 1819 |
| packages/backend/src/routes/preventivi.ts | MODIFIED | 325 |
| packages/backend/src/__tests__/portal-preventivi-risposta.atdd.spec.ts | CREATED | 269 |
| docs/sprint-artifacts/review-8.6.md | CREATED | 70 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| packages/backend/src/routes/auth.ts | packages/backend/src/services/auth-service.ts | WIRED |
| packages/backend/src/services/auth-service.ts | packages/backend/src/services/preventivi-service.ts | WIRED |
| packages/backend/src/routes/preventivi.ts | packages/backend/src/services/preventivi-service.ts | COMPATIBLE |
| packages/backend/src/__tests__/portal-preventivi-risposta.atdd.spec.ts | POST /api/portal/preventivi/:id/risposta | VERIFIED |