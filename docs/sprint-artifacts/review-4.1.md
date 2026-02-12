# Review Story 4.1

## Scope Reviewed

- `packages/backend/src/services/preventivi-service.ts`
- `packages/backend/src/routes/preventivi.ts`
- `packages/backend/src/__tests__/preventivi-create-atdd.spec.ts`
- `packages/backend/src/__tests__/preventivi-detail-atdd.spec.ts`
- `packages/backend/prisma/schema.prisma`
- `packages/backend/src/index.ts`

### Issue 1
Status: RESOLVED

Problema:
- Nel path database, la creazione preventivo non persisteva `subtotale`, `iva` e le `voci`, quindi il dettaglio DB non era coerente con il contratto AC.

Fix applicato:
- Aggiornato `createPreventivoInDatabase` in `packages/backend/src/services/preventivi-service.ts` per salvare `subtotale`, `iva` e nested create di `voci`.
- Esteso `schema.prisma` con campi `subtotale`, `iva` e modello `PreventivoVoce`.

Verifica:
- `npm run typecheck` e `npm test` passano su tutta la repo.

### Issue 2
Status: RESOLVED

Problema:
- Nel path database, `getPreventivoDettaglioInDatabase` restituiva stato hardcoded `"BOZZA"` invece del valore persistito.

Fix applicato:
- Il payload ora usa `row.stato` e mappa anche le `voci` persistite.

Verifica:
- Test globali verdi; nessuna regressione rilevata su backend suite.

### Issue 3
Status: RESOLVED

Problema:
- Nei test `preventivi-create-atdd`, i fake timers non venivano ripristinati, con rischio di leakage tra test file.

Fix applicato:
- Aggiunto `afterEach(() => vi.useRealTimers())` in `packages/backend/src/__tests__/preventivi-create-atdd.spec.ts`.

Verifica:
- Esecuzione completa `npm test` verde su backend + workspace.
