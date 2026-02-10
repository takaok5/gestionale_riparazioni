# Story 2.3 Research

## Patterns Found

- `packages/backend/src/routes/fornitori.ts:17` usa un helper dedicato (`respondUpdateFornitoreFailure`) per mappare errori service (`VALIDATION_ERROR`, `NOT_FOUND`) in HTTP status e `buildErrorResponse`.
- `packages/backend/src/routes/users.ts:195` mostra il pattern route update `PUT /:id` con payload esplicito e delega completa al service; la gestione errori passa da helper (`respondUserMutationFailure`).
- `packages/backend/src/routes/clienti.ts:63` e `packages/backend/src/routes/clienti.ts:80` confermano pattern route client: parse input da `req`, call service, risposta `res.status(...).json(result.data)`.
- `packages/backend/src/services/anagrafiche-service.ts:1251` implementa pattern Prisma per lista: `where` dinamico, `count + findMany` in `Promise.all`, `orderBy`, `skip/take`, `select` esplicito.
- `packages/backend/src/services/anagrafiche-service.ts:1322` e `packages/backend/src/services/anagrafiche-service.ts:1365` mostrano pattern dual-path test/db (`NODE_ENV === "test"`) da riusare per nuove funzioni cliente.
- `packages/backend/src/__tests__/clienti-list-search-atdd.spec.ts:22` mostra pattern ATDD: seed dati via API, chiamata endpoint, assert puntuali su status/body/meta.

## Known Pitfalls

- `packages/backend/src/routes/clienti.ts` espone solo `GET /` e `POST /`; mancano `GET /:id`, `PUT /:id` e `GET /:id/riparazioni`, quindi AC 2.3 non coperte out-of-the-box.
- `packages/backend/prisma/schema.prisma:40` contiene `model Cliente` ma non esiste un model/relazione `Riparazione`; AC-4 richiede nuova modellazione o adattamento dati.
- La codebase contiene due stack (`packages/backend/**` e `anagrafiche/models.py`): rischio incoerenza funzionale se la story viene implementata solo in uno dei due.
- Riutilizzare un test file non focalizzato puo creare suite troppo ampie; preferibile test dedicato story-level per tracciabilita RED/GREEN.

## Stack/Libraries to Use

- Express Router + middleware `authenticate`/`authorize` per endpoint REST (`packages/backend/src/routes/*.ts`).
- Utility `buildErrorResponse` per formato errore standard (`packages/backend/src/lib/errors.ts` via import nei route).
- Prisma Client per query `findUnique`/`findMany` con `select` esplicito e ordinamento deterministico.
- Vitest + Supertest per ATDD API e assert su status/code/body (`packages/backend/src/__tests__/*.spec.ts`).