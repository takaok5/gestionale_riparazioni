---
story_id: '4.7'
completed: '2026-02-12T13:52:00+01:00'
duration: '00:36:00'
---

# Story 4.7 Summary

## Stats

- Files created: 10
- Files modified: 3
- Lines added: 1081
- Tests added: 12
- Commits: 1

## Decisions Made

- Esteso `fatture-service` con list endpoint in test-store (`page/limit/stato/dataDa/dataA`) per rispettare AC-1/2/3/6.
- Implementato `GET /api/fatture/:id/pdf` con header `Content-Type`/`Content-Disposition` e payload PDF minimale per AC-5.
- Mantenuta la guardia ruolo `COMMERCIALE` su tutti gli endpoint fatture, coerente con pattern esistente.

## Deviations from Plan

- Nessuna deviazione funzionale.
- Lo step di commit e summary e' stato chiuso con due commit separati per evitare amend.

## Issues Encountered

- Quoting `bash -lc` su PowerShell ha richiesto wrapper `.sh` temporaneo per gate/checklist.
- Verifica `git diff --diff-filter=A` non rilevava file test untracked nel RED gate; risolto salvando esplicitamente `atdd-tests-4.7.txt`.
- Review step: migliorata validazione date e coerenza filename/contenuto PDF dopo riscontro issue reali.

## Lessons Learned

- Nelle pipeline su Windows conviene standardizzare l'esecuzione gate bash via file script temporaneo.
- Per AC su file binari conviene fissare in story assert su header e naming, non su implementazioni implicite.
