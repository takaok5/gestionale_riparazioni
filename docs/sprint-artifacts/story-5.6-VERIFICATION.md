---
story_id: "5.6"
verified: "2026-02-12T18:23:30+01:00"
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Admin puo' eseguire transizioni ordine `BOZZA -> EMESSO -> CONFERMATO -> SPEDITO -> RICEVUTO` | VERIFIED | `packages/backend/src/__tests__/ordini-stato-atdd.spec.ts` (AC-1..AC-4) verdi |
| 2 | Cancellazione non admin da `SPEDITO` e' bloccata con errore specifico | VERIFIED | `packages/backend/src/__tests__/ordini-stato-atdd.spec.ts` (AC-7) verde con messaggio esatto |
| 3 | Endpoint `PATCH /api/ordini/:id/stato` e' cablato con mapping errori dominio | VERIFIED | `packages/backend/src/routes/ordini.ts` handler patch + responder dedicato |
| 4 | Build, lint, typecheck e suite test completa passano dopo implementazione | VERIFIED | `docs/sprint-artifacts/test-output-5.6.txt` + run `npm run typecheck`, `npm run lint`, `npm run build` |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| `packages/backend/src/routes/ordini.ts` | UPDATED | 1-133 |
| `packages/backend/src/services/anagrafiche-service.ts` | UPDATED | 1-5319 |
| `packages/backend/src/__tests__/ordini-stato-atdd.spec.ts` | UPDATED | 1-239 |
| `packages/backend/prisma/schema.prisma` | UPDATED | 107-122 |
| `docs/sprint-artifacts/review-5.6.md` | CREATED | 1-28 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| `packages/backend/src/routes/ordini.ts` | `packages/backend/src/services/anagrafiche-service.ts` | WIRED |
| `packages/backend/src/__tests__/ordini-stato-atdd.spec.ts` | `PATCH /api/ordini/:id/stato` | VERIFIED |
| `docs/stories/5.6.gestione-stato-ordine.story.md` | codice + test implementati | ALIGNED |
