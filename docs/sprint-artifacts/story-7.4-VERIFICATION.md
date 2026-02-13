---
story_id: '7.4'
verified: '2026-02-13T12:40:28.1890539+01:00'
status: complete
---

# Verification Report

## Observable Truths

| #   | Truth                                                                | Status   | Evidence                                                    |
| --- | -------------------------------------------------------------------- | -------- | ----------------------------------------------------------- |
| 1   | Etichetta PDF include header e campi richiesti (AC-1).               | VERIFIED | packages/backend/src/__tests__/riparazioni-etichetta-atdd.spec.ts (AC-1) |
| 2   | Fallback cliente usa codiceCliente quando 
ome e vuoto (AC-2).     | VERIFIED | packages/backend/src/__tests__/riparazioni-etichetta-atdd.spec.ts (AC-2) |
| 3   | Riparazione inesistente restituisce 404 con RIPARAZIONE_NOT_FOUND. | VERIFIED | packages/backend/src/__tests__/riparazioni-etichetta-atdd.spec.ts (AC-3) |

## Artifacts

| File                                                             | Status   | Lines |
| ---------------------------------------------------------------- | -------- | ----- |
| packages/backend/src/services/riparazioni-etichetta-pdf.ts        | CREATED  | 113   |
| packages/backend/src/services/riparazioni-service.ts              | MODIFIED | 2315  |
| packages/backend/src/routes/riparazioni.ts                        | MODIFIED | 412   |
| packages/backend/src/__tests__/riparazioni-etichetta-atdd.spec.ts | CREATED  | 120   |
| docs/stories/7.4.stampa-etichetta-dispositivo.story.md            | MODIFIED | 33    |

## Key Links

| From                                                 | To                                                        | Status |
| ---------------------------------------------------- | --------------------------------------------------------- | ------ |
| packages/backend/src/routes/riparazioni.ts           | packages/backend/src/services/riparazioni-service.ts      | WIRED  |
| packages/backend/src/services/riparazioni-service.ts | packages/backend/src/services/riparazioni-etichetta-pdf.ts | WIRED  |
