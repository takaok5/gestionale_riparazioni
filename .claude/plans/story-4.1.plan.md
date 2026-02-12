---
story_id: "4.1"
created: "2026-02-12"
depends_on: []
files_modified:
  - packages/backend/src/index.ts
  - packages/backend/src/routes/preventivi.ts
  - packages/backend/src/services/preventivi-service.ts
  - packages/backend/src/services/riparazioni-service.ts
  - packages/backend/prisma/schema.prisma
  - packages/backend/src/__tests__/preventivi-create-atdd.spec.ts
  - packages/backend/src/__tests__/preventivi-detail-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 4.1

## Files to modify

| File | Change | Depends on |
| --- | --- | --- |
| `packages/backend/prisma/schema.prisma` | Definire modelli/relazioni per preventivo e voci, campi `subtotale/iva/totale` coerenti con AC | - |
| `packages/backend/src/services/preventivi-service.ts` | Implementare create/get detail con validazioni, calcolo totali, mapping errori dominio | schema.prisma |
| `packages/backend/src/routes/preventivi.ts` | Implementare `POST /` e `GET /:id` con mapping `VALIDATION_ERROR`/`RIPARAZIONE_NOT_FOUND` | preventivi-service.ts |
| `packages/backend/src/index.ts` | Registrare router `/api/preventivi` nel bootstrap API | routes/preventivi.ts |
| `packages/backend/src/services/riparazioni-service.ts` | Eventuale export/helper condiviso per lookup riparazione o allineamento store test/prisma | preventivi-service.ts |
| `packages/backend/src/__tests__/preventivi-create-atdd.spec.ts` | Rifinire test RED->GREEN su AC-1/3/4 in base al contratto reale route | routes + service preventivi |
| `packages/backend/src/__tests__/preventivi-detail-atdd.spec.ts` | Rifinire test GREEN per AC-2 su payload dettaglio e totali | routes + service preventivi |

## Implementation order

1. Aggiornare `packages/backend/prisma/schema.prisma` per supportare preventivi con voci itemizzate e campi totali.
2. Creare `packages/backend/src/services/preventivi-service.ts` con parse input, calcolo `subtotale/iva/totale`, gestione not found/validation e dual-path test-store/database.
3. Creare `packages/backend/src/routes/preventivi.ts` seguendo il pattern `respond*Failure` + `buildErrorResponse`.
4. Collegare il router in `packages/backend/src/index.ts` su `/api/preventivi`.
5. Allineare `packages/backend/src/services/riparazioni-service.ts` solo se servono helper condivisi o sync store per coerenza test.
6. Eseguire fix dei test `packages/backend/src/__tests__/preventivi-create-atdd.spec.ts` e `packages/backend/src/__tests__/preventivi-detail-atdd.spec.ts` fino a GREEN.

## Patterns to follow

- Router registration centralizzato da `packages/backend/src/index.ts:19` a `packages/backend/src/index.ts:25`.
- Mapping errori route con helper dedicati da `packages/backend/src/routes/riparazioni.ts:49`.
- Contract not found `RIPARAZIONE_NOT_FOUND` da `packages/backend/src/routes/riparazioni.ts:131`.
- Validation failure centralizzata in service da `packages/backend/src/services/riparazioni-service.ts:407`.
- Coerenza dual-path test-store/database da `packages/backend/src/services/riparazioni-service.ts:1720` e `packages/backend/src/services/riparazioni-service.ts:1723`.
- Assert ATDD su `status` + `error.code` da `packages/backend/src/__tests__/riparazioni-create-atdd.spec.ts:149` e `packages/backend/src/__tests__/riparazioni-detail-atdd.spec.ts:217`.

## Risks

- Divergenza tra path test-store e Prisma durante implementazione preventivi.
- Migrazione schema con impatto su relazioni già usate nel dettaglio riparazioni.
- Contratto errore non allineato ai pattern ATDD esistenti (`error.code`, `message`, `details`).
