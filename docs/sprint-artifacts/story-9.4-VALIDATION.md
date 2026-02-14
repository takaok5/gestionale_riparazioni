# Story 9.4 Validation

## Issues Found and Resolved

1. Problem: AC-1 mixed anti-spam payload details into the happy path derived from epic AC-1, making source traceability weaker and coupling AC-1 to AC-4 concerns.
   Fix: Removed `antispamToken` from AC-1 Given and kept only epic payload fields.
   Verification: AC-1 now uses `{ tipo, nome, email, problema, consensoPrivacy }` only.

2. Problem: AC-3 used non-deterministic wording (`invalid or repeated`, `short time window`) that cannot be translated into stable test setup.
   Fix: Specified exact window and threshold (`6` attempts, same IP, `60` seconds, max `5`).
   Verification: AC-3 Then explicitly targets the sixth request with `429`, `Retry-After`, and `RATE_LIMIT_EXCEEDED`.

3. Problem: AC-4 could fail earlier on generic validation because required payload fields were not fully declared in Given.
   Fix: Added complete payload with `consensoPrivacy: true` and explicit invalid anti-spam token.
   Verification: AC-4 now isolates anti-spam rejection as the intended failure condition.

4. Problem: Task coverage did not explicitly require deterministic ticket sequence behavior needed by AC-1 exact ticketId.
   Fix: Added Task 6 for deterministic `LEAD-YYYYMMDD-####` generation and testability under concurrency.
   Verification: Task breakdown now includes explicit implementation scope for ticket ID determinism.

## Gate Result

- Quality gate executed: PASS (`GATE PASS: Story validated`)