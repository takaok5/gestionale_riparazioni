---
story_id: '8.7'
created: '2026-02-13'
depends_on: []
files_modified:
  - packages/backend/src/routes/auth.ts
  - packages/backend/src/services/auth-service.ts
  - packages/backend/src/services/fatture-service.ts
  - packages/backend/src/services/preventivi-service.ts
  - packages/backend/src/__tests__/portal-documenti-download.atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 8.7

## Files to modify

| File | Change | Depends on |
| --------------- | ----------- | ---------- |
| packages/backend/src/services/preventivi-service.ts | Add portal-safe preventivo PDF retrieval use case returning { fileName, content } for validated preventivo id | Existing preventivo parsing utilities and test-store data |
| packages/backend/src/services/auth-service.ts | Add portal document download orchestration: token resolve, ownership guard, and error mapping for fattura/preventivo PDF | esolvePortalClienteIdFromAccessToken, preventivi/riparazioni/fatture service functions |
| packages/backend/src/routes/auth.ts | Add GET /api/portal/documenti/fattura/:id/pdf and GET /api/portal/documenti/preventivo/:id/pdf handlers with portal auth checks and PDF headers | New auth-service functions + existing portal error mapping style |
| packages/backend/src/services/fatture-service.ts | Reuse existing getFatturaPdf contract in new portal orchestration path; adjust exports only if needed | Existing getFatturaPdf implementation |
| packages/backend/src/__tests__/portal-documenti-download.atdd.spec.ts | Keep RED tests aligned with final contract (401/403/payload/headers) and stabilize assertions after implementation | New route/service behavior |

## Implementation order

1. Extend packages/backend/src/services/preventivi-service.ts with deterministic PDF retrieval function (depends on nothing, enables preventivo download branch).
2. Extend packages/backend/src/services/auth-service.ts with portal document use cases for fattura/preventivo downloads, including token validation and ownership checks (depends on task 1 and existing fatture API).
3. Extend packages/backend/src/routes/auth.ts with portal document endpoints + dedicated failure mappers + PDF response headers (depends on task 2).
4. Align packages/backend/src/__tests__/portal-documenti-download.atdd.spec.ts assertions to final response details only if implementation reveals stricter header/body formats (depends on task 3).
5. Run targeted and full backend tests, then workspace tests, and fix regressions until GREEN (depends on task 4).

## Patterns to follow

- From docs/sprint-artifacts/story-8.7-RESEARCH.md: use portal route skeleton from packages/backend/src/routes/auth.ts:601 (Bearer extraction, service call, failure branch).
- From docs/sprint-artifacts/story-8.7-RESEARCH.md: use ownership guard pattern from packages/backend/src/services/auth-service.ts:971 and packages/backend/src/services/auth-service.ts:1086.
- From docs/sprint-artifacts/story-8.7-RESEARCH.md: use PDF header response pattern from packages/backend/src/routes/fatture.ts:341.
- Keep portal unauthorized contract aligned with existing tests (packages/backend/src/__tests__/portal-dashboard-me.atdd.spec.ts:192).

## Risks

- Ownership validation bug could expose cross-customer invoice/quote PDFs.
- Inconsistent filename/header formatting could break portal ATDD expectations.
- New auth-service code paths may introduce regressions in existing portal endpoints if shared mapper logic is altered.