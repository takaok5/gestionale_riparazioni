# Review 6.2

### Issue 1: Response contract was under-constrained in ATDD
- Status: RESOLVED
- Problem: AC-1 tests checked only key presence and could miss extra/invalid payload fields.
- Fix: Added exact key-set assertion in packages/backend/src/__tests__/dashboard-riparazioni-per-stato-atdd.spec.ts.
- Verification: 
pm test -- --run passes with strict payload-key validation.

### Issue 2: Missing invalid-period test coverage
- Status: RESOLVED
- Problem: No coverage for unsupported periodo values, risking silent contract drift.
- Fix: Added test periodo=year expecting 400 VALIDATION_ERROR and explicit allowed-values hint.
- Verification: New test passes in packages/backend/src/__tests__/dashboard-riparazioni-per-stato-atdd.spec.ts.

### Issue 3: Validation error message for unsupported period was ambiguous
- Status: RESOLVED
- Problem: Service message did not indicate supported values (	oday|week|month).
- Fix: Updated validation message in packages/backend/src/services/dashboard-service.ts.
- Verification: Error-path test asserts message contains 	oday|week|month and passes.