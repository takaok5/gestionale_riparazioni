---
story_id: '8.5'
completed: '2026-02-13T19:28:06+01:00'
duration: '00:31:19'
---

# Story 8.5 Summary

## Stats

- Files created: 11
- Files modified: 3
- Lines added: 1191
- Tests added: 10
- Commits: 1

## Decisions Made

- Riutilizzato il flusso di autenticazione portale gia' in uso per gli ordini, estendendo route e mapper errori dedicati alle riparazioni.
- Introdotti helper condivisi in `auth-service` per ridurre duplicazioni tra endpoint ordini e riparazioni.
- Rinforzata la copertura ATDD con casi hardening su auth mancante e validazione ID non numerico.

## Deviations from Plan

- La logica comune dettaglio/lista e' stata centralizzata in helper interni a `auth-service` per mantenere coerenza tra i due endpoint portale.

## Issues Encountered

- Gate RED inizialmente fallito per rilevazione file test non tracciati; risolto adeguando lo script di controllo.
- Gate GREEN inizialmente fallito per path ATDD nel workspace root; risolto eseguendo il test nel workspace backend.
- Gate review inizialmente fallito per parsing CRLF su `config.yaml`; risolto normalizzando `\r` nello script bash.

## Lessons Learned

- Nei gate bash su Windows conviene normalizzare sempre le line endings quando si estraggono path da YAML.
- Per endpoint portale omologhi, conviene estrarre helper condivisi prima della stabilizzazione test per ridurre regressioni.
