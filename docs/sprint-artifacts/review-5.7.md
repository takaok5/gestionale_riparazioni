# Review 5.7

## Scope

- `packages/backend/src/routes/ordini.ts`
- `packages/backend/src/services/anagrafiche-service.ts`
- `packages/backend/src/__tests__/ordini-ricezione-atdd.spec.ts`
- `packages/backend/prisma/schema.prisma`

### Issue 1 - Missing 404 mapping for articolo not found in receive flow

Status: RESOLVED

Problem:
- Nel flow `POST /api/ordini/:id/ricevi`, il caso articolo non trovato veniva ricondotto a errore non specifico/500 invece di `404 ARTICOLO_NOT_FOUND`.

Fix:
- Aggiunto codice dominio `ARTICOLO_NOT_FOUND` in `ReceiveOrdineFornitoreResult`.
- Mappato l'errore in route con risposta `404` e codice coerente.

Evidence:
- `packages/backend/src/services/anagrafiche-service.ts`
- `packages/backend/src/routes/ordini.ts`

### Issue 2 - Incomplete sad-path assertion in AC-4 test

Status: RESOLVED

Problem:
- Nel secondo test AC-4 era verificata solo la giacenza invariata, senza assert esplicito sullo status HTTP di errore.

Fix:
- Aggiunto assert `expect(response.status).toBe(400)` nel test AC-4 relativo alla invarianza stock.

Evidence:
- `packages/backend/src/__tests__/ordini-ricezione-atdd.spec.ts`

### Issue 3 - Missing hardening coverage for malformed receive payload

Status: RESOLVED

Problem:
- Mancavano test su payload con articolo duplicato e quantità ricevuta eccedente il residuo, lasciando scoperta la validazione difensiva.

Fix:
- Aggiunti 2 test hardening:
- duplicate `articoloId` in `voci` -> `400 VALIDATION_ERROR`
- `quantitaRicevuta` oltre residuo -> `400 VALIDATION_ERROR` con messaggio coerente

Evidence:
- `packages/backend/src/__tests__/ordini-ricezione-atdd.spec.ts`

## Verification rerun

- `npm run lint` -> PASS
- `npm test` -> PASS
