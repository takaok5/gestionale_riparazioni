## Patterns Found

- packages/backend/src/routes/report.ts:31 and packages/backend/src/routes/report.ts:52 map service failures through buildErrorResponse with stable codes (VALIDATION_ERROR -> 400, FORBIDDEN -> 403, fallback -> 500). The new /api/report/magazzino route should reuse this exact contract.
- packages/backend/src/services/anagrafiche-service.ts:3903 encodes movement sign semantics (SCARICO as negative delta), and packages/backend/src/services/anagrafiche-service.ts:5146 already filters low-stock rows using giacenza <= sogliaMinima. This is the canonical stock logic for AC-2 and AC-3.
- packages/backend/src/__tests__/report-riparazioni-atdd.spec.ts:222 and packages/backend/src/__tests__/report-finanziari-atdd.spec.ts:139 show the expected ATDD style for report endpoints, including validation sad-path and FORBIDDEN payload checks.

## Known Pitfalls

- If the implementation uses authorize("ADMIN") middleware directly, error message may become "Accesso negato" instead of the AC contract "Admin only"; keep the report-service/routing mapping consistent.
- Top usage aggregation can become non-deterministic if ties are not ordered consistently; define and test deterministic ordering (quantitaUtilizzata desc, then articoloId asc as tie-breaker).
- Rolling 30-day logic can drift on timezone boundaries; normalize window boundaries before querying movement rows.

## Stack/Libraries to Use

- Express router in packages/backend/src/routes/report.ts for endpoint wiring.
- Prisma-backed services in packages/backend/src/services/report-service.ts and packages/backend/src/services/anagrafiche-service.ts for aggregations.
- Vitest + supertest in packages/backend/src/__tests__ for ATDD verification.
