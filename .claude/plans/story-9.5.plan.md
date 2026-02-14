---
story_id: "9.5"
created: "2026-02-14T02:06:00Z"
depends_on: []
files_modified:
  - packages/backend/src/routes/richieste.ts
  - packages/backend/src/services/anagrafiche-service.ts
  - packages/backend/src/index.ts
  - packages/backend/src/__tests__/richieste-backoffice-api.atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 9.5

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| `packages/backend/src/services/anagrafiche-service.ts` | Add lead listing, stato transition, assignment use-cases and audit details mapping for `RichiestaPubblica`. | Existing in-memory lead store and audit helpers |
| `packages/backend/src/routes/richieste.ts` | Create backoffice router with `GET /`, `PATCH /:id/stato`, `PATCH /:id/assegna` and error mapping. | New/updated service-layer functions |
| `packages/backend/src/index.ts` | Mount `richiesteRouter` under `/api/richieste`. | `routes/richieste.ts` export |
| `packages/backend/src/__tests__/richieste-backoffice-api.atdd.spec.ts` | Adapt RED tests to GREEN assertions once endpoints are implemented. | Router + service behavior |

## Implementation order

1. Extend `packages/backend/src/services/anagrafiche-service.ts` with typed inputs/results for list, stato transition, assignment and audit details (foundation for routes).
2. Implement `packages/backend/src/routes/richieste.ts` using `authenticate` and `authorize("COMMERCIALE", "ADMIN")` for list/state/assignment endpoints.
3. Register router in `packages/backend/src/index.ts` with `app.use("/api/richieste", richiesteRouter)` and verify route availability.
4. Run and adjust `packages/backend/src/__tests__/richieste-backoffice-api.atdd.spec.ts` until all AC assertions pass.
5. Re-run workspace tests and fix regressions in touched backend modules before review/commit steps.

## Patterns to follow

- From `docs/sprint-artifacts/story-9.5-RESEARCH.md`: thin route/controller pattern from `packages/backend/src/routes/public.ts:283`.
- Follow PATCH transition/assignment pattern from `packages/backend/src/routes/riparazioni.ts:463` and `packages/backend/src/routes/riparazioni.ts:483`.
- Reuse auth/error pattern from `packages/backend/src/middleware/auth.ts:125` and `packages/backend/src/middleware/auth.ts:131`.
- Align pagination contract with tested shape from `packages/backend/src/__tests__/audit-trail.spec.ts:252` and `packages/backend/src/__tests__/audit-trail.spec.ts:259`.

## Risks

- Lead data is currently centered on public creation flow; introducing backoffice transitions can break assumptions in existing fixtures.
- Audit contract for `RichiestaPubblica` may diverge from AC if details payload is not structured with `dettagli.old/new`.
- Role matrix mistakes could return `401/404` instead of mandated `403 FORBIDDEN` for `TECNICO`.
