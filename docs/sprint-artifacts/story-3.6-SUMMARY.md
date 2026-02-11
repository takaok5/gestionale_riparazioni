---
story_id: '3.6'
completed: '2026-02-11T20:57:00+01:00'
duration: '00:23:00'
---

# Story 3.6 Summary

## Stats

- Files created: 10
- Files modified: 3
- Lines added: 700+
- Tests added: 16
- Commits: 1

## Decisions Made

- Reused the existing transition engine in `packages/backend/src/services/riparazioni-service.ts` instead of adding parallel logic.
- Added one explicit sad-path AC (AC-8) to keep preventivo workflow testable and review-complete.
- Implemented ATDD in a dedicated test file `packages/backend/src/__tests__/riparazioni-stato-preventivo-atdd.spec.ts` to isolate story scope.

## Deviations from Plan

- Introduced execution fallbacks for gate commands in bash environment (Node PATH and new-test detection), without changing product code behavior.

## Issues Encountered

- Bash gate could not find `node` -> resolved by exporting `/mnt/c/nvm4w/nodejs` in gate execution context.
- RED gate default new-test detection did not include untracked files -> resolved by explicit `atdd-tests-3.6.txt`.
- Initial GREEN run failed on missing preventivo transitions -> resolved by extending `BASE_ALLOWED_TRANSITIONS`.

## Lessons Learned

- Keep transition rules centralized and additive to avoid regressions across existing stato flows.
- Story ACs with explicit history assertions reduce ambiguity and speed up RED->GREEN cycles.
