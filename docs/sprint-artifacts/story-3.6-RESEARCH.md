## Patterns Found

- `packages/backend/src/services/riparazioni-service.ts:274` centralizza le transizioni di stato in `BASE_ALLOWED_TRANSITIONS`; e' il punto corretto per estendere il workflow preventivo.
- `packages/backend/src/services/riparazioni-service.ts:791` usa `validateBaseTransition(from, to)` come guard unica prima di ogni mutazione; mantenere questo flusso evita divergenze tra percorsi.
- `packages/backend/src/services/riparazioni-service.ts:1578` e `packages/backend/src/services/riparazioni-service.ts:1639` applicano la stessa validazione sia in test-store sia in percorso Prisma.
- `packages/backend/src/services/riparazioni-service.ts:1658` registra storico tramite `riparazioneStatoHistory.create`; l'update stato senza append storico sarebbe regressione.
- `packages/backend/src/routes/riparazioni.ts:287` segue pattern route: payload tipizzato, delega al service, risposta `200` con `{ data: ... }`.
- `packages/backend/src/routes/riparazioni.ts:189` mappa errori service (`VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`) nel formato API standard.
- `packages/backend/src/__tests__/riparazioni-stato-base-atdd.spec.ts:101` mostra pattern ATDD Given/When/Then con `PATCH /api/riparazioni/:id/stato` e assert su stato finale.
- `packages/backend/src/__tests__/riparazioni-stato-base-atdd.spec.ts:114` verifica anche `statiHistory` via `GET /api/riparazioni/:id` dopo una transizione.

## Known Pitfalls

- Estendere solo `ALLOWED_STATI` senza aggiornare `BASE_ALLOWED_TRANSITIONS` produce `VALIDATION_ERROR` inattesi sulle nuove transizioni.
- Modificare la matrice transizioni senza rieseguire i test base puo' rompere il flusso 3.5 (`RICEVUTA -> IN_DIAGNOSI -> IN_LAVORAZIONE -> COMPLETATA -> CONSEGNATA`).
- Validazione diversa tra test-store e Prisma crea falsi verdi in test e bug runtime in ambiente reale.
- Omettere assert su storico in ATDD puo' nascondere regressioni nella timeline della riparazione.

## Stack/Libraries to Use

- `Express` per l'endpoint `PATCH /api/riparazioni/:id/stato` (`packages/backend/src/routes/riparazioni.ts`).
- `Prisma` per persistenza transazionale stato + storico (`packages/backend/src/services/riparazioni-service.ts`).
- `Vitest` + `Supertest` per test ATDD API e verifiche su payload/HTTP status.
