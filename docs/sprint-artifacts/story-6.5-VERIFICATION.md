---
story_id: '6.5'
verified: '2026-02-13T03:18:24+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Admin can call GET /api/report/finanziari and receive KPI payload | VERIFIED | packages/backend/src/routes/report.ts:80 + packages/backend/src/services/report-service.ts:387 + ATDD pass |
| 2 | Approval rate is computed with deterministic two-decimal rounding | VERIFIED | packages/backend/src/services/report-service.ts:461 + packages/backend/src/__tests__/report-finanziari-atdd.spec.ts AC-2 |
| 3 | Commerciale receives 403 FORBIDDEN with Admin only contract | VERIFIED | packages/backend/src/services/report-service.ts:402 + packages/backend/src/routes/report.ts:46 + ATDD AC-3 |
| 4 | Date filters are validated and invalid ranges return validation failures | VERIFIED | packages/backend/src/services/report-service.ts:164 and delegated report input parsing |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| packages/backend/src/routes/report.ts | MODIFIED | 101 |
| packages/backend/src/services/report-service.ts | MODIFIED | 482 |
| packages/backend/src/services/fatture-service.ts | MODIFIED | 985 |
| packages/backend/src/services/preventivi-service.ts | MODIFIED | 1765 |
| packages/backend/src/__tests__/report-finanziari-atdd.spec.ts | CREATED | 160 |
| docs/sprint-artifacts/review-6.5.md | CREATED | 38 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| packages/backend/src/routes/report.ts | packages/backend/src/services/report-service.ts | WIRED |
| packages/backend/src/services/report-service.ts | packages/backend/src/services/fatture-service.ts | WIRED |
| packages/backend/src/services/report-service.ts | packages/backend/src/services/preventivi-service.ts | WIRED |
| packages/backend/src/__tests__/report-finanziari-atdd.spec.ts | /api/report/finanziari endpoint | VERIFIED |