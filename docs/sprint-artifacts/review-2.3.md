# Review Story 2.3

### Issue 1 - Inconsistent duplicate-email contract on cliente update
Status: RESOLVED

Problem:
- `PUT /api/clienti/:id` returned `VALIDATION_ERROR` for duplicate email while `POST /api/clienti` uses `EMAIL_ALREADY_EXISTS` with HTTP `409`.

Fix:
- Updated service update flow to return `DuplicateEmailFailure` (`EMAIL_ALREADY_EXISTS`) for both test-store and database paths.
- Added route mapping to return `409` with `buildErrorResponse("EMAIL_ALREADY_EXISTS", ...)`.

Evidence:
- `packages/backend/src/services/anagrafiche-service.ts:1466`
- `packages/backend/src/services/anagrafiche-service.ts:1615`
- `packages/backend/src/routes/clienti.ts:111`

Verification:
- `npm run typecheck` pass
- `npm test -- --run` pass

### Issue 2 - Fragile riparazioni DB path when migration is missing
Status: RESOLVED

Problem:
- The database implementation for `GET /api/clienti/:id/riparazioni` could fail hard when the `Riparazione` table is not yet migrated.

Fix:
- Implemented real Prisma query on `riparazione.findMany`.
- Added defensive fallback for Prisma `P2021` (missing table) returning an empty list instead of 500.

Evidence:
- `packages/backend/src/services/anagrafiche-service.ts:1672`
- `packages/backend/src/services/anagrafiche-service.ts:1702`

Verification:
- `npm run build` pass
- `npm test -- --run` pass

### Issue 3 - Brittle AC-1 assertion in ATDD test
Status: RESOLVED

Problem:
- ATDD test asserted a fixed `codiceCliente` literal, coupling the test to seed sequence internals and making it fragile to unrelated fixture changes.

Fix:
- Replaced fixed literal assert with regex-based contract (`CLI-\d{6}`) in AC-1 tests.

Evidence:
- `packages/backend/src/__tests__/clienti-detail-update-atdd.spec.ts:62`
- `packages/backend/src/__tests__/clienti-detail-update-atdd.spec.ts:76`

Verification:
- `npm --workspace @gestionale/backend test -- src/__tests__/clienti-detail-update-atdd.spec.ts` pass
- `npm test -- --run` pass