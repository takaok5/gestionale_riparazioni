---
story_id: "6.7"
created: "2026-02-13"
depends_on: []
files_modified:
  - packages/backend/src/services/report-service.ts
  - packages/backend/src/routes/report.ts
  - packages/backend/src/__tests__/report-export-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 6.7

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| `packages/backend/src/services/report-service.ts` | Add export CSV service functions (riparazioni, finanziari, magazzino), admin guard reuse, date filter parsing, CSV escaping/formatting helpers | existing report data functions |
| `packages/backend/src/routes/report.ts` | Add `/export/*` routes using `authenticate`, call service export functions, map failures, set `Content-Type` and `Content-Disposition` | report-service export functions |
| `packages/backend/src/__tests__/report-export-atdd.spec.ts` | Keep RED tests as source of truth, adjust only if contract mismatch is discovered during GREEN | routes + service behavior |

## Implementation order

1. Implement CSV building and export result contracts in `packages/backend/src/services/report-service.ts`, reusing existing report/list data paths and admin checks.
2. Add export routes in `packages/backend/src/routes/report.ts` with the same error mapping style used by existing `/api/report/*` JSON endpoints.
3. Run `npm test -- --run` and iterate on `packages/backend/src/services/report-service.ts` + `packages/backend/src/routes/report.ts` until `packages/backend/src/__tests__/report-export-atdd.spec.ts` passes.
4. Verify no regression on existing report tests (`report-riparazioni`, `report-finanziari`, `report-magazzino`) and keep API error envelope unchanged.

## Patterns to follow

- Use route pattern from `packages/backend/src/routes/report.ts:94` (`authenticate`, payload object, service call, explicit failure responder).
- Use forbidden contract from `packages/backend/src/services/report-service.ts:560` (`code: "FORBIDDEN"`, `message: "Admin only"`).
- Use attachment response pattern from `packages/backend/src/routes/fatture.ts:341` (`Content-Type` + `Content-Disposition`).
- Keep ATDD naming/assertion style from `packages/backend/src/__tests__/report-riparazioni-atdd.spec.ts:116`.

## Risks

- CSV injection if cells are not escaped for spreadsheet formula prefixes.
- Date-range mismatch between existing JSON report filters and new export filters.
- Breaking existing route/service type unions if new export result types are not aligned.
