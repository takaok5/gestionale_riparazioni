---
story_id: '9.4'
verified: '2026-02-14T01:12:45+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Public endpoint POST /api/public/richieste returns 201 with deterministic 	icketId on valid payload | VERIFIED | packages/backend/src/__tests__/public-richieste-api.atdd.spec.ts AC-1 PASS |
| 2 | Missing/false consensoPrivacy is rejected with 400 VALIDATION_ERROR | VERIFIED | packages/backend/src/__tests__/public-richieste-api.atdd.spec.ts AC-2 PASS |
| 3 | Per-IP throttling enforces 429 RATE_LIMIT_EXCEEDED with Retry-After | VERIFIED | packages/backend/src/__tests__/public-richieste-api.atdd.spec.ts AC-3 PASS |
| 4 | Invalid anti-spam token is rejected with 400 INVALID_ANTISPAM_TOKEN | VERIFIED | packages/backend/src/__tests__/public-richieste-api.atdd.spec.ts AC-4 PASS |
| 5 | CTA destination /richiedi-preventivo renders a concrete form entry page | VERIFIED | packages/frontend/src/__tests__/public-home-vetrina.atdd.spec.ts AC-6 PASS |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| packages/backend/src/routes/public.ts | MODIFIED | 328 |
| packages/backend/src/services/anagrafiche-service.ts | MODIFIED | 6706 |
| packages/backend/src/__tests__/public-richieste-api.atdd.spec.ts | CREATED | 170 |
| packages/frontend/src/App.tsx | MODIFIED | 420 |
| packages/frontend/src/__tests__/public-home-vetrina.atdd.spec.ts | MODIFIED | 136 |
| docs/stories/9.4.form-richiesta-preventivo-appuntamento-pubblico.story.md | CREATED | 56 |
| docs/sprint-artifacts/review-9.4.md | CREATED | 27 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| packages/backend/src/routes/public.ts | packages/backend/src/services/anagrafiche-service.ts | WIRED |
| packages/backend/src/routes/public.ts | packages/backend/src/services/login-rate-limit.ts | WIRED |
| packages/backend/src/__tests__/public-richieste-api.atdd.spec.ts | packages/backend/src/routes/public.ts | VERIFIED |
| packages/frontend/src/App.tsx | packages/frontend/src/__tests__/public-home-vetrina.atdd.spec.ts | VERIFIED |