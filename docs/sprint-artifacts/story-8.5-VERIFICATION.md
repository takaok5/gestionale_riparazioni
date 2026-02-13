---
story_id: '8.5'
verified: '2026-02-13T19:23:28+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Cliente autenticato puo' leggere la lista riparazioni portale | VERIFIED | packages/backend/src/__tests__/portal-riparazioni-list-detail.atdd.spec.ts (AC-1 pass) |
| 2 | Filtro stato=IN_DIAGNOSI restituisce solo elementi coerenti | VERIFIED | packages/backend/src/__tests__/portal-riparazioni-list-detail.atdd.spec.ts (AC-2 pass) |
| 3 | Dettaglio riparazione del proprio cliente restituisce timeline/documenti | VERIFIED | packages/backend/src/__tests__/portal-riparazioni-list-detail.atdd.spec.ts (AC-3 pass) |
| 4 | Accesso dettaglio cross-customer e' bloccato con 403 FORBIDDEN | VERIFIED | packages/backend/src/__tests__/portal-riparazioni-list-detail.atdd.spec.ts (AC-4 pass) |
| 5 | Path hardening coperti (401 senza token, 400 id non valido) | VERIFIED | packages/backend/src/__tests__/portal-riparazioni-list-detail.atdd.spec.ts (Hardening pass) |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| packages/backend/src/routes/auth.ts | MODIFIED | route /api/portal/riparazioni + /api/portal/riparazioni/:id |
| packages/backend/src/services/auth-service.ts | MODIFIED | service listPortalRiparazioni, getPortalRiparazioneDettaglio, helper auth/token |
| packages/backend/src/__tests__/portal-riparazioni-list-detail.atdd.spec.ts | CREATED+MODIFIED | suite ATDD completa (10 test) |
| docs/stories/8.5.lista-e-dettaglio-riparazioni-cliente.story.md | MODIFIED | task [x], deviazioni Step 7, AC validate |
| docs/sprint-artifacts/review-8.5.md | CREATED | 3 issue reali documentate e risolte |

## Key Links

| From | To | Status |
| --- | --- | --- |
| packages/backend/src/routes/auth.ts | packages/backend/src/services/auth-service.ts | WIRED |
| packages/backend/src/services/auth-service.ts | packages/backend/src/services/riparazioni-service.ts | WIRED |
| packages/backend/src/__tests__/portal-riparazioni-list-detail.atdd.spec.ts | packages/backend/src/routes/auth.ts | VERIFIED |