---
story_id: '2.2'
created: '2026-02-10'
depends_on: ['2.1']
files_modified:
  - packages/backend/src/routes/clienti.ts
  - packages/backend/src/services/anagrafiche-service.ts
  - packages/backend/src/index.ts
  - packages/backend/src/__tests__/clienti-list-search-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 2.2

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/backend/src/services/anagrafiche-service.ts | Add list/search parser and service for clienti with pagination/filtering and `{ data, meta }` output for both test store and DB | Existing create/list-audit utilities |
| packages/backend/src/routes/clienti.ts | Add `GET /` handler, parse query params, map validation/service errors to HTTP responses | New service APIs in anagrafiche-service |
| packages/backend/src/index.ts | Ensure clienti router remains mounted at `/api/clienti` and reflects updated route surface | clienti route changes |
| packages/backend/src/__tests__/clienti-list-search-atdd.spec.ts | Keep RED tests, then make them GREEN by aligning with actual contract and assertions | Route + service implementation |

## Implementation order

1. Extend `packages/backend/src/services/anagrafiche-service.ts` with list clienti contracts, input parser (`page`, `limit`, `search`, `tipologia`), and implementations for test store + Prisma store returning `{ data, meta }`.
2. Update `packages/backend/src/routes/clienti.ts` to expose `GET /api/clienti`, delegate to new service function, and map validation failures to `400 VALIDATION_ERROR`.
3. Verify router wiring in `packages/backend/src/index.ts` and adjust only if needed to keep endpoint exposed through `/api/clienti`.
4. Run and fix `packages/backend/src/__tests__/clienti-list-search-atdd.spec.ts` until all AC tests pass while preserving existing suite behavior.
5. Re-run workspace tests and capture output in sprint artifacts for pipeline traceability.

## Patterns to follow

- Route query parsing + service delegation from `packages/backend/src/routes/audit-log.ts:37`.
- Input parsing and validation function shape from `packages/backend/src/services/anagrafiche-service.ts:632`.
- DB pagination with `count + findMany + skip/take` from `packages/backend/src/services/anagrafiche-service.ts:1012`.
- Pagination assertions in tests from `packages/backend/src/__tests__/audit-trail.spec.ts:132`.
- RESEARCH baseline: `docs/sprint-artifacts/story-2.2-RESEARCH.md`.

## Risks

- Response envelope mismatch (`results/pagination` vs `data/meta`) can break existing expectations if not isolated to clienti endpoint.
- Search matching may become inconsistent between test store and Prisma store if normalization differs.
- Tipologia validation contract (`invalid_enum`) must align between parser, route mapping, and tests.
