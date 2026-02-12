## Patterns Found

- `packages/backend/src/routes/articoli.ts:209` usa `authenticate` + `authorize("ADMIN")`, costruisce payload typed e delega al service con `res.status(201).json(...)`.
- `packages/backend/src/routes/fornitori.ts:176` centralizza il mapping errori domain->HTTP (`VALIDATION_ERROR`, `NOT_FOUND`, `SERVICE_UNAVAILABLE`) tramite failure responder dedicato.
- `packages/backend/src/services/anagrafiche-service.ts:963` applica parsing numerico condiviso con `asPositiveInteger(...)` e ritorna `VALIDATION_ERROR` invece di eccezioni runtime.
- `packages/backend/src/services/preventivi-service.ts:414` mostra pattern di generazione numero progressivo con `padStart(...)` e assegnazione deterministica lato service.
- `packages/backend/src/__tests__/articoli-create-atdd.spec.ts:42` adotta naming ATDD "Given/When/Then", auth token helper e assert puntuali su HTTP code + payload.

## Known Pitfalls

- Non allineare il contratto errori (`code`/`message`) con le route esistenti rompe ATDD e integrazione client.
- Calcolare il totale ordine con floating point senza normalizzazione a 2 decimali puo produrre drift nelle assertion.
- Generare `numeroOrdine` senza strategia anti-collisione in concorrenza puo violare l'unicita del campo.
- Validare solo il `fornitoreId` e non ogni `voci[].articoloId` porterebbe a ordini parzialmente inconsistenti.

## Stack/Libraries to Use

- `Express` routing + middleware RBAC (`authenticate`, `authorize`) per endpoint `/api/ordini`.
- `Prisma` transaction per creazione atomica testa ordine + eventuali righe ordine.
- `Vitest` + `supertest` per scenari ATDD endpoint-level con assert su status/code/message/body.

