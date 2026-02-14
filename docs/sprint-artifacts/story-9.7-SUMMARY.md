---
story_id: '9.7'
completed: '2026-02-14T04:33:06.7995343+01:00'
duration: '01:42:23'
---

# Story 9.7 Summary

## Stats

- Files created: 19
- Files modified: 4
- Lines added: 1859
- Lines removed: 7
- Tests added: 1
- Commits: 1

## Decisions Made

- Conversion flow now defers richiesta state transition until riparazione draft creation succeeds.
- Existing customer matching uses case-insensitive email normalization to avoid duplicate clienti.
- Route enforces explicit 401 handling when authenticated actor id is unavailable.

## Deviations from Plan

- None.

## Issues Encountered

- Review identified a partial-state inconsistency when riparazione creation failed after conversion.
- Existing customer lookup in DB path was case-sensitive and risked duplicate creation.
- Route-level auth edge case returned 400 instead of explicit 401.

## Lessons Learned

- Conversion orchestration across entities must use deferred/finalized transitions for consistency.
- Case-insensitive matching must be enforced at query boundary, not only in in-memory normalization.
- Route guards should fail fast for auth invariants before service execution.
