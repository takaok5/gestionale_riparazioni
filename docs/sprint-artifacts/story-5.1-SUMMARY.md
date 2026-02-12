---
story_id: '5.1'
completed: '2026-02-12T14:57:18+01:00'
duration: 'session'
---

# Story 5.1 Summary

## Stats

- Files created: 11
- Files modified: 5
- Lines added: 646
- Tests added: 11
- Commits: 1

## Decisions Made

- Implementata la creazione articolo dentro `anagrafiche-service.ts` per riuso pattern esistenti di anagrafiche (validazioni, test-store, DB path).
- Introdotta route dedicata `packages/backend/src/routes/articoli.ts` con guard ADMIN e mapping errori dominio coerente.
- Normalizzato `codiceArticolo` e `categoria` in uppercase per evitare duplicati case-variant e incoerenza dati.

## Deviations from Plan

- Nessuna deviazione architetturale; unico adattamento operativo: `docs/sprint-artifacts/atdd-tests-5.1.txt` salvato con path test relativo al workspace (`src/__tests__/...`) per compatibilita' con script test monorepo.

## Issues Encountered

- Esecuzione gate bash su Windows: risolto usando script bash con newline LF e invocazioni `cmd.exe /c npm ...`.
- Seed fornitore test-store: aggiunto `fornitoreId=3` senza alterare la sequenza legacy dei codici fornitore (fix regressione su test esistenti).

## Lessons Learned

- In monorepo workspace, i path test in artifact pipeline devono essere allineati al cwd del workspace per evitare falsi “No test files found”.
- Per script bash generati da PowerShell e' utile forzare LF per evitare side effects da CRLF.
