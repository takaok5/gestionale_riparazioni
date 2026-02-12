## Patterns Found

- `packages/backend/src/routes/articoli.ts:120` mostra il pattern route per articoli con middleware `authenticate` + `authorize("TECNICO", "ADMIN")`, payload esplicito e invocazione service.
- `packages/backend/src/routes/articoli.ts:33` mostra il mapping centralizzato dei failure (`VALIDATION_ERROR`, `NOT_FOUND`, `SERVICE_UNAVAILABLE`) verso HTTP status e body `buildErrorResponse`.
- `packages/backend/src/services/anagrafiche-service.ts:1257` mostra il parser `parseCreateArticoloInput` con validazioni campo-per-campo e ritorno typed union `ok/failure`.
- `packages/backend/src/services/anagrafiche-service.ts:2377` mostra uso di `getPrismaClient().$transaction(...)` con early-return typed per gestire atomicita e mapping errori.
- `packages/backend/src/__tests__/articoli-create-atdd.spec.ts:10` fornisce pattern test helper (`buildAccessToken`, `authHeader`) per chiamate autenticate e fixture setup stabile.

## Known Pitfalls

- Se lo scarico non e atomico, due richieste concorrenti possono portare giacenza negativa o inconsistente.
- Mapping errori incoerente tra route e service puo rompere i contratti gia usati dai client (`error.code`, `error.message`).
- Validazioni incomplete su `tipo`, `quantita`, `riferimento` possono accettare movimenti invalidi o ambigui.
- Mancata registrazione metadati (userId/timestamp) rende non verificabile l'audit del movimento.

## Stack/Libraries to Use

- Express Router + middleware auth esistenti (`authenticate`, `authorize`) in `packages/backend/src/routes`.
- Prisma Client con transazioni (`$transaction`) nel service layer.
- Jest + Supertest per ATDD in `packages/backend/src/__tests__`.
- Utility error payload `buildErrorResponse` per risposta errore coerente.
