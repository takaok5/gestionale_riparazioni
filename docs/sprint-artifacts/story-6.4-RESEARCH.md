## Patterns Found

- packages/backend/src/routes/dashboard.ts:15 and packages/backend/src/routes/dashboard.ts:44 use the route pattern uthenticate -> service call -> map error with buildErrorResponse -> 200 response.
- packages/backend/src/index.ts:35 mounts feature routers under /api/*; the report router should follow this registration pattern.
- packages/backend/src/services/dashboard-service.ts:281 and packages/backend/src/services/dashboard-service.ts:413 use listRiparazioni(...) with date filters and then aggregate results in memory.
- packages/backend/src/services/riparazioni-service.ts:605 to packages/backend/src/services/riparazioni-service.ts:657 validates 	ecnicoId, dataRicezioneDa, dataRicezioneA, including invalid range checks.
- packages/backend/src/routes/riparazioni.ts:296 to packages/backend/src/routes/riparazioni.ts:303 shows concrete query-to-service payload mapping for list filters.

## Known Pitfalls

- packages/backend/src/middleware/auth.ts:113 returns FORBIDDEN with message Accesso negato; if story expects Admin only, the new route must map message explicitly for consistency with AC-3.
- Aggregating report metrics by fetching all rows can become expensive on large ranges; pagination or grouped queries must be handled carefully.
- Date range filtering needs strict UTC handling (dataRicezioneDa/dataRicezioneA) to avoid off-by-one-day issues.

## Stack/Libraries to Use

- Express router + middleware from existing backend routes (uthenticate, uthorize).
- Existing error contract helper uildErrorResponse in packages/backend/src/lib/errors.ts.
- Existing riparazioni service contracts (listRiparazioni) for filters and source data.
- Prisma schema/indexed fields in packages/backend/prisma/schema.prisma for performant filtering.