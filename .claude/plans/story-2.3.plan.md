---
story_id: '2.3'
created: '2026-02-10'
depends_on: []
files_modified:
  - packages/backend/src/services/anagrafiche-service.ts
  - packages/backend/src/routes/clienti.ts
  - packages/backend/src/__tests__/clienti-detail-update-atdd.spec.ts
  - packages/backend/prisma/schema.prisma
  - docs/stories/2.3.dettaglio-modifica-cliente.story.md
must_pass: [typecheck, lint, test]
---

# Plan Story 2.3

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/backend/src/services/anagrafiche-service.ts | Aggiungere input/result types e funzioni per dettaglio cliente, update cliente, lista riparazioni (test-store + database path) | Schema dati cliente/riparazioni |
| packages/backend/src/routes/clienti.ts | Aggiungere endpoint GET /:id, PUT /:id, GET /:id/riparazioni con mapping errori coerente | Nuove funzioni service |
| packages/backend/src/__tests__/clienti-detail-update-atdd.spec.ts | Portare test RED a GREEN aggiornando setup seed e assert response contract | Endpoint e service implementati |
| packages/backend/prisma/schema.prisma | Valutare aggiunta/modifica model relazionale per supportare query riparazioni | AC-4 |
| docs/stories/2.3.dettaglio-modifica-cliente.story.md | Marcare task completate durante implementazione/review | Esecuzione step 7/8 |

## Implementation order

1. Definire nel service i nuovi contratti TypeScript (GetClienteByIdInput/Result, UpdateClienteInput/Result, ListClienteRiparazioniInput/Result) e parser input con regole validation coerenti.
2. Implementare ramo test-store in nagrafiche-service.ts (find/update cliente, not-found, elenco riparazioni sintetico) per sbloccare i test ATDD locali.
3. Implementare ramo database in nagrafiche-service.ts con Prisma (indUnique, update, eventuale query riparazioni) usando select esplicito e mapping response.
4. Aggiornare packages/backend/src/routes/clienti.ts con nuovi handler e funzioni espond...Failure per VALIDATION_ERROR, NOT_FOUND, SERVICE_UNAVAILABLE.
5. Allineare schema Prisma solo se necessario per AC-4 e rigenerare client/migration secondo stato repo.
6. Eseguire test story-specific (@gestionale/backend) fino a GREEN e poi rerun suite richiesta dal gate step 7.

## Patterns to follow

- Route failure mapping stile espondUpdateFornitoreFailure in packages/backend/src/routes/fornitori.ts:17.
- Pattern route update /:id con delega al service in packages/backend/src/routes/users.ts:195.
- Pattern service dual-path test/db in packages/backend/src/services/anagrafiche-service.ts:1322 e packages/backend/src/services/anagrafiche-service.ts:1365.
- Pattern query Prisma paginata con count + findMany, orderBy, skip/take, select in packages/backend/src/services/anagrafiche-service.ts:1251.
- Pattern ATDD seed + assert specifici in packages/backend/src/__tests__/clienti-list-search-atdd.spec.ts:69.

## Risks

- AC-4 puo richiedere nuova entita/relazione non ancora presente in schema Prisma.
- Gestione due stack (Node + Django) puo creare divergenze: il piano implementa backend Node e documenta il non-scope Django se non richiesto.
- Possibili regressioni sul contract API error payload se mapping NOT_FOUND non coerente tra route e test.