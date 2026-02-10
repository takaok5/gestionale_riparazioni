# Review Report - Story 1.5

## Task Evidence

- Task 1: endpoint `PUT /api/users/:id` implementato in `packages/backend/src/routes/users.ts`.
- Task 2: update ruolo implementato in `packages/backend/src/services/users-service.ts` (`updateUserRole`, parsing input, persistenza test/Prisma).
- Task 3: endpoint `PATCH /api/users/:id/deactivate` implementato in `packages/backend/src/routes/users.ts`.
- Task 4: blocco ultimo admin implementato in `packages/backend/src/services/users-service.ts` (`LAST_ADMIN_DEACTIVATION_FORBIDDEN`).
- Task 5: RBAC admin enforced in route con `authorize("ADMIN")`.
- Task 6: test AC-driven in `packages/backend/src/__tests__/users-update-deactivate.spec.ts`.
- Task 7: helper deterministici per test (`setUserRoleForTests`, `setUserIsActiveForTests`) in `packages/backend/src/services/users-service.ts`.
- Task 8: tipi shared aggiornati in `packages/shared/src/types/index.ts`.

### Issue 1
Status: RESOLVED

- Problem: `respondUserMutationFailure` non aveva fallback esplicito per codici non gestiti; rischio risposta incoerente o endpoint senza mapping centralizzato in evoluzioni future.
- Fix: aggiunto fallback `500 USERS_SERVICE_UNAVAILABLE` e `return` esplicito nel ramo `LAST_ADMIN_DEACTIVATION_FORBIDDEN`.
- Evidence: `packages/backend/src/routes/users.ts:43`, `packages/backend/src/routes/users.ts:61`, `packages/backend/src/routes/users.ts:77`.
- Verification: test suite backend passata e mapping errori utenti stabile.

### Issue 2
Status: RESOLVED

- Problem: helper di mutazione store test (`resetUsersStoreForTests`, `setUserRoleForTests`, `setUserIsActiveForTests`) potevano essere invocati anche fuori da `NODE_ENV=test`.
- Fix: introdotto guard `ensureTestEnvironment()` e applicato a tutti gli helper test-only.
- Evidence: `packages/backend/src/services/users-service.ts:559`, `packages/backend/src/services/users-service.ts:565`, `packages/backend/src/services/users-service.ts:578`, `packages/backend/src/services/users-service.ts:591`.
- Verification: typecheck/lint verdi; test backend verdi in ambiente test.

### Issue 3
Status: RESOLVED

- Problem: i test AC-3 non fissavano in modo deterministico la condizione "solo un admin attivo" in caso di cambi futuri ai seed.
- Fix: in AC-3 i test preparano esplicitamente `user 1 = ADMIN attivo` e `user 2 = TECNICO inattivo` prima della chiamata.
- Evidence: `packages/backend/src/__tests__/users-update-deactivate.spec.ts` blocco AC-3.
- Verification: `users-update-deactivate.spec.ts` verde con assert su `LAST_ADMIN_DEACTIVATION_FORBIDDEN`.

### Issue 4
Status: RESOLVED

- Problem: mancava copertura su path di validazione `userId` e su `USER_NOT_FOUND` per deactivation, lasciando scoperta parte del mapping errori.
- Fix: aggiunti due test review (`VALIDATION_ERROR` su id non intero e `USER_NOT_FOUND` su id inesistente).
- Evidence: `packages/backend/src/__tests__/users-update-deactivate.spec.ts:145`, `packages/backend/src/__tests__/users-update-deactivate.spec.ts:146`, `packages/backend/src/__tests__/users-update-deactivate.spec.ts:157`.
- Verification: suite backend aggiornata passa con 10 test nella spec story 1.5.

## Summary

- Issues found: 4
- Issues resolved: 4
- False positives in task marking: 0
