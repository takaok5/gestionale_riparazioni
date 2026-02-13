---
story_id: '8.6'
completed: '2026-02-13T20:28:30+01:00'
duration: 'circa 20 minuti (sessione corrente)'
---

# Story 8.6 Summary

## Stats

- Files created: 10
- Files modified: 5
- Lines added: 1173
- Lines removed: 17
- Tests added: 8 (portal-preventivi-risposta.atdd.spec.ts)
- Commits: 1

## Decisions Made

- Implementata una route portal dedicata POST /api/portal/preventivi/:id/risposta in outes/auth.ts, mantenendo il boundary route -> auth-service.
- Introdotto in dominio preventivi il codice esplicito RESPONSE_ALREADY_RECORDED per evitare parsing fragile del solo messaggio errore.
- Mantenuta backward compatibility dell’API legacy /api/preventivi/:id/risposta mappando RESPONSE_ALREADY_RECORDED a VALIDATION_ERROR nella route legacy.
- Eseguita ownership validation lato portal (clienteId da token vs cliente della riparazione del preventivo) prima di registrare la risposta.

## Deviations from Plan

- Nessuna deviazione sostanziale: i file toccati e l’ordine di implementazione sono coerenti con .claude/plans/story-8.6.plan.md.

## Issues Encountered

- Test RED inizialmente fallivano per setup incompleto del seed cliente (non per endpoint mancante).
  Risolto completando i dati seed (
ome, codiceCliente) e reset notifiche.
- tdd-tests-8.6.txt inizialmente conteneva path non adatto all’esecuzione workspace.
  Risolto usando path relativo backend (src/__tests__/portal-preventivi-risposta.atdd.spec.ts).

## Lessons Learned

- Nei workspace npm conviene salvare nei file gate path test relativi al package target.
- Introdurre error code dominio espliciti riduce ambiguita' e semplifica mapper API specifici (portal vs legacy).