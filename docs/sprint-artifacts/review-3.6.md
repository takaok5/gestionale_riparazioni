# Review Story 3.6

### Issue 1 - Preventivo transitions missing in service matrix
Status: RESOLVED
Severity: HIGH
Evidence: `packages/backend/src/__tests__/riparazioni-stato-preventivo-atdd.spec.ts` failed 14 tests in RED/GREEN transition with `expected 200 to be 400`.
Fix:
- Updated `BASE_ALLOWED_TRANSITIONS` in `packages/backend/src/services/riparazioni-service.ts` to include:
  - `IN_DIAGNOSI -> PREVENTIVO_EMESSO`
  - `PREVENTIVO_EMESSO -> IN_ATTESA_APPROVAZIONE`
  - `IN_ATTESA_APPROVAZIONE -> APPROVATA | ANNULLATA`
  - `APPROVATA -> IN_ATTESA_RICAMBI | IN_LAVORAZIONE`
  - `IN_ATTESA_RICAMBI -> IN_LAVORAZIONE`
Verification:
- `npm test -- --run src/__tests__/riparazioni-stato-preventivo-atdd.spec.ts` passes (16/16).

### Issue 2 - RED gate could miss new tests when file is untracked
Status: RESOLVED
Severity: MEDIUM
Evidence:
- `git diff --name-only --diff-filter=A` does not include untracked files, causing empty `NEW_TESTS` and invalid gate behavior.
Fix:
- Saved explicit test list in `docs/sprint-artifacts/atdd-tests-3.6.txt` using untracked-file fallback (`git ls-files --others --exclude-standard`) before RED gate execution.
Verification:
- `docs/sprint-artifacts/atdd-tests-3.6.txt` contains `packages/backend/src/__tests__/riparazioni-stato-preventivo-atdd.spec.ts`.
- GREEN gate re-used this file and executed ATDD suite successfully.

### Issue 3 - Bash gate environment missing Node runtime on PATH
Status: RESOLVED
Severity: MEDIUM
Evidence:
- Initial bash gate attempt failed with `/mnt/c/Users/FAT-E/AppData/Roaming/npm/npm: 15: exec: node: not found`.
Fix:
- Exported Node path in bash gate context: `export PATH=\"/mnt/c/nvm4w/nodejs:$PATH\"`.
Verification:
- RED and GREEN gates executed npm commands successfully from bash after PATH fix.
