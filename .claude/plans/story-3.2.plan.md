---
story_id: '3.2'
created: '2026-02-11T18:20:37+01:00'
depends_on:
  - story 3.1
files_modified:
  - packages/backend/src/routes/riparazioni.ts
  - packages/backend/src/services/riparazioni-service.ts
  - packages/backend/prisma/schema.prisma
  - packages/backend/src/__tests__/riparazioni-list-filter-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 3.2

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/backend/prisma/schema.prisma | Add 	ecnicoId field and relation/index needed for list filter by tecnico. | none |
| packages/backend/src/services/riparazioni-service.ts | Add list/filter/search/pagination input parsing, validation, test-store + database list implementation, response meta. | schema.prisma |
| packages/backend/src/routes/riparazioni.ts | Add GET /api/riparazioni with query payload mapping and failure responder. | riparazioni-service.ts |
| packages/backend/src/__tests__/riparazioni-list-filter-atdd.spec.ts | Keep RED tests as target contract and ensure GREEN pass. | routes + service |

## Implementation order

1. Update packages/backend/prisma/schema.prisma for 	ecnicoId support and relation/index consistency required by AC-3.
2. Extend packages/backend/src/services/riparazioni-service.ts with list input types/parsers (page, limit, stato, 	ecnicoId, priorita, dataRicezioneDa, dataRicezioneA, search) and structured validation errors.
3. Implement list behavior in service for both test store and database paths with filters, case-insensitive search, deterministic ordering, and { data, meta } pagination.
4. Add route handler in packages/backend/src/routes/riparazioni.ts for GET /api/riparazioni using existing error-mapping patterns.
5. Run ATDD target packages/backend/src/__tests__/riparazioni-list-filter-atdd.spec.ts, then run workspace tests and adjust implementation until GREEN.
6. Final verification: rerun typecheck/lint/tests and validate no regressions in existing riparazioni create tests.

## Patterns to follow

- Query payload mapping in routes from existing list endpoints:
  - packages/backend/src/routes/clienti.ts:172
  - packages/backend/src/routes/fornitori.ts:210
- List parser defaults/validation and error detail structure (ield, ule):
  - packages/backend/src/services/anagrafiche-service.ts:1243
  - packages/backend/src/services/anagrafiche-service.ts:1308
- Test-store filtering/search/pagination implementation pattern:
  - packages/backend/src/services/anagrafiche-service.ts:2718
- Database list pattern (where, skip/take, count, 	otalPages):
  - packages/backend/src/services/anagrafiche-service.ts:2810
- Sad-path list test for limit too high:
  - packages/backend/src/__tests__/fornitori-list-search-atdd.spec.ts:224

## Risks

- 	ecnicoId is not currently present in Riparazione; schema change can impact future stories if relation semantics are wrong.
- Date-range filtering must be aligned between in-memory test store (ISO strings) and Prisma DateTime comparisons.
- Search scope must match AC exactly (modelloDispositivo, marcaDispositivo, codiceRiparazione) to avoid false positives.
- Existing tests for story 3.1 must remain green after service/schema changes.

## Approval Notes

- EnterPlanMode/ExitPlanMode tools are not available in this environment; this file is used as explicit implementation plan artifact for step 6 gate.