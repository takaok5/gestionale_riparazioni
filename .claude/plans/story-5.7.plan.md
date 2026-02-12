---
story_id: "5.7"
created: "2026-02-12"
depends_on: ["5.5", "5.6", "5.3"]
files_modified:
  - packages/backend/src/routes/ordini.ts
  - packages/backend/src/services/anagrafiche-service.ts
  - packages/backend/prisma/schema.prisma
  - packages/backend/src/__tests__/ordini-ricezione-atdd.spec.ts
  - docs/stories/5.7.ricezione-ordine-carico-magazzino.story.md
must_pass: ["test:backend-targeted", "test:backend-regression"]
---

# Plan Story 5.7

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| `packages/backend/prisma/schema.prisma` | Aggiungere campi per tracciare quantitativi ricevuti per voce ordine e timestamp ricezione voce. | - |
| `packages/backend/src/services/anagrafiche-service.ts` | Estendere type/input/result, parse/validate, implementazione test-store + DB per `receiveOrdineFornitore`, aggiornamento stock e stato ordine. | `packages/backend/prisma/schema.prisma` |
| `packages/backend/src/routes/ordini.ts` | Esporre endpoint `POST /:id/ricevi`, mapping payload e gestione errori dominio. | `packages/backend/src/services/anagrafiche-service.ts` |
| `packages/backend/src/__tests__/ordini-ricezione-atdd.spec.ts` | Rifinire ATDD RED per allineamento a output reale endpoint una volta implementato. | `packages/backend/src/routes/ordini.ts`, `packages/backend/src/services/anagrafiche-service.ts` |
| `docs/stories/5.7.ricezione-ordine-carico-magazzino.story.md` | Aggiornare task checkbox e note di coverage a implementazione completata. | `packages/backend/src/__tests__/ordini-ricezione-atdd.spec.ts` |

## Implementation order

1. Model prep: estendere `packages/backend/prisma/schema.prisma` per supportare ricezione parziale per singola voce ordine (tracking cumulativo).
2. Service contract and validation: in `packages/backend/src/services/anagrafiche-service.ts` aggiungere input/result parser per endpoint ricezione, vincoli stato ordine e payload voci.
3. Service implementation (test-store): implementare applicazione ricezioni parziali/completa, incremento giacenze, transizione stato a `RICEVUTO` solo quando tutte le voci sono complete.
4. Service implementation (database): implementare transazione Prisma atomica con update voci, update articoli, audit movimenti e update stato ordine.
5. Route wiring: aggiungere `POST /:id/ricevi` in `packages/backend/src/routes/ordini.ts` con error mapper coerente (`VALIDATION_ERROR`, `ORDINE_NOT_FOUND`, `SERVICE_UNAVAILABLE`).
6. Test align: mantenere `packages/backend/src/__tests__/ordini-ricezione-atdd.spec.ts` allineato ai contratti risposta finali (status/body/error) senza indebolire assert.
7. Regression run: eseguire test target `ordini-ricezione-atdd.spec.ts` e regressioni ordini/articoli (`ordini-create`, `ordini-stato`, `articoli-movimenti`).

## Patterns to follow

- Pattern route->service error mapping da `packages/backend/src/routes/ordini.ts:65` e `packages/backend/src/routes/ordini.ts:120`.
- Pattern validazione transizioni stato da `packages/backend/src/services/anagrafiche-service.ts:3361`.
- Pattern update stock atomico con controllo disponibilita da `packages/backend/src/services/anagrafiche-service.ts:3542`.
- Pattern audit nello stesso flusso transazionale da `packages/backend/src/services/anagrafiche-service.ts:3587`.
- Pattern ATDD helper-based (seed + helper API) da `packages/backend/src/__tests__/ordini-stato-atdd.spec.ts:41`.

## Risks

- Doppio carico su chiamate ripetute se non si calcola correttamente il residuo ricevibile per voce.
- Divergenza tra test-store e database se logica di ricezione viene implementata in modo non simmetrico.
- Regressione su flusso stati ordine (5.6) se `receive` forza transizioni non consentite.
- Drift di payload risposta endpoint se route e test non condividono codici errore/messaggi esatti.
