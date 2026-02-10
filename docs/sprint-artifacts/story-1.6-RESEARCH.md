## Patterns Found

- `packages/backend/src/routes/users.ts:89` usa un mapper dedicato per errori dominio (`respondChangeOwnPasswordFailure`) con envelope uniforme via `buildErrorResponse`.
- `packages/backend/src/services/users-service.ts:333` applica la policy password tramite `VALIDATION_ERROR` con dettagli strutturati (`field`, `rule`, `min`, `requiresUppercase`, `requiresNumber`).
- `packages/backend/src/services/users-service.ts:601` valida la current password con `bcrypt.compare(...)` prima di aggiornare l'hash.
- `packages/backend/src/services/auth-service.ts:209` autentica login sempre con `bcrypt.compare(...)`; questo vincola la coerenza hash tra servizio utenti e auth.
- `packages/backend/src/__tests__/users-change-password.spec.ts:85` e `:92` mostrano il pattern di assert su `error.code` + `error.details` per i sad path.

## Known Pitfalls

- In ambiente test esistono due store in memoria (`testUsers` e `seededUsers`): senza sincronizzazione dell'hash il login post-cambio password puo' dare falsi negativi.
- Se i nuovi errori non passano da `buildErrorResponse`, il formato delle risposte puo' divergere da `users`/`auth`.
- AC troppo permissive sui `Then` (solo messaggio testuale) riducono la robustezza dei test e possono accettare errori sbagliati con stesso testo.

## Stack/Libraries to Use

- Express Router + middleware `authenticate` per endpoint `PUT /api/users/me/password`.
- `bcryptjs` per confronto password corrente e hashing nuova password.
- Prisma Client per persistenza in DB reale.
- Vitest + Supertest per verifica API end-to-end delle AC.