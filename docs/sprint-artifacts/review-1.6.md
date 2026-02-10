## Review Log - Story 1.6

### Issue 1
Status: RESOLVED

- Problem: AC-1 expected `response.body.success = true` and old-password login invalidation, but `packages/backend/src/__tests__/users-change-password.spec.ts` did not assert either behavior.
- Risk: false green where endpoint shape or credential invalidation regresses without test failure.
- Fix: updated AC-1 tests to assert exact payload `{ success: true }` and `401 INVALID_CREDENTIALS` when logging in with old password.
- Evidence: `packages/backend/src/__tests__/users-change-password.spec.ts:34`, `packages/backend/src/__tests__/users-change-password.spec.ts:55-58`.

### Issue 2
Status: RESOLVED

- Problem: AC-2 test asserted only error message and did not assert domain code.
- Risk: a different 400 branch with same message could pass tests incorrectly.
- Fix: added assertion `error.code = "CURRENT_PASSWORD_INCORRECT"`.
- Evidence: `packages/backend/src/__tests__/users-change-password.spec.ts:68`.

### Issue 3
Status: RESOLVED

- Problem: AC-3 tests were too permissive (`toMatchObject`) and did not enforce `error.message = "Payload non valido"`.
- Risk: partial or altered validation payload could slip through.
- Fix: added message assertion and switched details assertion to exact `toEqual`.
- Evidence: `packages/backend/src/__tests__/users-change-password.spec.ts:98`, `packages/backend/src/__tests__/users-change-password.spec.ts:110-116`.

### Issue 4
Status: RESOLVED

- Problem: temporary duplicate file `users-change-password-red-phase.spec.ts` duplicated coverage already present in the canonical test file.
- Risk: duplicated maintenance cost and noisy pipeline reruns.
- Fix: removed duplicate file and pointed `atdd-tests-1.6.txt` to `src/__tests__/users-change-password.spec.ts`.
- Evidence: `docs/sprint-artifacts/atdd-tests-1.6.txt`, file deletion in working tree.