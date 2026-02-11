---
story_id: '3.1'
created: '2026-02-11'
depends_on: []
files_modified:
  - packages/backend/prisma/schema.prisma
  - packages/backend/src/services/riparazioni-service.ts
  - packages/backend/src/routes/riparazioni.ts
  - packages/backend/src/index.ts
  - packages/backend/src/__tests__/riparazioni-create-atdd.spec.ts
must_pass: [typecheck, lint, test]
---

# Plan Story 3.1

## Files to modify

| File | Change | Depends on |
| --------------- | ----------- | ---------- |
| `packages/backend/prisma/schema.prisma` | Estendere modello `Riparazione` con campi AC e indici per progressivo giornaliero | - |
| `packages/backend/src/services/riparazioni-service.ts` | Nuovo service: parser input, validazioni, create transazionale, generazione `RIP-YYYYMMDD-####` | schema.prisma |
| `packages/backend/src/routes/riparazioni.ts` | Nuovo router POST `/` con `authenticate` e mapping errori `400/404/500` | riparazioni-service.ts |
| `packages/backend/src/index.ts` | Registrare `app.use("/api/riparazioni", riparazioniRouter)` | routes/riparazioni.ts |
| `packages/backend/src/__tests__/riparazioni-create-atdd.spec.ts` | Allineare assert RED->GREEN ai contratti finali dell'endpoint | routes + service |

## Implementation order

1. Aggiornare `packages/backend/prisma/schema.prisma` con i campi mancanti (`marcaDispositivo`, `modelloDispositivo`, `serialeDispositivo`, `descrizioneProblema`, `accessoriConsegnati`, `priorita`) e vincoli utili per query del progressivo giornaliero.
2. Implementare `packages/backend/src/services/riparazioni-service.ts` con parse input stile `buildValidationFailure`, verifica cliente esistente, create in transazione e progressivo codice per data.
3. Implementare `packages/backend/src/routes/riparazioni.ts` con payload tipizzato, chiamata service e mapping errori in envelope standard.
4. Collegare il router in `packages/backend/src/index.ts` e verificare reachability endpoint `/api/riparazioni`.
5. Rifinire `packages/backend/src/__tests__/riparazioni-create-atdd.spec.ts` per garantire assert robusti sui contratti finali (status, error code/message/details, progressivo).
6. Eseguire `npm run typecheck`, `npm run lint`, `npm test -- --run` e correggere regressioni fino a verde completo.

## Patterns to follow

- Pattern route create + `201` da `packages/backend/src/routes/clienti.ts:234`.
- Mapping `VALIDATION_ERROR` via `buildErrorResponse` da `packages/backend/src/routes/clienti.ts:37`.
- Mapping `NOT_FOUND -> CLIENTE_NOT_FOUND` da `packages/backend/src/routes/clienti.ts:95`.
- Parser con `buildValidationFailure` da `packages/backend/src/services/anagrafiche-service.ts:854`.
- Create transazionale con codice progressivo da `packages/backend/src/services/anagrafiche-service.ts:1661`.
- Pattern test ATDD API con `supertest` da `packages/backend/src/__tests__/clienti-create-atdd.spec.ts:27`.

## Risks

- Concorrenza su progressivo giornaliero: rischio collisioni codice senza transazione/query consistente.
- Divergenza contratto risposta (`error.code/message/details`) rispetto allo standard API esistente.
- Modifica schema Prisma senza migrazione coerente puo rompere test/local DB.
