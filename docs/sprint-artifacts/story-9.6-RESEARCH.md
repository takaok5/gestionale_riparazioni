# Story 9.6 Research

## Patterns Found

- `packages/frontend/src/App.tsx:86` + `packages/frontend/src/App.tsx:95` implement route parsing (`/servizi/:slug`) and path normalization before rendering. Reuse this pattern for route-scoped SEO metadata resolution.
- `packages/backend/src/routes/public.ts:229` uses thin Express handlers: parse payload, call service, map errors, return typed response. `seo.ts` should follow the same separation.
- `packages/backend/src/services/anagrafiche-service.ts:6705` filters `service.attivo` and sorts by slug before exposing public services. Sitemap generation should derive service URLs from active-only source.
- `packages/backend/src/index.ts:35` centralizes router mounting. Root-level SEO endpoints must be mounted here (not under `/api/public`).

## Known Pitfalls

- No existing head-management utility in frontend; metadata updates must work with browser runtime and not break server-side static markup tests.
- Routing `/sitemap.xml` or `/robots.txt` under `/api/*` would violate AC paths.
- Base URL can vary by environment; canonical and sitemap links must use `PUBLIC_SITE_URL` fallback logic to avoid broken absolute URLs.
- Inactive services (for example `riparazione-legacy`) must be excluded from sitemap even if present in catalog source.

## Stack/Libraries to Use

- Frontend: React + existing `App` route branching (`packages/frontend/src/App.tsx`), with minimal metadata helper and no new dependency unless strictly needed.
- Backend: Express router (`packages/backend/src/routes`), existing service layer in `packages/backend/src/services/anagrafiche-service.ts`.
- Tests: Vitest + Supertest patterns already used in `packages/backend/src/__tests__/public-services-api.atdd.spec.ts` and frontend ATDD specs under `packages/frontend/src/__tests__`.
