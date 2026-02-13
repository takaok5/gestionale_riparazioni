---
story_id: '7.4'
created: '2026-02-13'
depends_on: []
files_modified:
  - packages/backend/src/services/riparazioni-etichetta-pdf.ts
  - packages/backend/src/services/riparazioni-service.ts
  - packages/backend/src/routes/riparazioni.ts
  - packages/backend/package.json
  - packages/backend/src/__tests__/riparazioni-etichetta-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 7.4

## Files to modify

| File | Change | Depends on |
| --------------- | ----------- | ---------- |
| packages/backend/src/services/riparazioni-etichetta-pdf.ts | Create label PDF builder with fixed 62x100mm page size, QR payload = codiceRiparazione, and deterministic text layout for codice/cliente/marca/modello/data | - |
| packages/backend/src/services/riparazioni-service.ts | Add GetRiparazioneEtichettaPdfInput parsing + result types; fetch riparazione + cliente data (codiceCliente/nome fallback) in test/db; call PDF builder and map NOT_FOUND | services/riparazioni-etichetta-pdf.ts
| packages/backend/src/routes/riparazioni.ts | Add GET /api/riparazioni/:id/etichetta route with auth TECNICO, PDF headers, and error mapping aligned to existing riparazioni + fatture patterns | services/riparazioni-service.ts
| packages/backend/package.json | Add runtime deps for PDF/QR (pdfkit, qrcode) and any required types without changing scripts | services/riparazioni-etichetta-pdf.ts
| packages/backend/src/__tests__/riparazioni-etichetta-atdd.spec.ts | Keep RED tests; adjust only if implementation exposes invalid assumptions while preserving AC intent | services/riparazioni-service.ts, routes/riparazioni.ts

## Implementation order

1. Implement PDF/QR builder in `packages/backend/src/services/riparazioni-etichetta-pdf.ts` with mm->pt conversion and deterministic text fields required by AC-1.
2. Extend `packages/backend/src/services/riparazioni-service.ts` with `getRiparazioneEtichettaPdf` (parse input, test/db fetch with codiceCliente fallback, map NOT_FOUND/SERVICE_UNAVAILABLE).
3. Wire `GET /api/riparazioni/:id/etichetta` in `packages/backend/src/routes/riparazioni.ts` with TECNICO auth, PDF headers, and error mapping.
4. Add PDF/QR dependencies in `packages/backend/package.json` (pdfkit, qrcode) and re-run backend tests for the new endpoint.
5. Run workspace `npm test`, plus `npm run typecheck` and `npm run lint` to satisfy must_pass.

## Patterns to follow

- PDF response headers from `packages/backend/src/routes/fatture.ts:326-344` (Content-Type and Content-Disposition filename handling).
- Riparazioni NOT_FOUND mapping from `packages/backend/src/routes/riparazioni.ts:118-141` (404 + RIPARAZIONE_NOT_FOUND message).
- ATDD PDF header assertions from `packages/backend/src/__tests__/fatture-lista-dettaglio-atdd.spec.ts:292-313`.
- Library choices from `docs/sprint-artifacts/story-7.4-RESEARCH.md` (pdfkit + qrcode, fixed 62x100mm conversion).

## Risks

- Incorrect mm->points conversion will break label sizing (needs deterministic values).
- Missing `codiceCliente` select/fallback could break AC-2 when `nome` is empty.
- Adding PDF/QR dependencies might affect build/test if types or ESM/CJS interop are mismatched.