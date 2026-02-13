# Review Story 8.3

## Scope

- Reviewed diff for portal dashboard implementation (`/api/portal/me`) and related ATDD tests.
- Verified `[x]` tasks in `docs/stories/8.3.dashboard-cliente.story.md` against code changes in backend and tests.

## Task Evidence

- Task 1 evidence: `packages/backend/src/routes/auth.ts` adds `portalRouter.get("/me", ...)`.
- Task 2 evidence: `packages/backend/src/services/auth-service.ts` adds `getPortalDashboard` with `stats` aggregation.
- Task 3 evidence: `packages/backend/src/services/auth-service.ts` calls `listClienteRiparazioni({ clienteId })`.
- Task 4 evidence: `packages/backend/src/services/auth-service.ts` builds/sorts `eventiRecenti`.
- Task 5 evidence: `packages/backend/src/index.ts` mounts `app.use("/api/portal", portalRouter)`.
- Task 6 evidence: `packages/backend/src/__tests__/portal-dashboard-me.atdd.spec.ts` contains AC-1..AC-4 tests.
- Task 7 evidence: unauthorized handling enforced in both route and service token checks.

### Issue 1 - Potential cross-customer notification leakage
Status: RESOLVED

- Problem: when customer email was unavailable, notification filtering could include unrelated records.
- Fix: notifications are now included only when `clienteEmail` is present and matches recipient.
- Evidence: `packages/backend/src/services/auth-service.ts:701`.

### Issue 2 - Timeline included non-dashboard notification categories
Status: RESOLVED

- Problem: timeline could include non-relevant notification types.
- Fix: introduced `PORTAL_ALLOWED_NOTIFICA_TIPI` and filtered to `STATO_RIPARAZIONE`/`PREVENTIVO`.
- Evidence: `packages/backend/src/services/auth-service.ts:183` and `packages/backend/src/services/auth-service.ts:705`.

### Issue 3 - Duplicate events could appear in timeline
Status: RESOLVED

- Problem: merged events from repairs/notifications could produce duplicated timeline rows.
- Fix: deduplicated by composite key (`tipo:riferimentoId:timestamp`) before final slicing.
- Evidence: `packages/backend/src/services/auth-service.ts:723`.
