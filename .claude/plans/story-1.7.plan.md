---
story_id: '1.7'
created: '2026-02-10'
depends_on: []
files_modified:
  - packages/backend/prisma/schema.prisma
  - packages/shared/src/types/index.ts
  - packages/backend/src/services/anagrafiche-service.ts
  - packages/backend/src/routes/clienti.ts
  - packages/backend/src/routes/fornitori.ts
  - packages/backend/src/routes/audit-log.ts
  - packages/backend/src/index.ts
  - packages/backend/src/__tests__/audit-trail.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 1.7

## Files to modify

| File | Change | Depends on |
| --------------- | ----------- | ---------- |
| packages/backend/prisma/schema.prisma | Extend `AuditLog` with `dettagli` JSON payload for update old/new snapshots and keep `userId/action/modelName/objectId/timestamp` contract | - |
| packages/shared/src/types/index.ts | Extend shared `AuditLog` type and add paginated `AuditLogListResponse` contract used by `/api/audit-log` | packages/backend/prisma/schema.prisma |
| packages/backend/src/services/anagrafiche-service.ts | Introduce create/update/query logic for Cliente/Fornitore/AuditLog with in-memory test store + Prisma runtime branch | packages/backend/prisma/schema.prisma |
| packages/backend/src/routes/clienti.ts | Add `POST /api/clienti` route with `authenticate + authorize("ADMIN")` and error mapping via `buildErrorResponse` | packages/backend/src/services/anagrafiche-service.ts |
| packages/backend/src/routes/fornitori.ts | Add `PUT /api/fornitori/:id` route with deterministic validation and audit update trigger | packages/backend/src/services/anagrafiche-service.ts |
| packages/backend/src/routes/audit-log.ts | Add `GET /api/audit-log` route with admin-only access, `modelName` filter, page-based pagination, and structured JSON response | packages/backend/src/services/anagrafiche-service.ts |
| packages/backend/src/index.ts | Mount new routers: `/api/clienti`, `/api/fornitori`, `/api/audit-log` | packages/backend/src/routes/clienti.ts |
| packages/backend/src/__tests__/audit-trail.spec.ts | Turn RED tests GREEN by aligning payload shape and status/error mapping to implemented routes | packages/backend/src/routes/audit-log.ts |

## Implementation order

1. Data-contract task: update `packages/backend/prisma/schema.prisma` and `packages/shared/src/types/index.ts` to define audit payload (`dettagli.old/new`) and paginated audit response shape.
2. Service task: implement `packages/backend/src/services/anagrafiche-service.ts` with create cliente, update fornitore, audit append, and query/filter/pagination behavior (test-store for `NODE_ENV=test`, Prisma for runtime).
3. Route task: add `packages/backend/src/routes/clienti.ts` and wire `POST /api/clienti` with ADMIN auth and explicit 201 payload contract.
4. Route task: add `packages/backend/src/routes/fornitori.ts` and wire `PUT /api/fornitori/:id` with 200 payload and audit update details.
5. Route task: add `packages/backend/src/routes/audit-log.ts` and enforce ADMIN-only 200 list + TECNICO 403 behavior.
6. Integration task: update `packages/backend/src/index.ts` to mount new routers and keep existing auth/users routes untouched.
7. Verification task: adjust/confirm `packages/backend/src/__tests__/audit-trail.spec.ts` assertions against final payload shape, then run `npm test`, `npm run typecheck`, `npm run lint`.

## Patterns to follow

- Follow route-level error mapping pattern from `packages/backend/src/routes/users.ts:26` (`respond*Failure` helpers + `buildErrorResponse`).
- Follow RBAC middleware usage from `packages/backend/src/routes/users.ts:113` with `authenticate` + `authorize("ADMIN")`.
- Follow validation/result union pattern from `packages/backend/src/services/users-service.ts:151` and `packages/backend/src/services/users-service.ts:582` (parse input first, then runtime branch test-store/DB).
- Follow paginated-list response style aligned with existing list semantics documented in `docs/sprint-artifacts/story-1.7-RESEARCH.md` (`pageSize = 10`).

## Risks

- Schema change (`dettagli` in `AuditLog`) may require migration alignment before non-test runtime.
- Divergence between in-memory test store and Prisma branch can produce GREEN tests but runtime drift.
- Audit payload can accidentally include sensitive fields if not explicitly whitelisted in snapshot builder.
