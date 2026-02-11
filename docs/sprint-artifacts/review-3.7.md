# Review Story 3.7

## Scope
- `packages/backend/src/services/riparazioni-service.ts`
- `packages/backend/src/routes/riparazioni.ts`
- `packages/backend/src/__tests__/riparazioni-annullamento-admin-atdd.spec.ts`
- `packages/backend/src/__tests__/riparazioni-stato-preventivo-atdd.spec.ts`
- `docs/sprint-artifacts/atdd-tests-3.7.txt`

### Issue 1 - Incoerenza note tra test-store e path database
Status: RESOLVED

Problem:
- Nel path DB la history salvava `note: payload.note` (undefined quando omessa), mentre test-store salvava sempre stringa (`payload.note ?? ""`). Questo poteva generare divergenze tra ambienti.

Fix:
- Uniformata la persistenza DB a `note: payload.note ?? ""`.

Evidence:
- `packages/backend/src/services/riparazioni-service.ts:1605`
- `packages/backend/src/services/riparazioni-service.ts:1690`

### Issue 2 - Formato atdd-tests non compatibile con esecuzione workspace
Status: RESOLVED

Problem:
- `docs/sprint-artifacts/atdd-tests-3.7.txt` conteneva path `packages/backend/...`, che in esecuzione test a livello workspace poteva causare filtro errato nel backend.

Fix:
- Normalizzato il path in formato backend-relative: `src/__tests__/...`.

Evidence:
- `docs/sprint-artifacts/atdd-tests-3.7.txt:1`

### Issue 3 - Gap regressione: mancava test esplicito sul divieto tecnico in flusso preventivo
Status: RESOLVED

Problem:
- Dopo la regola "cancel solo admin", mancava un test dedicato nel pacchetto preventivo che verificasse il 403 con messaggio esatto e stato invariato per tecnico.

Fix:
- Aggiunti due test `AC-4b` in `riparazioni-stato-preventivo-atdd.spec.ts` per blocco tecnico + verifica invarianti.

Evidence:
- `packages/backend/src/__tests__/riparazioni-stato-preventivo-atdd.spec.ts:230`
- `packages/backend/src/__tests__/riparazioni-stato-preventivo-atdd.spec.ts:245`

## Re-Verification
- `npm run lint` -> PASS
- `npm test -- --run` -> PASS
- Test mirati story/regressione stato -> PASS
