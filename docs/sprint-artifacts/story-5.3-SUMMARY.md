---
story_id: '5.3'
completed: '2026-02-12T16:00:43+01:00'
duration: '34.7m'
---

# Story 5.3 Summary

## Stats

- Files created: 10
- Files modified: 13
- Lines added: 1324
- Lines deleted: 6
- Tests added: 10
- Commits: 8

## Decisions Made

- Implementato POST /api/articoli/:articoloId/movimenti con contratto risposta { movimento, giacenza } e handler errori coerente con uildErrorResponse.
- Mantenuto pattern ok/failure in nagrafiche-service con parser dedicato e branch test/db separati.
- Per AC-5 applicata logica atomica su database (updateMany condizionale su giacenza >= requested) e controllo concorrente in ATDD.

## Deviations from Plan

- Nessuna deviazione funzionale; non e stato necessario introdurre nuove directory o dipendenze.

## Issues Encountered

- Script gate bash su Windows richiedeva invocazione cmd.exe per i comandi npm e normalizzazione newline LF.
- Il parsing iniziale di iferimento accettava tipi invalidi: corretto in review step.
- Primo approccio DB decrement non era sufficientemente atomico: corretto con update condizionale.

## Lessons Learned

- Nei test concorrenti conviene asserire sempre i preload per evitare falsi positivi cascata.
- In pipeline cross-shell (PowerShell + Bash) conviene standardizzare subito i gate script in LF.
