---
story_id: '6.1'
reviewed_at: '2026-02-13T00:10:38'
status: complete
---

# Review 6.1

### Issue 1: Dashboard counts could be truncated by pagination limits
- Severity: medium
- Status: RESOLVED
- Problem: initial implementation used single-page reads (limit: 100) for riparazioni/fatture, undercounting when records exceed 100.
- Fix: introduced etchAllRiparazioni and etchAllFatture pagination loops and switched admin/tecnico/commerciale aggregations to full datasets.
- Evidence: packages/backend/src/services/dashboard-service.ts:96, packages/backend/src/services/dashboard-service.ts:134, packages/backend/src/services/dashboard-service.ts:168, packages/backend/src/services/dashboard-service.ts:236, packages/backend/src/services/dashboard-service.ts:329.

### Issue 2: ultimiPagamenti date handling was not normalized and could break ordering/contract
- Severity: medium
- Status: RESOLVED
- Problem: payment dates could include time components and produce unstable sorting/format.
- Fix: added 	oDateOnly normalization and explicit sorting/filtering on normalized values.
- Evidence: packages/backend/src/services/dashboard-service.ts:85, packages/backend/src/services/dashboard-service.ts:217, packages/backend/src/services/dashboard-service.ts:220.

### Issue 3: 30-day revenue logic was ambiguous (invoice-level vs payment-level window)
- Severity: medium
- Status: RESOLVED
- Problem: previous calculation could include amounts not tied to actual payment date window.
- Fix: introduced isWithinLast30Days helper and compute atturato30gg using payment events within rolling 30 days.
- Evidence: packages/backend/src/services/dashboard-service.ts:75, packages/backend/src/services/dashboard-service.ts:338.

## Regression Checks
- 
pm run lint: PASS
- 
pm test -- --run: PASS
- Focused ATDD: 
pm test --workspace @gestionale/backend -- --run src/__tests__/dashboard-operativa-atdd.spec.ts: PASS