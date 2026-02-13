---
story_id: '6.3'
created: '2026-02-13'
depends_on: []
files_modified:
  - packages/backend/src/routes/dashboard.ts
  - packages/backend/src/services/dashboard-service.ts
  - packages/backend/src/__tests__/dashboard-carico-tecnici-atdd.spec.ts
  - docs/sprint-artifacts/test-output-6.3.txt
must_pass: [test]
---

# Plan Story 6.3

## Files to modify

| File | Change | Depends on |
| --------------- | ----------- | ---------- |
| packages/backend/src/services/dashboard-service.ts | Add getDashboardCaricoTecnici admin-only service, aggregate active repairs, join technician identity data for payload { tecnicoId, username, nome, riparazioniAttive }. | listRiparazioni + users helpers |
| packages/backend/src/routes/dashboard.ts | Add GET /carico-tecnici route with authenticate middleware and existing dashboard error mapping conventions. | getDashboardCaricoTecnici |
| packages/backend/src/__tests__/dashboard-carico-tecnici-atdd.spec.ts | Keep ATDD expectations aligned to ACs and adjust only if contract-level mismatch is discovered during implementation. | route + service behavior |
| docs/sprint-artifacts/test-output-6.3.txt | Refresh RED/GREEN evidence after implementation. | npm test output |

## Implementation order

1. Implement service contract in packages/backend/src/services/dashboard-service.ts: input validation (ctorUserId, ctorRole), FORBIDDEN for non-admin, active-status aggregation (IN_DIAGNOSI, IN_LAVORAZIONE), and deterministic sorting by iparazioniAttive desc, 	ecnicoId asc.
2. Add route integration in packages/backend/src/routes/dashboard.ts for GET /carico-tecnici, reusing the same VALIDATION_ERROR/FORBIDDEN/500 mapping pattern used by / and /riparazioni-per-stato.
3. Align data source behavior for technician identity fields (username, 
ome) in service logic so AC-1 and AC-2 are testable against real store data in test env.
4. Run targeted test (dashboard-carico-tecnici-atdd) then full workspace tests; use failures to harden edge cases (missing tecnicoId, non-TECNICO users, empty datasets).
5. Update sprint artifacts (	est-output-6.3.txt, pipeline state) and finalize GREEN readiness for step 7 gate.

## Patterns to follow

- From docs/sprint-artifacts/story-6.3-RESEARCH.md: route-service error mapping pattern from packages/backend/src/routes/dashboard.ts:13.
- From docs/sprint-artifacts/story-6.3-RESEARCH.md: validation-first service flow in packages/backend/src/services/dashboard-service.ts:229 (sPositiveInteger, sRole, admin guard).
- From docs/sprint-artifacts/story-6.3-RESEARCH.md: Map-based aggregation on active statuses in packages/backend/src/services/dashboard-service.ts:323.

## Risks

- Existing admin dashboard currently emits placeholder technician names (Tecnico {id}), so AC requires explicit identity retrieval without leaking non-TECNICO users.
- Aggregation currently scans paginated repair lists; performance may degrade on larger data volumes.
- Test environment (NODE_ENV=test) uses in-memory stores; service implementation must behave consistently between test store and Prisma runtime.