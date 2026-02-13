# Review Story 8.7

### Issue 1 - Flaky PDF body assertion in ATDD
Status: RESOLVED

Problem:
- `packages/backend/src/__tests__/portal-documenti-download.atdd.spec.ts` checked `response.text.startsWith("%PDF-")` for binary responses.
- In `supertest`, binary payloads are not guaranteed to populate `response.text`, causing false negatives.

Fix:
- Replaced body-text checks with deterministic `Content-Length > 0` assertions for successful PDF downloads.
- Evidence: `packages/backend/src/__tests__/portal-documenti-download.atdd.spec.ts:210` and `packages/backend/src/__tests__/portal-documenti-download.atdd.spec.ts:243`.

Verification:
- `npm test -- --run src/__tests__/portal-documenti-download.atdd.spec.ts` passes.

### Issue 2 - Missing contract coverage for invalid document id
Status: RESOLVED

Problem:
- The suite did not verify API behavior for malformed IDs (`/documenti/fattura/not-a-number/pdf`).
- This left `VALIDATION_ERROR` mapping unprotected against regressions.

Fix:
- Added hardening test asserting `400` + `error.code="VALIDATION_ERROR"`.
- Evidence: `packages/backend/src/__tests__/portal-documenti-download.atdd.spec.ts:302`.

Verification:
- New hardening test passes in targeted suite.

### Issue 3 - Missing forbidden coverage for preventivo cross-customer download
Status: RESOLVED

Problem:
- AC-3 covered forbidden access on fattura, but preventivo download lacked explicit cross-customer `403` test.
- Security regression risk: one endpoint protected, the other potentially not.

Fix:
- Added hardening test for preventivo ownership mismatch expecting `403 FORBIDDEN` and non-PDF response.
- Evidence: `packages/backend/src/__tests__/portal-documenti-download.atdd.spec.ts:314`.

Verification:
- Test passes and confirms no PDF content-type on forbidden responses.

### Issue 4 - Duplicated ownership-check logic in portal document service functions
Status: RESOLVED

Problem:
- `getPortalFatturaPdf` and `getPortalPreventivoPdf` duplicated the same riparazione ownership flow and failure mapping.
- Duplication increased drift risk between endpoints.

Fix:
- Introduced shared helper `ensurePortalOwnsRiparazione` and reused it in both functions.
- Evidence: `packages/backend/src/services/auth-service.ts:938`, `packages/backend/src/services/auth-service.ts:1107`, `packages/backend/src/services/auth-service.ts:1152`.

Verification:
- Targeted ATDD passes, and full gate (`typecheck`, `lint`, `build`, ATDD, full tests) passes.