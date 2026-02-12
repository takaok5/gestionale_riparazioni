---
story_id: '5.2'
created: '2026-02-12'
depends_on: []
files_modified:
  - packages/backend/src/routes/articoli.ts
  - packages/backend/src/services/anagrafiche-service.ts
  - packages/backend/src/__tests__/articoli-list-search-alert-atdd.spec.ts
  - docs/stories/5.2.lista-ricerca-articoli.story.md
must_pass: [typecheck, lint, test]
---

# Plan Story 5.2

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/backend/src/services/anagrafiche-service.ts | Aggiungere input/result types e funzioni `listArticoli` + `listArticoliAlert` (parse, test-store, db-store) con search/categoria/pagination e validazioni | - |
| packages/backend/src/routes/articoli.ts | Estendere router con `GET /` e `GET /alert`, middleware auth `TECNICO/ADMIN`, payload query e mapping errori `VALIDATION_ERROR`/`SERVICE_UNAVAILABLE` | packages/backend/src/services/anagrafiche-service.ts |
| packages/backend/src/__tests__/articoli-list-search-alert-atdd.spec.ts | Allineare eventuali assertion ai dettagli finali di payload/meta e verificare tutte le AC (1..5) in GREEN | packages/backend/src/routes/articoli.ts |
| docs/stories/5.2.lista-ricerca-articoli.story.md | Marcare task completati e mantenere traceability AC->test | packages/backend/src/__tests__/articoli-list-search-alert-atdd.spec.ts |

## Implementation order

1. Implementare parser/types/result in `packages/backend/src/services/anagrafiche-service.ts` per lista/alert articoli (dipendenza base per route e test).
2. Implementare funzioni service `listArticoli` e `listArticoliAlert` (test store + database Prisma) in `packages/backend/src/services/anagrafiche-service.ts` con response `{ data, meta }` coerente ai pattern esistenti.
3. Estendere `packages/backend/src/routes/articoli.ts` con endpoint `GET /` e `GET /alert`, autorizzazione e mapping errori.
4. Eseguire e correggere `packages/backend/src/__tests__/articoli-list-search-alert-atdd.spec.ts` fino a passaggio completo in GREEN senza rompere test regressione.
5. Aggiornare `docs/stories/5.2.lista-ricerca-articoli.story.md` (task check) e verificare quality constraints (`TODO/TBD` assenti).

## Patterns to follow

- Da `docs/sprint-artifacts/story-5.2-RESEARCH.md`: `packages/backend/src/routes/fornitori.ts:210` per pattern endpoint lista query + responder errori.
- Da `docs/sprint-artifacts/story-5.2-RESEARCH.md`: `packages/backend/src/routes/clienti.ts:172` per risposta `200` con envelope `{ data, meta }`.
- Da `docs/sprint-artifacts/story-5.2-RESEARCH.md`: `packages/backend/src/services/anagrafiche-service.ts:1493` per parse input list con validazioni `page/limit/search`.
- Da `docs/sprint-artifacts/story-5.2-RESEARCH.md`: `packages/backend/src/services/anagrafiche-service.ts:3298` per query Prisma con `where`, `OR`, `contains`, `skip/take`, `orderBy`.

## Risks

- Modifiche a `anagrafiche-service.ts` possono impattare route clienti/fornitori/audit gia in produzione test.
- Incoerenza shape `meta` rispetto ai pattern esistenti causerebbe regressioni cross-suite.
- Alert low-stock richiede confronto `<=` e non `<`: errore logico facile da introdurre.
