## Code Review - Story 5.3

### Issue 1 - Database path not atomic on concurrent SCARICO
Status: RESOLVED
- Problem: `createArticoloMovimentoInDatabase` read-modify-write on `giacenza` without guarded conditional update, allowing two concurrent decrements to both pass.
- Fix: replaced decrement flow with atomic `updateMany` guarded by `giacenza >= requested` and fallback re-read for accurate insufficient-stock message.
- Verification: logic now enforces single winner on concurrent decrements; AC-5 semantics preserved also in DB runtime.

### Issue 2 - `riferimento` accepted invalid non-string payloads
Status: RESOLVED
- Problem: parser converted invalid `riferimento` types to `null` via optional-string helper, silently accepting malformed payloads.
- Fix: added explicit validation branch in `parseCreateArticoloMovimentoInput` to reject non-string non-null values with `VALIDATION_ERROR`.
- Verification: invalid typed payloads now fail deterministically before service logic.

### Issue 3 - ATDD preload operations had no explicit assertion
Status: RESOLVED
- Problem: multiple tests preloaded stock with movement calls but did not assert preload response status, risking misleading follow-up failures.
- Fix: added explicit `expect(preload.status).toBe(201)` checks for every preload movement call in `articoli-movimenti-atdd.spec.ts`.
- Verification: suite now fails immediately on preload regressions and keeps causal diagnostics aligned with each AC.
