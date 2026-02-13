---
story_id: '7.5'
completed: '2026-02-13T13:54:59.7218236+01:00'
duration: '01h 38m'
---

# Story 7.5 Summary

## Stats

- Files created: 12
- Files modified: 4
- Lines added: 761
- Tests added: 10
- Commits: 1

## Decisions Made

- Implementata una nuova service dedicated (iparazioni-ricevuta-pdf) con output deterministico in test mode e rendering A4 in runtime.
- Uniformata la normalizzazione degli accessori (trim + compressione whitespace) prima della generazione PDF.
- Esposta la route GET /api/riparazioni/:id/ricevuta con mapping esplicito degli errori dominio (RIPARAZIONE_NOT_FOUND -> 404).

## Deviations from Plan

- Aggiunta copertura hardening non pianificata inizialmente per il caso 404 e per la struttura sezione PDF in test mode.

## Issues Encountered

- Divergenza tra payload PDF test-mode/runtime risolta riallineando headers di sezione nel builder.
- Parsing accessori inizialmente permissivo, corretto con normalizzazione whitespace interna.

## Lessons Learned

- Mantenere parita' tra output test-mode e runtime riduce regressioni sui controlli ATDD.
- I gate di review con issue minime forzano hardening utile oltre i soli acceptance criteria.
