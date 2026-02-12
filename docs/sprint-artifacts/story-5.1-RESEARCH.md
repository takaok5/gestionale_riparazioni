# Story 5.1 Research

## Patterns Found

- `packages/backend/src/routes/fornitori.ts:232` usa `authenticate` + `authorize("ADMIN")` per endpoint POST amministrativi.
- `packages/backend/src/routes/fornitori.ts:66` mappa errore dominio duplicato a HTTP 409 con `buildErrorResponse`.
- `packages/backend/src/middleware/auth.ts:113` standardizza il 403 con payload `FORBIDDEN` e messaggio `Accesso negato`.
- `packages/backend/src/services/anagrafiche-service.ts:698` centralizza errori di validazione con `buildValidationFailure`.
- `packages/backend/src/__tests__/fornitori-create-atdd.spec.ts:45` mostra pattern test ATDD con `supertest`, token JWT e assert su status/error code.

## Known Pitfalls

- Divergenza tra path `test-store` e path `database` nei service: una validazione implementata solo in un path rompe la coerenza ATDD/runtime.
- Gestione duplicati non atomica senza vincolo univoco DB su `codiceArticolo` puo generare race condition.
- Mancata gestione esplicita di `fornitoreId` inesistente rischia 500 generici invece di 404 di dominio.

## Stack/Libraries to Use

- Express router + middleware auth esistenti (`authenticate`, `authorize`).
- Prisma per modello `Articolo`, vincoli e persistenza.
- Vitest + Supertest per test ATDD endpoint `/api/articoli`.
