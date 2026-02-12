## Patterns Found

- `packages/backend/src/routes/riparazioni.ts:346` usa `PATCH /:id/stato` con `authenticate` e payload tipizzato con delega al service.
- `packages/backend/src/routes/ordini.ts:17` centralizza il mapping errori con `buildErrorResponse`, pattern da riusare per il nuovo `PATCH`.
- `packages/backend/src/services/riparazioni-service.ts:321` definisce una matrice transizioni esplicita; utile per regole ordine `BOZZA/EMESSO/CONFERMATO/SPEDITO/RICEVUTO/ANNULLATO`.
- `packages/backend/src/services/riparazioni-service.ts:890` isola la validazione transizione in una funzione dedicata prima della mutazione stato.
- `packages/backend/src/__tests__/riparazioni-stato-base-atdd.spec.ts:248` mostra ATDD con assert puntuali su `status`, `error.code`, `error.message`.

## Known Pitfalls

- `packages/backend/prisma/schema.prisma:107` non include ancora `dataEmissione`/`dataRicezione` per `OrdineFornitore`: rischio mismatch AC-1/AC-4.
- `packages/backend/src/services/anagrafiche-service.ts` mantiene doppio ramo test-store/database: rischio divergenza regole stato se implementati in modo non simmetrico.
- Un middleware route-level troppo restrittivo (`authorize("ADMIN")`) impedirebbe la casistica AC-7 basata su validazione dominio.

## Stack/Libraries to Use

- `express` router + middleware auth esistenti (`authenticate`) per endpoint.
- `buildErrorResponse` per payload errore canonico.
- `vitest` + `supertest` per ATDD API-level.
- Prisma (`ordineFornitore`) per path database, mantenendo mapping JSON coerente con test-store.
