---
story_id: '4.2'
completed: '2026-02-12T03:52:44.7295618+01:00'
duration: '00:15:31'
---

# Story 4.2 Summary

## Stats

- Files created: 11
- Files modified: 3
- Lines added: 580
- Tests added: 10
- Commits: 1

## Decisions Made

- Implementato PUT /api/preventivi/:id nel router esistente mantenendo il pattern espond*Failure + buildErrorResponse.
- Unificata la validazione delle voci con parseVociPayload per evitare duplicazione tra create e update.
- Gestito update su doppio path (test-store + Prisma transaction) per evitare divergenze tra test e runtime.
- Introdotto helper test setPreventivoStatoForTests con guardia stati ammessi per setup deterministici AC-3/AC-4.

## Deviations from Plan

- Nessuna deviazione funzionale; aggiunti due test regressivi extra su PUT not-found durante review per copertura contratto API.

## Issues Encountered

- In ambiente bash su Windows 
ode non era nel PATH; i gate con 
pm sono stati eseguiti richiamando PowerShell nei wrapper bash.
- tdd-tests-4.2.txt inizialmente con BOM UTF-8 causava filtro test non trovato; corretto a encoding ASCII.

## Lessons Learned

- Nei workspace npm multi-package conviene salvare path test compatibili con il workspace target (src/__tests__/...) per evitare mismatch.
- I gate con parsing rigido (es. blocchi da 30 righe) richiedono AC compatti anche quando i payload sono dettagliati.
