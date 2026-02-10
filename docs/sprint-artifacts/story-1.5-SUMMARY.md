---
story_id: '1.5'
completed: '2026-02-10T16:02:50+01:00'
duration: '00:30:54'
---

# Story 1.5 Summary

## Stats

- Files created: 12
- Files modified: 4
- Lines added: 996
- Lines removed: 17
- Tests added: 10
- Commits: 1

## Decisions Made

- Implementata la logica di update ruolo/disattivazione direttamente in users-service mantenendo doppio percorso NODE_ENV=test e Prisma reale.
- Introdotto errore dominio LAST_ADMIN_DEACTIVATION_FORBIDDEN con mapping esplicito in route (400 + messaggio deterministico).
- Aggiunti helper test-only (setUserRoleForTests, setUserIsActiveForTests) con guard ambiente per setup AC deterministico.
- Estesa la suite ATDD con copertura addizionale su validazione userId e USER_NOT_FOUND.

## Deviations from Plan

- Nessuna deviazione funzionale sulle AC.
- Estesa la copertura test oltre il piano minimo con due test review aggiuntivi (validazione/not-found).

## Issues Encountered

- Esecuzione gate bash in worktree Windows con path Git: risolto usando script bash LF e comandi cmd.exe/git.exe dove necessario.
- Ambiente iniziale senza dipendenze (itest non trovato): risolto con 
pm install nel worktree.

## Lessons Learned

- In ambiente Windows+worktree, script gate devono evitare CRLF e differenze path shell per mantenere affidabilita' degli exit code.
- I test AC-driven sono piu' stabili quando il precondition setup e' esplicito nel test stesso, non implicito nei seed.
