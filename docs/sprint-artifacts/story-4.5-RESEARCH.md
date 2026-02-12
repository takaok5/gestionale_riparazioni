# Story 4.5 Research

## Patterns Found
- Route pattern `payload -> service -> response/error mapping` in `packages/backend/src/routes/preventivi.ts:228` and `packages/backend/src/routes/preventivi.ts:235`.
- Error mapping centralizzato con `buildErrorResponse` in `packages/backend/src/lib/errors.ts:11`, riutilizzato nelle route (`packages/backend/src/routes/clienti.ts:33`).
- Calcolo importi a 2 decimali con helper dedicato in `packages/backend/src/services/preventivi-service.ts:217` e uso IVA al 22% in `packages/backend/src/services/preventivi-service.ts:232`.
- Numerazione documento in due passaggi (temporaneo poi definitivo) in `packages/backend/src/services/preventivi-service.ts:531` utile come riferimento per `numeroFattura` progressivo.
- Pattern test ATDD con `supertest` e setup auth in `packages/backend/src/__tests__/preventivi-create-atdd.spec.ts:3` e chiamate API in `packages/backend/src/__tests__/preventivi-create-atdd.spec.ts:130`.

## Known Pitfalls
- Nessuna route/servizio `fatture` esistente: introdurre nuovi file senza allineare `index.ts` rompe il mount endpoint.
- Numerazione `YYYY/NNNN` deve essere atomica (race condition in richieste concorrenti).
- Importi e arrotondamenti devono restare coerenti tra creazione fattura e assert test (`subtotale`, `iva`, `totale`).
- Attualmente non esiste infrastruttura PDF backend dedicata: evitare AC non verificabili senza campo output (`pdfPath`).

## Stack/Libraries to Use
- `Express` + pattern route già in uso (`packages/backend/src/routes/*.ts`).
- `Prisma` per persistenza transazionale e vincoli univoci su numero fattura.
- `Vitest` + `supertest` per ATDD backend.
- `zod` per validazione payload route, coerente con resto progetto.