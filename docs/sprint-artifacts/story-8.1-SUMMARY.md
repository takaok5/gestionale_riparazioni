---
story_id: "8.1"
completed: "2026-02-13T15:32:30+01:00"
duration: "00:35:26"
---

# Story 8.1 Summary

## Stats

- Files created: 13
- Files modified: 10
- Lines added: 441
- Tests added: 4
- Commits: 1

## Decisions Made

- Implemented portal-account domain flow in `auth-service` to isolate behavior from the large `anagrafiche-service`.
- Added dedicated `portalAuthRouter` mounted at `/api/portal/auth` to avoid regressions on existing `/api/auth/*`.
- Kept RED-phase tests split by AC (`create`, `conflict`, `email-required`, `activation`) for direct traceability.

## Deviations from Plan

- Planned `anagrafiche-service` implementation for portal-account logic was moved to `auth-service` for lower blast radius.
- `schema.prisma` and `middleware/auth.ts` were not changed in this story scope because all AC/test gates were satisfied without DB migration changes.

## Issues Encountered

- Bash gates on Windows conflicted with PowerShell quoting: resolved by running dedicated `.sh` gate files.
- ATDD gate initially failed due workspace path resolution (`npm test -- --run ...`): resolved by running backend-targeted test invocation.
- Review gate flagged `[x]` evidence mismatch due outdated test filenames in story: resolved by aligning task file references to actual created test files.

## Lessons Learned

- In this monorepo, gate scripts should normalize test paths before invoking workspace-specific test runs.
- Story task evidence checks are fragile when filenames evolve; keep story tasks synchronized with final file naming.
