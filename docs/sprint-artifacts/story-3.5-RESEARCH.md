## Patterns Found

- `packages/backend/src/routes/riparazioni.ts:138` usa mapper dedicato degli errori service -> HTTP con `buildErrorResponse`; il nuovo endpoint stato deve seguire la stessa struttura.
- `packages/backend/src/routes/riparazioni.ts:216` mostra il pattern PATCH con `authenticate`, payload da `req.params`/`req.body`, chiamata service e risposta `{ data: ... }`.
- `packages/backend/src/services/riparazioni-service.ts:621` centralizza la validazione input in parser `parse*`; anche il cambio stato deve validare prima della business logic.
- `packages/backend/src/services/riparazioni-service.ts:1283` e `packages/backend/src/services/riparazioni-service.ts:1322` mantengono due percorsi simmetrici (`NODE_ENV=test` vs Prisma transaction).
- `packages/backend/src/services/riparazioni-service.ts:1466` aggiorna lo stato in test-store e aggiunge entry cronologica in `statiHistory`; utile come baseline per AC storico.
- `packages/backend/src/__tests__/riparazioni-assegnazione-atdd.spec.ts:93` adotta naming Given/When/Then con assert su status HTTP e campi payload.
- `packages/backend/src/__tests__/riparazioni-detail-atdd.spec.ts:119` verifica struttura e contenuto di `statiHistory`, incluso `dataOra` ISO.
- `packages/backend/prisma/schema.prisma:139` definisce `RiparazioneStatoHistory` con `riparazioneId`, `stato`, `dataOra`, `userId`, `note`.

## Known Pitfalls

- Divergenza tra test-store e Prisma: se le regole transizioni o storico non sono allineate, i test possono passare in test env ma fallire in produzione.
- Autorizzazione incompleta: limitarsi al ruolo non basta, per AC-6 serve controllo su tecnico assegnato (con eccezione admin).
- Messaggi errore non coerenti: AC-5 richiede testo esatto `"Invalid state transition from RICEVUTA to COMPLETATA"`.
- Aggiornare solo `riparazione.stato` senza inserire `RiparazioneStatoHistory` rompe tracciabilita' e AC-1.

## Stack/Libraries to Use

- Express Router + middleware auth (`authenticate`, `authorize`) in `packages/backend/src/routes`.
- Service layer TypeScript con parser/validator custom in `packages/backend/src/services/riparazioni-service.ts`.
- Prisma transaction API per persistenza atomica su `riparazione` + `riparazioneStatoHistory`.
- Vitest + Supertest per test ATDD HTTP end-to-end in `packages/backend/src/__tests__`.
