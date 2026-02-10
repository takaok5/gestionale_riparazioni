---
story_id: '1.7'
completed: '2026-02-10T18:19:30+01:00'
duration: 'approx 00:45:00'
---

# Story 1.7 Summary

## Stats

- Files created: 16
- Files modified: 4
- Lines added: 1680
- Tests added: 1 (`packages/backend/src/__tests__/audit-trail.spec.ts`, 8 test case)
- Commits: 1

## Decisions Made

- Implementazione eseguita sul backend TypeScript (`packages/backend/**`) per coerenza con pipeline test/gate e suite Vitest esistente.
- Introdotto servizio dedicato `anagrafiche-service` con doppio ramo runtime (`NODE_ENV=test` in-memory + Prisma DB branch).
- Endpoint separati per responsabilita (`/api/clienti`, `/api/fornitori`, `/api/audit-log`) e wiring centralizzato in `packages/backend/src/index.ts`.
- Esteso schema Prisma `AuditLog` con `dettagli Json?` per supportare snapshot old/new sugli update.

## Deviations from Plan

- Nessuna deviazione sostanziale sul perimetro file; il piano e' stato seguito.
- Nota operativa: il comando gate `npm test -- --run` continua a stampare warning npm (`Unknown cli config "--run"`), ma non impatta gli exit code dei gate.

## Issues Encountered

- Gate RED iniziale in bash non eseguiva Node (`node: not found`) nell'ambiente Git Bash su Windows.
- Risolto eseguendo i run test reali tramite PowerShell e mantenendo i gate bash per checklist/exit controls.
- In review, identificati e risolti 3 issue reali: `dettagli` assente nel ramo DB audit, mapping duplicato `codiceCliente`, validazione `tipologia` troppo permissiva.

## Lessons Learned

- In questo repo multi-workspace, i path test in `atdd-tests-{id}.txt` devono essere relativi al workspace backend (`src/...`) per evitare falsi negativi nei run filtrati.
- L'uso di branch DB/test-store paralleli richiede allineamento esplicito dei contratti payload per evitare drift fra ambiente test e runtime.
