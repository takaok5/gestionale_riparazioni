---
story_id: '2.4'
created: '2026-02-10'
depends_on: []
files_modified:
  - packages/backend/src/services/anagrafiche-service.ts
  - packages/backend/src/routes/fornitori.ts
  - packages/backend/prisma/schema.prisma
  - packages/backend/src/__tests__/fornitori-create-atdd.spec.ts
  - packages/backend/src/__tests__/audit-trail.spec.ts
  - docs/stories/2.4.creazione-fornitore.story.md
must_pass: [test]
---

# Plan Story 2.4

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| `packages/backend/src/services/anagrafiche-service.ts` | Aggiungere createFornitore (parse input, validazioni, test-store, DB transaction, mapping errori) | `packages/backend/prisma/schema.prisma` |
| `packages/backend/src/routes/fornitori.ts` | Aggiungere `POST /api/fornitori` con `authenticate + authorize("ADMIN")` e mapping failure (`VALIDATION_ERROR`, `PARTITA_IVA_EXISTS`) | `packages/backend/src/services/anagrafiche-service.ts` |
| `packages/backend/prisma/schema.prisma` | Garantire gestione robusta duplicato `partitaIva` su modello `Fornitore` | - |
| `packages/backend/src/__tests__/fornitori-create-atdd.spec.ts` | Portare i test RED a GREEN allineando assert ai contratti finali | `packages/backend/src/services/anagrafiche-service.ts`, `packages/backend/src/routes/fornitori.ts` |
| `packages/backend/src/__tests__/audit-trail.spec.ts` | Aggiungere verifica audit `CREATE` fornitore | `packages/backend/src/services/anagrafiche-service.ts`, `packages/backend/src/routes/fornitori.ts` |
| `docs/stories/2.4.creazione-fornitore.story.md` | Marcare task completati durante implementazione | tutti i file sopra |

## Implementation order

1. Definire dominio service in `packages/backend/src/services/anagrafiche-service.ts`: tipi `CreateFornitore*`, parser validazione (campi obbligatori/categoria/partitaIva), errore duplicato `PARTITA_IVA_EXISTS`, logica create per test store e database.
2. Implementare endpoint `POST /api/fornitori` in `packages/backend/src/routes/fornitori.ts` riusando il pattern di mapping errori da `clienti.ts` e RBAC da route fornitori esistente.
3. Aggiornare persistenza in `packages/backend/prisma/schema.prisma` (vincolo/strategia duplicati `partitaIva`) e adattare il service alla scelta per garantire `409` deterministico.
4. Aggiornare/finire `packages/backend/src/__tests__/fornitori-create-atdd.spec.ts` fino a passaggio completo dei 10 test AC-based.
5. Estendere `packages/backend/src/__tests__/audit-trail.spec.ts` con scenario `CREATE Fornitore` e verifica dettagli audit essenziali.
6. Eseguire `npm test -- --run`, verificare gate GREEN, poi marcare task completati in `docs/stories/2.4.creazione-fornitore.story.md`.

## Patterns to follow

- Da `docs/sprint-artifacts/story-2.4-RESEARCH.md`: mapping errori route in `packages/backend/src/routes/clienti.ts:33`.
- Da `docs/sprint-artifacts/story-2.4-RESEARCH.md`: route POST con payload tipizzato in `packages/backend/src/routes/clienti.ts:234`.
- Da `docs/sprint-artifacts/story-2.4-RESEARCH.md`: RBAC con `authorize("ADMIN")` in `packages/backend/src/routes/fornitori.ts:50` e `packages/backend/src/middleware/auth.ts:106`.
- Da `docs/sprint-artifacts/story-2.4-RESEARCH.md`: create transaction + audit + gestione conflitti (`P2002`) in `packages/backend/src/services/anagrafiche-service.ts:1134`.
- Da `docs/sprint-artifacts/story-2.4-RESEARCH.md`: separazione `NODE_ENV=test` vs database in `packages/backend/src/services/anagrafiche-service.ts:1237`.

## Risks

- Duplicati `partitaIva`: senza vincolo/controllo atomico rischio race condition.
- Divergenza regole validazione P.IVA tra backend e shared (`regex` vs `checksum`).
- Nuova logica createFornitore può impattare fixture test-store e audit preesistenti.
