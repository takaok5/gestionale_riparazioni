---
story_id: '4.2'
verified: '2026-02-12T03:50:39.0350021+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | User can edit preventivo in stato BOZZA with totals recalculated | VERIFIED | packages/backend/src/__tests__/preventivi-update-atdd.spec.ts AC-1/AC-2 passing |
| 2 | System blocks edit for INVIATO and APPROVATO with exact message | VERIFIED | packages/backend/src/__tests__/preventivi-update-atdd.spec.ts AC-3/AC-4 passing |
| 3 | PUT on non-existing preventivo returns PREVENTIVO_NOT_FOUND | VERIFIED | Regression tests in packages/backend/src/__tests__/preventivi-update-atdd.spec.ts:237 |
| 4 | Existing preventivi behavior (create/detail) unchanged | VERIFIED | Full test suite pass incl. preventivi-create-atdd.spec.ts and preventivi-detail-atdd.spec.ts |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| packages/backend/src/routes/preventivi.ts | MODIFIED | 158 |
| packages/backend/src/services/preventivi-service.ts | MODIFIED | 732 |
| packages/backend/src/__tests__/preventivi-update-atdd.spec.ts | CREATED+MODIFIED | 247 |
| docs/stories/4.2.modifica-preventivo-bozza.story.md | MODIFIED | 86 |
| docs/sprint-artifacts/review-4.2.md | CREATED | n/a |

## Key Links

| From | To | Status |
| --- | --- | --- |
| routes/preventivi PUT handler | services/updatePreventivo | WIRED |
| services/updatePreventivo | test-store + Prisma transaction path | WIRED |
| ATDD tests story 4.2 | route/service behavior | VERIFIED |
