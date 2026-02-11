---
story_id: '3.3'
created: '2026-02-11T19:00:00+01:00'
depends_on:
  - story 3.1
  - story 3.2
files_modified:
  - packages/backend/src/routes/riparazioni.ts
  - packages/backend/src/services/riparazioni-service.ts
  - packages/backend/prisma/schema.prisma
  - packages/backend/src/__tests__/riparazioni-detail-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 3.3

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/backend/prisma/schema.prisma | Add relational models/links for detail payload sections (`statiHistory`, `preventivi`, `ricambi`) to keep Prisma path coherent with story contract. | none |
| packages/backend/src/services/riparazioni-service.ts | Add `getRiparazioneDettaglio` input/result types, parser, route-facing error model, test-store detail logic (history + preventivi + ricambi), database detail query/mapping. | schema.prisma |
| packages/backend/src/routes/riparazioni.ts | Add `GET /api/riparazioni/:id`, map service failures to `400 VALIDATION_ERROR` and `404 RIPARAZIONE_NOT_FOUND`, return standardized envelope. | riparazioni-service.ts |
| packages/backend/src/__tests__/riparazioni-detail-atdd.spec.ts | Keep RED tests as contract; drive implementation to GREEN without relaxing assertions. | routes + service |

## Implementation order

1. Extend `packages/backend/src/services/riparazioni-service.ts` with domain types/parsers/results for detail endpoint (`id` validation, `NOT_FOUND`, service unavailable).
2. Implement detail retrieval in service test-store path, including deterministic `statiHistory` tracking and fixed-size `preventivi`/`ricambi` projections required by AC-2/AC-3.
3. Implement detail retrieval in service database path using `findUnique` + explicit `select`, mapping nested fields to `{ data: { ... } }` and handling missing record.
4. Add `GET /api/riparazioni/:id` in `packages/backend/src/routes/riparazioni.ts` using existing error-response patterns.
5. Update `packages/backend/prisma/schema.prisma` for detail-related relations so DB implementation remains aligned with story and future migrations.
6. Run and fix against `packages/backend/src/__tests__/riparazioni-detail-atdd.spec.ts`, then run full workspace checks (`typecheck`, `lint`, `test`) until GREEN.

## Patterns to follow

- Detail route pattern with payload from `req.params.id` and service delegation:
  - `packages/backend/src/routes/clienti.ts:189`
- Domain not found -> route-specific error code mapping:
  - `packages/backend/src/routes/clienti.ts:95`
- Service detail query via Prisma `findUnique` + explicit `select`:
  - `packages/backend/src/services/anagrafiche-service.ts:2292`
- ISO date mapping in service output:
  - `packages/backend/src/services/riparazioni-service.ts:865`
- ATDD detail assertions on response shape:
  - `packages/backend/src/__tests__/clienti-detail-update-atdd.spec.ts:148`

## Risks

- Test-store and database paths may diverge if logic is implemented only in one branch (`NODE_ENV === test` split).
- Introducing synthetic detail sections (`preventivi`/`ricambi`/history) can drift from future real schema if not normalized early.
- Error mapping mismatch in route can break AC-4 despite correct service behavior.
- Prisma schema changes can require regenerate/migration steps and may impact existing compile flows.

## Approval Notes

- EnterPlanMode/ExitPlanMode tools are not available in this environment; this file is used as explicit step-6 planning artifact.
