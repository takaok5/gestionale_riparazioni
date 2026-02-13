# Review 6.3

Date: 18+01:00
Story: 6.3

### Issue 1
- Description: Endpoint /api/dashboard/carico-tecnici was missing in packages/backend/src/routes/dashboard.ts, causing 404 on all AC scenarios.
- Severity: High
- Fix: Added authenticated route with the same error mapping pattern (VALIDATION_ERROR 400, FORBIDDEN 403, fallback 500).
- Evidence: packages/backend/src/routes/dashboard.ts
- Status: RESOLVED

### Issue 2
- Description: Initial service implementation for carico tecnico depended only on DB user query and returned empty payload in test-store mode.
- Severity: High
- Fix: Added listActiveTecniciForTests() in users-service and test-mode branch in listTecniciById() to resolve technician identities from in-memory users.
- Evidence: packages/backend/src/services/users-service.ts, packages/backend/src/services/dashboard-service.ts
- Status: RESOLVED

### Issue 3
- Description: Type narrowing bug in uildCaricoTecnici() (Map | DashboardFailure) triggered TypeScript failure during GREEN gate.
- Severity: Medium
- Fix: Replaced fragile narrowing with explicit instanceof Map check before map usage.
- Evidence: packages/backend/src/services/dashboard-service.ts
- Status: RESOLVED

## Task Evidence

- Task 1: route added in packages/backend/src/routes/dashboard.ts (GET /carico-tecnici).
- Task 2: getDashboardCaricoTecnici added in packages/backend/src/services/dashboard-service.ts.
- Task 3: active status aggregation + deterministic ordering in packages/backend/src/services/dashboard-service.ts.
- Task 4: TECNICO-only identity filtering via user source (listTecniciById / listActiveTecniciForTests).
- Task 5-6: dedicated ATDD suite in packages/backend/src/__tests__/dashboard-carico-tecnici-atdd.spec.ts.