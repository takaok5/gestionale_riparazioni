## Review Report - Story 1.7

### Issue 1

Status: RESOLVED

- Problem: Nel ramo database mancava il payload `dettagli.old/new` su `AuditLog` durante update Fornitore, quindi il comportamento AC-2 era soddisfatto solo nel test store.
- Fix: esteso `AuditLog` in `packages/backend/prisma/schema.prisma` con campo `dettagli Json?`, generato nuovamente Prisma client, e scritto snapshot old/new in `packages/backend/src/services/anagrafiche-service.ts`.
- Verification: build/test passano e `listAuditLogsInDatabase` ora mappa `dettagli` nel payload response.

### Issue 2

Status: RESOLVED

- Problem: `createClienteInDatabase` convertiva ogni errore DB in `SERVICE_UNAVAILABLE`, inclusi vincoli univoci su `codiceCliente`.
- Fix: gestione esplicita `PrismaClientKnownRequestError` codice `P2002` in `packages/backend/src/services/anagrafiche-service.ts`, con ritorno `VALIDATION_ERROR` su campo `codiceCliente`.
- Verification: typecheck/lint/build/test verdi; il ramo di errore ora produce failure semantico deterministico invece di 500 generico.

### Issue 3

Status: RESOLVED

- Problem: validazione `tipologia` accettava qualsiasi input non stringa come default `PRIVATO`, introducendo coercioni silenziose.
- Fix: aggiornato `normalizeTipologia` in `packages/backend/src/services/anagrafiche-service.ts` per default solo su `undefined/null` e errore su tipi non stringa.
- Verification: compilazione TypeScript e test suite complete in verde dopo la modifica, senza regressioni su AC correnti.
