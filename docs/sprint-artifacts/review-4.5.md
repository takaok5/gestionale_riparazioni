# Review Story 4.5

## Scope
- Diff reviewed: fatture route/service/tests + support helper in preventivi service + story/task artifacts.

### Issue 1
- File: `packages/backend/src/services/fatture-service.ts`
- Problem: `setFatturaSequenceForTests` accettava valori > 9999, con rischio di numerazione invalida rispetto al formato `YYYY/NNNN`.
- Fix: introdotto vincolo `sequence <= 9999`.
- Status: RESOLVED

### Issue 2
- File: `packages/backend/src/services/fatture-service.ts`
- Problem: la creazione fattura non validava consistenza minima del preventivo approvato (voci vuote / totali non numerici), con rischio di persistenza fatture invalide.
- Fix: aggiunto errore `INVALID_APPROVED_PREVENTIVO` con guardrail su `voci` e totali finiti.
- Status: RESOLVED

### Issue 3
- Files: `packages/backend/src/services/fatture-service.ts`, `packages/backend/src/__tests__/fatture-create-atdd.spec.ts`
- Problem: AC-4 richiede l'invariante "nessuna seconda fattura"; i test verificavano solo status/response senza controllo esplicito della cardinalita'.
- Fix: aggiunto helper `countFattureByRiparazioneForTests` e assert pre/post duplicato per garantire count=1.
- Status: RESOLVED

## Task Evidence
- `[x] fatture-service.ts`: implementato `createFattura`, sequenza annuale, regole AC-1..AC-4.
- `[x] routes/fatture.ts`: endpoint `POST /api/fatture` con mapping 400/409/500.
- `[x] index.ts`: mount `/api/fatture`.
- `[x] fatture-create-atdd.spec.ts`: 8 test AC-based in GREEN.
- `[x] fatture-pdf-service.ts`: generazione `pdfPath`.

## Context Maintenance
- Nuove directory significative: nessuna (solo file in directory esistenti), quindi nessun nuovo shard `CLAUDE.md` richiesto.
- `CLAUDE.md` root: nessun aggiornamento richiesto (nessun nuovo comando/stack/struttura top-level).
- `_bmad/bmm/config.yaml`: path artifact invariati; nessuna correzione necessaria.