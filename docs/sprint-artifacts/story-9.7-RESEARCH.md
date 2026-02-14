# Story 9.7 Research

## Patterns Found

- `packages/backend/src/routes/richieste.ts:132` shows authenticated/authorized backoffice handlers with role gating (`COMMERCIALE`, `ADMIN`) and service delegation; conversion endpoint must follow this router pattern.
- `packages/backend/src/routes/richieste.ts:60` and `packages/backend/src/lib/errors.ts` usage show centralized error mapping via `buildErrorResponse`; conversion should map domain failures (including 409) through the same contract.
- `packages/backend/src/services/anagrafiche-service.ts:6186` and `packages/backend/src/services/anagrafiche-service.ts:6223` show in-memory richiesta lookup + audit log append flow; conversion should reuse this lifecycle update style when switching to `CONVERTITA`.
- `packages/backend/src/services/riparazioni-service.ts:509` defines required payload fields for `createRiparazione` (`tipoDispositivo`, `marcaDispositivo`, `modelloDispositivo`, `serialeDispositivo`, `descrizioneProblema`, `accessoriConsegnati`, `priorita`), so conversion must provide deterministic defaults for missing lead fields.

## Known Pitfalls

- Public lead record currently stores `nome`, `email`, `problema`, but not `telefono` (`packages/backend/src/services/anagrafiche-service.ts:945`), so matching by phone must be conditional or backed by schema extension.
- Stato transition guard currently accepts only `NUOVA -> IN_LAVORAZIONE` (`packages/backend/src/services/anagrafiche-service.ts:6208`); conversion to `CONVERTITA` will fail until transition rules are expanded.
- Test-mode riparazione creation rejects unknown `clienteId` (`packages/backend/src/services/riparazioni-service.ts:1231`), so conversion must resolve/create cliente before creating the draft.
- Existing `createCliente` duplicate guard is email-based (`packages/backend/src/services/anagrafiche-service.ts:3222`); implementing email/phone reuse requires explicit normalization/lookup strategy to avoid duplicates.

## Stack/Libraries to Use

- Backend API: Express router + middleware in `packages/backend/src/routes/richieste.ts`.
- Domain logic: service layer in `packages/backend/src/services/anagrafiche-service.ts` and `packages/backend/src/services/riparazioni-service.ts`.
- Tests: Vitest + Supertest patterns from `packages/backend/src/__tests__/richieste-backoffice-api.atdd.spec.ts` and `packages/backend/src/__tests__/public-richieste-api.atdd.spec.ts`.
