---
story_id: '9.3'
created: '2026-02-14'
depends_on: ['9.1', '9.2']
files_modified:
  - packages/backend/src/services/anagrafiche-service.ts
  - packages/backend/src/routes/public.ts
  - packages/frontend/src/App.tsx
  - packages/backend/src/__tests__/public-contacts-faq-api.atdd.spec.ts
  - packages/frontend/src/__tests__/public-contatti-faq-pages.atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 9.3

## Files to modify

| File | Change | Depends on |
| --------------- | ----------- | ---------- |
| `packages/backend/src/services/anagrafiche-service.ts` | Add typed readers for public contacts and FAQ payload from public config, including fallback/validation for missing values | existing parse/result helpers in same file |
| `packages/backend/src/routes/public.ts` | Add `GET /pages/:slug` and `GET /faq` handlers with deterministic `buildErrorResponse` mapping (`PAGE_NOT_FOUND`, validation, unavailable) | new service functions from `anagrafiche-service.ts` |
| `packages/frontend/src/App.tsx` | Add route branches `/contatti` and `/faq`, breadcrumb rendering and page-specific titles; preserve `/servizi/:slug` precedence | API contracts in `public.ts`; existing route parsing function |
| `packages/backend/src/__tests__/public-contacts-faq-api.atdd.spec.ts` | Convert RED tests to GREEN expectations based on final payload shape and status/error mapping | backend route/service implementation |
| `packages/frontend/src/__tests__/public-contatti-faq-pages.atdd.spec.ts` | Convert RED tests to GREEN markup expectations for contacts/faq pages and breadcrumb flow | frontend route/page implementation |

## Implementation order

1. Implement backend service layer in `packages/backend/src/services/anagrafiche-service.ts` for contacts/faq retrieval, deterministic output shape, and fallback behavior.
2. Wire backend endpoints in `packages/backend/src/routes/public.ts` using new service functions and route-level error responders aligned with existing public router conventions.
3. Implement frontend route branches in `packages/frontend/src/App.tsx` for `/contatti` and `/faq`, keeping `getServiceSlugFromPath` detail flow untouched and adding breadcrumb/title consistency.
4. Update backend ATDD in `packages/backend/src/__tests__/public-contacts-faq-api.atdd.spec.ts` to validate the final API behavior (`200` for supported content, `404 PAGE_NOT_FOUND` for unsupported slug).
5. Update frontend ATDD in `packages/frontend/src/__tests__/public-contatti-faq-pages.atdd.spec.ts` to validate rendered contact data, FAQ category/answer content, and `/ -> /faq -> /` navigation semantics.
6. Run focused tests first (`backend` + `frontend` new specs), then full workspace `npm test -- --run`, and capture output in `docs/sprint-artifacts/test-output-9.3.txt`.

## Patterns to follow

- From `docs/sprint-artifacts/story-9.3-RESEARCH.md`: keep route branching strategy from `packages/frontend/src/App.tsx:56` (`getServiceSlugFromPath`) and avoid breaking `/servizi/:slug` rendering.
- From `docs/sprint-artifacts/story-9.3-RESEARCH.md`: follow response/error helper style from `packages/backend/src/routes/public.ts:24` and `packages/backend/src/routes/public.ts:51`.
- From `docs/sprint-artifacts/story-9.3-RESEARCH.md`: use parse/validate/map structure from `packages/backend/src/services/anagrafiche-service.ts:5994` and `packages/backend/src/services/anagrafiche-service.ts:6032`.
- Keep ATDD naming convention `Tests AC-*` already used in `packages/frontend/src/__tests__/public-home-vetrina.atdd.spec.ts:22` and `packages/backend/src/__tests__/public-services-api.atdd.spec.ts:6`.

## Risks

- Route precedence regression: if `/faq` and `/contatti` checks are ordered incorrectly, `/servizi/:slug` detail logic can break.
- Contract drift backend/frontend: payload keys for contacts/faq must match exactly to avoid brittle UI assertions.
- Incomplete sad path handling: unsupported slug must return deterministic `PAGE_NOT_FOUND` and not generic Express HTML 404.
- Existing public tests may assert current static home-only rendering and need careful update to avoid collateral regressions.
