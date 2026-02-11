## Patterns Found

- Route list con payload da query params e invocazione service:
  - `packages/backend/src/routes/clienti.ts:172`
  - `packages/backend/src/routes/fornitori.ts:210`
- Parsing input lista con default/validazioni e `VALIDATION_ERROR` strutturato (`field`, `rule`):
  - `packages/backend/src/services/anagrafiche-service.ts:1243`
  - `packages/backend/src/services/anagrafiche-service.ts:1308`
- Implementazione lista su test store con filtro + ricerca case-insensitive + paginazione + `meta.totalPages`:
  - `packages/backend/src/services/anagrafiche-service.ts:2718`
  - `packages/backend/src/services/anagrafiche-service.ts:2763`
- Implementazione lista su database con `where` condizionale, `skip/take`, `count` e `totalPages`:
  - `packages/backend/src/services/anagrafiche-service.ts:2810`
  - `packages/backend/src/services/anagrafiche-service.ts:2879`
- Pattern test ATDD per sad path query (`limit` troppo alto -> `400 VALIDATION_ERROR`):
  - `packages/backend/src/__tests__/fornitori-list-search-atdd.spec.ts:224`

## Known Pitfalls

- `Riparazione` non ha `tecnicoId` nello schema Prisma, ma AC-3 richiede filtro su `tecnicoId`:
  - `packages/backend/prisma/schema.prisma:109`
- Senza ordinamento deterministico la paginazione può produrre risultati non stabili tra pagine.
- Filtro range date va definito in modo esplicito (inclusione estremi e formato) per evitare divergenze test-store vs DB.

## Stack/Libraries to Use

- `Express` per route handling (`Router`, middleware `authenticate`).
- `Prisma` per query list su DB (`where`, `skip`, `take`, `count`).
- Pattern di validazione service già usato in backend (funzioni helper + errori strutturati).
- `Jest + supertest` per scenari ATDD API.