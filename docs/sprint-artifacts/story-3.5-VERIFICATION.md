---
story_id: '3.5'
verified: '2026-02-11T20:26:40+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Tecnico assegnato puo' cambiare stato con transizioni base consentite | VERIFIED | `packages/backend/src/__tests__/riparazioni-stato-base-atdd.spec.ts` (AC-1..AC-4 pass) |
| 2 | Transizione non valida `RICEVUTA -> COMPLETATA` restituisce `400 VALIDATION_ERROR` con messaggio atteso | VERIFIED | test AC-5 verde + `validateBaseTransition` in `packages/backend/src/services/riparazioni-service.ts` |
| 3 | Utente non autorizzato (tecnico non assegnato o commerciale) riceve `403 FORBIDDEN` senza side effects | VERIFIED | test AC-6 verdi (incl. caso COMMERCIALE) |
| 4 | Ogni cambio stato valido salva storico con `stato`, `dataOra`, `userId`, `note` | VERIFIED | persistenza in service (`test-store` + Prisma) e assert storico AC-1 |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| packages/backend/src/services/riparazioni-service.ts | MODIFIED | 1610 |
| packages/backend/src/routes/riparazioni.ts | MODIFIED | 289 |
| packages/backend/src/__tests__/riparazioni-stato-base-atdd.spec.ts | CREATED | 278 |
| docs/stories/3.5.cambio-stato-riparazione-transizioni-base.story.md | CREATED/MODIFIED | 55 |
| docs/sprint-artifacts/review-3.5.md | CREATED | 19 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| `packages/backend/src/routes/riparazioni.ts` (`PATCH /:id/stato`) | `packages/backend/src/services/riparazioni-service.ts` (`cambiaStatoRiparazione`) | WIRED |
| `packages/backend/src/services/riparazioni-service.ts` | Prisma `riparazioneStatoHistory` create | WIRED |
| `packages/backend/src/__tests__/riparazioni-stato-base-atdd.spec.ts` | `PATCH /api/riparazioni/:id/stato` route | VERIFIED |
