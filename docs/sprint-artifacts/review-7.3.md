# Review 7.3

Reviewed at: 2026-02-13T10:51:57.9797026+01:00
Story: 7.3

### Issue 1: Notifications list returned non-deterministic ordering for page slicing
- Severity: Medium
- Status: RESOLVED
- Problem: listNotifiche paginated insertion order, so page-1 boundaries depended on write sequence and did not enforce AC ordering (dataInvio DESC, tie-breaker id DESC).
- Fix: Added deterministic sort before pagination in packages/backend/src/services/notifiche-service.ts.
- Evidence: 
pm --workspace @gestionale/backend test -- src/__tests__/notifiche-list-atdd.spec.ts passes AC-1 ordering assertions.

### Issue 2: Date filter accepted malformed calendar dates and did not handle inverted ranges explicitly
- Severity: Medium
- Status: RESOLVED
- Problem: Date parsing accepted regex-only values and could process invalid dates ambiguously; inverted ranges (dataDa > dataA) were implicit side effects.
- Fix: Added strict calendar-date validation via UTC roundtrip and explicit inverted-range handling in packages/backend/src/services/notifiche-service.ts.
- Evidence: New tests in packages/backend/src/__tests__/notifiche-list-atdd.spec.ts verify invalid date handling and empty dataset on inverted range.

### Issue 3: authorize() allowed misconfiguration with no roles
- Severity: Low
- Status: RESOLVED
- Problem: uthorize() accepted variadic values but did not fail fast when no role was configured, enabling silent configuration errors.
- Fix: Added guard AUTHORIZE_ROLES_REQUIRED in packages/backend/src/middleware/auth.ts and kept default behavior for existing routes.
- Evidence: Full suite green with unchanged existing route behavior and endpoint-specific override for /api/notifiche.

## Task Marker Verification

- All [x] tasks in docs/stories/7.3.log-consultazione-notifiche.story.md have code/test evidence in modified files:
  - query + date forwarding: packages/backend/src/routes/notifiche.ts
  - filtering/sort/pagination/date logic: packages/backend/src/services/notifiche-service.ts
  - admin-only message contract: packages/backend/src/middleware/auth.ts + packages/backend/src/routes/notifiche.ts
  - ATDD coverage: packages/backend/src/__tests__/notifiche-list-atdd.spec.ts

False positives found: 0
