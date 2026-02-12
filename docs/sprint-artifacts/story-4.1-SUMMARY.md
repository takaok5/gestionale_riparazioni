---
story_id: "4.1"
completed: "2026-02-12T02:35:00+01:00"
duration: "00:21:00"
---

# Story 4.1 Summary

## Stats

- Files created: 13
- Files modified: 4
- Lines added: 1385
- Tests added: 8
- Commits: 1

## Decisions Made

- Introdotti moduli dedicati `preventivi` (route + service) invece di estendere `riparazioni.ts` per ridurre accoppiamento.
- Implementato dual path test-store/database nel service preventivi per coerenza con pattern backend esistente.
- Aggiunto seed test deterministico per `preventivo id=21` in modo da coprire AC-2 con dati specifici.

## Deviations from Plan

- Nessuna deviazione funzionale; il piano e' stato seguito e affinato in review con hardening sul path database.

## Issues Encountered

- Esecuzione gate bash inizialmente non trovava `node` nel PATH WSL; validazione definitiva eseguita da shell PowerShell/root workspace.
- Quoting bash/powershell sui gate inline: risolto con script gate temporanei `.sh`.

## Lessons Learned

- Nei workflow ibridi Windows+WSL conviene normalizzare presto la strategia di esecuzione gate.
- Gli AC numerici (id/totali) migliorano nettamente la testabilita' e riducono ambiguita' in review.
