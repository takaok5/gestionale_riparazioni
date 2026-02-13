# Review 7.1

### Issue 1: Subject email RICEVUTA hardcoded
- Severity: High
- File: `packages/backend/src/services/notifiche-service.ts`
- Problem: il subject per stato `RICEVUTA` era codificato in modo fisso, ignorando `codiceRiparazione`.
- Fix: subject reso dinamico con `Riparazione Ricevuta - ${codiceRiparazione}` (`buildSubject`).
- Evidence: `packages/backend/src/services/notifiche-service.ts:62`
- Status: RESOLVED

### Issue 2: Notifiche non disponibili fuori da NODE_ENV=test
- Severity: High
- File: `packages/backend/src/services/notifiche-service.ts`
- Problem: `createRiparazioneStatoNotifica` salvava nel registro solo in test, quindi `GET /api/notifiche` poteva restituire sempre vuoto.
- Fix: persistenza in memoria applicata in modo uniforme (push sempre eseguito) con id incrementale.
- Evidence: `packages/backend/src/services/notifiche-service.ts:132`
- Status: RESOLVED

### Issue 3: Endpoint notifiche senza paginazione/meta completa
- Severity: Medium
- File: `packages/backend/src/services/notifiche-service.ts`, `packages/backend/src/routes/notifiche.ts`
- Problem: mancavano `page/limit/totalPages` coerenti e slicing paginato.
- Fix: introdotta paginazione server-side (`page`, `limit`, `total`, `totalPages`) e route aggiornata a usare `result.meta`.
- Evidence: `packages/backend/src/services/notifiche-service.ts:153`, `packages/backend/src/routes/notifiche.ts:17`
- Status: RESOLVED
