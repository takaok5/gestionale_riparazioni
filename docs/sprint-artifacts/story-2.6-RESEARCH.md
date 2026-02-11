# Story 2.6 Research

## Patterns Found

- `packages/backend/src/routes/clienti.ts:189` mostra il pattern route dettaglio (`GET /:id`) con payload tipizzato, chiamata service e mapper errore dedicato.
- `packages/backend/src/routes/clienti.ts:220` mostra il pattern route annidata (`GET /:id/riparazioni`) con risposta `200` su array `data`.
- `packages/backend/src/services/anagrafiche-service.ts:1252` e `packages/backend/src/services/anagrafiche-service.ts:1353` mostrano parser input per `id` con regola `invalid_integer`.
- `packages/backend/src/services/anagrafiche-service.ts:1881` e `packages/backend/src/services/anagrafiche-service.ts:2168` mostrano il pattern dual-path test-store/DB con `NOT_FOUND` deterministico.
- `packages/backend/src/services/anagrafiche-service.ts:1021` mostra il vincolo `at_least_one_field_required` su update parziale.
- `packages/backend/src/services/anagrafiche-service.ts:1780` mostra il pattern audit `UPDATE` con snapshot `old/new`.
- `packages/backend/src/middleware/auth.ts:106` mostra la policy autorizzativa con `403 FORBIDDEN` e messaggio `Accesso negato`.
- `packages/backend/src/__tests__/fornitori-create-atdd.spec.ts:170` mostra test ATDD autorizzazione (`TECNICO` bloccato con `403 FORBIDDEN`).

## Known Pitfalls

- In fixture test-store il fornitore base e' `id=5` (`packages/backend/src/services/anagrafiche-service.ts:406`): i test per `id=3` devono creare/normalizzare dati dedicati.
- Lo schema Prisma corrente non contiene un model ordini collegato al fornitore (`packages/backend/prisma/schema.prisma`): AC-3 richiede estensione schema + mapping service.
- L'update fornitore attuale copre solo `ragioneSociale` e `telefono` (`packages/backend/src/services/anagrafiche-service.ts:965`): aggiungere `categoria` senza rompere `at_least_one_field_required`.
- Serve allineamento stretto tra test-store e DB per endpoint nuovi (`GET /:id`, `GET /:id/ordini`) per evitare divergenze tra ambiente test e runtime.

## Stack/Libraries to Use

- Express router (`packages/backend/src/routes/*.ts`) per endpoint e mapping errori HTTP.
- Service layer TypeScript (`packages/backend/src/services/anagrafiche-service.ts`) per parsing input, business logic e audit.
- Prisma Client (`packages/backend/prisma/schema.prisma`) per persistenza DB e relazioni.
- Middleware auth (`packages/backend/src/middleware/auth.ts`) per enforcement ruoli.
- Vitest + Supertest (`packages/backend/src/__tests__/*.spec.ts`) per ATDD RED/GREEN.
