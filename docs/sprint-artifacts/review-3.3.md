# Review Story 3.3

Story: `3.3`  
Reviewer: pipeline step-08  
Date: `2026-02-11`

### Issue 1
Status: RESOLVED

Problem: Il path database del dettaglio ritornava collezioni vuote (`statiHistory`, `preventivi`, `ricambi`) invece di mappare i dati relazionali previsti dalla story.

Evidence:
- `packages/backend/src/services/riparazioni-service.ts:1102`
- `packages/backend/src/services/riparazioni-service.ts:1195`

Fix applied:
- Estesa la `findUnique` con select delle relazioni `statiHistory`, `preventivi`, `ricambi`.
- Mappate le relazioni nel payload API (`dataOra` ISO, `note` fallback, mapping campi numerici/stringa).

Verification:
- `npm --workspace @gestionale/backend test -- --run src/__tests__/riparazioni-detail-atdd.spec.ts` PASS.
- `npm test -- --run` PASS.

### Issue 2
Status: RESOLVED

Problem: Nel test store, gli eventi di storico stato potevano avere timestamp identici con fake timers fissi, riducendo la stabilita del requisito "ordinamento cronologico".

Evidence:
- `packages/backend/src/services/riparazioni-service.ts:1298`

Fix applied:
- In `setRiparazioneStatoForTests` introdotto offset incrementale sui millisecondi (`Date.now() + target.statiHistory.length`) prima del push.

Verification:
- `riparazioni-detail-atdd.spec.ts` valida `dataOra` ISO e cardinalita storico (`3`) in GREEN.

### Issue 3
Status: RESOLVED

Problem: Il payload dettaglio del test store esponeva array per riferimento diretto, consentendo mutazioni esterne dello stato in-memory tra chiamate.

Evidence:
- `packages/backend/src/services/riparazioni-service.ts:748`

Fix applied:
- In `toDettaglioPayload` aggiunta copia difensiva di `statiHistory`, `preventivi`, `ricambi` via `map(... => ({ ...entry }))`.

Verification:
- Suite backend e full suite workspace passano dopo il fix.

## Task Evidence Check

- Task 1 `[x]` evidenza route/detail + mapping errori:
  - `packages/backend/src/routes/riparazioni.ts:94`
  - `packages/backend/src/routes/riparazioni.ts:151`
- Task 2 `[x]` evidenza service/detail + parser + test-store:
  - `packages/backend/src/services/riparazioni-service.ts:569`
  - `packages/backend/src/services/riparazioni-service.ts:1083`
  - `packages/backend/src/services/riparazioni-service.ts:1255`
- Task 3 `[x]` evidenza schema relazioni:
  - `packages/backend/prisma/schema.prisma:127`
  - `packages/backend/prisma/schema.prisma:137`
- Task 4 `[x]` evidenza test ATDD:
  - `packages/backend/src/__tests__/riparazioni-detail-atdd.spec.ts:70`

False positives found: `0`
