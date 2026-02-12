---
story_id: '4.5'
created: '2026-02-12'
depends_on: []
files_modified:
  - packages/backend/prisma/schema.prisma
  - packages/backend/src/services/fatture-service.ts
  - packages/backend/src/routes/fatture.ts
  - packages/backend/src/index.ts
  - packages/backend/src/services/fatture-pdf-service.ts
  - packages/backend/src/__tests__/fatture-create-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 4.5

## Files to modify

| File | Change | Depends on |
| --------------- | ----------- | ---------- |
| `packages/backend/prisma/schema.prisma` | Aggiungere modelli fattura/righe e vincoli univoci per numerazione/relazioni | - |
| `packages/backend/src/services/fatture-service.ts` | Implementare use case createInvoiceFromApprovedPreventivo con validazioni AC-1..AC-4 | schema.prisma |
| `packages/backend/src/routes/fatture.ts` | Esporre `POST /api/fatture`, parsing payload e mapping errori 400/409/500 | fatture-service.ts |
| `packages/backend/src/index.ts` | Registrare `fattureRouter` su `/api/fatture` | routes/fatture.ts |
| `packages/backend/src/services/fatture-pdf-service.ts` | Generare `pdfPath` coerente e testabile per AC-1 | fatture-service.ts |
| `packages/backend/src/__tests__/fatture-create-atdd.spec.ts` | Allineare fixture/assert dopo implementazione GREEN | routes/fatture.ts |

## Implementation order

1. Modellare persistenza in `packages/backend/prisma/schema.prisma` (Fattura, VoceFattura o equivalente, vincoli relazione e unique su numero fattura).
2. Implementare `packages/backend/src/services/fatture-service.ts` con validazioni business: preventivo approvato richiesto, blocco duplicati per riparazione, numerazione progressiva anno corrente, calcolo importi.
3. Implementare `packages/backend/src/services/fatture-pdf-service.ts` con output deterministico (`pdfPath`) senza dipendere da librerie non presenti.
4. Implementare `packages/backend/src/routes/fatture.ts` seguendo pattern route existing (`payload -> service -> respond*Failure`).
5. Registrare router in `packages/backend/src/index.ts` e verificare integrazione API.
6. Aggiornare `packages/backend/src/__tests__/fatture-create-atdd.spec.ts` solo se necessario per match 1:1 con AC e quindi portare suite in GREEN.

## Patterns to follow

- Da `docs/sprint-artifacts/story-4.5-RESEARCH.md`: pattern route `payload -> service -> error mapping` (`packages/backend/src/routes/preventivi.ts:228`, `packages/backend/src/routes/preventivi.ts:235`).
- Da `docs/sprint-artifacts/story-4.5-RESEARCH.md`: pattern calcolo importi con arrotondamento (`packages/backend/src/services/preventivi-service.ts:217`, `packages/backend/src/services/preventivi-service.ts:232`).
- Da `docs/sprint-artifacts/story-4.5-RESEARCH.md`: pattern test ATDD con `supertest` + auth helper (`packages/backend/src/__tests__/preventivi-create-atdd.spec.ts:3`).

## Risks

- Race condition su numerazione fattura (`YYYY/NNNN`) con richieste concorrenti.
- Divergenza tra percorso in-memory test e percorso Prisma reale.
- Assenza infrastruttura PDF esistente: rischio di AC-1 non verificabile se `pdfPath` non e' stabile.
- Possibile impatto su test esistenti se nuove route alterano middleware o ordine mount.
