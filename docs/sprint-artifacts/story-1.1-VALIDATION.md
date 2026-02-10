# Story 1.1 Validation Report

## Issues Found and Resolved

1. AC-2 Given was underspecified because it did not include concrete submitted password data.
- Fix applied: Given now specifies username `utente.inesistente` and password `Password1` in login payload.
- Verification: AC-2 now defines deterministic input for a 401 `INVALID_CREDENTIALS` assertion.

2. AC-3 Given was underspecified because it did not identify concrete credentials for the disabled user scenario.
- Fix applied: Given now specifies username `mario.disabilitato`, password `Password1`, and `isActive=false` state.
- Verification: AC-3 now maps to a concrete setup and explicit 401 `ACCOUNT_DISABLED` assertion.

3. AC-4 Then was partially vague because `retryAfter` had no measurable bounds.
- Fix applied: Then now requires integer seconds in range `1..60` in `retryAfter` header.
- Verification: AC-4 now has testable numeric assertions for rate limit response.

4. Task breakdown included misleading implementation scope (`routes/health.ts`) and lacked dedicated auth route/test modules.
- Fix applied: tasks now target `routes/auth.ts`, `services/auth-service.ts`, `middleware/login-rate-limit.ts`, and `routes/auth.test.ts`.
- Verification: task plan now maps each AC to concrete auth-focused modules without coupling to health endpoint logic.