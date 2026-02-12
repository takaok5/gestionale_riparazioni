---
story_id: '4.5'
completed: '2026-02-12T11:46:46+01:00'
duration: '00:29:05'
---

# Story 4.5 Summary

## Stats

- Files created: 13
- Files modified: 3
- Lines added: 1222
- Lines deleted: 5
- Tests added: 8
- Commits: 1

## Decisions Made

- Implementato il percorso GREEN completo su test-store backend per rispettare i gate ATDD immediati.
- Introdotto `fatture-service` separato con numerazione annuale `YYYY/NNNN` e controlli di business AC-1..AC-4.
- Introdotto modulo dedicato `fatture-pdf-service` per rendere verificabile `pdfPath` in output.

## Deviations from Plan

- Persistenza Prisma (`schema.prisma` + migration) rimasta fuori scope in questa iterazione; documentata come blocker nella story.

## Issues Encountered

- Quoting bash/powershell sui gate inline: risolto spezzando i controlli in comandi robusti.
- Sequenza AC-2 dipendente da scenario pre-esistente: risolto con helper test `setFatturaSequenceForTests`.
- Invariante AC-4 non esplicita nei test iniziali: risolto con helper `countFattureByRiparazioneForTests`.

## Lessons Learned

- In pipeline multi-step su Windows conviene evitare gate bash monolitici in favore di check atomici.
- Gli AC con precondizioni temporali richiedono helper test espliciti per evitare fragilita'.
- Tenere separata la logica di output documento (`pdfPath`) facilita verifiche e manutenzione.