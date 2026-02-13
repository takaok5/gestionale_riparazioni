# Review Story 7.6

## Summary

- Issues found: 3
- Issues resolved: 3
- False positives on `[x]` tasks: 0

### Issue 1 - Webhook signature validation too permissive
Status: RESOLVED

Problem:
- `verifyWebhookSignature` accepted any header containing a substring, allowing trivially forged signatures.

Fix:
- Hardened signature checks to strict test token match in test mode and a structured `t=...,v1=...` format outside test mode.

Evidence:
- `packages/backend/src/services/stripe-service.ts:22`

### Issue 2 - Non-checkout webhook events over-validated
Status: RESOLVED

Problem:
- Payload parsing required checkout-specific fields for all webhook events, returning validation errors instead of safely ignoring unsupported events.

Fix:
- Updated parser/handler flow to short-circuit non-`checkout.session.completed` events without requiring checkout-specific fields.

Evidence:
- `packages/backend/src/services/fatture-service.ts:447`
- `packages/backend/src/services/fatture-service.ts:471`
- `packages/backend/src/services/fatture-service.ts:932`

### Issue 3 - Missing invoice amount coherence before checkout link creation
Status: RESOLVED

Problem:
- Checkout link generation did not enforce a validated `amountCents` derived from invoice total.

Fix:
- Added `amountCents` validation from fattura total and propagated value to checkout session generation.

Evidence:
- `packages/backend/src/services/fatture-service.ts:898`
- `packages/backend/src/services/fatture-service.ts:912`
- `packages/backend/src/services/stripe-service.ts:3`
- `packages/backend/src/services/stripe-service.ts:15`

## Task Evidence ([x] verification)

- `POST /api/pagamenti/crea-link/:fatturaId` implemented:
  - `packages/backend/src/routes/pagamenti.ts:75`
- Checkout session service implemented:
  - `packages/backend/src/services/stripe-service.ts:11`
- Paid invoice guard implemented:
  - `packages/backend/src/services/fatture-service.ts:894`
  - `packages/backend/src/routes/pagamenti.ts:58`
- Webhook handler implemented:
  - `packages/backend/src/routes/stripe-webhooks.ts:87`
- Raw-body webhook wiring implemented:
  - `packages/backend/src/index.ts:26`
- ATDD file present and green:
  - `packages/backend/src/__tests__/stripe-pagamenti-atdd.spec.ts`
- Idempotency by sessionId implemented:
  - `packages/backend/src/services/fatture-service.ts:254`
  - `packages/backend/src/services/fatture-service.ts:957`
