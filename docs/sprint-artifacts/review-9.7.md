# Review Story 9.7

### Issue 1
Status: RESOLVED
Finding: Conversion marked richiesta as `CONVERTITA` before riparazione draft creation; if riparazione creation failed, state became inconsistent and retry was blocked by 409.
Fix: Introduced deferred conversion state (`deferStateChange`) and explicit finalize step `finalizzaConversionePublicRichiesta` executed only after successful riparazione creation.
Evidence: `packages/backend/src/services/anagrafiche-service.ts:6449`, `packages/backend/src/services/anagrafiche-service.ts:6494`, `packages/backend/src/routes/richieste.ts:398`.

### Issue 2
Status: RESOLVED
Finding: Existing cliente lookup by email in DB path was case-sensitive, risking duplicate customer creation for mixed-case emails.
Fix: Switched DB lookup to normalized equality with case-insensitive matching.
Evidence: `packages/backend/src/services/anagrafiche-service.ts:6336`.

### Issue 3
Status: RESOLVED
Finding: Route conversion path relied on service validation for missing auth actor, producing 400 instead of explicit 401 in unexpected auth context.
Fix: Added early `UNAUTHORIZED` guard in route before conversion/riparazione orchestration.
Evidence: `packages/backend/src/routes/richieste.ts:347`.

## Post-Review Verification

- `npm run typecheck --workspace @gestionale/backend` PASS
- `npm run test --workspace @gestionale/backend -- --run src/__tests__/richieste-conversione-api.atdd.spec.ts src/__tests__/richieste-backoffice-api.atdd.spec.ts` PASS
