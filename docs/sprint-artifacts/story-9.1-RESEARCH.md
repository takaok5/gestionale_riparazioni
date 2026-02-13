## Patterns Found

- packages/frontend/src/main.tsx:6 renders the app through ReactDOM.createRoot(...); homepage UI changes should stay inside App.tsx to preserve bootstrap flow.
- packages/frontend/src/index.css:1 uses Tailwind layers (@tailwind base/components/utilities), so responsive fixes should follow utility-first classes already used in App.tsx.
- gestionale_riparazioni/urls.py:6 currently protects root home_view with @login_required; for a public homepage this is the primary regression point to remove.
- docs/frontend-spec.md:203 defines Home/Servizi public structure (hero, service cards, trust blocks, CTA labels), which should be reused as content contract.
- packages/backend/src/routes/auth.ts:572 and packages/backend/src/routes/auth.ts:574 already expose portal login behavior; CTA routing must target /portale/login coherently with existing auth flow.

## Known Pitfalls

- Leaving @login_required on / makes AC-1 fail by redirecting anonymous users to login.
- Implementing CTA with a mismatched route (/portal/login vs /portale/login) causes broken navigation.
- Mobile layout can appear visually correct while still failing AC-2 if any section exceeds viewport width and causes hidden horizontal scroll.
- Lighthouse AC can become non-repeatable if command/profile is not fixed (mobile profile + deterministic output parsing).

## Stack/Libraries to Use

- Frontend: React 18 + Vite (packages/frontend/package.json)
- Styling: Tailwind CSS (packages/frontend/src/index.css)
- Routing target contract: /portale/login from frontend spec (docs/frontend-spec.md)
- Validation/tooling: Vitest for component assertions; Lighthouse CLI for performance threshold checks