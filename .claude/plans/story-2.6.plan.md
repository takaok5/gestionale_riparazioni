---
story_id: "2.6"
created: "2026-02-11"
depends_on: ["2.4", "2.5"]
files_modified:
  - packages/backend/src/routes/fornitori.ts
  - packages/backend/src/services/anagrafiche-service.ts
  - packages/backend/prisma/schema.prisma
  - packages/backend/src/__tests__/fornitori-detail-update-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 2.6

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| `packages/backend/prisma/schema.prisma` | Introdurre modello ordini fornitore e relazione con `Fornitore` per supportare `GET /api/fornitori/:id/ordini`. | - |
| `packages/backend/src/services/anagrafiche-service.ts` | Aggiungere `getFornitoreById`, estendere `updateFornitore` con `categoria`, aggiungere `listFornitoreOrdini`, parser input e mapping payload. | schema Prisma |
| `packages/backend/src/routes/fornitori.ts` | Aggiungere endpoint `GET /:id`, `GET /:id/ordini`, estendere `PUT /:id` con `categoria`, mapping errori 400/404/500. | service |
| `packages/backend/src/__tests__/fornitori-detail-update-atdd.spec.ts` | Completare i test RED in GREEN allineando seed dati (`id=3`) e asserzioni finali su AC-1..AC-4. | route + service |

## Implementation order

1. Modellare la persistenza ordini fornitore in `packages/backend/prisma/schema.prisma` (campi: `id`, `fornitoreId`, `numeroOrdine`, `stato`, `dataOrdine`, `totale`) e allineare il contratto dati per AC-3.
2. Estendere `packages/backend/src/services/anagrafiche-service.ts` con:
   - tipi input/output per `getFornitoreById` e `listFornitoreOrdini`;
   - parser `fornitoreId` e parser update con `categoria`;
   - implementazioni test-store/DB e gestione `NOT_FOUND`.
3. Aggiornare `packages/backend/src/routes/fornitori.ts` con nuovi endpoint `GET /:id` e `GET /:id/ordini` + update `PUT /:id` con `categoria`, mantenendo `authorize("ADMIN")` e mapping errori coerente.
4. Rendere verdi i test in `packages/backend/src/__tests__/fornitori-detail-update-atdd.spec.ts`, includendo normalizzazione dataset per scenario `id=3` e verifica shape payload richiesta dagli AC.
5. Eseguire test/lint/typecheck e correggere regressioni fino a green completo in workspace backend.

## Patterns to follow

- Pattern route dettaglio con payload tipizzato e failure mapper: `packages/backend/src/routes/clienti.ts:189`.
- Pattern route annidata su risorsa collegata: `packages/backend/src/routes/clienti.ts:220`.
- Pattern parser `id` con `invalid_integer`: `packages/backend/src/services/anagrafiche-service.ts:1252`.
- Pattern dual-path test-store/DB con `NOT_FOUND`: `packages/backend/src/services/anagrafiche-service.ts:1881`.
- Pattern update parziale con `at_least_one_field_required`: `packages/backend/src/services/anagrafiche-service.ts:1021`.
- Pattern audit update con snapshot `old/new`: `packages/backend/src/services/anagrafiche-service.ts:1780`.
- Pattern autorizzazione 403 centralizzata: `packages/backend/src/middleware/auth.ts:106`.

## Risks

- Alto rischio di divergenza tra test-store e DB per AC-3 se mapping ordini non e' identico.
- Rischio regressione update fornitore esistente (story 2.4/2.5) introducendo `categoria` senza rompere validazioni correnti.
- Rischio incoerenza test su `id=3` se i seed non vengono normalizzati in modo deterministico.
- Possibile impatto su performance/query Prisma se la relazione ordini viene modellata senza indici adeguati.
