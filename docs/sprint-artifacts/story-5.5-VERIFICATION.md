---
story_id: "5.5"
verified: "2026-02-12T17:43:30+01:00"
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Admin can create supplier order in BOZZA with computed total and auto number | VERIFIED | `packages/backend/src/__tests__/ordini-create-atdd.spec.ts` AC-1 passing |
| 2 | Missing supplier returns 404 with `FORNITORE_NOT_FOUND` | VERIFIED | `packages/backend/src/__tests__/ordini-create-atdd.spec.ts` AC-2 passing |
| 3 | Missing article in any line returns 404 with `ARTICOLO_NOT_FOUND in voce` | VERIFIED | `packages/backend/src/__tests__/ordini-create-atdd.spec.ts` AC-3 passing |
| 4 | Non-admin cannot create orders (`403 FORBIDDEN`) | VERIFIED | `packages/backend/src/__tests__/ordini-create-atdd.spec.ts` AC-4 passing |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| packages/backend/src/routes/ordini.ts | CREATED | 75 |
| packages/backend/src/services/anagrafiche-service.ts | UPDATED | 500+ |
| packages/backend/src/index.ts | UPDATED | 35 |
| packages/backend/prisma/schema.prisma | UPDATED | 240+ |
| packages/backend/src/__tests__/ordini-create-atdd.spec.ts | CREATED | 190 |
| docs/sprint-artifacts/review-5.5.md | CREATED | 25 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| `packages/backend/src/index.ts` | `packages/backend/src/routes/ordini.ts` | WIRED |
| `packages/backend/src/routes/ordini.ts` | `packages/backend/src/services/anagrafiche-service.ts` | WIRED |
| `packages/backend/src/services/anagrafiche-service.ts` | `packages/backend/prisma/schema.prisma` (`OrdineFornitore` + `OrdineFornitoreVoce`) | WIRED |
| `packages/backend/src/__tests__/ordini-create-atdd.spec.ts` | `/api/ordini` endpoint | VERIFIED |

