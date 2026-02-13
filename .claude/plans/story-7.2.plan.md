story_id: '7.2'
created: '2026-02-13'
depends_on: []
files_modified:
  - packages/backend/src/services/notifiche-service.ts
  - packages/backend/src/services/preventivi-service.ts
  - packages/backend/src/routes/preventivi.ts
  - packages/backend/src/routes/notifiche.ts
  - packages/backend/src/__tests__/preventivi-notifiche-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 7.2

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/backend/src/services/notifiche-service.ts | Extend Notifica types and creators to support PREVENTIVO with success/failure payload including allegato and contenuto template | Existing list/filter logic |
| packages/backend/src/services/preventivi-service.ts | On send success/failure, persist PREVENTIVO notification with attachment path and detailed body values | notifiche-service PREVENTIVO creator |
| packages/backend/src/routes/preventivi.ts | Keep existing EMAIL_SEND_FAILED contract while exposing unchanged API envelope used by tests | preventivi-service result mapping |
| packages/backend/src/routes/notifiche.ts | Preserve query filter behavior for tipo=PREVENTIVO through existing listNotifiche flow | notifiche-service filtering |
| packages/backend/src/__tests__/preventivi-notifiche-atdd.spec.ts | Turn RED tests to GREEN by validating exact PREVENTIVO notification contract | service + route changes |

## Implementation order

1. Update packages/backend/src/services/notifiche-service.ts with PREVENTIVO-capable payload model and creation helpers while keeping STATO_RIPARAZIONE behavior intact.
2. Wire PREVENTIVO notification creation in packages/backend/src/services/preventivi-service.ts for both happy path and email failure path, including body fields oci/subtotale/IVA/totale and llegato path.
3. Validate and adjust route contracts in packages/backend/src/routes/preventivi.ts and packages/backend/src/routes/notifiche.ts without changing existing error codes/messages.
4. Run targeted test packages/backend/src/__tests__/preventivi-notifiche-atdd.spec.ts, then full 
pm test -- --run, and fix regressions until all tests pass.

## Patterns to follow

- Follow email-send error mapping already present in packages/backend/src/routes/preventivi.ts:177 for EMAIL_SEND_FAILED.
- Follow send flow pattern in packages/backend/src/services/preventivi-service.ts:1146 (generate document -> send -> map failure).
- Follow filter normalization and pagination in packages/backend/src/services/notifiche-service.ts:157.
- Follow ATDD naming/assert style from packages/backend/src/__tests__/preventivi-send-atdd.spec.ts:39.

## Risks

- Extending in-memory Notifica shape may break existing riparazioni notification tests if shared fields change.
- Missing atomicity between preventivo state update and notification insert can leave inconsistent data.
- Body template assertions can become brittle if formatting is not deterministic.
