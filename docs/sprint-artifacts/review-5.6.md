## Step 8 Review - Story 5.6

### Issue 1
Problem: transizioni stato ordine erano applicabili anche da ruoli non admin (salvo caso specifico AC-7), con rischio di escalation permessi.

Fix:
- inserita guardia dominio globale per ruoli non admin in `packages/backend/src/services/anagrafiche-service.ts:1878`.
- mantenuta eccezione AC-7 con messaggio specifico `Cannot cancel order in SPEDITO state`.
- aggiunto test di hardening in `packages/backend/src/__tests__/ordini-stato-atdd.spec.ts:230`.

Status: RESOLVED

### Issue 2
Problem: richiesta di transizione verso lo stesso stato produceva errore generico di transizione invalida, poco diagnosticabile.

Fix:
- introdotto errore dedicato `Order is already in {state} state` in `packages/backend/src/services/anagrafiche-service.ts:1854`.

Status: RESOLVED

### Issue 3
Problem: task story marcato `[x]` puntava ancora al file test errato (`ordini-create-atdd.spec.ts`), creando evidenza incoerente (false-positive documentale).

Fix:
- aggiornato task ATDD con path reale `packages/backend/src/__tests__/ordini-stato-atdd.spec.ts` in `docs/stories/5.6.gestione-stato-ordine.story.md:70`.

Status: RESOLVED
