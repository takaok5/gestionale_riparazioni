# Review 3.2

- Story: 3.2
- Reviewed: 2026-02-11T18:30:36+01:00

### Issue 1 - stato filter accepted arbitrary strings
Status: RESOLVED

Problem:
- 
ormalizeStatoFilter accepted any non-empty string, so invalid values like stato=FOO were treated as valid filters.

Fix:
- Added strict allowed-state set (ALLOWED_STATI) and changed parser to reject unknown values with VALIDATION_ERROR and ule: invalid_enum.

Verification:
- packages/backend/src/services/riparazioni-service.ts now validates states through ALLOWED_STATI.
- 
pm test -w packages/backend passes.

### Issue 2 - Possible FK failure when assigning 	ecnicoId in DB create path
Status: RESOLVED

Problem:
- Create flow wrote 	ecnicoId = actorUserId directly; if the actor user was missing in DB, Prisma could fail with FK error and return 500.

Fix:
- Added actor existence lookup in transaction and persisted 	ecnicoId only when actor exists (
ull otherwise).
- CreatedRiparazionePayload.tecnicoId updated to 
umber | null.

Verification:
- packages/backend/src/services/riparazioni-service.ts transaction now checks 	x.user.findUnique before create.
- Root 
pm run typecheck and 
pm test -- --run pass.

### Issue 3 - AC-2 tests were weak (no real mixed-state dataset)
Status: RESOLVED

Problem:
- AC-2 tests asserted stato=IN_LAVORAZIONE filtering without explicitly creating records in mixed states, risking vacuous pass.

Fix:
- Added test helper setRiparazioneStatoForTests in riparazioni service.
- Updated AC-2 tests to set one record IN_LAVORAZIONE and another RICEVUTA before filtering.

Verification:
- packages/backend/src/__tests__/riparazioni-list-filter-atdd.spec.ts now seeds explicit mixed states for AC-2.
- Targeted and full backend suites pass.

### Issue 4 - ATDD test list path incompatible with workspace test runner
Status: RESOLVED

Problem:
- docs/sprint-artifacts/atdd-tests-3.2.txt originally contained root-relative backend path, causing workspace-runner filtering failures.

Fix:
- Updated ATDD list to backend-workspace path: src/__tests__/riparazioni-list-filter-atdd.spec.ts.

Verification:
- Step 7 GREEN gate re-run succeeded including ATDD replay.

## Context Maintenance Checks

- CLAUDE.md shards: no new significant directories created by this story; no shard update required.
- Root CLAUDE.md: no new commands/dependencies/structure introduced; no update required.
- _bmad/bmm/config.yaml: checked, prdFile and rchitectureFile paths exist.