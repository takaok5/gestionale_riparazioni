---
story_id: '6.5'
created: '2026-02-13'
depends_on: []
files_modified:
  - packages/backend/src/services/report-service.ts
  - packages/backend/src/routes/report.ts
  - packages/backend/src/__tests__/report-finanziari-atdd.spec.ts
  - docs/stories/6.5.report-finanziari.story.md
must_pass: [typecheck, lint, test]
---

# Plan Story 6.5

## Files to modify

| File | Change | Depends on |
| --------------- | ----------- | ---------- |
| packages/backend/src/services/report-service.ts | Add `getReportFinanziari` with date validation, admin-only guard, KPI aggregation (`fatturato`, `incassato`, `margine`, `preventiviEmessi`, `preventiviApprovati`, `tassoApprovazione`) and deterministic two-decimal rounding. | packages/backend/src/services/fatture-service.ts, packages/backend/src/services/preventivi-service.ts |
| packages/backend/src/routes/report.ts | Add `GET /finanziari` route reusing existing report route pattern (`authenticate`, query payload mapping, failure mapping with `buildErrorResponse`). | packages/backend/src/services/report-service.ts |
| packages/backend/src/__tests__/report-finanziari-atdd.spec.ts | Keep RED tests and adjust fixtures/assertions only where needed to match final contract after implementation. | packages/backend/src/routes/report.ts, packages/backend/src/services/report-service.ts |
| docs/stories/6.5.report-finanziari.story.md | Update checklist/task status and validation/deviation notes to reflect implemented behavior. | implementation and tests |

## Implementation order

1. Implement backend service logic in `packages/backend/src/services/report-service.ts` with shared parsing/validation conventions from existing report service functions.
2. Expose `/api/report/finanziari` in `packages/backend/src/routes/report.ts` using the same error envelope contract for `VALIDATION_ERROR`, `FORBIDDEN`, and service failures.
3. Execute and iterate on `packages/backend/src/__tests__/report-finanziari-atdd.spec.ts` until RED tests become GREEN while preserving AC-specific payload values.
4. Re-run targeted and regression backend tests, then align `docs/stories/6.5.report-finanziari.story.md` task checkboxes and implementation notes with final outcome.

## Patterns to follow

- From `docs/sprint-artifacts/story-6.5-RESEARCH.md`: route failure mapping pattern in `packages/backend/src/routes/report.ts:17-35`.
- From `docs/sprint-artifacts/story-6.5-RESEARCH.md`: authenticated report endpoint pattern in `packages/backend/src/routes/report.ts:38-53`.
- From `docs/sprint-artifacts/story-6.5-RESEARCH.md`: input parsing and date-range validation in `packages/backend/src/services/report-service.ts:79-151`.
- From `docs/sprint-artifacts/story-6.5-RESEARCH.md`: admin-only failure contract in `packages/backend/src/services/report-service.ts:270-271`.
- From `docs/sprint-artifacts/story-6.5-RESEARCH.md`: ATDD sad-path pattern in `packages/backend/src/__tests__/report-riparazioni-atdd.spec.ts:222-238`.

## Risks

- Contract mismatch risk: middleware default `403` message is `Accesso negato`, while story AC requires `Admin only`.
- KPI risk: `margine` computation can be ambiguous if source cost inputs are inconsistent; formula must be explicit and stable.
- Rounding risk: `tassoApprovazione` must remain deterministic to two decimals to avoid flaky tests.
- Validation risk: missing inverted-date checks can produce silent wrong aggregates instead of `400 VALIDATION_ERROR`.
