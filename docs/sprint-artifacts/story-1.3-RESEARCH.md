## Patterns Found

- `packages/backend/src/routes/auth.ts:55` usa handler Express asincroni con parsing input minimale, chiamata service e ritorno status HTTP esplicito.
- `packages/backend/src/routes/auth.ts:83` usa `buildErrorResponse(code, message, details?)` per un envelope error uniforme.
- `packages/backend/src/middleware/auth.ts:105` espone `authorize(...roles)` per enforcement RBAC lato route.
- `packages/backend/src/services/auth-service.ts:101` usa `PrismaClient` con `findUnique` e `select` esplicito per controllare i campi restituiti.
- `packages/backend/src/__tests__/auth-login.spec.ts:10` e `packages/backend/src/__tests__/auth-refresh.spec.ts:24` mostrano test integration AC-oriented con `supertest` + `vitest`.

## Known Pitfalls

- Non esiste un pattern già implementato per validazione payload con `zod` in `packages/backend/src` (dipendenza presente ma non ancora usata): rischio di validazioni incoerenti tra route.
- `authorize(...)` oggi risponde con `{ error: "Accesso negato" }` (`packages/backend/src/middleware/auth.ts:112`) mentre le route auth usano `buildErrorResponse(...)`: possibile inconsistenza del formato errore.
- I test auth correnti girano con utenti seedati in memoria (`packages/backend/src/services/auth-service.ts:53` quando `NODE_ENV=test`): il flusso create-user deve evitare side effects non deterministici.
- Vincoli univoci `username/email` esistono a schema (`packages/backend/prisma/schema.prisma:29-30`): senza mapping esplicito degli errori DB si rischia risposta 500 invece di 409 dominio.

## Stack/Libraries to Use

- Express Router per `POST /api/users`.
- Prisma Client per persistenza utente e gestione conflitti univoci.
- `bcryptjs` per hash password.
- `buildErrorResponse` (`packages/backend/src/lib/errors.ts`) per error envelope API.
- `supertest` + `vitest` per test integration di AC happy/sad path.
