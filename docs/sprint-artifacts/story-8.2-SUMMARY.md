---
story_id: '8.2'
completed: '2026-02-13T16:28:40+01:00'
duration: '1h 33m'
---

# Story 8.2 Summary

## Stats

- Files created: 10
- Files modified: 4
- Lines added: 1256
- Tests added: 1
- Commits: 1

## Decisions Made

- Esteso il rate limiter in modo backward-compatible (API legacy + API keyed per lockout portale 10/15min).
- Implementata revoca refresh token portale in uth-service con blacklist in-memory e cleanup TTL.
- Separati i flussi /api/auth/* e /api/portal/auth/* mantenendo envelope errori coerente via uildErrorResponse.

## Deviations from Plan

- La validazione revoca/access token e stata completata nel service auth e nel route layer senza modificare packages/backend/src/middleware/auth.ts.

## Issues Encountered

- tdd-tests-8.2.txt inizialmente scritto con BOM/CRLF causava filtro test non trovato; risolto con salvataggio ASCII senza newline finale.
- Gate RED basato su git diff --diff-filter=A non includeva file non tracciati; risolto con git add -N durante step 5.

## Lessons Learned

- Nei gate bash cross-platform conviene normalizzare encoding dei file artefatto usati come input CLI.
- Per nuove AC auth conviene aggiungere subito test sad-path su dominio token (cross-domain refresh, header access invalido).
