# Review 8.4

### Issue 1
Status: RESOLVED

Problem:
- `listPortalOrdini` mappava qualsiasi errore del service (`VALIDATION_ERROR` incluso) a `SERVICE_UNAVAILABLE`, restituendo 500 invece di 400 su query invalida.

Fix:
- Aggiunto `VALIDATION_ERROR` a `PortalOrdiniFailureCode` in `packages/backend/src/services/auth-service.ts`.
- In `packages/backend/src/routes/auth.ts` i responder portal ordini ora mappano `VALIDATION_ERROR` a HTTP 400 con envelope `VALIDATION_ERROR`.

Verification:
- `npm run typecheck` PASS.
- `npm test -- --run src/__tests__/portal-ordini-list-detail.atdd.spec.ts` PASS.

### Issue 2
Status: RESOLVED

Problem:
- Il calcolo `importi` nel dettaglio ordine non forzava arrotondamento a 2 decimali, con rischio di valori floating inconsistenti.

Fix:
- Introdotta helper `roundCurrency` in `packages/backend/src/services/auth-service.ts`.
- Applicato arrotondamento a `totalePreventivi` e `saldoResiduo`.

Verification:
- `npm run lint` PASS.
- Test ATDD 8.4 PASS.

### Issue 3
Status: RESOLVED

Problem:
- `timeline` poteva risultare vuota per ordini senza storico stati, riducendo osservabilita' lato client.

Fix:
- In `getPortalOrdineDettaglio` aggiunto fallback: se `statiHistory` e' vuoto, viene emesso un evento timeline con stato corrente.

Verification:
- `npm test -- --run` PASS (suite completa).
- Endpoint dettaglio continua a soddisfare AC-3/AC-4 della story 8.4.
