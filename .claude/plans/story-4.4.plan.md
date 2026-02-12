---
story_id: '4.4'
created: '2026-02-12'
depends_on: []
files_modified:
  - packages/backend/prisma/schema.prisma
  - packages/backend/src/services/preventivi-service.ts
  - packages/backend/src/routes/preventivi.ts
  - packages/backend/src/__tests__/preventivi-response-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 4.4

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| packages/backend/prisma/schema.prisma | Aggiungere dataRisposta a RiparazionePreventivo e preparare migration coerente | - |
| packages/backend/src/services/preventivi-service.ts | Implementare egistraRispostaPreventivo (test-store + Prisma) con transazione stato preventivo/riparazione e validazioni AC-3/AC-4 | schema aggiornato |
| packages/backend/src/routes/preventivi.ts | Esporre PATCH /api/preventivi/:id/risposta con parsing payload { approvato: boolean } e mapping errori standard | service API |
| packages/backend/src/__tests__/preventivi-response-atdd.spec.ts | Allineare i test RED alla shape finale risposta dopo implementazione | route + service |

## Implementation order

1. Aggiornare packages/backend/prisma/schema.prisma con dataRisposta (nullable) e generare migration; questo sblocca select/update coerenti in service.
2. Estendere packages/backend/src/services/preventivi-service.ts con parser input risposta, ramo test-store e ramo Prisma (transazione atomica), inclusi errori testuali esatti richiesti dagli AC.
3. Estendere packages/backend/src/routes/preventivi.ts con endpoint PATCH, auth commerciale e mapping result-code -> HTTP/error contract conforme agli endpoint preventivi esistenti.
4. Rifinire packages/backend/src/__tests__/preventivi-response-atdd.spec.ts e far passare tutti i test story-specific, verificando sia path positivi sia no-mutation nei path 400.
5. Eseguire 
pm run test --workspace @gestionale/backend, poi 
pm run typecheck e 
pm run lint per chiudere gate GREEN senza regressioni.

## Patterns to follow

- Da docs/sprint-artifacts/story-4.4-RESEARCH.md: route action-style con uthenticate + espond* (packages/backend/src/routes/preventivi.ts:230).
- Da docs/sprint-artifacts/story-4.4-RESEARCH.md: orchestrazione service con parser input e split test-store/Prisma (packages/backend/src/services/preventivi-service.ts:1071).
- Da docs/sprint-artifacts/story-4.4-RESEARCH.md: transazione Prisma per update preventivo + riparazione (packages/backend/src/services/preventivi-service.ts:861).
- Da docs/sprint-artifacts/story-4.4-RESEARCH.md: struttura ATDD con assert puntuali e messaggi errore esatti (packages/backend/src/__tests__/preventivi-send-atdd.spec.ts:38).

## Risks

- Divergenza logica tra test-store e Prisma se i due percorsi non vengono aggiornati in parallelo.
- Regressioni su messaggi errore hardcoded negli ATDD se cambia anche solo la punteggiatura.
- Possibile mismatch di schema/migration se dataRisposta viene usato in service prima della migration applicata.