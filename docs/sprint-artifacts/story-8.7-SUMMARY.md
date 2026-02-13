---
story_id: '8.7'
completed: '2026-02-13T21:05:33+01:00'
duration: '0h 30m'
---

# Story 8.7 Summary

## Stats

- Files created: 10
- Files modified: 4
- Lines added: 1320
- Tests added: 10
- Commits: 9

## Decisions Made

- Implemented portal PDF downloads inside existing portalRouter in packages/backend/src/routes/auth.ts to preserve current auth/error mapping style.
- Introduced portal-specific orchestration in packages/backend/src/services/auth-service.ts (token validation + ownership checks) instead of embedding business checks in routes.
- Added getPreventivoPdf in packages/backend/src/services/preventivi-service.ts to expose a stable PDF payload contract (ileName, content) for portal use.
- Added hardening ATDD coverage for invalid ID (400 VALIDATION_ERROR) and preventivo cross-customer access (403 FORBIDDEN).

## Deviations from Plan

- Planned update to packages/backend/src/services/fatture-service.ts was not required: existing getFatturaPdf/getFatturaDetail contracts were already sufficient and reused as-is.

## Issues Encountered

- Initial RED/GREEN assertions based on esponse.text for PDF binaries were flaky with supertest; resolved by asserting Content-Length and headers.
- Step 7 and Step 8 gate scripts needed adaptation for workspace-aware ATDD path handling and robust numeric parsing in shell checks.

## Lessons Learned

- For binary endpoint ATDD, header-level assertions are more reliable than text-body assertions.
- Reusing existing ownership-check patterns through a shared helper (ensurePortalOwnsRiparazione) reduces drift across endpoint variants.
- In monorepo workspaces, targeted test execution should use workspace-relative paths to avoid false negatives in gate scripts.