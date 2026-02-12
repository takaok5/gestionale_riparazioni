---
story_id: '4.4'
reviewed_at: '2026-02-12T11:10:30+01:00'
status: completed
---

# Review 4.4

### Issue 1 - Missing role authorization on risposta endpoint
- Severity: medium
- File: packages/backend/src/routes/preventivi.ts
- Problem: l'endpoint PATCH /api/preventivi/:id/risposta accettava qualsiasi utente autenticato, ma la story richiede operazione per ruolo commerciale.
- Fix: aggiunto controllo esplicito eq.user?.role === "COMMERCIALE" con risposta 403 FORBIDDEN in caso contrario.
- Evidence: packages/backend/src/routes/preventivi.ts:285, packages/backend/src/routes/preventivi.ts:293
- Status: RESOLVED

### Issue 2 - Fragility in timestamp assertions
- Severity: medium
- File: packages/backend/src/__tests__/preventivi-response-atdd.spec.ts
- Problem: i test validavano un prefisso timestamp hardcoded (2026-02-12T11:00:00), fragile rispetto a micro-variazioni di clock/fake timers.
- Fix: sostituiti assert string-match con validazione robusta Date.parse(...) non-NaN.
- Evidence: packages/backend/src/__tests__/preventivi-response-atdd.spec.ts:61, packages/backend/src/__tests__/preventivi-response-atdd.spec.ts:92
- Status: RESOLVED

### Issue 3 - Test helper stato preventivo non sincronizzava stato riparazione
- Severity: medium
- File: packages/backend/src/services/preventivi-service.ts
- Problem: setPreventivoStatoForTests aggiornava lo stato preventivo ma non sincronizzava sempre lo stato riparazione associato, introducendo stato test-store incoerente.
- Fix: aggiunta sincronizzazione 	estRiparazioneStatoById per stati INVIATO, APPROVATO, RIFIUTATO e reset a PREVENTIVO_EMESSO su BOZZA.
- Evidence: packages/backend/src/services/preventivi-service.ts:1436, packages/backend/src/services/preventivi-service.ts:1443, packages/backend/src/services/preventivi-service.ts:1450
- Status: RESOLVED