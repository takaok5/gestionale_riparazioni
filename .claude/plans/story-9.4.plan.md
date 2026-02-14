---
story_id: '9.4'
created: '2026-02-14'
depends_on: []
files_modified:
  - packages/backend/src/services/anagrafiche-service.ts
  - packages/backend/src/routes/public.ts
  - packages/backend/src/services/login-rate-limit.ts
  - packages/backend/src/__tests__/public-richieste-api.atdd.spec.ts
  - packages/frontend/src/App.tsx
  - packages/frontend/src/__tests__/public-home-vetrina.atdd.spec.ts
must_pass: [test]
---

# Plan Story 9.4

## Files to modify

| File | Change | Depends on |
| --------------- | ----------- | ---------- |
| packages/backend/src/services/anagrafiche-service.ts | Add createPublicRichiesta input parser, anti-spam verification result mapping, deterministic 	icketId generation, and test-safe reset helpers. | Existing public service patterns and in-memory stores |
| packages/backend/src/routes/public.ts | Add POST /richieste endpoint and response mappers for VALIDATION_ERROR, INVALID_ANTISPAM_TOKEN, RATE_LIMIT_EXCEEDED, and fallback 500. | createPublicRichiesta service result contract |
| packages/backend/src/services/login-rate-limit.ts | Reuse/extend sliding-window primitives for public-lead throttling keyed by IP, keeping Retry-After semantics. | Current rate-limit utility exports |
| packages/backend/src/__tests__/public-richieste-api.atdd.spec.ts | Keep AC-aligned ATDD expectations and adjust any fixture/reset helpers once implementation is in place. | New route + service behavior |
| packages/frontend/src/App.tsx | Add /richiedi-preventivo public entry page linked from homepage CTA. | Existing path-switch rendering structure |
| packages/frontend/src/__tests__/public-home-vetrina.atdd.spec.ts | Validate CTA to /richiedi-preventivo and route rendering contract. | App route implementation |

## Implementation order

1. Implement backend domain logic in packages/backend/src/services/anagrafiche-service.ts (payload parsing, anti-spam validation code path, deterministic ticket ID sequence).
2. Wire route handling in packages/backend/src/routes/public.ts with explicit status and error-code mapping for all AC outcomes.
3. Integrate per-IP throttling by reusing/extending packages/backend/src/services/login-rate-limit.ts and invoke it from public richieste flow.
4. Execute and refine packages/backend/src/__tests__/public-richieste-api.atdd.spec.ts until all AC-1..AC-4 tests pass.
5. Implement /richiedi-preventivo view in packages/frontend/src/App.tsx and align packages/frontend/src/__tests__/public-home-vetrina.atdd.spec.ts with the final CTA/form entry behavior.

## Patterns to follow

- From docs/sprint-artifacts/story-9.4-RESEARCH.md: use route-level failure responders and uildErrorResponse shape as in packages/backend/src/routes/public.ts:37.
- From docs/sprint-artifacts/story-9.4-RESEARCH.md: use parse*Input + { ok: false, code } contracts as in packages/backend/src/services/anagrafiche-service.ts:6026.
- From docs/sprint-artifacts/story-9.4-RESEARCH.md: use Retry-After + RATE_LIMIT_EXCEEDED semantics from packages/backend/src/routes/auth.ts:142 and packages/backend/src/routes/auth.ts:499.
- From docs/sprint-artifacts/story-9.4-RESEARCH.md: reuse sliding-window logic and reset hook pattern from packages/backend/src/services/login-rate-limit.ts:1.

## Risks

- Ticket ID generation can collide under concurrency if sequence increment is not atomic in shared state.
- Reusing global rate-limit state can leak across tests if reset hooks are not invoked in eforeEach.
- Anti-spam contract is new; incomplete payload precedence rules can return VALIDATION_ERROR when AC expects INVALID_ANTISPAM_TOKEN.
- Adding /richiedi-preventivo rendering inside a single-file router (App.tsx) can regress existing /servizi, /contatti, or /faq branches if path checks are ordered incorrectly.