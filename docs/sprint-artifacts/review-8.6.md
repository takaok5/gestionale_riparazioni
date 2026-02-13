# Review Story 8.6

## Scope

Reviewed modified files for story 8.6 (portal preventivo response flow):
- `packages/backend/src/services/preventivi-service.ts`
- `packages/backend/src/services/auth-service.ts`
- `packages/backend/src/routes/auth.ts`
- `packages/backend/src/routes/preventivi.ts`
- `packages/backend/src/__tests__/portal-preventivi-risposta.atdd.spec.ts`

### Issue 1: Duplicate-response domain code would break legacy preventivi API contract
Status: RESOLVED

Problem:
- Introducing `RESPONSE_ALREADY_RECORDED` in domain (`preventivi-service`) would have changed legacy `/api/preventivi/:id/risposta` behavior expected by existing tests (`VALIDATION_ERROR` + same message).

Fix applied:
- Added explicit compatibility mapping in `packages/backend/src/routes/preventivi.ts:198` to keep HTTP `400` with `error.code="VALIDATION_ERROR"` and the historical message.

Verification:
- `npm test -- --run src/__tests__/preventivi-response-atdd.spec.ts` passes.

### Issue 2: New portal ATDD tests were failing for setup reasons instead of feature behavior
Status: RESOLVED

Problem:
- Test bootstrap seeded customer data with incomplete shape; this produced runtime failures in test fixtures before reaching endpoint assertions.

Fix applied:
- Normalized test seeding in `packages/backend/src/__tests__/portal-preventivi-risposta.atdd.spec.ts:104` with complete customer fields (`nome`, `codiceCliente`, `email`) and added notifiche reset.

Verification:
- `npm test -- --run src/__tests__/portal-preventivi-risposta.atdd.spec.ts` passes with all 8 AC tests green.

### Issue 3: Missing dedicated portal failure mapper would have produced inconsistent API errors
Status: RESOLVED

Problem:
- New portal endpoint needed explicit mapping for `RESPONSE_ALREADY_RECORDED`, `FORBIDDEN`, and `NOT_FOUND`; without this, failures risked surfacing as generic `500` or inconsistent error codes.

Fix applied:
- Added `respondPortalPreventivoRispostaFailure` in `packages/backend/src/routes/auth.ts:365` and wired new endpoint `POST /api/portal/preventivi/:id/risposta` at `packages/backend/src/routes/auth.ts:680`.
- Added portal orchestrator `registraRispostaPreventivoPortale` in `packages/backend/src/services/auth-service.ts:1050` with ownership check and code mapping.

Verification:
- Full suite passes, including AC-3 (`RESPONSE_ALREADY_RECORDED`) and AC-4 (`FORBIDDEN`) in new portal ATDD.

## Task Evidence Check

- Task 1 evidence: route exists in `packages/backend/src/routes/auth.ts:680`.
- Task 2 evidence: portal service orchestration exists in `packages/backend/src/services/auth-service.ts:1050`.
- Task 3 evidence: domain signal + mapping in `packages/backend/src/services/preventivi-service.ts:1310` and `packages/backend/src/routes/auth.ts:383`.
- Task 4 evidence: ATDD file with AC-1..AC-4 exists in `packages/backend/src/__tests__/portal-preventivi-risposta.atdd.spec.ts:125`.
- Task 5 evidence: regression alignment validated by passing `preventivi-response` tests and portal helper reuse patterns.

## Context Maintenance Check

- New directories created: none (no CLAUDE.md shard required).
- Root `CLAUDE.md` update required: no (no new commands/structure/dependencies introduced).
- `_bmad/bmm/config.yaml` path integrity: unchanged and valid.