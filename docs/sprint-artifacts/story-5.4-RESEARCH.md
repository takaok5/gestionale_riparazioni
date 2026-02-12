## Patterns Found

- `packages/backend/src/routes/riparazioni.ts:254` usa pattern route->payload tipizzato->service->failure mapper per endpoint riparazioni; il nuovo `POST /:id/ricambi` deve seguire lo stesso flusso.
- `packages/backend/src/services/riparazioni-service.ts:1326` usa `findUnique` con `select` annidati e mapping esplicito di `preventivi`/`ricambi`; utile come riferimento per estendere la shape `ricambi[].articolo`.
- `packages/backend/src/routes/articoli.ts:87` mappa gli errori dominio `NOT_FOUND` e `INSUFFICIENT_STOCK` in HTTP `404/400` con `buildErrorResponse`; da riusare per coerenza semantica.
- `packages/backend/src/services/anagrafiche-service.ts:2749` applica transazione atomica per decremento stock + creazione movimento; va riusato/replicato per evitare inconsistenze su link ricambi.
- `packages/backend/src/__tests__/riparazioni-detail-atdd.spec.ts:163` mostra pattern ATDD con seed deterministici e assert shape su `ricambi`, base per i nuovi test di story 5.4.

## Known Pitfalls

- Aggiornare solo link ricambio senza movimento magazzino rompe il vincolo dominio su giacenza e audit.
- Cambiare shape di `ricambi` nel dettaglio senza compatibilita' puo rompere test/regressioni esistenti.
- Messaggi/codici errore non allineati (`ARTICOLO_NOT_FOUND`, insufficient stock) causano failure ATDD anche con logica business corretta.

## Stack/Libraries to Use

- Express router + middleware `authenticate`/`authorize` per endpoint API.
- Service layer con result union ok/failure in TypeScript per validazione e mapping errori.
- Prisma transaction (`$transaction`) per coerenza tra stock e link ricambio.
- Vitest + Supertest per ATDD API end-to-end sui contratti HTTP.
