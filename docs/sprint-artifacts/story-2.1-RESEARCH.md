# Story 2.1 Research

## Patterns Found

- packages/backend/src/routes/clienti.ts:30 usa il pattern route uthenticate + uthorize + delega al service + 201 su successo.
- packages/backend/src/routes/clienti.ts:15 centralizza il mapping errori con espondCreateClienteFailure e uildErrorResponse.
- packages/backend/src/services/anagrafiche-service.ts:359 valida campi richiesti e formato (cap, provincia) nel parser del payload.
- packages/backend/src/services/anagrafiche-service.ts:611 usa transazione Prisma per create + audit log.
- packages/backend/src/routes/users.ts:30 mostra il pattern per conflitti (409) con codici errore applicativi.

## Known Pitfalls

- packages/backend/src/routes/clienti.ts:30 richiede uthorize("ADMIN"), mentre la story richiede utente autenticato: possibile mismatch AC/autorizzazione.
- packages/backend/src/services/anagrafiche-service.ts:411 richiede codiceCliente in input: non compatibile con AC che richiede auto-generazione.
- packages/backend/src/services/anagrafiche-service.ts:659 gestisce conflitto P2002 solo su codiceCliente: rischio mancanza gestione duplicato email.
- packages/shared/src/validators/index.ts:1 contiene validatori fiscali presenti ma non chiaramente integrati nel flusso createCliente.

## Stack/Libraries to Use

- express router + middleware auth (uthenticate, uthorize) per endpoint API.
- @prisma/client per persistenza e vincoli univocita lato DB.
- packages/shared/src/validators/index.ts per validazione CF/P.IVA/CAP/provincia.
- uildErrorResponse in packages/backend/src/lib/errors.ts per payload errore coerenti.
