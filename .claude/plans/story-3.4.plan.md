---
story_id: '3.4'
created: '2026-02-11'
depends_on:
  - docs/sprint-artifacts/story-3.4-RESEARCH.md
  - docs/sprint-artifacts/atdd-tests-3.4.txt
files_modified:
  - packages/backend/src/services/riparazioni-service.ts
  - packages/backend/src/routes/riparazioni.ts
  - packages/backend/src/__tests__/riparazioni-assegnazione-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 3.4

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/backend/src/services/riparazioni-service.ts | Add assignment input/result types, validation (iparazioneId, 	ecnicoId, role TECNICO), and implementation for test-store + Prisma branches. | Existing parse helpers and dual runtime pattern |
| packages/backend/src/routes/riparazioni.ts | Add PATCH /:id/assegna with uthenticate + uthorize("ADMIN"), payload mapping, and failure responder. | New service function exported by riparazioni-service |
| packages/backend/src/__tests__/riparazioni-assegnazione-atdd.spec.ts | Keep RED tests as source of truth; update only if implementation reveals real contract mismatch. | New route/service behavior |
| docs/stories/3.4.assegnazione-tecnico.story.md | Mark task checklist as completed after GREEN and review validations. | Implemented code + passing tests |

## Implementation order

1. Define service contract in packages/backend/src/services/riparazioni-service.ts: input/output types, parsing, validation error codes/messages for assignment, and export signature.
2. Implement assignment logic in packages/backend/src/services/riparazioni-service.ts for both NODE_ENV=test and Prisma flows, including role check for target user and not-found handling.
3. Wire route in packages/backend/src/routes/riparazioni.ts (PATCH /:id/assegna) using uthenticate + uthorize("ADMIN") and explicit error mapping to HTTP responses.
4. Run ATDD focus test packages/backend/src/__tests__/riparazioni-assegnazione-atdd.spec.ts, fix implementation gaps until all AC tests pass.
5. Run full project checks (
pm test, 
pm run lint, 
pm run typecheck) and then update story task checkboxes with completed work.

## Patterns to follow

- Route failure mapping pattern from packages/backend/src/routes/riparazioni.ts:33 (dedicated responder functions and uildErrorResponse).
- Route payload extraction pattern from packages/backend/src/routes/riparazioni.ts:130 (build typed payload from eq.params/eq.body).
- Authorization pattern from packages/backend/src/middleware/auth.ts:106 (uthorize(...roles) and FORBIDDEN response contract).
- Numeric parsing pattern from packages/backend/src/services/riparazioni-service.ts:221 (sPositiveInteger).
- Validation failure shape from packages/backend/src/services/riparazioni-service.ts:334 (uildValidationFailure).
- Test-store/Prisma dual path pattern from packages/backend/src/services/riparazioni-service.ts:1233.

## Risks

- Divergence between test-store and Prisma assignment logic may cause tests to pass in one path and fail in the other.
- Error message/code mismatch (VALIDATION_ERROR, FORBIDDEN, not-found) can break contract assertions in ATDD tests.
- Adding new route handler without centralized failure mapping can introduce inconsistent API responses.
- Role lookup for 	ecnicoId may require careful handling of inactive/non-existent users to avoid ambiguous behavior.
