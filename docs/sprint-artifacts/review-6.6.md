# Review 6.6

## Scope
- Diff reviewed: packages/backend/src/services/report-service.ts, packages/backend/src/routes/report.ts, packages/backend/src/__tests__/report-magazzino-atdd.spec.ts, docs/stories/6.6.report-magazzino.story.md
- Validation rerun after fixes: 
pm test -- --run, 
pm run lint

### Issue 1
Status: RESOLVED

- Problem: rticoliSottoSoglia counted rows with sogliaMinima=0, inflating low-stock KPI with non-alerting items.
- Fix: constrained metric to sogliaMinima > 0 && giacenza <= sogliaMinima.
- Evidence: packages/backend/src/services/report-service.ts (rticoliSottoSoglia filter).

### Issue 2
Status: RESOLVED

- Problem: top usage aggregation could include audit rows for article IDs no longer present in current inventory set.
- Fix: filtered usageByArticleId by rticlesById.has(articoloId) before sorting/slicing top 10.
- Evidence: packages/backend/src/services/report-service.ts (etchTopArticoliUtilizzati).

### Issue 3
Status: RESOLVED

- Problem: AC-2 test accepted rticoliEsauriti >= 1, too weak and able to pass with unrelated zero-stock fixtures.
- Fix: warm-up fixtures now use sogliaMinima: 0 and assertion hardened to exact rticoliEsauriti === 1.
- Evidence: packages/backend/src/__tests__/report-magazzino-atdd.spec.ts.

## Task Evidence Check
- [x] tasks in docs/stories/6.6.report-magazzino.story.md have direct evidence in modified route/service/test files.
- No false-positive markers (Deferred, TODO, SKIP, WIP, N/A) on completed tasks.

## Context Maintenance
- No new significant runtime directories requiring new CLAUDE.md shards.
- Root CLAUDE.md update not required (no new commands/stack/structure conventions introduced).
- _bmad/bmm/config.yaml paths verified unchanged and valid.
