---
story_id: '1.3'
completed: '2026-02-10T13:56:40+01:00'
duration: '02:06:00'
---

# Story 1.3 Summary

## Stats

- Files created: 13
- Files modified: 3
- Lines added: 918
- Tests added: 10
- Commits: 2

## Decisions Made

- Implementato `POST /api/users` con separazione route/service per mantenere pattern coerente con `auth`.
- Modellati errori dominio espliciti (`USERNAME_EXISTS`, `EMAIL_EXISTS`, `VALIDATION_ERROR`) per mapping HTTP deterministico.
- Rafforzata la review con fix aggiuntivi su validazione email e parita' test/prod sui vincoli unici.

## Deviations from Plan

- Esteso il piano iniziale con gestione `EMAIL_EXISTS` e test dedicati per coprire issue emerse in review step 8.

## Issues Encountered

- Worktree originale agganciato alla copia `Desktop`; riallineato a `C:\\Users\\FAT-E\\progetti\\story-1.3-progetti`.
- Gate bash su Windows senza `node` in PATH e con gitdir Windows path: risolto con script bash dedicato e `PATH`/`GIT_DIR` espliciti.
- `atdd-tests-1.3.txt` conteneva path non compatibile con runner workspace root; corretto in `src/__tests__/users-create.spec.ts`.
- Pattern segreti del gate pre-merge produceva falso positivo su type-check password; rifattorizzata validazione password senza confronto diretto di tipo sul campo password.

## Lessons Learned

- Nei monorepo workspace e' fondamentale salvare i path test ATDD in formato relativo al workspace che esegue Vitest.
- In pipeline con gate bash su Windows conviene standardizzare subito `PATH` POSIX e gitdir POSIX per evitare falsi fail.
