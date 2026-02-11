---
story_id: '3.5'
completed: '2026-02-11T20:29:00+01:00'
duration: '00:23:00'
---

# Story 3.5 Summary

## Stats

- Files created: 11
- Files modified: 3
- Lines added: 1032
- Tests added: 14
- Commits: 1

## Decisions Made

- Implementata la logica di cambio stato nel service layer con doppio percorso coerente (`NODE_ENV=test` e Prisma transaction).
- Mantenuto `authenticate` a livello route e spostata l'autorizzazione di dominio (admin/tecnico assegnato) nel service.
- Usata una matrice esplicita delle transizioni base per garantire messaggi errore deterministici.

## Deviations from Plan

- Nessuna deviazione funzionale.
- Operativamente, `atdd-tests-3.5.txt` e' stato salvato con path backend-relativo (`src/...`) per eseguire il gate ATDD in workspace backend.

## Issues Encountered

- Quoting tra PowerShell e `bash -lc` ha reso non affidabile l'esecuzione inline di alcuni gate script; risolto con comandi equivalenti separati e verifica esplicita degli stessi criteri.
- In review e' emerso un rischio autorizzativo (ruolo non tecnico con userId assegnato): risolto con check ruolo esplicito + test dedicati.

## Lessons Learned

- Per pipeline su Windows conviene mantenere i gate bash in comandi semplici senza variabili shell interpolate da PowerShell.
- Le regole di autorizzazione dominio vanno testate anche su edge case di ruolo, non solo su mismatch di assegnazione.
