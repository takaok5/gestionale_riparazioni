# Review Story 6.5

## Scope

- Files reviewed: `packages/backend/src/routes/report.ts`, `packages/backend/src/services/report-service.ts`, `packages/backend/src/services/fatture-service.ts`, `packages/backend/src/services/preventivi-service.ts`, `packages/backend/src/__tests__/report-finanziari-atdd.spec.ts`
- Test evidence reviewed: `docs/sprint-artifacts/test-output-6.5.txt` and post-fix test runs (`npm test -- --run`, `npm run lint`)

### Issue 1 - Fatture aggregation truncated to first page

Status: RESOLVED

- Problem: `getReportFinanziari` used a single `listFatture` call with `limit=100`, so reports undercounted invoices when range size exceeded one page.
- Fix: Added paginated `fetchAllFattureForReport` loop in `packages/backend/src/services/report-service.ts` and switched KPI totals to aggregate all pages.
- Verification: Full suite passes; no regression in report tests (`packages/backend/src/__tests__/report-finanziari-atdd.spec.ts` and `packages/backend/src/__tests__/report-riparazioni-atdd.spec.ts`).

### Issue 2 - Test seeding accepted invalid invoice datasets

Status: RESOLVED

- Problem: `seedFattureForReportForTests` accepted malformed dates and overpaid totals, allowing impossible fixtures and masking data-quality bugs.
- Fix: Added strict checks in `packages/backend/src/services/fatture-service.ts` for ISO dates, positive totals, non-negative `totalePagato`, and `totalePagato <= totale`.
- Verification: Existing fatture tests plus full test suite remain green after validations.

### Issue 3 - Test seeding accepted invalid preventivo status/date values

Status: RESOLVED

- Problem: `seedPreventiviForReportForTests` allowed invalid `stato` and non-ISO dates, producing ambiguous reporting behavior.
- Fix: Added allowed-stato validation and date normalization checks in `packages/backend/src/services/preventivi-service.ts`.
- Verification: Preventivi/report tests pass with deterministic seeded datasets; no lint/typecheck errors.

## False Positives Check

- Checked `[x]` tasks in `docs/stories/6.5.report-finanziari.story.md` against modified code files.
- Result: no false positives found.
