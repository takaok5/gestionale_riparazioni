---
story_id: '9.4'
completed: '2026-02-14T01:14:14+01:00'
duration: 'current session'
---

# Story 9.4 Summary

## Stats

- Files created: 16
- Files modified: 5
- Lines added: 410
- Lines removed: 9
- Tests added: 2
- Commits: 1

## Decisions Made

- Implemented POST /api/public/richieste inside existing public.ts router to preserve current anonymous route architecture.
- Implemented public-lead create flow in anagrafiche-service.ts using existing parser/result conventions ({ ok, code }) to stay consistent with backend patterns.
- Reused login-rate-limit.ts primitives for per-IP throttling and Retry-After semantics, rather than introducing a second limiter.
- Added /richiedi-preventivo page branch in App.tsx so the homepage CTA points to a real, testable route.

## Deviations from Plan

- No structural deviation; planned files and ordering were respected.

## Issues Encountered

- Step 5 default gate command (git diff --diff-filter=A) did not detect untracked tests; used explicit untracked detection and produced atdd-tests-9.4.txt.
- Root workspace npm test -- --run <path> did not target backend path correctly; standardized ATDD file path for backend workspace execution.

## Lessons Learned

- For workspace monorepos, ATDD test lists should use workspace-relative paths to avoid false green runs.
- Route-level IP fallback must include req.ip to avoid accidental global throttling when proxy headers are absent.