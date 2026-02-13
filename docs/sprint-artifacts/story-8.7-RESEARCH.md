# Story 8.7 Research

## Patterns Found

- `packages/backend/src/routes/auth.ts:601` uses the portal route skeleton: Bearer token extraction, service call, and dedicated failure mapper.
- `packages/backend/src/routes/auth.ts:309` maps portal ownership failures to HTTP `403` via `buildErrorResponse("FORBIDDEN", "FORBIDDEN")`.
- `packages/backend/src/services/auth-service.ts:971` and `packages/backend/src/services/auth-service.ts:1086` enforce ownership guard (`clienteId` vs resource owner) before returning sensitive data.
- `packages/backend/src/routes/fatture.ts:326` and `packages/backend/src/routes/fatture.ts:341` show the reference PDF delivery pattern (`Content-Type: application/pdf` + `Content-Disposition` attachment filename).
- `packages/backend/src/__tests__/portal-riparazioni-list-detail.atdd.spec.ts:227` provides the portal cross-customer `403 FORBIDDEN` ATDD pattern.
- `packages/backend/src/__tests__/portal-dashboard-me.atdd.spec.ts:192` validates portal unauthorized payload contract (`error.code="UNAUTHORIZED"`, token message).

## Known Pitfalls

- Missing ownership checks in portal document downloads would leak invoice/quote PDFs across customers.
- Divergent 401 payload shape (status-only without code/message) would break established portal API contract and existing ATDD style.
- Reusing PDF generation incorrectly can produce inconsistent filenames, causing flaky browser download expectations.

## Stack/Libraries to Use

- `express` router patterns from `packages/backend/src/routes/auth.ts`.
- Service orchestration and token parsing from `packages/backend/src/services/auth-service.ts`.
- Existing invoice PDF retrieval from `packages/backend/src/services/fatture-service.ts` and quote PDF naming contract from `packages/backend/src/services/preventivi-service.ts`.
- `vitest` + `supertest` for ATDD endpoint coverage in `packages/backend/src/__tests__/`.