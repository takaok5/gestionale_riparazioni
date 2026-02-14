# Review Story 9.5

## Scope

Reviewed files changed for Story 9.5 implementation and ATDD integration.

### Issue 1
- **Title:** Backoffice richieste endpoints were disabled outside test environment.
- **Severity:** High
- **Location:** `packages/backend/src/services/anagrafiche-service.ts`
- **Status:** RESOLVED
- **Problem:** `listRichiesteBackoffice`, `cambiaStatoPublicRichiesta`, and `assegnaPublicRichiesta` returned `SERVICE_UNAVAILABLE` whenever `NODE_ENV !== "test"`, making `/api/richieste` unusable in non-test runtime.
- **Fix applied:** Removed the environment hard-stop in these three functions and aligned behavior with current in-memory public lead store used by `createPublicRichiesta`.
- **Verification:** `npm --workspace @gestionale/backend test -- --run src/__tests__/richieste-backoffice-api.atdd.spec.ts` passes.

### Issue 2
- **Title:** ATDD rerun list used a path that made workspace-targeted gate partially no-op.
- **Severity:** Medium
- **Location:** `docs/sprint-artifacts/atdd-tests-9.5.txt`
- **Status:** RESOLVED
- **Problem:** The file contained `packages/backend/src/__tests__/...`, which caused workspace test invocations to print `No test files found` in some contexts.
- **Fix applied:** Updated list entry to backend-workspace-relative path `src/__tests__/richieste-backoffice-api.atdd.spec.ts`.
- **Verification:** Story-specific test is resolved by backend workspace and passes.

### Issue 3
- **Title:** Commerciale self-assignment rule was not enforced on `/api/richieste/:id/assegna`.
- **Severity:** Medium
- **Location:** `packages/backend/src/routes/richieste.ts`, `packages/backend/src/services/anagrafiche-service.ts`, `packages/backend/src/__tests__/richieste-backoffice-api.atdd.spec.ts`
- **Status:** RESOLVED
- **Problem:** Route accepted arbitrary `commercialeId` without checking that a `COMMERCIALE` actor was assigning to self.
- **Fix applied:** Added route-level guard: if actor role is `COMMERCIALE`, `commercialeId` must match actor user id. Added fallback to actor id when payload omits `commercialeId`. Parser now accepts integer or string IDs and normalizes to string.
- **Verification:** AC-3 tests pass with `commercialeId=5001`; full backend+frontend+shared test suites pass.

## Post-fix Checks

- `npm run lint`: PASS
- `npm test -- --run`: PASS
- No `TODO`/`FIXME` introduced in modified code.
- No `console.log` introduced in modified code.