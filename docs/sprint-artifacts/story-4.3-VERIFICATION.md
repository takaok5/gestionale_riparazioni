---
story_id: '4.3'
verified: '2026-02-12T09:07:49+01:00'
status: complete
---

# Verification Report

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Endpoint POST /api/preventivi/:id/invia esiste e risponde 200 su invio valido | VERIFIED | packages/backend/src/__tests__/preventivi-send-atdd.spec.ts AC-1 passa |
| 2 | Reinvio di preventivo gia' inviato ritorna 400 con messaggio esatto | VERIFIED | packages/backend/src/__tests__/preventivi-send-atdd.spec.ts AC-2 passa |
| 3 | Invio con email cliente mancante ritorna 400 con messaggio esatto | VERIFIED | packages/backend/src/__tests__/preventivi-send-atdd.spec.ts AC-3 passa |
| 4 | Fallimento email ritorna 500 e lascia preventivo in BOZZA con dataInvio=null | VERIFIED | packages/backend/src/__tests__/preventivi-send-atdd.spec.ts AC-4 + GET dettaglio |
| 5 | Gate GREEN completo (typecheck/lint/build/test) | VERIFIED | esecuzione docs/sprint-artifacts/.gate-step7-lf.sh con PASS |

## Artifacts

| File | Status | Lines |
| --- | --- | --- |
| packages/backend/prisma/schema.prisma | MODIFIED | 198 |
| packages/backend/src/services/preventivi-service.ts | MODIFIED | 1218 |
| packages/backend/src/routes/preventivi.ts | MODIFIED | 244 |
| packages/backend/src/__tests__/preventivi-send-atdd.spec.ts | CREATED | 140 |
| docs/stories/4.3.invio-preventivo-cliente.story.md | MODIFIED | 63 |
| docs/sprint-artifacts/review-4.3.md | CREATED | 24 |

## Key Links

| From | To | Status |
| --- | --- | --- |
| packages/backend/src/routes/preventivi.ts | packages/backend/src/services/preventivi-service.ts | WIRED |
| packages/backend/src/services/preventivi-service.ts | packages/backend/prisma/schema.prisma (dataInvio) | WIRED |
| packages/backend/src/__tests__/preventivi-send-atdd.spec.ts | packages/backend/src/routes/preventivi.ts (POST /:id/invia) | VERIFIED |
| _bmad/bmm/config.yaml | docs/prd.md + docs/architecture.md | VERIFIED |
