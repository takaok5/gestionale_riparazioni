---
story_id: '5.3'
verified: '2026-02-12T15:59:07+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Tecnico/Admin puo registrare movimenti magazzino su articolo | VERIFIED | packages/backend/src/__tests__/articoli-movimenti-atdd.spec.ts AC-1/AC-2 passano |
| 2 | Scarico oltre disponibilita ritorna errore esplicito | VERIFIED | AC-3 verifica 400 e messaggio Insufficient stock: available 5, requested 10 |
| 3 | Rettifica negativa aggiorna la giacenza correttamente | VERIFIED | AC-4 verifica giacenza finale 10 |
| 4 | Scenario concorrente SCARICO mantiene vincolo stock | VERIFIED | AC-5 verifica un 201, un 400, giacenza finale 3 |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| packages/backend/src/services/anagrafiche-service.ts | UPDATED | 400+ |
| packages/backend/src/routes/articoli.ts | UPDATED | 200- |
| packages/backend/src/__tests__/articoli-movimenti-atdd.spec.ts | CREATED | 250+ |
| docs/stories/5.3.movimenti-magazzino.story.md | UPDATED | 60+ |
| docs/sprint-artifacts/review-5.3.md | UPDATED | 20+ |

## Key Links

| From | To | Status |
| --- | --- | --- |
| packages/backend/src/routes/articoli.ts | packages/backend/src/services/anagrafiche-service.ts#createArticoloMovimento | WIRED |
| packages/backend/src/__tests__/articoli-movimenti-atdd.spec.ts | POST /api/articoli/:id/movimenti | WIRED |
| docs/stories/5.3.movimenti-magazzino.story.md | packages/backend/src/__tests__/articoli-movimenti-atdd.spec.ts | TRACEABLE |
