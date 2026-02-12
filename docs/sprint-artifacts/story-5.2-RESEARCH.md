## Patterns Found

- `packages/backend/src/routes/fornitori.ts:210` usa il pattern GET lista con payload query (`page`, `limit`, `search`, `categoria`) + `respondList*Failure` per mapping errori.
- `packages/backend/src/routes/clienti.ts:172` mostra risposta lista consistente `200` con body `{ data, meta }`.
- `packages/backend/src/services/anagrafiche-service.ts:1493` applica validazioni centralizzate su `page/limit/search/categoria` con `MAX_LIST_LIMIT` e `VALIDATION_ERROR`.
- `packages/backend/src/services/anagrafiche-service.ts:3298` implementa filtro Prisma (`where`, `OR`, `contains`, `mode: insensitive`) con paginazione `skip/take` e `orderBy id asc`.
- `packages/backend/src/__tests__/fornitori-list-search-atdd.spec.ts:71` e `packages/backend/src/__tests__/clienti-list-search-atdd.spec.ts:125` forniscono pattern ATDD per assertions su `meta` e filtri search.

## Known Pitfalls

- Aggiornare `anagrafiche-service.ts` senza isolamento puo rompere route non correlate (`clienti`, `fornitori`, `audit-log`) che importano lo stesso modulo.
- Divergenza nel contratto `meta` (`limit`, `total`, `totalPages`) porta a regressioni immediate nei test ATDD.
- Implementare alert con confronto `<` invece di `<=` viola il requisito low-stock.
- Ricerca case-sensitive o su campi incompleti (`nome` soltanto) rompe AC-2.

## Stack/Libraries to Use

- Express router + middleware esistenti (`authenticate`, `authorize`).
- Prisma client gia in uso in `anagrafiche-service.ts` con `findMany/count`.
- Vitest + Supertest per ATDD endpoint.
