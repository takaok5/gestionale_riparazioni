# Story 9.4 Research

## Patterns Found

- `packages/backend/src/routes/public.ts:37` uses dedicated failure responders per endpoint and maps domain errors to deterministic HTTP codes with `buildErrorResponse`; the new `POST /richieste` should follow the same route pattern.
- `packages/backend/src/services/anagrafiche-service.ts:6026` applies `parse*Input` plus `{ ok: false, code }` domain responses, keeping validation and business logic outside route handlers.
- `packages/backend/src/routes/auth.ts:142` + `packages/backend/src/routes/auth.ts:499` show rate-limit contract (`Retry-After` header + `RATE_LIMIT_EXCEEDED`) that can be mirrored for public lead throttling.
- `packages/backend/src/services/login-rate-limit.ts:1` implements a sliding-window limiter with explicit `resetRateLimiter()` test hook; this is the existing reusable in-memory throttling approach.
- `packages/backend/src/__tests__/auth-login.spec.ts:78` demonstrates ATDD for repeated IP attempts with `.set("X-Forwarded-For", ...)` and explicit assertions on `429` + `retryafter`.

## Known Pitfalls

- No existing backend module currently handles `Richiesta`/`Lead` persistence; if ticket generation is not atomic, concurrent requests can produce duplicate IDs.
- ACs that rely on exact generated IDs (`LEAD-YYYYMMDD-0001`) are brittle without deterministic clock/sequence control in tests.
- Rate limiting keyed only by IP can block legitimate users behind NAT/proxy unless thresholds and headers are calibrated.
- Anti-spam validation has no existing provider integration in code; missing a deterministic adapter contract will make tests flaky.

## Stack/Libraries to Use

- `express` route handlers in `packages/backend/src/routes/public.ts` for endpoint wiring.
- Existing `buildErrorResponse` helper in `packages/backend/src/lib/errors.ts` for error payload consistency.
- Existing service-layer style in `packages/backend/src/services/anagrafiche-service.ts` for parser/result typing.
- Existing rate-limit primitives in `packages/backend/src/services/login-rate-limit.ts` to implement `429` behavior and test reset.
- Existing backend ATDD setup with `vitest` + `supertest` in `packages/backend/src/__tests__/*.spec.ts`.