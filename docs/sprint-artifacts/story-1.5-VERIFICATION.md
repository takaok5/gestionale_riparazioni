---
story_id: '1.5'
verified: '2026-02-10T16:00:20+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Admin can update user role via PUT /api/users/:id | VERIFIED | packages/backend/src/__tests__/users-update-deactivate.spec.ts AC-1 tests pass |
| 2 | Admin can deactivate user via PATCH /api/users/:id/deactivate | VERIFIED | packages/backend/src/__tests__/users-update-deactivate.spec.ts AC-2 tests pass |
| 3 | Last active admin deactivation is blocked with domain error | VERIFIED | AC-3 tests assert LAST_ADMIN_DEACTIVATION_FORBIDDEN and exact message |
| 4 | Non-admin role is blocked by RBAC on user mutations | VERIFIED | AC-4 tests assert 403 FORBIDDEN |
| 5 | Validation/not-found branches are mapped deterministically | VERIFIED | Review fix tests cover VALIDATION_ERROR and USER_NOT_FOUND |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| packages/backend/src/services/users-service.ts | MODIFIED | 610 |
| packages/backend/src/routes/users.ts | MODIFIED | 183 |
| packages/backend/src/__tests__/users-update-deactivate.spec.ts | CREATED | 167 |
| packages/shared/src/types/index.ts | MODIFIED | 102 |
| docs/sprint-artifacts/review-1.5.md | CREATED | 50 |
| docs/stories/1.5.modifica-disattivazione-utente-admin.story.md | MODIFIED | 57 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| packages/backend/src/routes/users.ts | packages/backend/src/services/users-service.ts | WIRED |
| packages/backend/src/__tests__/users-update-deactivate.spec.ts | packages/backend/src/index.ts | WIRED |
| packages/shared/src/types/index.ts | backend/frontend shared contracts | WIRED |
