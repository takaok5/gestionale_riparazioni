---
story_id: "5.6"
completed: "2026-02-12T18:25:30+01:00"
duration: "session-based"
---

# Story 5.6 Summary

## Stats

- Files created: 11
- Files modified: 4
- Lines added: 987
- Lines deleted: 7
- Tests added: 15
- Commits: 8

## Decisions Made

- Implementato `PATCH /api/ordini/:id/stato` con controllo dominio nel service invece di regole hardcoded nel router.
- Mantenuta doppia implementazione test-store/database in `anagrafiche-service` con regole di transizione coerenti.
- Isolata la suite ATDD in `ordini-stato-atdd.spec.ts` per separare la story 5.6 dalla story 5.5.

## Deviations from Plan

- Nessuna deviazione sostanziale di implementazione; l'unica variazione e' stata formalizzare i test stato in file dedicato (`ordini-stato-atdd.spec.ts`) invece di estendere il file dei test create.

## Issues Encountered

- Gate bash su Windows non trovava `node` nel PATH bash; verifiche test sono state eseguite con successo dal terminale PowerShell.
- Il path dei test in `atdd-tests-5.6.txt` doveva essere workspace-relative (`src/__tests__/...`) per compatibilita' con `npm run test --workspaces`.

## Lessons Learned

- Nei workflow workspace npm, salvare path test relativi al package evita falsi negativi nei gate.
- Le regole di autorizzazione cross-role vanno centralizzate nella validazione dominio per evitare bypass involontari.
