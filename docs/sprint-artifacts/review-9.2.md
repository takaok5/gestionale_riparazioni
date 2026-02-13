# Review 9.2

Story: `9.2.catalogo-servizi-pubblico.story.md`

## Task Evidence

- Task 1 evidence: `packages/backend/prisma/schema.prisma` contains `model ServizioVetrina`; `packages/backend/src/services/anagrafiche-service.ts` contains catalog fixtures.
- Task 2 evidence: `packages/backend/src/services/anagrafiche-service.ts` exports `listPublicServices` with category parsing and payload mapping.
- Task 3 evidence: `packages/backend/src/routes/public.ts` defines `GET /services` and `GET /services/:slug`; `packages/backend/src/index.ts` mounts `/api/public`.
- Task 4 evidence: `packages/backend/src/services/anagrafiche-service.ts` exports `getPublicServiceBySlug`; `packages/backend/src/routes/public.ts` maps `NOT_FOUND` to `SERVICE_NOT_FOUND`.
- Task 5 evidence: `packages/frontend/src/main.tsx` passes current pathname to `App`; `packages/frontend/src/App.tsx` renders `/servizi/:slug` detail; `gestionale_riparazioni/urls.py` handles `servizi/<slug>`.
- Task 6 evidence: `packages/backend/src/__tests__/public-services-api.atdd.spec.ts` and `packages/frontend/src/__tests__/public-services-detail.atdd.spec.ts` exist and pass.

### Issue 1
Status: RESOLVED

Problem:
- Slug parser accepted any non-empty string, including invalid characters, increasing risk of malformed route input.

Fix applied:
- Added strict slug regex validation in `packages/backend/src/services/anagrafiche-service.ts` using `PUBLIC_SERVICE_SLUG_PATTERN` and returning `VALIDATION_ERROR` for invalid format.

Verification:
- `npm test -- --run src/__tests__/public-services-api.atdd.spec.ts` (backend) passes.

### Issue 2
Status: RESOLVED

Problem:
- Public services list order depended on declaration order only; no explicit sort made ordering brittle if catalog source changes.

Fix applied:
- Added deterministic sort by `slug` before mapping list response in `packages/backend/src/services/anagrafiche-service.ts`.

Verification:
- `npm test -- --run src/__tests__/public-services-api.atdd.spec.ts` passes with stable API expectations.

### Issue 3
Status: RESOLVED

Problem:
- Detail route matching in frontend required exact `/servizi/:slug` (no trailing slash), causing avoidable 404/incorrect rendering on `/servizi/:slug/`.

Fix applied:
- Updated frontend matcher regex in `packages/frontend/src/App.tsx` to accept optional trailing slash.
- Added Django route variant with trailing slash in `gestionale_riparazioni/urls.py`.

Verification:
- `npm test -- --run src/__tests__/public-services-detail.atdd.spec.ts` (frontend) passes.

## Re-Validation

- `npm run typecheck` -> PASS
- `npm run lint` -> PASS
- `npm run build` -> PASS
- `npm test -- --run` -> PASS

False positives: 0