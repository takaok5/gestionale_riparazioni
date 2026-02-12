---
story_id: '5.1'
created: '2026-02-12'
depends_on: []
files_modified:
  - packages/backend/prisma/schema.prisma
  - packages/backend/src/services/anagrafiche-service.ts
  - packages/backend/src/routes/articoli.ts
  - packages/backend/src/index.ts
  - packages/backend/src/__tests__/articoli-create-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 5.1

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/backend/prisma/schema.prisma | Add Articolo model + relation to Fornitore + unique codiceArticolo | none |
| packages/backend/src/services/anagrafiche-service.ts | Add createArticolo input/result parsing, validation, test-store and db implementations | schema.prisma |
| packages/backend/src/routes/articoli.ts | Add POST /api/articoli with ADMIN guard and error mapping 400/403/404/409 | anagrafiche-service.ts, middleware/auth.ts |
| packages/backend/src/index.ts | Register articoliRouter at /api/articoli | routes/articoli.ts |
| packages/backend/src/__tests__/articoli-create-atdd.spec.ts | Keep RED tests, then drive GREEN implementation | routes+service |

## Implementation order

1. Extend `packages/backend/prisma/schema.prisma` with `Articolo` model (including `codiceArticolo @unique`, `giacenza`, relation on `fornitoreId`) and keep consistency with existing models.
2. Implement service logic in `packages/backend/src/services/anagrafiche-service.ts`: payload parsing, validation (`prezzoVendita > prezzoAcquisto`), duplicate detection, missing supplier handling, and response shape for create.
3. Add `packages/backend/src/routes/articoli.ts` following existing route patterns (`authenticate`, `authorize("ADMIN")`, `buildErrorResponse` mappings) and export router.
4. Wire new router in `packages/backend/src/index.ts` with `app.use("/api/articoli", articoliRouter)`.
5. Run `packages/backend/src/__tests__/articoli-create-atdd.spec.ts` and iterate until all AC tests pass without breaking existing suite.

## Patterns to follow

- From `docs/sprint-artifacts/story-5.1-RESEARCH.md`: route protections and 409 mapping from `packages/backend/src/routes/fornitori.ts:232` and `packages/backend/src/routes/fornitori.ts:66`.
- Use auth forbidden response contract from `packages/backend/src/middleware/auth.ts:113`.
- Reuse validation style from `packages/backend/src/services/anagrafiche-service.ts:698` (`buildValidationFailure`).
- Reuse ATDD structure from `packages/backend/src/__tests__/fornitori-create-atdd.spec.ts:45`.

## Risks

- Prisma schema change without aligned service paths (test-store and db) causes divergent behavior.
- Duplicate codice handling must be deterministic (409) and not leak internal DB errors.
- Missing supplier path must return domain 404 (`FORNITORE_NOT_FOUND`) rather than generic 500.
