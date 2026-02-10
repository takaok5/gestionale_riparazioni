# Story 1.1 Research

## Patterns Found

- `packages/backend/src/index.ts:9` to `packages/backend/src/index.ts:13` mounts global middleware (`helmet`, `cors`, `express.json`) and registers routers via `app.use(...)`.
- `packages/backend/src/routes/health.ts:1` to `packages/backend/src/routes/health.ts:7` shows the project router pattern (`Router()` + inline handler + JSON response).
- `packages/backend/src/middleware/auth.ts:17` to `packages/backend/src/middleware/auth.ts:54` contains auth middleware conventions (Bearer token extraction, JWT verification, role authorization).

## Known Pitfalls

- No existing `/api/auth/login` route exists; login flow must be introduced without breaking current route registration.
- No backend test files were found in `packages/` for auth/login flows, so RED phase must add tests from scratch.
- No existing rate-limit/throttle implementation was found for login attempts; AC-4 requires a new mechanism with deterministic retry window behavior.

## Stack/Libraries to Use

- Express router and app registration patterns already used in `packages/backend/src/index.ts` and `packages/backend/src/routes/health.ts`.
- `jsonwebtoken` already present in `packages/backend/src/middleware/auth.ts` for JWT-related behavior.
- Prisma schema (`packages/backend/prisma/schema.prisma`) and shared types (`packages/shared/src/types/index.ts`) for data model and response typing alignment.