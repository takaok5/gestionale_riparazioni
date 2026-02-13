---
story_id: '7.3'
created: '2026-02-13'
depends_on: []
files_modified:
  - packages/backend/src/services/notifiche-service.ts
  - packages/backend/src/routes/notifiche.ts
  - packages/backend/src/middleware/auth.ts
  - packages/backend/src/__tests__/notifiche-list-atdd.spec.ts
must_pass: [test]
---

# Plan Story 7.3

## Files to modify

| File | Change | Depends on |
| --------------- | ----------- | ---------- |
| packages/backend/src/services/notifiche-service.ts | Extend ListNotificheInput with dataDa/dataA; add date parsing + inclusive range filter; enforce deterministic sort by dataInvio DESC, id DESC before pagination | - |
| packages/backend/src/routes/notifiche.ts | Forward dataDa/dataA query params; preserve existing response shape { data, meta } | services/notifiche-service.ts |
| packages/backend/src/middleware/auth.ts | Add non-breaking optional custom forbidden message parameter to uthorize(...), defaulting to current message for existing routes | - |
| packages/backend/src/routes/notifiche.ts | Use new uthorize capability (if introduced) to return Admin only for /api/notifiche 403 contract | middleware/auth.ts |
| packages/backend/src/__tests__/notifiche-list-atdd.spec.ts | Keep RED tests; adjust only if implementation reveals strictly invalid assumptions while preserving story AC intent | services/notifiche-service.ts, routes/notifiche.ts, middleware/auth.ts |

## Implementation order

1. Update packages/backend/src/services/notifiche-service.ts for deterministic ordering and date-range filtering (dataDa, dataA) with inclusive boundaries.
2. Update packages/backend/src/routes/notifiche.ts to pass dataDa and dataA into listNotifiche while keeping API envelope unchanged.
3. Implement endpoint-specific forbidden message support (Admin only) through a non-breaking extension in packages/backend/src/middleware/auth.ts and wire it in packages/backend/src/routes/notifiche.ts.
4. Run RED test target packages/backend/src/__tests__/notifiche-list-atdd.spec.ts and verify expected failures move to green for AC-1/4/5.
5. Run workspace tests and ensure no regression outside story 7.3.

## Patterns to follow

- Route query forwarding pattern from packages/backend/src/routes/fatture.ts:271 and packages/backend/src/routes/fatture.ts:275.
- Date filter validation and range checks pattern from packages/backend/src/services/fatture-service.ts:457 and packages/backend/src/services/fatture-service.ts:491.
- Pagination result shape and total pages calculation pattern from packages/backend/src/services/notifiche-service.ts:238 and packages/backend/src/services/fatture-service.ts:716.
- Admin-only contract message style (Admin only) from packages/backend/src/services/dashboard-service.ts:403.

## Risks

- Changing uthorize signature may unintentionally affect all protected routes if default behavior is not preserved.
- Date parsing that accepts malformed values can produce silent mis-filtering and brittle tests.
- Sorting changes in notifications endpoint can alter behavior expected by existing tests from stories 7.1/7.2.
