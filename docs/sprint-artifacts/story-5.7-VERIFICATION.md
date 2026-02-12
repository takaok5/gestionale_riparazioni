---
story_id: "5.7"
verified: "2026-02-12T19:35:00+01:00"
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Ricezione completa porta ordine a `RICEVUTO` e aggiorna stock | VERIFIED | `ordini-ricezione-atdd.spec.ts` AC-1 PASS |
| 2 | Ricezione parziale mantiene ordine in `SPEDITO` | VERIFIED | `ordini-ricezione-atdd.spec.ts` AC-2 PASS |
| 3 | Stato `BOZZA` blocca la ricezione con errore validazione | VERIFIED | `ordini-ricezione-atdd.spec.ts` AC-4 PASS |
| 4 | Validazioni hardening (duplicate articolo, over-receipt) attive | VERIFIED | `ordini-ricezione-atdd.spec.ts` hardening PASS |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| `packages/backend/src/routes/ordini.ts` | UPDATED | endpoint `POST /:id/ricevi` + failure mapping |
| `packages/backend/src/services/anagrafiche-service.ts` | UPDATED | parser + service receive test-store/DB |
| `packages/backend/prisma/schema.prisma` | UPDATED | `quantitaRicevuta`, `dataUltimaRicezione` su voce ordine |
| `packages/backend/src/__tests__/ordini-ricezione-atdd.spec.ts` | CREATED/UPDATED | AC-1..AC-4 + hardening |
| `docs/sprint-artifacts/review-5.7.md` | CREATED | 3 issue review resolved |

## Key Links

| From | To | Status |
| --- | --- | --- |
| `routes/ordini.ts` | `services/anagrafiche-service.ts` | WIRED |
| `anagrafiche-service.ts` | `schema.prisma` fields ordine voce | WIRED |
| `ordini-ricezione-atdd.spec.ts` | `POST /api/ordini/:id/ricevi` | VERIFIED |
