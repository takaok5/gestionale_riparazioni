---
story_id: '8.6'
created: '2026-02-13'
depends_on: []
files_modified:
  - packages/backend/src/services/auth-service.ts
  - packages/backend/src/routes/auth.ts
  - packages/backend/src/services/preventivi-service.ts
  - packages/backend/src/__tests__/portal-preventivi-risposta.atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 8.6

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/backend/src/services/auth-service.ts | Add portal use-case to record preventivo response with token-to-cliente ownership enforcement | packages/backend/src/services/preventivi-service.ts |
| packages/backend/src/routes/auth.ts | Add POST /api/portal/preventivi/:id/risposta and failure mapping (401/400/403/404/500) | packages/backend/src/services/auth-service.ts |
| packages/backend/src/services/preventivi-service.ts | Expose deterministic error signal for duplicate response (RESPONSE_ALREADY_RECORDED) while preserving existing transition rules | - |
| packages/backend/src/__tests__/portal-preventivi-risposta.atdd.spec.ts | Keep AC-aligned assertions for 200/400/403 contracts and remove any setup drift during GREEN phase | outes/auth.ts, services/auth-service.ts |

## Implementation order

1. Update packages/backend/src/services/preventivi-service.ts result typing and mapping for duplicate-response signal so portal can surface RESPONSE_ALREADY_RECORDED deterministically.
2. Implement portal response orchestration in packages/backend/src/services/auth-service.ts (token validation, preventivo ownership check through riparazione detail, call preventivi response use-case).
3. Add route and response mapper in packages/backend/src/routes/auth.ts for POST /api/portal/preventivi/:id/risposta, aligned with existing portal guard/failure style.
4. Re-run and refine packages/backend/src/__tests__/portal-preventivi-risposta.atdd.spec.ts until all AC expectations pass with real behavior.

## Patterns to follow

- From docs/sprint-artifacts/story-8.6-RESEARCH.md: reuse portal handler structure from packages/backend/src/routes/auth.ts:604 (Bearer extraction, service call, centralized failure response).
- From docs/sprint-artifacts/story-8.6-RESEARCH.md: reuse ownership guard style from packages/backend/src/services/auth-service.ts:975 (clienteId derived from portal access token).
- From docs/sprint-artifacts/story-8.6-RESEARCH.md: preserve preventivo transition logic from packages/backend/src/services/preventivi-service.ts:1290 and :1335.

## Risks

- Error-code regression between legacy /api/preventivi/:id/risposta and new portal endpoint if domain/result mapping diverges.
- Ownership check race or missing branch could leak cross-customer quote updates.
- Test determinism can degrade if shared in-memory stores are not fully reset in each case.