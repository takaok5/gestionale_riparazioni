---
story_id: '4.3'
created: '2026-02-12'
depends_on: []
files_modified:
  - packages/backend/prisma/schema.prisma
  - packages/backend/src/services/preventivi-service.ts
  - packages/backend/src/services/riparazioni-service.ts
  - packages/backend/src/routes/preventivi.ts
  - packages/backend/src/__tests__/preventivi-send-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 4.3

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/backend/prisma/schema.prisma | Add `dataInvio DateTime?` to `RiparazionePreventivo` model | - |
| packages/backend/src/services/preventivi-service.ts | Add `inviaPreventivo` use case (test-store + Prisma), error mapping, side-effect adapters, rollback semantics | schema.prisma |
| packages/backend/src/services/riparazioni-service.ts | Export minimal helper for riparazione transition update tied to preventivo send | preventivi-service.ts contract |
| packages/backend/src/routes/preventivi.ts | Add `POST /:id/invia` endpoint and map service failures to HTTP | preventivi-service.ts |
| packages/backend/src/__tests__/preventivi-send-atdd.spec.ts | Align test setup for AC-3/AC-4 scenarios using dedicated test hooks (email missing / email failure) | preventivi-service.ts |

## Implementation order

1. Update `packages/backend/prisma/schema.prisma` and `packages/backend/src/services/preventivi-service.ts` payload types to include `dataInvio`; ensure serialization contract is defined first.
2. Implement core business flow in `packages/backend/src/services/preventivi-service.ts`: validate state/email, generate pdf artifact, send email via injectable adapter, transition riparazione, and rollback semantics on email failure.
3. Add/adjust helper API in `packages/backend/src/services/riparazioni-service.ts` to enforce transition path to `IN_ATTESA_APPROVAZIONE` without bypassing domain rules.
4. Add endpoint `POST /api/preventivi/:id/invia` in `packages/backend/src/routes/preventivi.ts` following existing `respond*Failure` pattern and explicit error code mapping.
5. Finalize ATDD file `packages/backend/src/__tests__/preventivi-send-atdd.spec.ts` for deterministic AC-3 (missing email) and AC-4 (email adapter failure) setup, then run RED->GREEN validation using saved list `docs/sprint-artifacts/atdd-tests-4.3.txt`.

## Patterns to follow

- Route/service error mapping pattern from `packages/backend/src/routes/preventivi.ts:33` and `packages/backend/src/routes/preventivi.ts:103`.
- Dual implementation pattern (test-store + Prisma) from `packages/backend/src/services/preventivi-service.ts:559` and `packages/backend/src/services/preventivi-service.ts:593`.
- Riparazione transition enforcement from `packages/backend/src/services/riparazioni-service.ts:796` and matrix at `packages/backend/src/services/riparazioni-service.ts:278`.
- ATDD naming and assertion style from `packages/backend/src/__tests__/preventivi-update-atdd.spec.ts:146`.

## Risks

- Introducing side-effect adapters (PDF/email) can make tests flaky if not injectable and resettable in `beforeEach`.
- Partial updates across preventivo/riparazione can violate consistency if Prisma transaction boundaries are not preserved.
- New field `dataInvio` must remain optional for existing dataset compatibility; strict null handling is required in test-store.
