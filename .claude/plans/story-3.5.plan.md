---
story_id: '3.5'
created: '2026-02-11'
depends_on:
  - docs/sprint-artifacts/story-3.5-RESEARCH.md
  - docs/sprint-artifacts/story-3.5-VALIDATION.md
  - docs/sprint-artifacts/atdd-tests-3.5.txt
files_modified:
  - packages/backend/src/services/riparazioni-service.ts
  - packages/backend/src/routes/riparazioni.ts
  - packages/backend/src/__tests__/riparazioni-stato-base-atdd.spec.ts
  - docs/stories/3.5.cambio-stato-riparazione-transizioni-base.story.md
must_pass: [typecheck, lint, test]
---

# Plan Story 3.5

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/backend/src/services/riparazioni-service.ts | Add stato-change contract (input/result/error types), parser, transition matrix, authorization (admin or assigned tecnico), and dual-path implementation (test-store + Prisma) with history persistence. | Existing parse helpers and dual runtime pattern from current service |
| packages/backend/src/routes/riparazioni.ts | Add PATCH /:id/stato endpoint with authenticate, payload mapping from req params/body/user, and dedicated error responder for service codes. | New service export for stato transitions |
| packages/backend/src/__tests__/riparazioni-stato-base-atdd.spec.ts | Use RED tests as acceptance source; adjust only for real API contract mismatches discovered during GREEN. | Implemented route/service behavior |
| docs/stories/3.5.cambio-stato-riparazione-transizioni-base.story.md | Mark task checklist as completed after GREEN and final verification. | Passing tests and completed implementation |

## Implementation order

1. Define service interfaces in `packages/backend/src/services/riparazioni-service.ts` for `CambiaStatoRiparazioneInput`, parsed payload, result unions, and validation/auth error semantics.
2. Implement transition rules and authorization in service layer for both code paths: in-memory test store and Prisma transaction with `RiparazioneStatoHistory` insert.
3. Wire `PATCH /api/riparazioni/:id/stato` in `packages/backend/src/routes/riparazioni.ts`, including failure mapping for `VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, and `SERVICE_UNAVAILABLE`.
4. Run focused ATDD test file `packages/backend/src/__tests__/riparazioni-stato-base-atdd.spec.ts` and iterate implementation until all 12 tests pass.
5. Run regression checks (`npm test`, `npm run lint`, `npm run typecheck`) and update story checklist in `docs/stories/3.5.cambio-stato-riparazione-transizioni-base.story.md`.

## Patterns to follow

- Error mapping pattern in `packages/backend/src/routes/riparazioni.ts:138` (typed service failure -> HTTP code with `buildErrorResponse`).
- PATCH endpoint structure in `packages/backend/src/routes/riparazioni.ts:216` (payload extraction + service invocation).
- Validation helper pattern in `packages/backend/src/services/riparazioni-service.ts:362` (`buildValidationFailure` with details/message).
- Input parser pattern in `packages/backend/src/services/riparazioni-service.ts:621` (convert unknown DTO to typed payload and fail fast).
- Test-store + Prisma parity pattern in `packages/backend/src/services/riparazioni-service.ts:1283` and `packages/backend/src/services/riparazioni-service.ts:1322`.
- History shape consistency from `packages/backend/src/services/riparazioni-service.ts:1466` and schema in `packages/backend/prisma/schema.prisma:139`.

## Risks

- Authorization drift: route-level role checks without service-level assigned-tecnico verification can violate AC-6.
- Transition mismatch between test-store and Prisma paths can make ATDD pass in one environment and fail in another.
- Missing/incorrect history insert fields (`userId`, `note`, `dataOra`) can break AC-1 and detail endpoint expectations.
- Error message mismatch for invalid transition (AC-5 exact string) can fail contract tests despite correct status codes.
