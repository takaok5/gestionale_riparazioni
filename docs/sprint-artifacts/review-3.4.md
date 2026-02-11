# Review Story 3.4

### Issue 1 - Potential false positive in AC follow-up tests
- Severity: Medium
- File: `packages/backend/src/__tests__/riparazioni-assegnazione-atdd.spec.ts`
- Problem: The second test of each AC validated only the final detail state and did not assert the PATCH response, so a failing PATCH could still leave partial false confidence.
- Fix applied: Added explicit assertions on `assignResponse.status` and key response fields in the second test of AC-1, AC-2, AC-3 and AC-4.
- Verification: `npm --workspace @gestionale/backend test -- --run src/__tests__/riparazioni-assegnazione-atdd.spec.ts` passes.
- Status: RESOLVED

### Issue 2 - Missing coverage for `USER_NOT_FOUND` branch
- Severity: Medium
- File: `packages/backend/src/__tests__/riparazioni-assegnazione-atdd.spec.ts`
- Problem: The endpoint implemented `USER_NOT_FOUND` mapping but there was no automated test covering assignment to a non-existing technician.
- Fix applied: Added review-hardening test asserting `404`, `USER_NOT_FOUND`, and `Utente non trovato` for `tecnicoId=999`.
- Verification: Targeted ATDD test file and full suite both pass.
- Status: RESOLVED

### Issue 3 - Missing coverage for invalid `tecnicoId` payload
- Severity: Medium
- File: `packages/backend/src/__tests__/riparazioni-assegnazione-atdd.spec.ts`
- Problem: There was no test proving validation behavior for malformed `tecnicoId` input.
- Fix applied: Added test with payload `{ tecnicoId: "abc" }` expecting `400 VALIDATION_ERROR` and `details.field = "tecnicoId"`.
- Verification: `npm test -- --run` passes with all backend tests green.
- Status: RESOLVED
