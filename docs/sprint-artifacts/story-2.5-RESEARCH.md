# Story 2.5 Research

## Patterns Found

- `packages/backend/src/routes/clienti.ts:172` mostra il pattern route di lista: parsing query -> service -> `200` con payload `{ data, meta }`.
- `packages/backend/src/routes/clienti.ts:60` mostra mapping `VALIDATION_ERROR` a `400` con `buildErrorResponse` per query non valide.
- `packages/backend/src/services/anagrafiche-service.ts:1060` implementa il parser lista con validazione `page`, `limit`, `search` e regola `too_large` su `limit`.
- `packages/backend/src/services/anagrafiche-service.ts:2198` implementa il ramo test-store con filtro+search case-insensitive, ordinamento per `id` e `totalPages` coerente.
- `packages/backend/src/services/anagrafiche-service.ts:2243` implementa il ramo Prisma con `where`, `OR`, `contains`, `mode: "insensitive"`, `skip`, `take`.
- `packages/backend/src/__tests__/clienti-list-search-atdd.spec.ts:70` e `packages/backend/src/__tests__/clienti-list-search-atdd.spec.ts:233` mostrano pattern ATDD per happy path e sad path (`limit` oltre soglia).

## Known Pitfalls

- Divergenza tra test-store e database: filtri/search/meta devono restare identici in entrambi i rami.
- `categoria` fornitore deve validare enum coerente (`RICAMBI|SERVIZI|ALTRO`) con errore `VALIDATION_ERROR` in caso input invalido.
- Ricerca `search` deve coprire entrambi i campi (`nome`, `codiceFornitore`) con match case-insensitive.
- `totalPages` deve restare consistente con il pattern esistente (0 quando `total=0`).

## Stack/Libraries to Use

- Express router (`packages/backend/src/routes/*.ts`) per endpoint HTTP.
- Service layer in TypeScript (`packages/backend/src/services/anagrafiche-service.ts`) per parsing e logica.
- Prisma Client per query DB (`contains`, `mode: "insensitive"`, `skip`, `take`).
- Supertest + Vitest per ATDD (`packages/backend/src/__tests__/*.spec.ts`).