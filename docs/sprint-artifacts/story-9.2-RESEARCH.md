# Story 9.2 Research

## Patterns Found

- Route handlers parse query payload and delegate business logic to service functions, then map validation/service errors via `buildErrorResponse` (`packages/backend/src/routes/fornitori.ts:210`, `packages/backend/src/routes/fornitori.ts:115`).
- List endpoints expose deterministic payload shape (`data` + `meta`) and optional enum filters (`categoria`) with parser-level validation in services (`packages/backend/src/routes/articoli.ts:169`, `packages/backend/src/services/anagrafiche-service.ts:2241`).
- Category filters are normalized and validated through dedicated helpers before querying stores/Prisma (`packages/backend/src/services/anagrafiche-service.ts:2214`, `packages/backend/src/services/anagrafiche-service.ts:5235`).
- Service entrypoints already separate test-store and database flows; new public catalog behavior should follow the same split for ATDD reliability (`packages/backend/src/services/anagrafiche-service.ts:5630`).
- API router registration is centralized in backend bootstrap; any new public router must be mounted there (`packages/backend/src/index.ts:29`).
- Public homepage currently exists in both React static render and Django route ownership for `/`, showing a dual-stack public surface (`packages/frontend/src/App.tsx:39`, `gestionale_riparazioni/urls.py:40`).

## Known Pitfalls

- No existing `/api/public/*` router in backend: copying authenticated route patterns without removing `authenticate/authorize` will violate public ACs (`packages/backend/src/middleware/auth.ts:34`).
- Prisma schema currently has no dedicated service-catalog model with `slug` and `attivo`; implementing AC-1/AC-4 without explicit data model risks inconsistent behavior (`packages/backend/prisma/schema.prisma:74`).
- Dual ownership of public pages (Django and React) can create conflicting behavior for `/servizi/:slug` unless one source of truth is chosen (`packages/frontend/src/main.tsx:1`, `gestionale_riparazioni/urls.py:43`).
- Existing frontend ATDD covers only homepage static markup; adding catalog/detail flows without new tests can pass CI while missing AC regressions (`packages/frontend/src/__tests__/public-home-vetrina.atdd.spec.ts:21`).

## Stack/Libraries to Use

- Backend HTTP/API: Express routers + middleware already used in `packages/backend/src/routes/*`.
- Validation/error contract: existing `buildErrorResponse` helper in `packages/backend/src/lib/errors.ts:11`.
- Persistence: Prisma schema + client in `packages/backend/prisma/schema.prisma` and backend services.
- Backend testing: Vitest + Supertest patterns from `packages/backend/src/__tests__/fornitori-list-search-atdd.spec.ts:1`.
- Frontend rendering/tests: React + Vitest server-side markup assertions from `packages/frontend/src/__tests__/public-home-vetrina.atdd.spec.ts:1`.