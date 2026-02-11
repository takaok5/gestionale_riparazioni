## Patterns Found

- `packages/backend/src/routes/riparazioni.ts:33` usa funzioni `respond*Failure` per mappare codici servizio a HTTP status e `buildErrorResponse(...)`.
- `packages/backend/src/routes/riparazioni.ts:130` costruisce payload dal `req` e delega validazione al service invece di validare in route.
- `packages/backend/src/middleware/auth.ts:106` applica `authorize(...roles)` e restituisce `403` con `buildErrorResponse("FORBIDDEN", "Accesso negato")`.
- `packages/backend/src/services/riparazioni-service.ts:221` usa `asPositiveInteger` per validare ID numerici positivi.
- `packages/backend/src/services/riparazioni-service.ts:334` usa `buildValidationFailure` per errori coerenti (`VALIDATION_ERROR`, details field/rule).
- `packages/backend/src/services/riparazioni-service.ts:1233` separa logica `NODE_ENV=test` (store in-memory) da runtime Prisma.

## Known Pitfalls

- Implementare solo il ramo Prisma o solo il ramo test-store rompe la coerenza tra test e runtime.
- Restituire messaggi errori non allineati ai pattern esistenti causa mismatch nei test API.
- Validare `tecnicoId` in route invece che nel service crea comportamento incoerente rispetto alle altre API riparazioni.
- Mancata protezione `authorize("ADMIN")` sull'endpoint produce regressione sicurezza su AC-4.

## Stack/Libraries to Use

- Express Router + middleware `authenticate`/`authorize` per endpoint PATCH.
- Utility `buildErrorResponse` per payload errori standardizzati.
- Service layer in TypeScript strict con helper `asPositiveInteger` e `buildValidationFailure`.
- Prisma client nel ramo runtime e test store in-memory nel ramo `NODE_ENV=test`.

## Validation Issues Found And Fixed

1. **Issue:** Story text was corrupted by escaped control sequences (`\r`, `\t`, `\a`) causing broken tokens (for example `riparazione` split) and non-reliable AC text.
   **Fix:** Rewrote full story file with literal markdown text and explicit values.
   **Verification:** Re-read file and confirmed all AC sections are readable and complete.

2. **Issue:** AC-1 and AC-3 had non-testable Then clauses (`payload di successo`) without concrete expected fields.
   **Fix:** Specified exact assertions on response payload (`data.id`, `data.tecnicoId`) and status code `200`.
   **Verification:** Each Then now maps directly to deterministic `expect(response.body.data...)` checks.

3. **Issue:** AC-4 used vague action input (`body JSON valido`) and did not define exact error message.
   **Fix:** Replaced with concrete body `{ "tecnicoId": 7 }` and exact expected error (`FORBIDDEN`, `Accesso negato`).
   **Verification:** AC-4 now defines a single clear action and fully testable expected output.
