# Story 4.6 ATDD Map

## Coverage Matrix

| AC | Scenario | Test case |
| --- | --- | --- |
| AC-1 | Pagamento totale 244.00 su fattura id=8 porta stato PAGATA | `packages/backend/src/__tests__/fatture-pagamenti-atdd.spec.ts` - test `Tests AC-1: Given fattura id=8 totale 244.00 senza pagamenti ...` |
| AC-1 | Dopo pagamento totale, dettaglio fattura mostra residuo 0.00 | `packages/backend/src/__tests__/fatture-pagamenti-atdd.spec.ts` - test `Tests AC-1: Given pagamento totale registrato ...` |
| AC-2 | Secondo pagamento 144.00 dopo pagamento 100.00 chiude la fattura | `packages/backend/src/__tests__/fatture-pagamenti-atdd.spec.ts` - test `Tests AC-2: Given pagamento iniziale 100.00 ...` |
| AC-2 | Dettaglio fattura espone due pagamenti dopo due POST | `packages/backend/src/__tests__/fatture-pagamenti-atdd.spec.ts` - test `Tests AC-2: Given due pagamenti 100+144 ...` |
| AC-3 | Overpayment da 10.00 su fattura gia saldata ritorna 400 + messaggio | `packages/backend/src/__tests__/fatture-pagamenti-atdd.spec.ts` - test `Tests AC-3: Given fattura gia saldata 244.00 ...` |
| AC-3 | Overpayment non altera numero pagamenti e residuo | `packages/backend/src/__tests__/fatture-pagamenti-atdd.spec.ts` - test `Tests AC-3: Given overpayment rifiutato ...` |
| AC-4 | GET /api/fatture/8 restituisce pagamento da 100.00 e residuo 144.00 | `packages/backend/src/__tests__/fatture-pagamenti-atdd.spec.ts` - test `Tests AC-4: Given pagamento da 100.00 esiste ... residuo 144` |
| AC-4 | GET /api/fatture/8 espone prima riga pagamenti con importo 100.00 | `packages/backend/src/__tests__/fatture-pagamenti-atdd.spec.ts` - test `Tests AC-4: Given pagamento da 100.00 esiste ... prima riga` |

## Notes

- Suite eseguita in ambiente `NODE_ENV=test` usando test-store backend.
- Tutti i casi AC 4.6 hanno almeno 2 test dedicati.
