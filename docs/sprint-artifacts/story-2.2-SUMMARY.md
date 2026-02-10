---
story_id: '2.2'
completed: '2026-02-10T21:29:24.9633847+01:00'
duration: '00:26:23'
---

# Story 2.2 Summary

## Stats

- Files created: 11
- Files modified: 4
- Lines added: 1085
- Tests added: 10
- Commits: 7

## Decisions Made

- Implementata la lista/ricerca clienti nel service con parser dedicato e doppio backend (	est store + Prisma) mantenendo output { data, meta }.
- Mantenuta l'autenticazione route con uthenticate per coerenza con policy clienti gia esistente.
- Introdotto limite massimo limit=100 per proteggere performance e payload.

## Deviations from Plan

- Task route registration su packages/backend/src/index.ts: nessuna modifica necessaria, il mount /api/clienti era gia presente.
- File ATDD (tdd-tests-2.2.txt) convertito a path relativo backend (src/__tests__/...) per compatibilita con workspace npm durante i gate.

## Issues Encountered

- Quoting Bash su Windows e BOM nel file ATDD hanno causato failure gate; risolto con script bash dedicati e scrittura UTF-8 senza BOM.
- Review gate custom aveva parsing ambiguo su conteggio issue aperte; corretto e rieseguito con esito positivo.

## Lessons Learned

- Nei workspace npm conviene salvare path test relativi al package target quando si usa itest run filtrato.
- Nei gate cross-shell su Windows e piu robusto eseguire script .sh espliciti in Git Bash.
- I test ATDD devono minimizzare dipendenze implicite dal seed iniziale per evitare fragilita.
