---
story_id: '4.2'
created: '2026-02-12'
depends_on: []
files_modified:
  - packages/backend/src/services/preventivi-service.ts
  - packages/backend/src/routes/preventivi.ts
  - packages/backend/src/__tests__/preventivi-update-atdd.spec.ts
  - docs/stories/4.2.modifica-preventivo-bozza.story.md
must_pass: [typecheck, lint, test]
---

# Plan Story 4.2

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/backend/src/services/preventivi-service.ts | Add update input parsing, BOZZA-only guard, replace voci + totals, support both test-store and Prisma paths | Existing create/get service functions |
| packages/backend/src/routes/preventivi.ts | Add PUT /:id route and failure mapping for stato non editabile / validation / not found | New update service contract |
| packages/backend/src/__tests__/preventivi-update-atdd.spec.ts | Keep RED tests and align expectations to final error contract if needed | Service + route behavior |
| docs/stories/4.2.modifica-preventivo-bozza.story.md | Mark task completion and validation notes after implementation | Implementation completed |

## Implementation order

1. Implement service update contract in packages/backend/src/services/preventivi-service.ts (input parser, BOZZA guard, totals recompute, replace voci in test-store + DB transaction).
2. Expose PUT endpoint in packages/backend/src/routes/preventivi.ts with explicit uildErrorResponse mapping for VALIDATION_ERROR, NOT_FOUND, and stato non editabile cases.
3. Stabilize test fixtures in packages/backend/src/services/preventivi-service.ts so story IDs/states required by AC (id=5, BOZZA/INVIATO/APPROVATO) are available in test mode.
4. Run packages/backend/src/__tests__/preventivi-update-atdd.spec.ts and adjust contract details only where story requires exact deterministic outputs.
5. Update story task checklist in docs/stories/4.2.modifica-preventivo-bozza.story.md and keep Step 4 issue/fix section consistent with actual implementation.

## Patterns to follow

- Use route failure responder style from packages/backend/src/routes/preventivi.ts:25 and packages/backend/src/routes/preventivi.ts:61.
- Follow PUT route payload extraction pattern from packages/backend/src/routes/clienti.ts:203.
- Reuse totals calculation from packages/backend/src/services/preventivi-service.ts:155 (computeTotals).
- Keep DB write atomic with Prisma. pattern used in packages/backend/src/services/preventivi-service.ts:331.
- Keep test store bootstrap coherent with seedDefaultTestPreventivi/resetPreventiviStoreForTests in packages/backend/src/services/preventivi-service.ts:545 and packages/backend/src/services/preventivi-service.ts:581.

## Risks

- Divergence between test-store and Prisma branches could make tests green while runtime is wrong.
- Error mapping mismatch (400/404/500 or code/message) can break ATDD strict assertions.
- Replace-voci logic can produce stale rows if delete/create is not done transactionally.
