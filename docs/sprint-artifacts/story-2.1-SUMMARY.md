---
story_id: '2.1'
completed: '2026-02-10T19:35:53.9285403+01:00'
duration: 'single-session'
---

# Story 2.1 Summary

## Stats

- Files created: 12
- Files modified: 4
- Lines added: 1088
- Tests added: 1 file (packages/backend/src/__tests__/clienti-create-atdd.spec.ts, 10 test cases)
- Commits: 1

## Decisions Made

- Aperto POST /api/clienti a utente autenticato (rimozione vincolo ADMIN) per allineare AC-1.
- Centralizzata la logica di creazione cliente in nagrafiche-service con auto-generazione codiceCliente (CLI-xxxxxx).
- Gestito conflitto email con codice dominio EMAIL_ALREADY_EXISTS e risposta HTTP 409.
- Rafforzata validazione provincia con set di sigle ammesse e retry bounded su collisioni codiceCliente in DB.

## Deviations from Plan

- Invece di importare direttamente i validator da packages/shared, le regole fiscali/territoriali sono state applicate nel service backend mantenendo coerenza contrattuale con i test.

## Issues Encountered

- Esecuzione gate bash su Windows: 
pm/node non disponibile direttamente in Git Bash. Risolto invocando i comandi npm tramite powershell all'interno degli script gate.
- Verifica path da config.yaml in bash con CRLF. Risolto normalizzando \r in lettura.

## Lessons Learned

- In ambiente Windows con pipeline bash conviene normalizzare subito line ending e shell bridge per evitare falsi fail di gate.
- Per story con AC API conviene introdurre ATDD specifici prima dell'implementazione: il delta RED->GREEN ha evidenziato rapidamente mismatch su auth, validazioni e mapping errori.
