---
story_id: '8.4'
created: '2026-02-13'
depends_on: ['8.2', '8.3']
files_modified:
  - packages/backend/src/routes/auth.ts
  - packages/backend/src/services/auth-service.ts
  - packages/backend/src/services/riparazioni-service.ts
  - packages/backend/src/__tests__/portal-ordini-list-detail.atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 8.4

## Files to modify

| File | Change | Depends on |
| ---- | ------ | ---------- |
| `packages/backend/src/services/riparazioni-service.ts` | Extend `listRiparazioni` with optional `clienteId` filter in parser + test-store + database query | - |
| `packages/backend/src/services/auth-service.ts` | Add `listPortalOrdini` and `getPortalOrdineDettaglio` use cases with portal token validation and ownership checks | `packages/backend/src/services/riparazioni-service.ts` |
| `packages/backend/src/routes/auth.ts` | Add `GET /api/portal/ordini` and `GET /api/portal/ordini/:id` with `401/403/500` error mapping consistent with portal routes | `packages/backend/src/services/auth-service.ts` |
| `packages/backend/src/__tests__/portal-ordini-list-detail.atdd.spec.ts` | Keep RED tests aligned with final contract without weakening assertions | `packages/backend/src/routes/auth.ts`, `packages/backend/src/services/auth-service.ts` |

## Implementation order

1. Extend `packages/backend/src/services/riparazioni-service.ts` adding optional `clienteId` to `ListRiparazioniInput` and filter application in both test-store and Prisma branches, preserving current default behavior.
2. Implement in `packages/backend/src/services/auth-service.ts`:
   - `listPortalOrdini(accessToken, query)` with `stato` filter, pagination and deterministic `meta`.
   - `getPortalOrdineDettaglio(accessToken, ordineId)` with ownership validation and payload `{ stato, importi, timeline, documentiCollegati }`.
3. Extend `packages/backend/src/routes/auth.ts` with portal orders routes and dedicated responder mapping for auth/forbidden/service errors.
4. Re-run `packages/backend/src/__tests__/portal-ordini-list-detail.atdd.spec.ts` and adjust only contract mismatches strictly needed to preserve AC intent.
5. Re-run full suite (`npm test -- --run`) and verify tests listed in `docs/sprint-artifacts/atdd-tests-8.4.txt` pass in GREEN phase.

## Patterns to follow

- Bearer token guard + service delegation: `packages/backend/src/routes/auth.ts:422`.
- Route-level error mapping with dedicated responders: `packages/backend/src/routes/auth.ts:219`.
- Query params to list payload mapping: `packages/backend/src/routes/riparazioni.ts:379`.
- Parser validation for pagination/filters (`invalid_integer`, `invalid_enum`): `packages/backend/src/services/riparazioni-service.ts:604`.
- Standard pagination meta shape (`page`, `limit`, `total`, `totalPages`): `packages/backend/src/services/riparazioni-service.ts:1422`.
- Detail shape with timeline/economic fields: `packages/backend/src/services/riparazioni-service.ts:1564`.
- Portal customer resolution from access token: `packages/backend/src/services/auth-service.ts:651`.

## Risks

- Regression risk on existing callers of `listRiparazioni` if new `clienteId` filter changes current default behavior.
- `403` vs `404` semantic drift if ownership checks run at the wrong stage.
- Contract drift between service payload and ATDD expectations for `importi`/`timeline`/`documentiCollegati`.
- Performance risk if customer filter is applied after page slicing instead of before pagination totals.
