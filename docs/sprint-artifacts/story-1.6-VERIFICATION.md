---
story_id: '1.6'
verified: '2026-02-10T17:11:02.0453075+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Endpoint PUT /api/users/me/password e' disponibile e risponde con payload di successo | VERIFIED | packages/backend/src/routes/users.ts:165, test AC-1 in packages/backend/src/__tests__/users-change-password.spec.ts |
| 2 | Current password errata produce 400 CURRENT_PASSWORD_INCORRECT con messaggio esatto | VERIFIED | packages/backend/src/routes/users.ts:105, test AC-2 in packages/backend/src/__tests__/users-change-password.spec.ts:61 |
| 3 | Policy nuova password produce VALIDATION_ERROR con details strutturati | VERIFIED | packages/backend/src/services/users-service.ts:333, test AC-3 in packages/backend/src/__tests__/users-change-password.spec.ts:92 |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| packages/backend/src/__tests__/users-change-password.spec.ts | MODIFIED | 118 |
| docs/stories/1.6.cambio-password-propria.story.md | MODIFIED | 49 |
| .claude/plans/story-1.6.plan.md | CREATED | 45 |
| docs/sprint-artifacts/review-1.6.md | CREATED | 33 |
| docs/sprint-artifacts/story-1.6-RESEARCH.md | CREATED | 20 |
| docs/sprint-artifacts/story-1.6-VALIDATION.md | CREATED | 22 |
| docs/sprint-artifacts/story-1.6-ATDD-MAP.md | CREATED | 22 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| packages/backend/src/routes/users.ts | packages/backend/src/services/users-service.ts | WIRED |
| packages/backend/src/services/users-service.ts | packages/backend/src/services/auth-service.ts | WIRED |
| packages/backend/src/__tests__/users-change-password.spec.ts | packages/backend/src/index.ts | WIRED |