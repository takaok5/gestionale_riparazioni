---
story_id: '7.6'
created: '2026-02-13'
depends_on: []
files_modified:
  - packages/backend/package.json
  - packages/backend/src/index.ts
  - packages/backend/src/routes/pagamenti.ts
  - packages/backend/src/routes/stripe-webhooks.ts
  - packages/backend/src/services/stripe-service.ts
  - packages/backend/src/services/fatture-service.ts
  - packages/backend/src/__tests__/stripe-pagamenti-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 7.6

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| `packages/backend/package.json` | Add Stripe SDK dependency | - |
| `packages/backend/src/services/stripe-service.ts` | Create Stripe adapter for checkout session creation + webhook signature verification | `packages/backend/package.json` |
| `packages/backend/src/routes/pagamenti.ts` | Add `POST /api/pagamenti/crea-link/:fatturaId` with auth and error mapping | `packages/backend/src/services/stripe-service.ts`, `packages/backend/src/services/fatture-service.ts` |
| `packages/backend/src/routes/stripe-webhooks.ts` | Add `POST /api/webhooks/stripe` route with signature validation + idempotent event handling | `packages/backend/src/services/stripe-service.ts`, `packages/backend/src/services/fatture-service.ts` |
| `packages/backend/src/services/fatture-service.ts` | Add helpers for stripe payment registration, paid-invoice guard and idempotency check by `sessionId` | - |
| `packages/backend/src/index.ts` | Mount new routers and ensure webhook raw-body parsing order before `express.json()` consumes payload | `packages/backend/src/routes/pagamenti.ts`, `packages/backend/src/routes/stripe-webhooks.ts` |
| `packages/backend/src/__tests__/stripe-pagamenti-atdd.spec.ts` | Keep RED tests and adjust only if contract details change during implementation | all backend changes |

## Implementation order

1. Add Stripe dependency and create `packages/backend/src/services/stripe-service.ts` with typed results for `createCheckoutLink` and `verifyWebhookSignature`.
2. Extend `packages/backend/src/services/fatture-service.ts` with reusable operations for:
   - validate fattura status before link creation (`EMESSA` only),
   - register Stripe payment (`metodo: "STRIPE"`, date conversion from unix to `YYYY-MM-DD`),
   - idempotency guard by `sessionId`.
3. Implement `packages/backend/src/routes/pagamenti.ts` following existing route patterns (`authenticate`, role guard, payload mapping, failure-to-HTTP mapping).
4. Implement `packages/backend/src/routes/stripe-webhooks.ts` with raw payload handling, signature verification, event filtering (`checkout.session.completed`) and duplicate-event no-op behavior.
5. Wire routes in `packages/backend/src/index.ts` with correct middleware ordering (webhook raw parser before global JSON parser).
6. Run targeted tests for `stripe-pagamenti-atdd.spec.ts`, then full backend test suite, and fix contract mismatches until GREEN.

## Patterns to follow

- Reuse error mapping style from `packages/backend/src/routes/fatture.ts:93` (`code -> HTTP status` via dedicated responder).
- Reuse route/auth pattern from `packages/backend/src/routes/fatture.ts:305` (`authenticate` + role check + payload object).
- Reuse payment state update logic from `packages/backend/src/services/fatture-service.ts:641` (`totalePagato`, `residuo`, `stato` consistency).
- Respect `docs/sprint-artifacts/story-7.6-RESEARCH.md` pitfall on `express.json()` order (`packages/backend/src/index.ts:24`).

## Risks

- Webhook signature verification can fail if body parsing order is wrong.
- Duplicate webhook events can create multiple payments without session-level idempotency.
- Stripe SDK integration in tests can become flaky without deterministic test-mode adapter behavior.
