---
story_id: '9.2'
created: '2026-02-13T23:35:02+01:00'
depends_on: []
files_modified:
  - packages/backend/prisma/schema.prisma
  - packages/backend/src/services/anagrafiche-service.ts
  - packages/backend/src/routes/public.ts
  - packages/backend/src/index.ts
  - packages/backend/src/__tests__/public-services-api.atdd.spec.ts
  - packages/frontend/src/main.tsx
  - packages/frontend/src/App.tsx
  - packages/frontend/src/__tests__/public-services-detail.atdd.spec.ts
  - gestionale_riparazioni/urls.py
must_pass: [typecheck, lint, test]
---

# Plan Story 9.2

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/backend/prisma/schema.prisma | Add public service catalog model with slug/category/active/detail fields required by AC-1..AC-4 | - |
| packages/backend/src/services/anagrafiche-service.ts | Add parse/list/detail functions for public services with category filter and inactive-slug guard | packages/backend/prisma/schema.prisma |
| packages/backend/src/routes/public.ts | Add unauthenticated GET /services and GET /services/:slug with deterministic error mapping | packages/backend/src/services/anagrafiche-service.ts |
| packages/backend/src/index.ts | Mount public router at /api/public without auth middleware | packages/backend/src/routes/public.ts |
| packages/backend/src/__tests__/public-services-api.atdd.spec.ts | Move RED tests to GREEN by aligning assertions with real payload/error contract | packages/backend/src/index.ts |
| packages/frontend/src/main.tsx | Introduce route handling for /servizi/:slug in public area | packages/frontend/src/App.tsx |
| packages/frontend/src/App.tsx | Render service detail state for slug page and keep existing homepage intact | packages/backend/src/routes/public.ts |
| packages/frontend/src/__tests__/public-services-detail.atdd.spec.ts | Keep AC-3 assertions aligned with actual detail markup and route behavior | packages/frontend/src/main.tsx, packages/frontend/src/App.tsx |
| gestionale_riparazioni/urls.py | Align Django public URL handling for /servizi/<slug> to avoid route ownership conflicts | packages/frontend/src/main.tsx |

## Implementation order

1. Extend data model in packages/backend/prisma/schema.prisma and add service-layer primitives in packages/backend/src/services/anagrafiche-service.ts for list/detail public catalog operations.
2. Implement packages/backend/src/routes/public.ts with list/detail endpoints and map service errors via uildErrorResponse, then mount it in packages/backend/src/index.ts.
3. Make backend RED tests pass in packages/backend/src/__tests__/public-services-api.atdd.spec.ts and ensure AC-1/AC-2/AC-4 payload and error expectations are met.
4. Implement public slug detail rendering flow in packages/frontend/src/main.tsx and packages/frontend/src/App.tsx, including fetch to /api/public/services/:slug and 404 handling.
5. Align Django URL ownership in gestionale_riparazioni/urls.py for /servizi/<slug> so browser routing remains consistent across runtime entrypoints.
6. Make frontend RED tests pass in packages/frontend/src/__tests__/public-services-detail.atdd.spec.ts, preserving homepage assertions from story 9.1.
7. Run full quality checks (
pm run typecheck, 
pm run lint, 
pm test -- --run) and update story task checkboxes plus artifacts.

## Patterns to follow

- From docs/sprint-artifacts/story-9.2-RESEARCH.md: route payload parsing + error mapping contract used in packages/backend/src/routes/fornitori.ts:210 and packages/backend/src/routes/fornitori.ts:115.
- From docs/sprint-artifacts/story-9.2-RESEARCH.md: enum filter normalization and parser flow in packages/backend/src/services/anagrafiche-service.ts:2214 and packages/backend/src/services/anagrafiche-service.ts:2241.
- From docs/sprint-artifacts/story-9.2-RESEARCH.md: service entrypoint split test-store vs database in packages/backend/src/services/anagrafiche-service.ts:5630.
- From docs/sprint-artifacts/story-9.2-RESEARCH.md: keep frontend ATDD style and deterministic static assertions consistent with packages/frontend/src/__tests__/public-home-vetrina.atdd.spec.ts:21.

## Risks

- Public route may accidentally inherit auth middleware conventions and break anonymous access if mounted incorrectly.
- Schema/model changes for service catalog can ripple into Prisma migrations and test fixtures if not isolated.
- Dual Django/React public routing can produce inconsistent detail behavior on /servizi/:slug unless one ownership path is explicit.
- Error payload contract for inactive service (SERVICE_NOT_FOUND) must be stable across backend and frontend tests to avoid brittle assertions.