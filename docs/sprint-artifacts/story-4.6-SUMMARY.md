---
story_id: '4.6'
completed: '2026-02-12T12:23:35+01:00'
duration: '~00:20:00'
---

# Story 4.6 Summary

## Stats

- Files created: 10
- Files modified: 3
- Diff summary:  4 files changed, 754 insertions(+), 17 deletions(-)
- Tests added: 1
- Commits: 1

## Decisions Made

- Implementato POST /api/fatture/:id/pagamenti e GET /api/fatture/:id nel router fatture per coprire AC-1..AC-4.
- Esteso il test-store di atture-service con gestione pagamenti, calcolo 	otalePagato/esiduo e blocco overpayment.
- Mantenuta coerenza response/error format con uildErrorResponse e pattern route esistente.

## Deviations from Plan

- Nessuna deviazione funzionale. Applicata review addizionale su encoding e timer cleanup.

## Issues Encountered

- Quoting gate bash su Windows PowerShell non affidabile nel wrapper: gate equivalenti eseguiti in PowerShell con stessi controlli logici.
- Encoding BOM introdotto da Set-Content -Encoding UTF8: corretto con riscrittura UTF-8 senza BOM.

## Lessons Learned

- Per pipeline su Windows e' preferibile forzare UTF-8 senza BOM per file TypeScript.
- Nei test con fake timers serve sempre fterEach con useRealTimers per isolamento suite.
