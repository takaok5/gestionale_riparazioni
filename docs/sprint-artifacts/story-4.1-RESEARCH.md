## Patterns Found

- `packages/backend/src/index.ts:19`-`packages/backend/src/index.ts:25` registra i router in bootstrap con `app.use("/api/<resource>", <router>)`; il nuovo router preventivi deve seguire lo stesso wiring.
- `packages/backend/src/routes/riparazioni.ts:49` usa helper `respond*Failure` + `buildErrorResponse` per mappare errori dominio in HTTP status/codici coerenti.
- `packages/backend/src/routes/riparazioni.ts:131` mappa il not found su codice applicativo stabile `RIPARAZIONE_NOT_FOUND`.
- `packages/backend/src/services/riparazioni-service.ts:407` centralizza la generazione errori di validazione con `buildValidationFailure`, pattern utile per messaggi deterministici nei sad path.
- `packages/backend/src/services/riparazioni-service.ts:1720` e `packages/backend/src/services/riparazioni-service.ts:1723` mostrano dual path test-store/database; il nuovo servizio preventivi deve mantenere lo stesso approccio.
- `packages/backend/src/__tests__/riparazioni-detail-atdd.spec.ts:217` e `packages/backend/src/__tests__/riparazioni-create-atdd.spec.ts:149` verificano esplicitamente `error.code` e status HTTP: i nuovi test preventivi devono usare assert dello stesso livello.

## Known Pitfalls

- Implementare solo il path Prisma o solo il path test-store rompe gli ATDD in ambiente test.
- Usare `riparazioni.ts` per endpoint preventivi aumenta accoppiamento e rende ambiguo il routing in `index.ts`.
- Errori non normalizzati con `buildErrorResponse`/`buildValidationFailure` generano payload non compatibili con le aspettative `error.code` dei test.

## Stack/Libraries to Use

- Express router (`express.Router`) per `POST /api/preventivi` e `GET /api/preventivi/:id`.
- Prisma (schema + query con select espliciti) per persistenza preventivi/voci.
- Helper error handling esistenti: `buildErrorResponse` e pattern service `buildValidationFailure`.
- Vitest + Supertest per ATDD backend con assert su status, `error.code`, messaggi e shape payload.
