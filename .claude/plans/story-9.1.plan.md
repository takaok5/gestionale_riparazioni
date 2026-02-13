---
story_id: '9.1'
created: '2026-02-13T22:56:32+01:00'
depends_on: []
files_modified:
  - packages/frontend/src/App.tsx
  - packages/frontend/src/index.css
  - packages/frontend/src/__tests__/public-home-vetrina.atdd.spec.ts
  - package.json
  - gestionale_riparazioni/urls.py
must_pass: [typecheck, lint, test]
---

# Plan Story 9.1

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/frontend/src/App.tsx | Replace placeholder with public home sections (hero, servizi, trust, dual CTA links) and query-safe rendering path | - |
| packages/frontend/src/index.css | Add global overflow protections and utility support for responsive 390px layout | packages/frontend/src/App.tsx |
| gestionale_riparazioni/urls.py | Remove root @login_required guard so / stays publicly reachable | - |
| package.json | Add reproducible Lighthouse script for story 9.1 and output artifact path | packages/frontend/src/App.tsx |
| packages/frontend/src/__tests__/public-home-vetrina.atdd.spec.ts | Align assertions with final markup/classnames and keep AC traceability | packages/frontend/src/App.tsx, packages/frontend/src/index.css, package.json |

## Implementation order

1. Implement homepage structure and CTA targets in packages/frontend/src/App.tsx (AC-1, AC-4, AC-5 baseline).
2. Add responsive/no-overflow styling in packages/frontend/src/index.css and class usage in packages/frontend/src/App.tsx (AC-2).
3. Remove root login guard in gestionale_riparazioni/urls.py to keep / public for anonymous users (AC-1 enablement).
4. Add Lighthouse script in root package.json that writes docs/sprint-artifacts/lighthouse-9.1.json (AC-3).
5. Update packages/frontend/src/__tests__/public-home-vetrina.atdd.spec.ts only if selectors/labels changed, then run frontend tests and full workspace tests to move RED->GREEN.

## Patterns to follow

- From docs/sprint-artifacts/story-9.1-RESEARCH.md: keep app bootstrap unchanged (packages/frontend/src/main.tsx:6 + App composition).
- From docs/frontend-spec.md:203: preserve public-home content contract (hero, service cards, trust blocks, CTA labels).
- From packages/frontend/src/index.css:1: continue Tailwind-layer style approach, avoid ad-hoc inline styles.
- From packages/backend/src/routes/auth.ts:572 and packages/backend/src/routes/auth.ts:574: preserve /portale/login ecosystem compatibility by routing CTA exactly to /portale/login.

## Risks

- If markup labels diverge from story AC text, ATDD tests stay red even with visually correct layout.
- If root route remains auth-protected, story behavior can pass unit tests but fail real anonymous access.
- Lighthouse score can fluctuate without deterministic command/profile flags.