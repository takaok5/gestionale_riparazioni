## Patterns Found

- `packages/backend/src/routes/users.ts:35` usa route handler async con `authenticate` + `authorize("ADMIN")`, chiamata al service e mapping esplicito errori/status.
- `packages/backend/src/lib/errors.ts:11` centralizza envelope error con `buildErrorResponse(code, message, details?)`.
- `packages/backend/src/middleware/auth.ts:106` implementa `authorize(...roles)` con risposta `403` standardizzata.
- `packages/backend/src/services/auth-service.ts:182` e `:222` mostrano pattern guard su `isActive` con codici dominio (`ACCOUNT_DISABLED`).
- `packages/backend/src/__tests__/users-create.spec.ts:33` usa `resetUsersStoreForTests()` per isolamento deterministico dei test API.

## Known Pitfalls

- Lo store test utenti in `packages/backend/src/services/users-service.ts:49` non include un admin attivo di default: il controllo "last admin" puo' fallire in modo non deterministico senza setup esplicito.
- Se nuove route users non usano sempre `buildErrorResponse` (`packages/backend/src/lib/errors.ts:11`), il formato errore puo' divergere da auth/users esistenti.
- Il mapping errori Prisma in `packages/backend/src/services/users-service.ts:246` copre oggi `P2002` (unique): nuovi casi dominio (utente non trovato, ultimo admin) vanno mappati in modo esplicito per evitare `500` generici.

## Stack/Libraries to Use

- Express Router + middleware `authenticate/authorize` per `PUT /api/users/:id` e `PATCH /api/users/:id/deactivate`.
- Prisma Client per update ruolo/disattivazione su database reale.
- `buildErrorResponse` per envelope error consistente.
- Vitest + Supertest per test integration AC-driven (`packages/backend/src/__tests__`).
