# Review Story 4.3

### Issue 1
- Severity: Medium
- Status: RESOLVED
- Problem: il flusso di invio non validava lo stato della riparazione prima della transizione verso `IN_ATTESA_APPROVAZIONE`, con rischio di bypass delle regole di dominio.
- Fix: aggiunto controllo esplicito su stato sorgente `PREVENTIVO_EMESSO` in `packages/backend/src/services/preventivi-service.ts` per path test-store e Prisma.
- Evidence: `packages/backend/src/services/preventivi-service.ts` (check `riparazioneStato !== "PREVENTIVO_EMESSO"` e `row.riparazione.stato !== "PREVENTIVO_EMESSO"`).

### Issue 2
- Severity: High
- Status: RESOLVED
- Problem: in caso di invio email fallito, il codice iniziale non modellava un adapter di invio e non garantiva fallback coerente con errore applicativo dedicato.
- Fix: introdotti `generatePreventivoPdfDocument` e `sendPreventivoEmail`, con gestione `EMAIL_SEND_FAILED` prima delle mutazioni persistenti.
- Evidence: `packages/backend/src/services/preventivi-service.ts` (funzioni helper e blocchi `try/catch` in `inviaPreventivoInTestStore` e `inviaPreventivoInDatabase`).

### Issue 3
- Severity: Medium
- Status: RESOLVED
- Problem: gli ATDD AC-3/AC-4 non erano deterministici senza hook dedicati per simulare email mancante e failure email.
- Fix: aggiunti helper test-only `setPreventivoClienteEmailForTests` e `setPreventivoEmailFailureForTests`, usati in `preventivi-send-atdd.spec.ts`.
- Evidence: `packages/backend/src/services/preventivi-service.ts` (export helper test) e `packages/backend/src/__tests__/preventivi-send-atdd.spec.ts` (setup AC-3/AC-4).
