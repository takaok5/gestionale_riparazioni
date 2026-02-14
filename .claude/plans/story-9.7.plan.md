---
story_id: '9.7'
created: '2026-02-14T04:12:36.5740630+01:00'
depends_on: []
files_modified:
  - packages/backend/src/routes/richieste.ts
  - packages/backend/src/services/anagrafiche-service.ts
  - packages/backend/src/services/riparazioni-service.ts
  - packages/backend/src/__tests__/richieste-conversione-api.atdd.spec.ts
  - docs/stories/9.7.conversione-lead-in-cliente-pratica.story.md
  - docs/sprint-artifacts/story-9.7-VALIDATION.md
must_pass: [typecheck, lint, test]
---

# Plan Story 9.7

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| `packages/backend/src/services/anagrafiche-service.ts` | Add conversion use-case for public richiesta: load by id, guard already converted, resolve/create cliente by email/telefono rule, update stato/audit, trigger riparazione draft creation | Existing richiesta and cliente helpers |
| `packages/backend/src/routes/richieste.ts` | Expose `POST /api/richieste/:id/converti` with `authenticate` + `authorize("COMMERCIALE","ADMIN")`, map validation/not-found/conflict/service failures to HTTP contract | New service function in anagrafiche-service |
| `packages/backend/src/services/riparazioni-service.ts` | Reuse/create helper for deterministic conversion draft payload (fallback required fields + `priorita=NORMALE`) if needed by anagrafiche conversion flow | Existing `createRiparazione` validation contract |
| `packages/backend/src/__tests__/richieste-conversione-api.atdd.spec.ts` | Update RED tests as needed to align with final endpoint payload once implementation exists | Route + service implementation |

## Implementation order

1. Define service-level conversion contract in `packages/backend/src/services/anagrafiche-service.ts` (input/result types + failure codes + orchestration skeleton).
2. Implement domain logic in `packages/backend/src/services/anagrafiche-service.ts`: richiesta lookup, idempotency guard (`REQUEST_ALREADY_CONVERTED`), customer reuse/create, stato transition to `CONVERTITA`, audit append, and riparazione draft creation call.
3. Add route handler in `packages/backend/src/routes/richieste.ts` for `POST /:id/converti` using existing auth/authorization/error-response patterns.
4. Implement/adjust riparazione draft payload defaults where needed (`packages/backend/src/services/riparazioni-service.ts` or conversion mapper in anagrafiche-service) so mandatory create fields are always non-empty and deterministic.
5. Execute GREEN loop on `packages/backend/src/__tests__/richieste-conversione-api.atdd.spec.ts` until all AC tests pass; keep existing suite green.
6. Re-run full workspace tests and update sprint artifacts/state for steps 7-10 gates.

## Patterns to follow

- From `docs/sprint-artifacts/story-9.7-RESEARCH.md`: route style in `packages/backend/src/routes/richieste.ts:132` (thin handler + role guard + service delegation).
- From `docs/sprint-artifacts/story-9.7-RESEARCH.md`: error mapping via `buildErrorResponse` in `packages/backend/src/routes/richieste.ts:60`.
- From `docs/sprint-artifacts/story-9.7-RESEARCH.md`: richiesta stato/audit mutation pattern in `packages/backend/src/services/anagrafiche-service.ts:6186` and `packages/backend/src/services/anagrafiche-service.ts:6223`.
- From `docs/sprint-artifacts/story-9.7-RESEARCH.md`: strict required payload contract for riparazioni in `packages/backend/src/services/riparazioni-service.ts:509`.

## Risks

- Lead schema currently lacks phone; AC-2 phone matching path must remain conditional to avoid impossible branch in test store.
- Introducing `CONVERTITA` transition may break existing stato guard behavior if not backward compatible.
- Riparazione draft defaults can leak low-quality placeholder data if not centralized and documented.
- Double-conversion race condition may still produce duplicates without atomic guard in conversion flow.
