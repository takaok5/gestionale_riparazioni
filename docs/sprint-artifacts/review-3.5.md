# Review Story 3.5

### Issue 1 - Role bypass on assigned user id
Status: RESOLVED

- Problem: l'autorizzazione iniziale permetteva il cambio stato a qualunque ruolo non admin se `actorUserId` coincideva con `tecnicoId` della riparazione.
- Evidence: controllo originario basato solo su `target.tecnicoId !== payload.actorUserId`.
- Fix: aggiunto controllo esplicito ruolo `TECNICO` per i non-admin in entrambi i percorsi service (`test-store` e `Prisma`).
- Verification: test AC-6 aggiornati e passanti.

### Issue 2 - actorRole non normalizzato/validato
Status: RESOLVED

- Problem: `actorRole` veniva usato in confronto case-sensitive senza normalizzazione e senza validazione enum.
- Evidence: parser accettava qualsiasi stringa non vuota.
- Fix: parser aggiornato con `toUpperCase()` + validazione contro `ADMIN|TECNICO|COMMERCIALE`.
- Verification: typecheck + test backend passano dopo la modifica.

### Issue 3 - Gap di test su ruolo non tecnico
Status: RESOLVED

- Problem: la suite ATDD copriva solo tecnico non assegnato, ma non il caso di ruolo `COMMERCIALE` con stesso userId del tecnico assegnato.
- Evidence: assenza di casi `authHeader("COMMERCIALE", ...)` nel file test story 3.5.
- Fix: aggiunti due test in `packages/backend/src/__tests__/riparazioni-stato-base-atdd.spec.ts` per verificare `403 FORBIDDEN` e assenza di side effect.
- Verification: file test story 3.5 ora ha 14 test tutti verdi.
