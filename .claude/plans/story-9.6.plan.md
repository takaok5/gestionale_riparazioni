---
story_id: '9.6'
created: '2026-02-14'
depends_on: []
files_modified:
  - packages/frontend/src/App.tsx
  - packages/frontend/index.html
  - packages/frontend/src/__tests__/public-seo-metadata.atdd.spec.ts
  - packages/backend/src/services/anagrafiche-service.ts
  - packages/backend/src/routes/seo.ts
  - packages/backend/src/index.ts
  - packages/backend/src/__tests__/public-seo-routes.atdd.spec.ts
  - docs/sprint-artifacts/story-9.6-SUMMARY.md
  - docs/sprint-artifacts/story-9.6-VERIFICATION.md
must_pass: [typecheck, lint, test]
---

# Plan Story 9.6

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/frontend/src/App.tsx | Add route-based SEO metadata model and inject title/meta/canonical/og tags into rendered output for public routes. | story AC-1/AC-2 |
| packages/frontend/index.html | Set stronger default title/description for initial bootstrap when route metadata is not yet rendered. | none |
| packages/frontend/src/__tests__/public-seo-metadata.atdd.spec.ts | Keep RED tests and align assertions with final metadata strings if needed after implementation details stabilize. | App.tsx |
| packages/backend/src/services/anagrafiche-service.ts | Expose helper that returns active public service slugs for sitemap generation. | existing publicServiceCatalog |
| packages/backend/src/routes/seo.ts (new) | Implement /sitemap.xml and /robots.txt handlers with content-type and base URL fallback logic. | nagrafiche-service.ts helper |
| packages/backend/src/index.ts | Mount SEO routes at root level (/sitemap.xml, /robots.txt) without /api prefix. | outes/seo.ts |
| packages/backend/src/__tests__/public-seo-routes.atdd.spec.ts | Keep RED tests and ensure assertions target final payload structure/content. | outes/seo.ts, index.ts |
| docs/sprint-artifacts/story-9.6-VERIFICATION.md | Capture GREEN test evidence and gate outcomes. | implementation + tests |
| docs/sprint-artifacts/story-9.6-SUMMARY.md | Summarize completed scope, changed files, and residual risks. | verification results |

## Implementation order

1. Implement frontend metadata rendering in packages/frontend/src/App.tsx and bootstrap defaults in packages/frontend/index.html to satisfy AC-1/AC-2 baseline expectations.
2. Add backend slug helper in packages/backend/src/services/anagrafiche-service.ts and build new router packages/backend/src/routes/seo.ts for /sitemap.xml and /robots.txt.
3. Register SEO router endpoints in packages/backend/src/index.ts at root paths, then run targeted backend tests for SEO routes.
4. Re-run frontend SEO tests and adjust metadata strings only if there is mismatch between implemented copy and AC-required literals.
5. Run full workspace test suite (
pm test -- --run) and generate verification + summary artifacts for step 7/8 handoff.

## Patterns to follow

- From docs/sprint-artifacts/story-9.6-RESEARCH.md: reuse route normalization and path-based branching pattern from packages/frontend/src/App.tsx:95.
- From docs/sprint-artifacts/story-9.6-RESEARCH.md: follow thin route handler style from packages/backend/src/routes/public.ts:229 (parse request, call service, deterministic response).
- From docs/sprint-artifacts/story-9.6-RESEARCH.md: derive sitemap service URLs from active-only source based on packages/backend/src/services/anagrafiche-service.ts:6705.
- Keep endpoint mounting pattern consistent with packages/backend/src/index.ts:35 and existing root app wiring.

## Risks

- Injecting metadata tags in component output may impact existing frontend snapshot/string expectations.
- Root-level SEO routes can conflict with future static hosting assumptions if mounted incorrectly.
- Base URL fallback mismatches between frontend and backend can produce canonical/sitemap divergence.
- Existing catalog data ordering/filter assumptions might change sitemap determinism if helper is not explicitly sorted.
