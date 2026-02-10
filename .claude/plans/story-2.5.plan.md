---
story_id: '2.5'
created: '2026-02-10T23:53:58+01:00'
depends_on: ['2.4']
files_modified:
  - packages/backend/src/routes/fornitori.ts
  - packages/backend/src/services/anagrafiche-service.ts
  - packages/backend/src/__tests__/fornitori-list-search-atdd.spec.ts
  - docs/stories/2.5.lista-ricerca-fornitori.story.md
must_pass: [typecheck, lint, test]
---

# Plan Story 2.5

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/backend/src/services/anagrafiche-service.ts | Aggiungere tipi/input parser list fornitori + implementazioni listFornitoriInTestStore e listFornitoriInDatabase con filtro categoria, search, paginazione e meta. | Prisma model Fornitore, helper validazione esistenti |
| packages/backend/src/routes/fornitori.ts | Aggiungere GET /api/fornitori, mapping errori VALIDATION_ERROR -> 400, risposta 200 con { data, meta }. | Nuovo service listFornitori |
| packages/backend/src/__tests__/fornitori-list-search-atdd.spec.ts | Rifinire eventuali assert RED e mantenere copertura AC-1..AC-4 durante GREEN. | Endpoint GET implementato |
| docs/stories/2.5.lista-ricerca-fornitori.story.md | Aggiornare task checkbox a completate e note finali a fine implementazione. | Implementazione e test GREEN |

## Implementation order

1. Definire in packages/backend/src/services/anagrafiche-service.ts i tipi ListFornitoriInput/ListFornitoriResult, parser query (page/limit/search/categoria) e orchestratore listFornitori con branching test-store/DB.
2. Implementare in packages/backend/src/services/anagrafiche-service.ts i due rami listFornitoriInTestStore e listFornitoriInDatabase, mantenendo shape risposta uguale ai clienti (data + meta + totalPages).
3. Estendere packages/backend/src/routes/fornitori.ts con GET / autenticato Admin, payload query tipizzato, gestione errori e risposta 200.
4. Eseguire i test ATDD in packages/backend/src/__tests__/fornitori-list-search-atdd.spec.ts, correggere implementazione fino a GREEN su AC-1..AC-4 senza degradare suite esistente.
5. Aggiornare docs/stories/2.5.lista-ricerca-fornitori.story.md marcando task completate e registrando eventuali deviazioni implementative.

## Patterns to follow

- Pattern route lista + mapping errori da packages/backend/src/routes/clienti.ts:172 e packages/backend/src/routes/clienti.ts:60.
- Pattern parser paginazione/validazione da packages/backend/src/services/anagrafiche-service.ts:1060.
- Pattern test-store lista da packages/backend/src/services/anagrafiche-service.ts:2198.
- Pattern database lista con Prisma OR/search da packages/backend/src/services/anagrafiche-service.ts:2243.
- Pattern test ATDD lista/sad path da packages/backend/src/__tests__/clienti-list-search-atdd.spec.ts:70 e packages/backend/src/__tests__/clienti-list-search-atdd.spec.ts:233.

## Risks

- Divergenza tra ramo test-store e DB su filtro/search/meta.
- Possibile incoerenza enum categoria se parser non valida input (`invalid_enum`) e limite massimo (`too_large`).
- Regressioni sulle route fornitori esistenti (POST/PUT) se import/tipi vengono modificati in modo non retrocompatibile.
