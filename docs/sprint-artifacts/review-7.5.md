### Issue 1: Missing 404 regression coverage for `/api/riparazioni/:id/ricevuta`
Status: RESOLVED

Problem:
`RIPARAZIONE_NOT_FOUND` mapping in route/service was implemented but not protected by dedicated tests, risking silent regressions on domain error contract.

Fix:
Added two hardening tests for not-found path in `packages/backend/src/__tests__/riparazioni-ricevuta-atdd.spec.ts`:
- 404 with `error.code="RIPARAZIONE_NOT_FOUND"` and message
- no `data` payload on 404 response

Verification:
Targeted and full test suites pass with the new checks.

### Issue 2: Deterministic test PDF structure diverged from runtime section model
Status: RESOLVED

Problem:
The test-mode PDF buffer lacked explicit section headers (`Dati cliente`, `Dispositivo`, `Descrizione problema`) present in runtime rendering, making AC section assertions weaker and reducing parity between test/runtime behavior.

Fix:
Aligned test-mode content generation in `packages/backend/src/services/riparazioni-ricevuta-pdf.ts` to include explicit section headers.
Extended AC-1 assertions in `packages/backend/src/__tests__/riparazioni-ricevuta-atdd.spec.ts` to verify those sections.

Verification:
`riparazioni-ricevuta-atdd.spec.ts` passes and validates section presence explicitly.

### Issue 3: Accessory normalization could leak malformed tokens
Status: RESOLVED

Problem:
Accessory splitting only trimmed ends; internal repeated whitespace (e.g. `"custodia   premium"`) was not normalized, potentially producing inconsistent output rows.

Fix:
Hardened parser in `packages/backend/src/services/riparazioni-service.ts`:
- normalize internal whitespace via `replace(/\s+/g, " ")`
- keep comma split + empty-token filtering

Verification:
ATDD checks for accessory row rendering continue to pass and parser behavior is stricter for malformed input.
