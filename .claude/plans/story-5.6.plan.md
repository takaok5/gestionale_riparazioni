---
story_id: '5.6'
created: '2026-02-12'
depends_on: []
files_modified:
  - packages/backend/prisma/schema.prisma
  - packages/backend/src/services/anagrafiche-service.ts
  - packages/backend/src/routes/ordini.ts
  - packages/backend/src/__tests__/ordini-stato-atdd.spec.ts
  - docs/stories/5.6.gestione-stato-ordine.story.md
must_pass: [test, lint, typecheck]
---

# Plan Story 5.6

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| `packages/backend/prisma/schema.prisma` | Aggiungere campi `dataEmissione` e `dataRicezione` a `OrdineFornitore` per coprire AC-1/AC-4. | - |
| `packages/backend/src/services/anagrafiche-service.ts` | Introdurre input/result per cambio stato ordine, matrice transizioni, policy ruolo, implementazione test-store + database, mapping output coerente. | schema aggiornato |
| `packages/backend/src/routes/ordini.ts` | Aggiungere endpoint `PATCH /:id/stato` con `authenticate`, parsing robusto `id/stato`, e mapping errori (`VALIDATION_ERROR`, `ORDINE_NOT_FOUND`, `SERVICE_UNAVAILABLE`). | service contract |
| `packages/backend/src/__tests__/ordini-stato-atdd.spec.ts` | Adeguare eventuali assert dopo implementazione (soprattutto stato invariato AC-7 e campi timestamp). | route+service |
| `packages/backend/src/__tests__/ordini-create-atdd.spec.ts` | Verificare regressione su `POST /api/ordini` dopo estensione modello ordine. | schema+service |

## Implementation order

1. Aggiornare `packages/backend/prisma/schema.prisma` con i nuovi campi timestamp ordine e garantire compatibilita' con output JSON.
2. Estendere `packages/backend/src/services/anagrafiche-service.ts` con tipi, validazioni input e motore transizioni (`BOZZA -> EMESSO -> CONFERMATO -> SPEDITO -> RICEVUTO`, annullamenti permessi) su test-store.
3. Implementare lo stesso flusso transizioni nel ramo database di `packages/backend/src/services/anagrafiche-service.ts`, allineando error codes e messaggi al ramo test-store.
4. Esporre `PATCH /api/ordini/:id/stato` in `packages/backend/src/routes/ordini.ts` usando il pattern responder esistente e actor context da auth token.
5. Eseguire e sistemare `packages/backend/src/__tests__/ordini-stato-atdd.spec.ts` fino a GREEN, poi rieseguire regressione mirata `packages/backend/src/__tests__/ordini-create-atdd.spec.ts`.
6. Eseguire `npm test -- --run` in workspace root e salvare output di verifica in `docs/sprint-artifacts/test-output-5.6.txt` aggiornato.

## Patterns to follow

- `docs/sprint-artifacts/story-5.6-RESEARCH.md`: pattern route `PATCH stato` e matrice transizioni gia' validati.
- `packages/backend/src/routes/riparazioni.ts:346`: struttura handler `PATCH` con actor context e delega service.
- `packages/backend/src/routes/ordini.ts:17`: failure responder centralizzato con `buildErrorResponse`.
- `packages/backend/src/services/riparazioni-service.ts:321`: uso di matrice transizioni esplicita per evitare logica dispersa.
- `packages/backend/src/services/riparazioni-service.ts:890`: helper dedicato per validazione transizioni prima di mutare stato.

## Risks

- Divergenza tra ramo test-store e database nello stesso service: rischio test verdi ma comportamento runtime incoerente.
- Ambiguita' AC-7 (errore dominio vs autorizzazione route-level): endpoint deve restare `authenticate` senza `authorize("ADMIN")`.
- Introduzione nuovi campi schema senza mapping completo puo' rompere payload esistenti su ordini.