## Patterns Found

- `packages/backend/src/routes/auth.ts:137` usa estrazione `refreshToken` da body e delega a service (`refreshSession`) con mapping errori centralizzato.
- `packages/backend/src/routes/auth.ts:179` implementa `POST /api/portal/auth/login` con payload parsing esplicito (`email`, `password`) e risposta `200` dal risultato service.
- `packages/backend/src/routes/auth.ts:99` mostra pattern rate-limit osservabile via codice errore + header retry (`retryAfter`) su endpoint login.
- `packages/backend/src/services/login-rate-limit.ts:1` centralizza policy lockout e tracking tentativi con finestra temporale.
- `packages/backend/src/services/auth-service.ts:298` valida refresh token (`trim`, verify JWT, tokenType refresh, user active) prima di emettere nuovi token.
- `packages/backend/src/services/auth-service.ts:411` implementa login portale con validazione account ATTIVO + bcrypt compare.
- `packages/backend/src/__tests__/auth-refresh.spec.ts:24` mostra stile test refresh con asserzioni su status, token presenti/assenti e codici errore.

## Known Pitfalls

- Policy lockout attuale non coincide con AC 8.2 (`5 tentativi / 1 minuto` in `login-rate-limit.ts`) e rischia regressioni su login non-portale.
- Header di lockout nel codice e' `retryAfter` (camelCase), mentre molte integrazioni si aspettano `Retry-After`.
- Refresh token oggi e' validato solo via JWT stateless; invalidazione del vecchio token richiede stato persistente/revocation strategy.
- `loginPortalWithCredentials` (`auth-service.ts:430`) emette token con role hardcoded e senza summary cliente: gap rispetto al payload AC-1.

## Stack/Libraries to Use

- Express + router/service split gia' presente in `packages/backend/src/routes/auth.ts`.
- `buildErrorResponse` per envelope errori consistente (`packages/backend/src/lib/errors.ts`).
- JWT helpers (`issueAuthTokens`, `verifyAuthToken`) in `packages/backend/src/middleware/auth.ts`.
- `bcryptjs` per verifica password in `packages/backend/src/services/auth-service.ts`.
- `Vitest` + `Supertest` per ATDD API in `packages/backend/src/__tests__/*.spec.ts`.
