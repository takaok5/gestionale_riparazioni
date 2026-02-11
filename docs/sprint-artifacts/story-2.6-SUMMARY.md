---
story_id: "2.6"
completed: "2026-02-11T02:59:10+01:00"
duration: "00:40:19"
---

# Story 2.6 Summary

## Stats

- Files created: 11
- Files modified: 4
- Lines added: 1296
- Tests added: 8
- Commits: 1

## Decisions Made

- Mantenuto il pattern route/service gia' usato in `clienti.ts` e `anagrafiche-service.ts` per coerenza API.
- Introdotto seed helper test-only (`seedFornitoreDetailScenarioForTests`) per supportare AC con `id=3` senza rompere i test legacy su fixture base.
- Estesa la validazione update fornitore per includere `categoria` nel vincolo `at_least_one_field_required`.
- Aggiornato schema Prisma con `OrdineFornitore` e implementata query DB per ordini fornitore con fallback sicuro `P2021`.

## Deviations from Plan

- Nessuna deviazione funzionale sugli AC.
- Adeguamento operativo: il path in `atdd-tests-2.6.txt` e' stato normalizzato a path workspace (`src/__tests__/...`) per compatibilita' con il comando test multi-workspace.

## Issues Encountered

- Bash su Windows non risolveva `node` nei gate: risolto usando `cmd.exe /c npm ...` nei gate bash.
- Script gate review con conteggio `OPEN_COUNT` ambiguo (`0\\n0`): corretto parsing nello script.
- Quoting PowerShell/bash in alcuni gate: stabilizzato con script `.sh` temporanei e cleanup finale.

## Lessons Learned

- Nei workspace npm, i file test in artefatti pipeline devono essere path relativi al workspace target.
- Per gate bash su Windows conviene standardizzare il bridge `cmd.exe /c` per comandi Node.
- L'aggiunta di helper test-only puo' evitare regressioni su fixture legacy mantenendo AC rigidi (es. id specifici).
