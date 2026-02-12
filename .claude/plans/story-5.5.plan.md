---
story_id: "5.5"
created: "2026-02-12"
depends_on: []
files_modified:
  - packages/backend/src/index.ts
  - packages/backend/src/routes/ordini.ts
  - packages/backend/src/services/anagrafiche-service.ts
  - packages/backend/prisma/schema.prisma
  - packages/backend/src/__tests__/ordini-create-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 5.5

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| `packages/backend/prisma/schema.prisma` | Add order-line model linked to `OrdineFornitore` for `voci` persistence | - |
| `packages/backend/src/services/anagrafiche-service.ts` | Add create-order input/result types, validation, test-store branch, DB branch, total/number generation | schema updates |
| `packages/backend/src/routes/ordini.ts` | New router with `POST /` admin-only, payload mapping, failure responder | service create-order API |
| `packages/backend/src/index.ts` | Mount `ordiniRouter` on `/api/ordini` | new route file |
| `packages/backend/src/__tests__/ordini-create-atdd.spec.ts` | Keep ATDD assertions aligned with final response/error contracts | route + service behavior |

## Implementation order

1. Extend data model in `packages/backend/prisma/schema.prisma` to represent order header + voci relation needed by AC-1 and AC-3.
2. Implement service-layer support in `packages/backend/src/services/anagrafiche-service.ts`: parse payload, verify supplier and each item article, compute total, generate unique `numeroOrdine`, create test-store and database records.
3. Create `packages/backend/src/routes/ordini.ts` with `authenticate` + `authorize("ADMIN")`, map domain failures (`VALIDATION_ERROR`, `FORNITORE_NOT_FOUND`, `ARTICOLO_NOT_FOUND`, `SERVICE_UNAVAILABLE`) to HTTP responses.
4. Wire router in `packages/backend/src/index.ts` (`app.use("/api/ordini", ordiniRouter)`).
5. Execute `packages/backend/src/__tests__/ordini-create-atdd.spec.ts` and adjust contracts/details until RED tests turn GREEN without breaking existing behavior.

## Patterns to follow

- `packages/backend/src/routes/articoli.ts:209` for admin-protected create endpoint + service delegation + `201`.
- `packages/backend/src/routes/fornitori.ts:176` for dedicated failure responder mapping domain errors to `buildErrorResponse`.
- `packages/backend/src/services/anagrafiche-service.ts:963` for shared numeric parsing with deterministic `VALIDATION_ERROR`.
- `packages/backend/src/services/preventivi-service.ts:414` for deterministic progressive identifier formatting (`padStart` pattern).
- `packages/backend/src/__tests__/articoli-create-atdd.spec.ts:42` for ATDD naming and specific `expect()` assertions per AC.

## Risks

- Number-generation collisions for `numeroOrdine` under concurrent requests.
- Floating-point precision mismatches on `totale` assertions.
- Partial persistence risk if header and lines are not wrapped in one transaction.
- Contract drift on `error.message` for AC-3 (`ARTICOLO_NOT_FOUND in voce`).
