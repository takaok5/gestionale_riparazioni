---
story_id: '1.6'
created: '2026-02-10'
depends_on: []
files_modified:
  - docs/stories/1.6.cambio-password-propria.story.md
  - packages/backend/src/__tests__/users-change-password-red-phase.spec.ts
  - packages/backend/src/routes/users.ts
  - packages/backend/src/services/users-service.ts
  - packages/backend/src/services/auth-service.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 1.6

## Files to modify

| File | Change | Depends on |
| --------------- | ----------- | ---------- |
| docs/stories/1.6.cambio-password-propria.story.md | Tighten AC assertions to deterministic payload-level checks | docs/sprint-artifacts/story-1.6-RESEARCH.md |
| packages/backend/src/__tests__/users-change-password-red-phase.spec.ts | Add ATDD mapping tests for AC-1/AC-2/AC-3 with exact expects | packages/backend/src/routes/users.ts |
| packages/backend/src/routes/users.ts | Verify error mapping codes/messages remain aligned with story ACs | packages/backend/src/services/users-service.ts |
| packages/backend/src/services/users-service.ts | Verify password-policy/current-password branches match AC contract | packages/backend/src/services/auth-service.ts |
| packages/backend/src/services/auth-service.ts | Verify test-store synchronization keeps login behavior deterministic | packages/backend/src/services/users-service.ts |

## Implementation order

1. Story alignment task - update docs/stories/1.6.cambio-password-propria.story.md to enforce deterministic Then assertions (success flag, error code/message, exact details payload).
2. ATDD mapping task - create/update packages/backend/src/__tests__/users-change-password-red-phase.spec.ts with at least 2 tests per AC and explicit expect() assertions mapped to ACs.
3. Backend contract verification task - verify packages/backend/src/routes/users.ts and packages/backend/src/services/users-service.ts expose CURRENT_PASSWORD_INCORRECT and VALIDATION_ERROR shapes exactly as declared in story.
4. Auth synchronization verification task - verify packages/backend/src/services/auth-service.ts + packages/backend/src/services/users-service.ts keep test-store hashes synchronized after password change.
5. Regression execution task - run full backend tests and repository gates (	ypecheck, lint, uild, 	est) before review.

## Patterns to follow

- From RESEARCH.md: keep route-level domain error mapping centralized with uildErrorResponse pattern from packages/backend/src/routes/users.ts:89.
- From RESEARCH.md: keep validation failures as structured VALIDATION_ERROR payloads (ield, ule, min, flags) following packages/backend/src/services/users-service.ts:333.
- From RESEARCH.md: preserve crypt.compare authentication behavior and test-store sync pattern between users-service and uth-service.

## Risks

- Re-running RED on an already implemented story can produce false positives; only green gates should decide merge readiness.
- AC tightening without matching tests may create documentation-code drift.
- Any mismatch between in-memory test stores can make login assertions flaky.