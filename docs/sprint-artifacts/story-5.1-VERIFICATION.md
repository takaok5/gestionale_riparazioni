---
story_id: '5.1'
verified: '2026-02-12T14:55:14+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Admin puo creare un articolo con giacenza iniziale 0 | VERIFIED | `src/__tests__/articoli-create-atdd.spec.ts` AC-1 passa |
| 2 | Duplicato codice articolo produce 409 con codice dominio | VERIFIED | `src/__tests__/articoli-create-atdd.spec.ts` AC-2 passa |
| 3 | prezzoVendita <= prezzoAcquisto produce validazione 400 deterministica | VERIFIED | `src/__tests__/articoli-create-atdd.spec.ts` AC-3 passa |
| 4 | Tecnico non puo creare articoli | VERIFIED | `src/__tests__/articoli-create-atdd.spec.ts` AC-4 passa |
| 5 | fornitoreId inesistente produce 404 FORNITORE_NOT_FOUND | VERIFIED | `src/__tests__/articoli-create-atdd.spec.ts` AC-5 passa |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| packages/backend/src/routes/articoli.ts | CREATED | 90 |
| packages/backend/src/services/anagrafiche-service.ts | MODIFIED | 3683 |
| packages/backend/src/__tests__/articoli-create-atdd.spec.ts | CREATED | 179 |
| packages/backend/prisma/schema.prisma | MODIFIED | 218 |
| packages/backend/src/index.ts | MODIFIED | 39 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| packages/backend/src/index.ts | packages/backend/src/routes/articoli.ts | WIRED |
| packages/backend/src/routes/articoli.ts | packages/backend/src/services/anagrafiche-service.ts | WIRED |
| packages/backend/src/__tests__/articoli-create-atdd.spec.ts | packages/backend/src/routes/articoli.ts | VERIFIED |
