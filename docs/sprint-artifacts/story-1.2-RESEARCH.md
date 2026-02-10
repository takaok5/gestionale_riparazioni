# Story 1.2 Research

## Patterns Found

- `packages/backend/src/routes/auth.ts:33` usa handler Express con early-return e mapping esplicito degli errori (`buildErrorResponse`) prima di rispondere.
- `packages/backend/src/services/auth-service.ts:107` implementa il pattern service result union (`{ ok: true; data } | { ok: false; code }`) ideale anche per refresh.
- `packages/backend/src/middleware/auth.ts:77` centralizza la generazione dei token (`issueAuthTokens`) con durate coerenti (15m/7d).
- `packages/backend/src/lib/errors.ts:11` definisce il contratto errore uniforme `{ error: { code, message, details? } }` da riusare nei 401 refresh.

## Known Pitfalls

- L'endpoint `/api/auth/refresh` non esiste: va introdotto senza alterare il comportamento di `/api/auth/login`.
- Nessun test refresh esiste oggi: senza suite dedicata il rischio di regressioni auth e' alto.
- I refresh token attuali sono JWT stateless: assenza di revoca server-side implica validita' fino a scadenza se compromessi.

## Stack/Libraries to Use

- Express Router in `packages/backend/src/routes/auth.ts` per l'endpoint refresh.
- `jsonwebtoken` in `packages/backend/src/middleware/auth.ts` per verifica/parse token.
- Prisma user lookup gia' presente in `packages/backend/src/services/auth-service.ts` per controllo account attivo.
- Vitest + Supertest (pattern presente in `packages/backend/src/__tests__/auth-login.spec.ts`) per test API refresh.
