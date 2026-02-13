## Patterns Found

- `packages/backend/src/routes/riparazioni.ts:346-362` usa pattern route->service con payload tipizzato e risposta uniforme `200 { data }` dopo `if (!result.ok)`.
- `packages/backend/src/services/riparazioni-service.ts:1774-1854` usa transazione Prisma per aggiornare stato + creare history nello stesso blocco atomico; la notifica va agganciata qui per evitare inconsistenze.
- `packages/backend/src/services/preventivi-service.ts:990-1053` mostra pattern email helper con failure simulabile in test (`EMAIL_SEND_FAILED`) e catch esplicito.
- `packages/backend/src/routes/preventivi.ts:153-181` mostra mapping centralizzato degli error code verso HTTP status e `buildErrorResponse`.

## Known Pitfalls

- `packages/backend/src/services/riparazioni-service.ts:1776-1782` seleziona solo `id/stato/tecnicoId`; per invio email mancano `codiceRiparazione`, `cliente.email`, `marca/modello` da includere nel `select`.
- Se l'errore email viene propagato come failure HTTP (pattern preventivi), si viola AC-4 della story 7.1 che richiede successo cambio stato anche con email fallita.
- Non esiste ancora un modello `Notifica` in `packages/backend/prisma/schema.prisma`; prima di implementare service e test serve estensione schema/migrazione coerente con `docs/architecture.md:460-472`.

## Stack/Libraries to Use

- Prisma transaction (`getPrismaClient().$transaction`) per commit atomico di stato/history/notifica.
- Pattern error response condiviso (`buildErrorResponse`) nelle route backend.
- Test stack esistente: Vitest + Supertest nel file `packages/backend/src/__tests__/riparazioni-stato-base-atdd.spec.ts`.
