---
story_id: '4.6'
created: '2026-02-12'
depends_on: ['4.5']
files_modified:
  - packages/backend/src/services/fatture-service.ts
  - packages/backend/src/routes/fatture.ts
  - packages/backend/src/__tests__/fatture-pagamenti-atdd.spec.ts
  - docs/sprint-artifacts/story-4.6-ATDD-MAP.md
must_pass: [typecheck, lint, test]
---

# Plan Story 4.6

## Files to modify

| File | Change | Depends on |
| --------------- | ----------- | ---------- |
| packages/backend/src/services/fatture-service.ts | Aggiungere modello dati pagamento in test-store, funzione createPagamento, calcolo 	otalePagato/esiduo, validazione overpayment e funzione dettaglio fattura con pagamenti | stato e shape fattura esistenti |
| packages/backend/src/routes/fatture.ts | Aggiungere POST /:id/pagamenti e GET /:id, parsing payload, mapping errori e guard ruolo COMMERCIALE | nuovi result codes dal service |
| packages/backend/src/__tests__/fatture-pagamenti-atdd.spec.ts | Allineare o completare assert RED/GREEN in base alla shape finale risposta | endpoint nuovi |
| docs/sprint-artifacts/story-4.6-ATDD-MAP.md | Mappare AC -> test case per tracciabilita' pipeline | suite ATDD 4.6 |

## Implementation order

1. Estendere packages/backend/src/services/fatture-service.ts con tipi e funzioni pagamenti (create + detail) includendo validazione importi e update stato fattura.
2. Estendere packages/backend/src/routes/fatture.ts con endpoint POST /api/fatture/:id/pagamenti e GET /api/fatture/:id seguendo il pattern di error mapping esistente.
3. Eseguire i test ATDD in packages/backend/src/__tests__/fatture-pagamenti-atdd.spec.ts, correggere implementazione fino a GREEN e confermare i 4 AC.
4. Aggiornare docs/sprint-artifacts/story-4.6-ATDD-MAP.md, story checklist e artefatti di sprint (verification/summary/review) dopo passaggio GREEN.

## Patterns to follow

- Pattern route-level failure mapper: packages/backend/src/routes/fatture.ts:14.
- Pattern role guard prima della logica endpoint: packages/backend/src/routes/fatture.ts:77.
- Pattern parsing input typed: packages/backend/src/services/fatture-service.ts:100.
- Pattern test-store helper per assert di invarianza: packages/backend/src/services/fatture-service.ts:259.
- Pattern naming ATDD con AC esplicito nei test: packages/backend/src/__tests__/fatture-create-atdd.spec.ts:114.

## Risks

- Overpayment e arrotondamenti: importi decimali devono restare coerenti a 2 cifre.
- Possibile regressione su POST /api/fatture se si altera il modello FatturaPayload senza backward compatibility.
- Possibile divergenza shape API tra POST /pagamenti e GET /fatture/:id se non si centralizza il builder response.
