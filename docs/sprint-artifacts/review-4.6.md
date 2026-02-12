# Review 4.6

### Issue 1: BOM nei nuovi file TypeScript
Status: RESOLVED

- Problema: i file creati con `Set-Content -Encoding UTF8` includevano BOM, visibile come carattere `﻿` all'inizio di `import`.
- Impatto: rumore nei diff, rischio di inconsistenze tooling su parser/linters.
- Fix applicato: riscrittura file senza BOM (`UTF8Encoding(false)`) per:
  - `packages/backend/src/routes/fatture.ts`
  - `packages/backend/src/services/fatture-service.ts`
  - `packages/backend/src/__tests__/fatture-pagamenti-atdd.spec.ts`
- Verifica: primi byte `69 6D 70` (`imp`) su tutti e tre i file.

### Issue 2: Timer fake non ripristinati nei test ATDD 4.6
Status: RESOLVED

- Problema: la suite nuova impostava `vi.useFakeTimers()` in `beforeEach` senza reset esplicito.
- Impatto: possibile leakage tra test suite con clock fittizio persistente.
- Fix applicato: aggiunto `afterEach(() => { vi.useRealTimers(); })` in `packages/backend/src/__tests__/fatture-pagamenti-atdd.spec.ts:120`.
- Verifica: suite 4.6 passa (`8/8`) e full suite verde.

### Issue 3: dataPagamento invalidabile solo implicitamente
Status: RESOLVED

- Problema: input `dataPagamento` non conforme poteva essere normalizzato implicitamente alla data corrente.
- Impatto: dati silenziosamente alterati e perdita di tracciabilita' input client.
- Fix applicato:
  - validazione esplicita formato `YYYY-MM-DD` in `packages/backend/src/services/fatture-service.ts:264-278`
  - `toIsoDate` semplificata per non mascherare input invalidi (`packages/backend/src/services/fatture-service.ts:196`)
- Verifica: lint/typecheck/build/test tutti passati.

## Task Evidence

- Task service pagamenti: evidenza in `packages/backend/src/services/fatture-service.ts:502` (`createPagamento`) e `packages/backend/src/services/fatture-service.ts:520` (`getFatturaDetail`).
- Task route pagamenti/detail: evidenza in `packages/backend/src/routes/fatture.ts:209` e `packages/backend/src/routes/fatture.ts:230`.
- Task test ATDD: evidenza in `packages/backend/src/__tests__/fatture-pagamenti-atdd.spec.ts` (4 describe AC, 8 test).
- Task ATDD map: evidenza in `docs/sprint-artifacts/story-4.6-ATDD-MAP.md`.

## Final Check

- `npm run lint`: PASS
- `npm test -- --run`: PASS
