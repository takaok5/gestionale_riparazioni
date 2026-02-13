---
story_id: '7.1'
created: '2026-02-13'
depends_on: []
files_modified:
  - packages/backend/prisma/schema.prisma
  - packages/backend/src/services/riparazioni-service.ts
  - packages/backend/src/routes/riparazioni.ts
  - packages/backend/src/services/riparazioni-notifiche.ts
  - packages/backend/src/__tests__/riparazioni-stato-notifiche-atdd.spec.ts
  - packages/backend/src/__tests__/riparazioni-stato-base-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 7.1

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/backend/prisma/schema.prisma | Add Notifica model/enums and relation fields needed by story 7.1 | docs/architecture.md:460-472 |
| packages/backend/src/services/riparazioni-notifiche.ts | New helper for subject/body generation and delivery result mapping (INVIATA/FALLITA) | schema + AC strings |
| packages/backend/src/services/riparazioni-service.ts | Extend `cambiaStatoRiparazioneInDatabase` to load customer/device data, call helper, persist Notifica in transaction, keep stato change success on email failure | riparazioni-notifiche.ts |
| packages/backend/src/routes/riparazioni.ts | Keep current 200 success contract for PATCH stato while service internally handles notification failure logging | riparazioni-service.ts |
| packages/backend/src/__tests__/riparazioni-stato-notifiche-atdd.spec.ts | RED tests already written; keep as target for GREEN | service + route behavior |
| packages/backend/src/__tests__/riparazioni-stato-base-atdd.spec.ts | Add assertions for notification side effects where appropriate | service changes |

## Implementation order

1. Schema groundwork: extend `packages/backend/prisma/schema.prisma` with Notifica structure aligned to architecture and generate/apply migration.
2. Notification helper: implement `packages/backend/src/services/riparazioni-notifiche.ts` with deterministic subject/body mapping for `RICEVUTA`, `COMPLETATA`, `CONSEGNATA` and explicit delivery outcome (`INVIATA`/`FALLITA`).
3. Service integration: update `packages/backend/src/services/riparazioni-service.ts` transaction to fetch required fields, call helper, persist Notifica row, and guarantee stato transition commit even if email delivery fails.
4. Route alignment: validate `packages/backend/src/routes/riparazioni.ts` keeps current success payload while logging failures through service-level telemetry.
5. Tests GREEN: make `packages/backend/src/__tests__/riparazioni-stato-notifiche-atdd.spec.ts` pass and update `packages/backend/src/__tests__/riparazioni-stato-base-atdd.spec.ts` to verify regression coverage.

## Patterns to follow

- From `docs/sprint-artifacts/story-7.1-RESEARCH.md`: route->service response flow in `packages/backend/src/routes/riparazioni.ts:346-362`.
- From `docs/sprint-artifacts/story-7.1-RESEARCH.md`: transactional update pattern in `packages/backend/src/services/riparazioni-service.ts:1774-1854`.
- From `docs/sprint-artifacts/story-7.1-RESEARCH.md`: email failure handling style in `packages/backend/src/services/preventivi-service.ts:990-1053`.
- From `docs/sprint-artifacts/story-7.1-RESEARCH.md`: centralized error response mapping in `packages/backend/src/routes/preventivi.ts:153-181`.

## Risks

- Existing transitions currently reject some state changes expected by story 7.1 (notably `IN_DIAGNOSI -> RICEVUTA`), requiring explicit transition-rule decision.
- Adding notification persistence inside transaction can affect PATCH latency; keep helper minimal and avoid remote blocking work when possible.
- Missing Notifica schema/migration can cascade into failing tests and runtime errors if relation fields are incomplete.
