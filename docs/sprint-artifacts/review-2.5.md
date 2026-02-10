# Review Story 2.5

### Issue 1 - AC-1 ordering test non deterministico
Status: RESOLVED

- Problem: il test `AC-1 should return fornitori ordered by id asc` assumeva almeno due record senza seeding esplicito, causando `TypeError` su `data[1]`.
- Fix: aggiunto seeding esplicito di due fornitori nel test prima della query lista.
- Evidence: `packages/backend/src/__tests__/fornitori-list-search-atdd.spec.ts` (blocco AC-1, secondo `it`).

### Issue 2 - AC-3 exclusion test con fixture insufficiente
Status: RESOLVED

- Problem: il test `AC-3 should exclude non-matching suppliers` verificava presenza di match `SRL` senza creare un record SRL nello stesso test (`beforeEach` resetta lo store).
- Fix: aggiunti fixture espliciti (`Tecnologia SRL`, `Laboratorio Alfa`) all'inizio del test.
- Evidence: `packages/backend/src/__tests__/fornitori-list-search-atdd.spec.ts` (blocco AC-3, secondo `it`).

### Issue 3 - Incoerenza path ATDD tra step 5 e gate GREEN
Status: RESOLVED

- Problem: `docs/sprint-artifacts/atdd-tests-2.5.txt` conteneva path root (`packages/backend/...`) che in workspace backend non veniva risolto da Vitest (`No test files found`).
- Fix: normalizzato il path test a formato backend (`src/__tests__/fornitori-list-search-atdd.spec.ts`) per l'esecuzione nel gate GREEN.
- Evidence: `docs/sprint-artifacts/atdd-tests-2.5.txt`.

## Context Maintenance

- CLAUDE.md shards: nessuna nuova directory applicativa significativa creata in questa story.
- Root `CLAUDE.md`: nessun nuovo comando, stack o convenzione da aggiungere.
- `_bmad/bmm/config.yaml`: path verificati (`docs/prd.md`, `docs/architecture.md`) e validi.
