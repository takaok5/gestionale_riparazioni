---
story_id: "5.5"
completed: "2026-02-12T17:45:10+01:00"
duration: "session"
---

# Story 5.5 Summary

## Stats

- Files created: 12
- Files modified: 4
- Lines added: 946
- Tests added: 8
- Commits: 8

## Decisions Made

- Implemented `/api/ordini` as backend-only endpoint with `ADMIN` authorization and route-level domain error mapping.
- Centralized order creation logic in `anagrafiche-service` to keep consistency with existing supplier/article service patterns.
- Added `OrdineFornitoreVoce` model to persist order lines and keep AC-1/AC-3 traceability.
- Kept ATDD scope focused on story 5.5 and validated regressions on existing `fornitori` and `articoli` suites.

## Deviations from Plan

- During review, DB implementation was hardened with retry on `numeroOrdine` collisions and strict mandatory line persistence check; this was an improvement over the initial step-7 implementation.

## Issues Encountered

- Initial RED-to-GREEN transition failed AC-1 because test data did not include required article records.
- Fixed by seeding required articles in the ATDD test before order creation.
- Review identified and fixed 3 additional implementation issues (duplicate article IDs, no unique retry, silent missing-line-model fallback).

## Lessons Learned

- For entity references in ATDD, setup fixtures explicitly in tests instead of assuming baseline IDs exist.
- Unique business identifiers (`numeroOrdine`) should always include collision strategy even with deterministic generation.
- Silent fallbacks on persistence layers can hide data-integrity bugs; fail fast is safer for core transactional flows.

