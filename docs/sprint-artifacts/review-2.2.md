# Review Story 2.2

## Scope
Diff reviewed from `origin/main..HEAD` with focus on:
- `packages/backend/src/services/anagrafiche-service.ts`
- `packages/backend/src/routes/clienti.ts`
- `packages/backend/src/__tests__/clienti-list-search-atdd.spec.ts`

### Issue 1
Status: RESOLVED

Problem:
`tipologia` vuota (`?tipologia=`) veniva trattata come assenza filtro invece che input invalido, riducendo la robustezza del contratto di validazione.

Fix applied:
Aggiornata la normalizzazione del filtro per restituire `invalid_enum` su stringa vuota.

Evidence:
- `packages/backend/src/services/anagrafiche-service.ts:707`
- `packages/backend/src/services/anagrafiche-service.ts:776`
- `packages/backend/src/__tests__/clienti-list-search-atdd.spec.ts:225`

### Issue 2
Status: RESOLVED

Problem:
Mancava un limite massimo su `limit`, con rischio di query troppo pesanti e payload eccessivi.

Fix applied:
Introdotto `MAX_LIST_LIMIT=100` e validazione `too_large` in fase di parse query.

Evidence:
- `packages/backend/src/services/anagrafiche-service.ts:707`
- `packages/backend/src/services/anagrafiche-service.ts:759`
- `packages/backend/src/__tests__/clienti-list-search-atdd.spec.ts:235`

### Issue 3
Status: RESOLVED

Problem:
I test AC-1 erano accoppiati al numero fisso di fixture iniziali (assumevano implicitamente baseline = 1), rendendo i test fragili a cambi di seed.

Fix applied:
Reso dinamico il baseline counting (`getCurrentClientiTotal`) e calcolo dei record da creare per raggiungere il target richiesto.

Evidence:
- `packages/backend/src/__tests__/clienti-list-search-atdd.spec.ts:55`
- `packages/backend/src/__tests__/clienti-list-search-atdd.spec.ts:71`
- `packages/backend/src/__tests__/clienti-list-search-atdd.spec.ts:94`

## Re-Verification
- `npm run lint` -> PASS
- `npm test -- --run` -> PASS
- Story task markers `[x]` checked against implemented files and tests.
