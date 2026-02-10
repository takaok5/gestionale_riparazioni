## Code Review - Story 1.3

### Issue 1

- Status: RESOLVED
- Severity: High
- Problem: `createUserInDatabase` handled Prisma `P2002` only for `username`, so duplicate `email` could bubble up as `500` instead of a deterministic domain error.
- Fix: Added `EMAIL_EXISTS` domain result in `packages/backend/src/services/users-service.ts` and mapped it to `409` in `packages/backend/src/routes/users.ts`.
- Verification: Added API test for duplicate email conflict in `packages/backend/src/__tests__/users-create.spec.ts` and verified it returns `409` with `error.code = "EMAIL_EXISTS"`.

### Issue 2

- Status: RESOLVED
- Severity: Medium
- Problem: Test-mode in-memory store validated uniqueness only on username, diverging from production DB constraints and hiding regressions.
- Fix: Added email uniqueness check in `createUserInTestStore` in `packages/backend/src/services/users-service.ts`.
- Verification: Duplicate-email test now fails without the fix and passes with the new check.

### Issue 3

- Status: RESOLVED
- Severity: Medium
- Problem: Email validation accepted malformed values using only `includes("@")`, allowing invalid payloads to pass validation.
- Fix: Replaced the check with explicit email format validation and normalized email to lowercase in `packages/backend/src/services/users-service.ts`.
- Verification: Added malformed-email test in `packages/backend/src/__tests__/users-create.spec.ts` asserting `400 VALIDATION_ERROR` with `field = "email"` and `rule = "invalid_format"`.
