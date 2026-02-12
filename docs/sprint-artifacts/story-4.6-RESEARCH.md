# Story 4.6 Research

## Patterns Found

- Mapping errori centralizzato route-level con helper dedicato: `packages/backend/src/routes/fatture.ts:14` (`respondCreateFatturaFailure`) + `buildErrorResponse` (`packages/backend/src/routes/fatture.ts:2`).
- Guard di autorizzazione ruolo prima della business logic: `packages/backend/src/routes/fatture.ts:77-84` (richiesto `COMMERCIALE`).
- Parsing input riusabile e typed prima del service flow: `packages/backend/src/services/fatture-service.ts:100` (`parseCreateFatturaInput`) con validazione numerica in `asPositiveInteger` (`packages/backend/src/services/fatture-service.ts:74`).
- Test-store in memoria per scenari ATDD backend: `packages/backend/src/services/fatture-service.ts:153` (`createFatturaInTestStore`) e helper di conteggio utile per assert di invarianza (`packages/backend/src/services/fatture-service.ts:259`).
- Struttura test ATDD orientata agli AC con `request(app)` e `describe` per AC: `packages/backend/src/__tests__/fatture-create-atdd.spec.ts:114`.

## Known Pitfalls

- Rischio overpayment con pagamenti parziali: serve controllo su somma pagata + nuovo importo prima della persistenza.
- Rischio mismatch formato risposta tra endpoint nuovi e pattern esistente (`{ data }` / `{ error: { ... } }`): mantenere coerenza per evitare regressioni frontend.
- Rischio race condition su registrazioni concorrenti del pagamento (in memoria o DB): la validazione importi deve essere atomica.

## Stack/Libraries to Use

- `Express Router` + middleware `authenticate` per endpoint `POST /api/fatture/:id/pagamenti` e `GET /api/fatture/:id`.
- `Supertest` + `Vitest` per test ATDD backend.
- Helper errori condiviso `buildErrorResponse` (`packages/backend/src/lib/errors.ts`) per uniformita' dei payload di errore.
