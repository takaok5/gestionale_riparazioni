# Story 2.2 Research

## Patterns Found

- Route pattern for list endpoint with query parsing + service delegation + centralized error mapping in `packages/backend/src/routes/audit-log.ts:37`.
- Input parsing and validation pattern in service layer (`parse*Input`) in `packages/backend/src/services/anagrafiche-service.ts:632`.
- Pagination implementation pattern in test store and DB store with `skip/take`, `count`, and response envelope in `packages/backend/src/services/anagrafiche-service.ts:986` and `packages/backend/src/services/anagrafiche-service.ts:1012`.
- Pagination assertions in ATDD tests in `packages/backend/src/__tests__/audit-trail.spec.ts:132`.

## Known Pitfalls

- Existing list pattern returns `{ results, pagination }`, while story AC requires `{ data, meta }`; this must be aligned explicitly to avoid contract mismatch.
- `packages/backend/src/routes/clienti.ts` currently exposes only `POST /`, so `GET /api/clienti` must be added and wired correctly.
- Filtering by `search` must be case-insensitive and resilient when `nome` or `codiceCliente` is missing/null.
- Pagination tests can become flaky without deterministic ordering criteria.

## Stack/Libraries to Use

- Express Router + middleware (`authenticate`, optional `authorize`) for HTTP layer.
- Service orchestration in `packages/backend/src/services/anagrafiche-service.ts`.
- Prisma access via `getPrismaClient()` for DB mode and test-store parity for in-memory mode.
- Vitest + Supertest for AC verification in backend integration tests.
