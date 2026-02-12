# Story 4.2 Research

## Patterns Found

- packages/backend/src/routes/preventivi.ts:25 e packages/backend/src/routes/preventivi.ts:61 usano funzioni dedicate di mapping errore (espond*Failure) con uildErrorResponse: pattern da replicare per PUT /api/preventivi/:id.
- packages/backend/src/routes/clienti.ts:203 mostra il pattern route PUT con payload esplicito e delega al service.
- packages/backend/src/services/preventivi-service.ts:155 centralizza il ricalcolo economico in computeTotals(...): da riusare senza duplicare formule.
- packages/backend/src/services/preventivi-service.ts:331 usa Prisma.(...) nel path DB: il replace delle voci deve restare atomico.
- packages/backend/src/services/preventivi-service.ts:356 e packages/backend/src/services/preventivi-service.ts:387 mostrano gestione voci relazionali (create + update successivo): utile per implementare replace completo delle voci in update.
- packages/backend/src/services/preventivi-service.ts:545 e packages/backend/src/services/preventivi-service.ts:583 definiscono seed/reset in-memory test store: va allineato agli scenari id=5 con stati diversi.

## Known Pitfalls

- Implementare update solo sul path Prisma o solo sul test-store rompe la parita tra test e runtime.
- Fare append delle voci invece di replace lascia dati stantii e totali incoerenti.
- Mancata guardia su stato !== BOZZA rende editabile preventivo inviato/approvato.
- Mapping errori non coerente (400/404/500) rompe il contratto API e gli ATDD.

## Stack/Libraries to Use

- Express Router (route PUT /:id nel modulo preventiviRouter).
- Prisma Client con transazione per update atomico preventivo + voci.
- Utility interna uildErrorResponse per payload errore uniforme.
- Test stack ATDD esistente in packages/backend/src/__tests__ (Jest/Supertest pattern già in uso).
