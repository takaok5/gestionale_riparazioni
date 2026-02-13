---
story_id: '8.7'
verified: '2026-02-13T21:03:27+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Cliente autenticato puo' scaricare PDF fattura dal portale con header corretti | VERIFIED | packages/backend/src/__tests__/portal-documenti-download.atdd.spec.ts AC-1 passa; route packages/backend/src/routes/auth.ts:786 |
| 2 | Cliente autenticato puo' scaricare PDF preventivo dal portale con filename coerente | VERIFIED | packages/backend/src/__tests__/portal-documenti-download.atdd.spec.ts AC-2 passa; service packages/backend/src/services/preventivi-service.ts espone getPreventivoPdf |
| 3 | Accesso cross-customer e' bloccato con 403 FORBIDDEN | VERIFIED | packages/backend/src/__tests__/portal-documenti-download.atdd.spec.ts AC-3 + hardening passano; ownership check centralizzato in packages/backend/src/services/auth-service.ts:938 |
| 4 | Richiesta senza token viene rifiutata con 401 UNAUTHORIZED | VERIFIED | packages/backend/src/__tests__/portal-documenti-download.atdd.spec.ts AC-4 passa; bearer guard in packages/backend/src/routes/auth.ts |
| 5 | Suite completa rimane verde dopo integrazione | VERIFIED | Gate step 8: 
pm test -- --run (501 passed), 
pm run lint passed |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| packages/backend/src/routes/auth.ts | UPDATED | 769 |
| packages/backend/src/services/auth-service.ts | UPDATED | 1117 |
| packages/backend/src/services/preventivi-service.ts | UPDATED | 1690 |
| packages/backend/src/__tests__/portal-documenti-download.atdd.spec.ts | UPDATED | 271 |
| docs/sprint-artifacts/review-8.7.md | CREATED | 41 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| packages/backend/src/routes/auth.ts (/documenti/fattura/:id/pdf) | packages/backend/src/services/auth-service.ts (getPortalFatturaPdf) | WIRED |
| packages/backend/src/routes/auth.ts (/documenti/preventivo/:id/pdf) | packages/backend/src/services/auth-service.ts (getPortalPreventivoPdf) | WIRED |
| packages/backend/src/services/auth-service.ts | packages/backend/src/services/preventivi-service.ts (getPreventivoPdf) | WIRED |
| packages/backend/src/services/auth-service.ts | packages/backend/src/services/fatture-service.ts (getFatturaPdf) | WIRED |