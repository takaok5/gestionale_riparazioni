# Review 5.5

### Issue 1 - Duplicate articolo IDs falsely rejected in DB path
Status: RESOLVED

- Problem: `createOrdineFornitoreInDatabase` compared `articoliFound.length` with raw `voci.length`. If the same `articoloId` appears in multiple lines, Prisma returns one row, causing a false `ARTICOLO_NOT_FOUND`.
- Fix: deduplicated IDs before DB lookup using `new Set(...)` and compared against unique count.
- Verification: `packages/backend/src/services/anagrafiche-service.ts` now uses `uniqueArticleIds` and `findMany` against that set.

### Issue 2 - No retry on `numeroOrdine` unique collisions
Status: RESOLVED

- Problem: DB creation had no retry strategy for `P2002` on `numeroOrdine`, causing transient failures under concurrency.
- Fix: wrapped DB creation in retry loop (`MAX_NUMERO_ORDINE_GENERATION_ATTEMPTS`) and retried only for `numeroOrdine` unique collisions.
- Verification: retry loop and `P2002` handling added in `createOrdineFornitoreInDatabase`.

### Issue 3 - Silent partial persistence when order lines model missing
Status: RESOLVED

- Problem: implementation silently skipped `createMany` on `ordineFornitoreVoce` when model binding was unavailable, potentially leaving header without lines.
- Fix: made `ordineFornitoreVoce` mandatory in DB path; if unavailable, return `SERVICE_UNAVAILABLE` and abort transaction.
- Verification: `createOrdineFornitoreInDatabase` now checks both `transaction.articolo` and `transaction.ordineFornitoreVoce` before continuing.

