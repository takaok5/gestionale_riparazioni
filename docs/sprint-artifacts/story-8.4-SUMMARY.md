---
story_id: '8.4'
completed: '2026-02-13T18:45:05.2080225+01:00'
duration: '00:31:57'
---

# Story 8.4 Summary

## Stats

- Files created: 10
- Files modified: 5
- Lines added: 651
- Tests added: 8
- Commits: 1

## Decisions Made

- Implementato il filtro cliente sulla query ordini in `riparazioni-service` per riuso del datasource gia' usato dagli ATDD.
- Gestita ownership nel dettaglio ordine lato `auth-service` per restituire `FORBIDDEN` su mismatch cliente.
- Mappati errori `VALIDATION_ERROR` delle route portale ordini a HTTP 400 invece di 500.

## Deviations from Plan

- Task 4 implementato in `packages/backend/src/services/riparazioni-service.ts` (non in `anagrafiche-service.ts`) per coerenza con setup test e dati seed.

## Issues Encountered

- Gate Step 8 falliva per parsing `OPEN_COUNT` e CRLF su path config; risolto con script robusto e normalizzazione `\r`.
- Nessun ulteriore blocco dopo fix; gate review passato.

## Lessons Learned

- I gate bash su Windows richiedono parsing robusto di newline/CRLF.
- Conviene esplicitare arrotondamenti monetari per evitare drift floating in payload API.