## Patterns Found

- Dettaglio route con payload da `req.params.id`, chiamata service e risposta `200` con envelope `data`: `packages/backend/src/routes/clienti.ts:189`.
- Mapping errori dominio -> HTTP specifico in route layer (`NOT_FOUND` -> `*_NOT_FOUND`): `packages/backend/src/routes/clienti.ts:95`.
- Query dettaglio con Prisma `findUnique` + `select` esplicito + ritorno `NOT_FOUND` se assente: `packages/backend/src/services/anagrafiche-service.ts:2292`.
- Mapping date in stringa ISO nella risposta service: `packages/backend/src/services/riparazioni-service.ts:865`.
- Test ATDD per endpoint dettaglio con assert su status/code/body shape: `packages/backend/src/__tests__/clienti-detail-update-atdd.spec.ts:148`.

## Known Pitfalls

- Il service `riparazioni` ha doppio percorso `test store`/`database`; la feature dettaglio va implementata e mantenuta in entrambi, altrimenti i test ATDD falliscono: `packages/backend/src/services/riparazioni-service.ts:895` e `packages/backend/src/services/riparazioni-service.ts:910`.
- Lo schema attuale di `Riparazione` non espone relazioni per storico stati, preventivi e ricambi richiesti dalla story; senza estensioni schema i campi AC-2/AC-3 restano irraggiungibili: `packages/backend/prisma/schema.prisma:110`.
- Il router `riparazioni` oggi espone solo lista/creazione; l'aggiunta `GET /:id` deve allineare naming errori e envelope a quelli già usati nel progetto: `packages/backend/src/routes/riparazioni.ts:86`.

## Stack/Libraries to Use

- Express Router + middleware `authenticate` + `buildErrorResponse` per mapping errori HTTP.
- Prisma Client (`findUnique`, `findMany`, `select` espliciti) per query sicure e shape stabile.
- Vitest + Supertest per ATDD endpoint-level con assert su status, payload `data` e `error.code`.
