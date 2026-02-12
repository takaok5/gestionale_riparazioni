## Patterns Found

- `packages/backend/src/routes/preventivi.ts:230` implementa endpoint action-style (`POST /:id/invia`) con `authenticate` e mapping errori tramite helper `respond*`, pattern da replicare per `PATCH /:id/risposta`.
- `packages/backend/src/services/preventivi-service.ts:1071` usa parse input dedicato + orchestrazione service (`inviaPreventivo`) con switch test-store/Prisma, da estendere con `registraRispostaPreventivo` mantenendo simmetria.
- `packages/backend/src/services/preventivi-service.ts:857` mostra transazione Prisma che aggiorna preventivo e riparazione in modo atomico, pattern da riusare per aggiornare `stato` + `dataRisposta` + stato riparazione.
- `packages/backend/src/__tests__/preventivi-send-atdd.spec.ts:38` contiene struttura ATDD per AC con assert su HTTP code, messaggi errore e side effects, pattern da seguire per i test della risposta preventivo.

## Known Pitfalls

- Il service mantiene due percorsi (test-store e database): se la logica viene aggiunta solo su uno dei due, i test ATDD passano/parzialmente falliscono in modo incoerente (`packages/backend/src/services/preventivi-service.ts:790`, `packages/backend/src/services/preventivi-service.ts:857`).
- Le transizioni stato sono sensibili all'ordine: aggiornare preventivo senza sincronizzare riparazione rompe invarianti di workflow (`packages/backend/src/services/preventivi-service.ts:974`).
- I messaggi errore sono validati testualmente negli ATDD; differenze minime di stringa causano regressioni (`packages/backend/src/__tests__/preventivi-send-atdd.spec.ts:62`, `packages/backend/src/__tests__/preventivi-send-atdd.spec.ts:86`).

## Stack/Libraries to Use

- Express router e middleware auth gia' presenti in backend (`packages/backend/src/routes/preventivi.ts`).
- Prisma transaction API per operazioni atomiche multi-entita (`packages/backend/src/services/preventivi-service.ts:861`).
- Vitest + Supertest per copertura ATDD endpoint REST (`packages/backend/src/__tests__/preventivi-send-atdd.spec.ts`).