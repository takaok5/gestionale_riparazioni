# Story 9.5 Research

## Patterns Found

- `packages/backend/src/routes/public.ts:283` uses a thin-route pattern: request parsing, service call, centralized failure mapping, deterministic success payload.
- `packages/backend/src/routes/riparazioni.ts:463` and `packages/backend/src/routes/riparazioni.ts:483` show PATCH endpoint structure for assignment/state transitions with `authenticate`, `authorize`, and typed payload mapping.
- `packages/backend/src/routes/audit-log.ts:37` shows role-gated list endpoints and service response forwarding for paginated reads.
- `packages/backend/src/middleware/auth.ts:125` and `packages/backend/src/middleware/auth.ts:131` provide canonical `401/403` authorization behavior with `buildErrorResponse("FORBIDDEN", ...)`.
- `packages/backend/src/__tests__/audit-trail.spec.ts:252` and `packages/backend/src/__tests__/audit-trail.spec.ts:259` validate pagination assertions (`pagination.page`, `pagination.pageSize`) that can be reused for AC-1.

## Known Pitfalls

- New router files are unreachable if not mounted in `packages/backend/src/index.ts` (`app.use("/api/richieste", richiesteRouter)` must be added).
- Existing lead flow in `anagrafiche-service` is currently shaped around public creation; adding backoffice transitions without explicit audit details can make AC-2 non-testable.
- Role handling must be explicit for AC-4: `TECNICO` must receive `403 FORBIDDEN`, not generic `500`/`401` fallback.
- Pagination response shape must stay consistent with existing tests (`pagination.page`, `pagination.pageSize`) to avoid contract drift.

## Stack/Libraries to Use

- Express Router + middleware chain (`authenticate`, `authorize`) in backend route modules.
- Shared error envelope via `packages/backend/src/lib/errors.ts` (`buildErrorResponse`).
- Existing service-layer style in `packages/backend/src/services/anagrafiche-service.ts`.
- Vitest + Supertest for ATDD endpoint coverage in `packages/backend/src/__tests__`.