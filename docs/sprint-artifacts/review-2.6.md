# Review Story 2.6

Date: 2026-02-11
Reviewer: Codex (pipeline step 8)

### Issue 1 - AC-3 database path returned a stubbed empty list
Status: RESOLVED

Problem:
- `listFornitoreOrdiniInDatabase` returned `data: []` unconditionally after existence check, so AC-3 could never be satisfied in DB mode.

Fix applied:
- Implemented real Prisma query on `ordineFornitore` with ordering and projection mapping.
- File: `packages/backend/src/services/anagrafiche-service.ts`

Verification:
- Backend typecheck and tests pass after change.

### Issue 2 - Missing resilience when order table is not migrated
Status: RESOLVED

Problem:
- Querying a newly introduced model can throw `P2021` in environments not yet migrated, causing 500 instead of controlled behavior.

Fix applied:
- Added explicit `PrismaClientKnownRequestError` handling for `P2021` and returned deterministic empty data.
- File: `packages/backend/src/services/anagrafiche-service.ts`

Verification:
- Full test suite remains green; no runtime regression in test mode.

### Issue 3 - Test seed scenario used duplicate partita IVA
Status: RESOLVED

Problem:
- The seeded supplier for story 2.6 reused a partita IVA already present in baseline fixtures, increasing risk of non-deterministic uniqueness side effects.

Fix applied:
- Updated scenario fixture with unique partita IVA (`33333333334`).
- Files: `packages/backend/src/services/anagrafiche-service.ts`, `docs/stories/2.6.dettaglio-modifica-fornitore.story.md`

Verification:
- Story-specific ATDD tests and audit tests pass.

### Issue 4 - ATDD list path was not reusable in workspace-level command
Status: RESOLVED

Problem:
- `atdd-tests-2.6.txt` contained a root-relative path that caused false negatives in the workspace test command.

Fix applied:
- Normalized the entry to backend-workspace relative path: `src/__tests__/fornitori-detail-update-atdd.spec.ts`.
- File: `docs/sprint-artifacts/atdd-tests-2.6.txt`

Verification:
- ATDD gate command (`npm test -- --run <tests-from-file>`) now passes.
