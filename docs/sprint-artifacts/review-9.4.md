# Review 9.4

## Summary

Adversarial review completed on the Story 9.4 implementation diff. Three concrete issues were found and resolved.

### Issue 1 - IP fallback collapsed to `unknown` (global throttle risk)
- Severity: High
- File: `packages/backend/src/routes/public.ts`
- Problem: When `X-Forwarded-For` was absent, all requests resolved to `unknown`, causing unrelated clients to share one rate-limit bucket.
- Fix: `resolveRequestIp` now uses `req.ip` fallback and only falls back to `unknown` as last resort.
- Verification: `src/__tests__/public-richieste-api.atdd.spec.ts` remains green and route now computes key from real request IP.
- Status: RESOLVED

### Issue 2 - Successful submissions consumed throttle budget
- Severity: Medium
- File: `packages/backend/src/routes/public.ts`
- Problem: Rate-limit attempts were incremented for both failures and successful creates, making legitimate users hit 429 after repeated valid submissions.
- Fix: `registerFailedAttemptForKey` is now called only on failing outcomes.
- Verification: AC-3 tests still pass (invalid requests still throttle), AC-1 success path remains 201.
- Status: RESOLVED

### Issue 3 - Missing upper-bound assertion for `Retry-After`
- Severity: Medium
- File: `packages/backend/src/__tests__/public-richieste-api.atdd.spec.ts`
- Problem: Test validated integer and lower bound only; policy cap (`<= 60`) was unverified.
- Fix: Added explicit `expect(retryAfter).toBeLessThanOrEqual(60)` and robust header key fallback (`retryafter` / `retry-after`).
- Verification: Targeted backend ATDD passes with the stronger assertion.
- Status: RESOLVED