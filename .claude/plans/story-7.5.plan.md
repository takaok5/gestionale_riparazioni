---
story_id: '7.5'
created: '2026-02-13'
depends_on: []
files_modified:
  - packages/backend/src/services/riparazioni-ricevuta-pdf.ts
  - packages/backend/src/services/riparazioni-service.ts
  - packages/backend/src/routes/riparazioni.ts
  - packages/backend/src/__tests__/riparazioni-ricevuta-atdd.spec.ts
must_pass: [test, lint, typecheck]
---

# Plan Story 7.5

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| `packages/backend/src/services/riparazioni-ricevuta-pdf.ts` | New deterministic A4 receipt PDF builder (test mode + runtime mode) with required sections and fixed service-conditions/signature labels. | - |
| `packages/backend/src/services/riparazioni-service.ts` | Add typed input/result/parser + test/db handlers for receipt endpoint, data extraction (cliente/device), accessori split, date formatting, and error mapping. | `packages/backend/src/services/riparazioni-ricevuta-pdf.ts` |
| `packages/backend/src/routes/riparazioni.ts` | Add `GET /:id/ricevuta` route with `authenticate` + `authorize("TECNICO")`, dedicated failure responder, PDF headers and binary send. | `packages/backend/src/services/riparazioni-service.ts` |
| `packages/backend/src/__tests__/riparazioni-ricevuta-atdd.spec.ts` | Keep RED tests and align assertions to final response contract for GREEN pass. | all above |

## Implementation order

1. Implement `packages/backend/src/services/riparazioni-ricevuta-pdf.ts` with deterministic `%PDF` content in test mode and PDFKit A4 rendering in runtime mode.
2. Extend `packages/backend/src/services/riparazioni-service.ts` with receipt input/result types, parser, test-store and database retrieval, payload mapping (customer/device/accessori/date), and call to receipt PDF builder.
3. Extend `packages/backend/src/routes/riparazioni.ts` with `respondGetRiparazioneRicevutaPdfFailure` and route `GET /:id/ricevuta` wired to service output (`fileName`, `content`).
4. Run targeted test `packages/backend/src/__tests__/riparazioni-ricevuta-atdd.spec.ts`, then full backend test suite, adjusting implementation details until all receipt AC tests pass.
5. Re-run project checks (`npm test -- --run`, lint/typecheck if available) and record outputs for step 7 verification artifact.

## Patterns to follow

- From `docs/sprint-artifacts/story-7.5-RESEARCH.md`: route auth + PDF header pattern from `packages/backend/src/routes/riparazioni.ts:357` and `packages/backend/src/routes/riparazioni.ts:372`.
- From `docs/sprint-artifacts/story-7.5-RESEARCH.md`: service input parser pattern from `packages/backend/src/services/riparazioni-service.ts:737`.
- From `docs/sprint-artifacts/story-7.5-RESEARCH.md`: date formatting pattern from `packages/backend/src/services/riparazioni-service.ts:775`.
- From `docs/sprint-artifacts/story-7.5-RESEARCH.md`: deterministic PDF test strategy from `packages/backend/src/services/riparazioni-etichetta-pdf.ts:24`.
- Keep error contract mapping style used in `packages/backend/src/routes/riparazioni.ts:162`.

## Risks

- New receipt route could regress existing `/:id/etichetta` behavior if shared service code is refactored broadly.
- Accessory parsing edge cases (extra commas/spaces) may fail AC-2 unless normalization is strict.
- Date formatting may drift with timezone if not locked to UTC logic.
- Unauthenticated AC-4 can fail if route middleware order is wrong or route is not registered.
