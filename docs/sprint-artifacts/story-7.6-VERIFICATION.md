---
story_id: '7.6'
verified: '2026-02-13T14:49:30+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Link checkout Stripe viene creato per fattura EMESSA | VERIFIED | Test `AC-1` passa in `packages/backend/src/__tests__/stripe-pagamenti-atdd.spec.ts` |
| 2 | Fattura gia' PAGATA blocca creazione link con errore esplicito | VERIFIED | Test `AC-2` passa + mapping `INVOICE_ALREADY_PAID` in `packages/backend/src/routes/pagamenti.ts` |
| 3 | Webhook `checkout.session.completed` registra pagamento STRIPE e chiude fattura | VERIFIED | Test `AC-3` passa + handler in `packages/backend/src/services/fatture-service.ts` |
| 4 | Webhook duplicato non crea doppio pagamento (idempotenza) | VERIFIED | Test `AC-5` passa + `processedStripeSessionIds` in `packages/backend/src/services/fatture-service.ts` |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| `packages/backend/src/routes/pagamenti.ts` | CREATED | 93 |
| `packages/backend/src/routes/stripe-webhooks.ts` | CREATED | 111 |
| `packages/backend/src/services/stripe-service.ts` | CREATED | 35 |
| `packages/backend/src/services/fatture-service.ts` | MODIFIED | 1330 |
| `packages/backend/src/index.ts` | MODIFIED | 51 |
| `packages/backend/src/__tests__/stripe-pagamenti-atdd.spec.ts` | CREATED | 304 |
| `docs/sprint-artifacts/review-7.6.md` | CREATED | 65 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| `packages/backend/src/routes/pagamenti.ts` | `packages/backend/src/services/fatture-service.ts` | WIRED |
| `packages/backend/src/routes/stripe-webhooks.ts` | `packages/backend/src/services/fatture-service.ts` | WIRED |
| `packages/backend/src/services/fatture-service.ts` | `packages/backend/src/services/stripe-service.ts` | WIRED |
| `packages/backend/src/index.ts` | `packages/backend/src/routes/pagamenti.ts` | WIRED |
| `packages/backend/src/index.ts` | `packages/backend/src/routes/stripe-webhooks.ts` | WIRED |
