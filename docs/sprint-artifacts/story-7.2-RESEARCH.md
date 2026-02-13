## Patterns Found

- `packages/backend/src/services/preventivi-service.ts:1041` and `packages/backend/src/services/preventivi-service.ts:1146` use the same send flow pattern: generate document, call async email sender, map failure to `EMAIL_SEND_FAILED`.
- `packages/backend/src/routes/preventivi.ts:177` maps `EMAIL_SEND_FAILED` to HTTP `500` via `buildErrorResponse`, which should be preserved for Story 7.2.
- `packages/backend/src/services/notifiche-service.ts:157` applies query filter normalization (`tipo`, `stato`) before slicing pagination, a reusable pattern for `tipo=PREVENTIVO`.
- `packages/backend/src/__tests__/preventivi-send-atdd.spec.ts:39` already provides endpoint-level ATDD structure for `POST /api/preventivi/5/invia` and is the best anchor for new assertions.

## Known Pitfalls

- `packages/backend/src/services/notifiche-service.ts:1` currently types `NotificaTipo` as only `STATO_RIPARAZIONE`; adding `PREVENTIVO` requires updating service-level typing and generated payload shape.
- Existing send flow updates preventivo/riparazione state but does not currently persist PREVENTIVO notification in the same code path; partial writes are a regression risk.
- AC asks for `allegato` path in notification; this field must match actual persisted data schema to avoid contract drift between endpoint and tests.

## Stack/Libraries to Use

- Keep Express route handlers and `buildErrorResponse` pattern in `packages/backend/src/routes/preventivi.ts`.
- Keep Prisma transaction pattern already used in `inviaPreventivoInDatabase` for atomic updates.
- Keep existing Vitest + Supertest ATDD style in `packages/backend/src/__tests__/preventivi-send-atdd.spec.ts` and notification API tests.
