---
story_id: '9.5'
verified: '2026-02-14T02:15:37.2643068+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Commerciale/Admin can list backoffice leads with pagination | VERIFIED | packages/backend/src/__tests__/richieste-backoffice-api.atdd.spec.ts AC-1 passes |
| 2 | Stato transition NUOVA -> IN_LAVORAZIONE writes audit details | VERIFIED | packages/backend/src/__tests__/richieste-backoffice-api.atdd.spec.ts AC-2 passes |
| 3 | Commerciale assignment endpoint persists ssegnataAUserId | VERIFIED | packages/backend/src/__tests__/richieste-backoffice-api.atdd.spec.ts AC-3 passes |
| 4 | Tecnico access to /api/richieste is blocked with 403 FORBIDDEN | VERIFIED | packages/backend/src/__tests__/richieste-backoffice-api.atdd.spec.ts AC-4 passes |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| packages/backend/src/routes/richieste.ts | CREATED | 1-198 |
| packages/backend/src/services/anagrafiche-service.ts | UPDATED | backoffice richieste parser/service/export sections |
| packages/backend/src/index.ts | UPDATED | router import + mount |
| packages/backend/src/__tests__/richieste-backoffice-api.atdd.spec.ts | CREATED | 1-181 |
| docs/sprint-artifacts/review-9.5.md | CREATED | review issues and fixes |

## Key Links

| From | To | Status |
| --- | --- | --- |
| packages/backend/src/index.ts | packages/backend/src/routes/richieste.ts | WIRED |
| packages/backend/src/routes/richieste.ts | packages/backend/src/services/anagrafiche-service.ts | WIRED |
| packages/backend/src/__tests__/richieste-backoffice-api.atdd.spec.ts | /api/richieste routes | VERIFIED |