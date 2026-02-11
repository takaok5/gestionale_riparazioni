## Patterns Found

- `packages/backend/src/routes/clienti.ts:234` usa pattern endpoint `POST` autenticato con payload esplicito + risposta `201`.
- `packages/backend/src/routes/clienti.ts:37` mappa `VALIDATION_ERROR` a `400` con `buildErrorResponse` e dettagli strutturati.
- `packages/backend/src/routes/clienti.ts:95` mappa `NOT_FOUND` a errore dominio (`CLIENTE_NOT_FOUND`) con `404`.
- `packages/backend/src/services/anagrafiche-service.ts:854` implementa parser input con `buildValidationFailure` per campi obbligatori.
- `packages/backend/src/services/anagrafiche-service.ts:1661` mostra create transazionale con generazione codice progressivo e audit log nello stesso `$transaction`.
- `packages/backend/src/index.ts:21` registra i router API in maniera esplicita (`app.use("/api/...", router)`).
- `packages/backend/src/__tests__/clienti-create-atdd.spec.ts:27` definisce pattern ATDD per creazione (`request(app).post(...)`, assert su status, body, error codes).

## Known Pitfalls

- `Riparazione` in `packages/backend/prisma/schema.prisma:109` non ha ancora tutti i campi richiesti dagli AC (marca/modello/seriale/descrizione/accessori/priorita).
- La generazione `RIP-YYYYMMDD-####` non esiste: implementazione non transazionale rischia collisioni in richieste concorrenti.
- Gli errori di dominio devono restare coerenti con envelope standard (`{ error: { code, message, details } }`): mismatch su codice/messaggio rompe test ATDD.
- Gli attuali test usano store in-memory resettable (`resetAnagraficheStoreForTests`): la logica progressivo giornaliero va resa deterministica nei test.

## Stack/Libraries to Use

- `Express` router + middleware `authenticate` per endpoint backend.
- `Prisma` transaction (`$transaction`) per create e progressivo codice sicuro.
- Utility errori in `packages/backend/src/lib/errors.ts` per risposta standard.
- `Vitest` + `supertest` per casi ATDD su API (`201`, `400`, `404`).
