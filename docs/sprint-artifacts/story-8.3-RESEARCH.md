## Patterns Found

- `packages/backend/src/routes/dashboard.ts` uses route -> service -> `buildErrorResponse` mapping with explicit status codes for validation/forbidden/service errors. Reuse the same route contract style for `GET /api/portal/me`.
- `packages/backend/src/routes/auth.ts` already has portal endpoints (`/api/portal/auth/*`) with deterministic unauthorized handling (`UNAUTHORIZED`, `Token mancante o non valido`). Keep the same error envelope and wording in the new endpoint.
- `packages/backend/src/services/notifiche-service.ts` sorts rows by descending `dataInvio`; this is the reference pattern for timeline ordering in `eventiRecenti`.

## Known Pitfalls

- Mixing staff and portal auth semantics can accidentally allow wrong tokens if route guards are not checked consistently.
- Counter aggregation across multiple services can produce performance regressions if each counter triggers independent expensive queries.
- Timeline generation from multiple sources can duplicate or mis-order events without normalized timestamps and deterministic sorting.

## Stack/Libraries to Use

- Express Router + existing middleware `authenticate` for route protection.
- Existing service layer (`auth-service`, `anagrafiche-service`, `riparazioni-service`, `preventivi-service`, `notifiche-service`) to avoid duplicating business logic.
- Vitest + Supertest ATDD style already used in `packages/backend/src/__tests__/*-atdd.spec.ts`.
